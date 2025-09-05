package com.tModLoader_Board.Service;

import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Service
public class CreateWorld {

    private final String serverPath = System.getProperty("user.home") + "/tmodloader/start-tModLoaderServer.sh";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    private volatile Process activeProcess;
    private volatile BufferedWriter processWriter;
    private volatile BufferedReader processReader;
    private volatile SseEmitter progressEmitter;

    private final Object processLock = new Object();

    /**
     * 启动并准备 tModLoader 进程
     */
    public void startConfigurationProcess() throws Exception {
        synchronized (processLock) {
            if (activeProcess != null && activeProcess.isAlive()) {
                System.out.println("警告：世界创建进程已在运行，本次启动请求被忽略。");
                return;
            }
            stopProcess(); // 确保清理旧的

            System.out.println("正在启动世界创建配置流程...");
            List<String> command = new ArrayList<>();
            command.add(serverPath);
            command.add("-nosteam");

            ProcessBuilder processBuilder = new ProcessBuilder(command);
            processBuilder.redirectErrorStream(true);
            this.activeProcess = processBuilder.start();
            this.processWriter = new BufferedWriter(new OutputStreamWriter(activeProcess.getOutputStream()));
            this.processReader = new BufferedReader(new InputStreamReader(activeProcess.getInputStream()));
        }

        CompletableFuture<Void> readyFuture = new CompletableFuture<>();

        executor.execute(() -> {
            try {
                String line;
                while ((line = processReader.readLine()) != null) {
                    System.out.println("INIT: " + line);
                    if (line.contains("n") && line.contains("New World")) {
                        System.out.println("检测到 'New World' 选项，服务器已准备就绪。");
                        sendCommand("n");
                        readyFuture.complete(null);
                        return;
                    }
                }
                readyFuture.completeExceptionally(new IOException("进程在准备就绪前已终止，未找到'New World'选项。"));
            } catch (IOException e) {
                readyFuture.completeExceptionally(e);
                stopProcess();
            }
        });

        readyFuture.get(120, TimeUnit.SECONDS);
    }

    public void sendCommand(String command) throws IOException {
        BufferedWriter writer;
        synchronized (processLock) {
            if (this.processWriter == null) {
                throw new IOException("进程写入器未初始化或进程已停止。");
            }
            writer = this.processWriter;
        }
        System.out.println("SENDING COMMAND: " + command);
        writer.write(command);
        writer.newLine();
        writer.flush();
    }

    public void streamProgress(SseEmitter emitter) {
        final Process processToMonitor;
        final BufferedReader readerToMonitor;

        synchronized (processLock) {
            if (activeProcess == null || processReader == null) {
                emitter.completeWithError(new IllegalStateException("没有正在运行的世界创建进程可供监控。"));
                return;
            }
            processToMonitor = this.activeProcess;
            readerToMonitor = this.processReader;
        }

        this.progressEmitter = emitter;

        executor.execute(() -> {
            try {
                String line;
                boolean creationInProgress = true;
                while (creationInProgress && processToMonitor.isAlive() && (line = readerToMonitor.readLine()) != null) {
                    System.out.println(line);
                    if (line.contains("n") && line.contains("New World")) {
                        System.out.println("检测到主菜单重新出现，世界创建完成。");
                        sendSseEvent(SseEmitter.event().name("complete").data("世界已成功创建！"));
                        creationInProgress = false;
                        continue;
                    }
                    sendSseEvent(line);
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendSseEvent(SseEmitter.event().name("error").data("错误: " + e.getMessage()));
            } finally {
                System.out.println("监控任务结束，正在停止进程...");
                stopProcess();
                if (progressEmitter != null) {
                    progressEmitter.complete();
                }
            }
        });
    }

    public void stopProcess() {
        synchronized (processLock) {
            if (processWriter != null) try { processWriter.close(); } catch (IOException ignored) {}
            if (processReader != null) try { processReader.close(); } catch (IOException ignored) {}
            if (activeProcess != null) {
                activeProcess.destroyForcibly();
                System.out.println("活动进程已被销毁。");
            }
            activeProcess = null;
            processWriter = null;
            processReader = null;
        }
    }

    private void sendSseEvent(Object data) {
        if (this.progressEmitter != null) {
            try {
                if (data instanceof SseEmitter.SseEventBuilder) {
                    this.progressEmitter.send((SseEmitter.SseEventBuilder) data);
                } else {
                    this.progressEmitter.send(SseEmitter.event().data(data));
                }
            } catch (IOException e) {
                System.err.println("发送 SSE 事件失败: " + e.getMessage());
            }
        }
    }
}
