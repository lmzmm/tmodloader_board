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

    // --- 状态变量：用于在多个HTTP请求间保持进程状态 ---
    private volatile Process activeProcess;
    private volatile BufferedWriter processWriter;
    private volatile BufferedReader processReader;
    private volatile SseEmitter progressEmitter;

    // 一个专门的锁对象，用于保护对上述共享资源的访问，防止死锁
    private final Object processLock = new Object();

    /**
     * 第一步：启动并准备tModLoader进程。
     * 启动服务器，并阻塞等待直到它输出主菜单，然后发送'n'指令进入创建流程。
     * @throws Exception 如果进程启动失败或在规定时间内未准备就绪。
     */
    public void startConfigurationProcess() throws Exception {
        // 使用同步块确保整个启动过程是原子性的
        synchronized (processLock) {
            if (activeProcess != null && activeProcess.isAlive()) {
                System.out.println("警告：一个世界创建进程已在运行，新的启动请求被忽略。");
                return;
            }
            // 只有在没有活动进程时，才调用 stopProcess 并启动新进程
            stopProcess();

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
                        readyFuture.complete(null); // 发送完成信号
                        return; // 初始化读取任务完成
                    }
                }
                readyFuture.completeExceptionally(new IOException("进程在准备就绪前已终止，未找到'New World'选项。"));
            } catch (IOException e) {
                readyFuture.completeExceptionally(e);
                stopProcess();
            }
        });

        // 阻塞等待，直到 readyFuture 完成或超时（例如120秒）
        readyFuture.get(120, TimeUnit.SECONDS);
    }

    /**
     * 第二步：向正在运行的进程发送配置指令。
     * @param command 要发送的指令字符串 (e.g., "1", "My World", "12345")
     * @throws IOException 如果进程未运行或写入失败。
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
     * 第三步：附加到进程并开始流式传输世界生成进度。
     * @param emitter 用于向客户端发送事件的 SseEmitter 实例。
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
                    // 如果再次看到主菜单，说明生成已结束
                    if (line.contains("n") && line.contains("New World")) {
                        System.out.println("检测到主菜单重新出现，世界创建完成。");
                        sendSseEvent(SseEmitter.event().name("complete").data("世界已成功创建！"));
                        creationInProgress = false; // 设置标志以退出循环
                        continue; // 跳过发送该行日志
                    }
                    sendSseEvent(line);
                }
            } catch (Exception e) {
                e.printStackTrace();
                sendSseEvent(SseEmitter.event().name("error").data("错误: " + e.getMessage()));
            } finally {
                // 监控任务结束时，必须主动停止进程并关闭SSE连接
                System.out.println("监控任务结束，正在停止进程...");
                stopProcess();
                if (progressEmitter != null) {
                    progressEmitter.complete();
                }
            }
        });
    }

    /**
     * 停止正在运行的进程并清理所有相关资源。
     * 这个方法是线程安全的。
     */
    public void stopProcess() {
        synchronized (processLock) {
            if (processWriter != null) try { processWriter.close(); } catch (IOException e) { /* ignore */ }
            if (processReader != null) try { processReader.close(); } catch (IOException e) { /* ignore */ }
            if (activeProcess != null) {
                activeProcess.destroyForcibly();
                System.out.println("活动进程已被销毁。");
            }
            activeProcess = null;
            processWriter = null;
            processReader = null;
        }
    }

    /**

     * 一个安全的发送 SSE 事件的辅助方法。
     * @param data 要发送的数据，可以是字符串或 SseEventBuilder
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
                System.err.println("发送 SSE 事件失败: " + e.getMessage());
                // 当客户端断开连接时，这个异常很常见，通常可以安全地忽略
            }
        }
    }
}