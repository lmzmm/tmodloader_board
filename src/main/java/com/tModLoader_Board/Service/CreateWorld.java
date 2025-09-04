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
import java.util.concurrent.*;


@Service
public class CreateWorld {

    private final String serverPath = System.getProperty("user.home") + "/tmodloader/start-tModLoaderServer.sh";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    // --- 状态变量：用于在多个HTTP请求间保持进程状态 ---
    private volatile Process activeProcess;
    private volatile BufferedWriter processWriter;
    private volatile BufferedReader processReader;
    private volatile SseEmitter progressEmitter;

    /**
     * 第一步：启动配置流程。
     * 启动服务器进程，并等待其进入主菜单。
     * 这个方法是同步的，因为它需要确认进程已准备好接收配置。
     */
    public synchronized void startConfigurationProcess() throws Exception {
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

        // 使用 CompletableFuture 来等待后台任务完成特定的初始化步骤
    CompletableFuture<Void> readyFuture = new CompletableFuture<>();

    executor.execute(() -> {
        try {
            String line;
            while ((line = processReader.readLine()) != null) {
                System.out.println("INIT: " + line); // 保持日志输出

                //  "n" 和 "New World" 作为就绪信号
                if (line.contains("n") && line.contains("New World")) {

                    System.out.println("服务器已准备就绪。");

                    sendCommand("n");

                    readyFuture.complete(null); // 发送完成信号
                    return; // 初始化读取任务完成
                }
            }
            // 如果循环结束进程还没准备好（例如，脚本立即退出），说明出错了
            readyFuture.completeExceptionally(new IOException("进程在准备就绪前已终止，未找到'New World'选项。"));
        } catch (IOException e) {
            readyFuture.completeExceptionally(e); // 将异常传递给 Future
            stopProcess();
        }
    });
    // 阻塞等待，直到 readyFuture 完成或超时。可以适当增加超时时间以防万一。
    readyFuture.get(180, TimeUnit.SECONDS); // 将超时增加到 2 分钟
}

    /**
     * 第二步：发送配置指令。
     * 由 /create/worldconfig 端点调用。
     */
    public synchronized void sendCommand(String command) throws IOException {
        if (processWriter == null) {
            throw new IOException("进程未运行或未准备好接收指令。");
        }
        System.out.println("发送指令: " + command);
        processWriter.write(command);
        processWriter.newLine();
        processWriter.flush();
    }

    /**
     * 第三步：附加到进程并开始流式传输进度。
     * 由 /create/worldprogress-stream 端点调用。
     * @param emitter 用于发送进度的 SseEmitter
     */
    public void streamProgress(SseEmitter emitter) {
        if (activeProcess == null || processReader == null) {
            emitter.completeWithError(new IllegalStateException("没有正在运行的世界创建进程。"));
            return;
        }

        this.progressEmitter = emitter;

        // 在新线程中持续读取并推送进度
        executor.execute(() -> {
            try {
                String line;
                // 持续读取进程的输出
                while (activeProcess.isAlive() && (line = processReader.readLine()) != null) {
                    sendSseEvent(line);
                }

                // 进程结束后，检查退出码
                int exitCode = activeProcess.waitFor();
                if (exitCode == 0) {
                    sendSseEvent(SseEmitter.event().name("complete").data("世界成功创建！"));
                } else {
                    throw new IOException("进程异常终止，退出码: " + exitCode);
                }

            } catch (Exception e) {
                e.printStackTrace();
                sendSseEvent(SseEmitter.event().name("error").data("错误: " + e.getMessage()));
            } finally {
                stopProcess(); // 任务完成或出错后，清理所有资源
                if (progressEmitter != null) {
                    progressEmitter.complete();
                }
            }
        });
    }

    /**
     * 安全地停止进程并关闭流。
     */
    public synchronized void stopProcess() {
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

    // 辅助方法，用于发送 SSE 事件
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