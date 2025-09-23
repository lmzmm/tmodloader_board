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

    // --- 状态变量 ---
    private volatile Process activeProcess;
    private volatile BufferedWriter processWriter;
    private volatile BufferedReader processReader;
    private volatile SseEmitter progressEmitter;

    // 专门的锁对象，用于保护对上述共享资源的访问
    private final Object processLock = new Object();

    /**
     * 启动并准备tModLoader进程。
     * @throws Exception 如果进程启动失败或在规定时间内未准备就绪。
     */
    public void startConfigurationProcess() throws Exception {
        synchronized (processLock) {
            if (activeProcess != null && activeProcess.isAlive()) {
                System.out.println("警告：一个世界创建进程已在运行,即将强制中断");

            }
            stopProcess(); // 启动前先确保彻底清理

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

        readyFuture.get(240, TimeUnit.SECONDS);
    }

    /**
     * 向正在运行的进程发送配置指令。
     */
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

    /**
     * 附加到进程并开始流式传输世界生成进度。
     */
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
                System.out.println("监控任务结束，正在停止整个进程树...");
                stopProcess(); // 任务完成或出错，主动停止整个进程树
                if (progressEmitter != null) {
                    progressEmitter.complete();
                }
            }
        });
    }

    /**
     * 【关键修复】停止正在运行的进程及其所有子进程。
     * 使用 Java 9+ 的 ProcessHandle API 来确保彻底清理。
     */
    public void stopProcess() {
        synchronized (processLock) {
            // 总是先关闭流
            if (processWriter != null) try { processWriter.close(); } catch (IOException ignored) {}
            if (processReader != null) try { processReader.close(); } catch (IOException ignored) {}

            if (activeProcess != null) {
                long pid = activeProcess.pid();
                System.out.println("正在尝试销毁进程树 (父进程 PID: " + pid + ")");

                try {
                    // 1. 获取进程的句柄
                    ProcessHandle handle = ProcessHandle.of(pid)
                        .orElseThrow(() -> new IllegalStateException("无法找到 PID 为 " + pid + " 的进程句柄。"));

                    // 2. 递归地销毁所有后代进程
                    handle.descendants().forEach(child -> {
                        System.out.println("正在强制销毁子进程 (PID: " + child.pid() + ")");
                        child.destroyForcibly();
                    });

                    // 3. 最后销毁主进程本身
                    handle.destroyForcibly();
                    System.out.println("活动进程树已被成功销毁。");

                } catch (Exception e) {
                    System.err.println("销毁进程树时发生错误，回退到简单销毁: " + e.getMessage());
                    // 如果 ProcessHandle 失败，仍然尝试旧的方法作为最后的保险
                    activeProcess.destroyForcibly();
                }
            }

            // 清理所有引用
            activeProcess = null;
            processWriter = null;
            processReader = null;
        }
    }

    /**
     * 安全地发送 SSE 事件。
     */
    private void sendSseEvent(Object data) {
        if (this.progressEmitter != null) {
            try {
                if (data instanceof SseEmitter.SseEventBuilder) {
                    this.progressEmitter.send((SseEmitter.SseEventBuilder) data);
                } else {
                    this.progressEmitter.send(SseEmitter.event().data(data));
                }
            } catch (IOException e) {
                System.err.println("发送 SSE 事件失败 (客户端可能已断开连接): " + e.getMessage());
            }
        }
    }
}