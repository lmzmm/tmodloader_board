package com.tModLoader_Board.Service;

import com.tModLoader_Board.config.TmodloaderPathConfig;
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

    private final String serverPath;

    public CreateWorld(TmodloaderPathConfig pathConfig){
        this.serverPath = pathConfig.getServerPath();
    }


    private final ExecutorService executor = Executors.newCachedThreadPool();

    // 状态变量
    private volatile Process activeProcess;
    private volatile BufferedWriter processWriter;
    private volatile BufferedReader processReader;

    private volatile SseEmitter progressEmitter;

    private final Object processLock = new Object();


    // 启动世界创建流程
    public void startConfigurationProcess() throws Exception {

        synchronized (processLock) {
            // 如果已有进程在运行，先清理
            if (activeProcess != null && activeProcess.isAlive()) {
                System.out.println("警告：已有世界创建进程正在运行，正在强制清理...");
                stopProcess();
            }

            System.out.println("正在启动世界创建配置流程...");

            List<String> command = new ArrayList<>();
            command.add("bash");
            command.add(serverPath);
            command.add("-nosteam");

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);

            this.activeProcess = pb.start();
            this.processWriter = new BufferedWriter(
                    new OutputStreamWriter(activeProcess.getOutputStream()));
            this.processReader = new BufferedReader(
                    new InputStreamReader(activeProcess.getInputStream()));
        }


        // 等待进程准备就绪
        CompletableFuture<Void> readyFuture = new CompletableFuture<>();

        executor.execute(() -> {
            try {
                String line;
                while ((line = safeReadLine()) != null) {
                    System.out.println("INIT: " + line);

                    if (line.contains("n") && line.contains("New World")) {
                        System.out.println("检测到 'New World' 选项，服务器已准备就绪。");

                        // 自动输入 n 开始创建世界
                        sendCommand("n");
                        readyFuture.complete(null);
                        return;
                    }
                }

                readyFuture.completeExceptionally(
                        new IOException("未检测到 'New World'，进程提前结束"));

            } catch (Exception e) {
                readyFuture.completeExceptionally(e);
            }
        });

        // 最多等待 4 分钟
        readyFuture.get(240, TimeUnit.SECONDS);
    }


    // 发送命令到进程
    public void sendCommand(String command) throws IOException {
        synchronized (processLock) {
            if (processWriter == null) {
                throw new IOException("写入器未初始化或进程已停止。");
            }

            System.out.println("SENDING COMMAND: " + command);
            processWriter.write(command);
            processWriter.newLine();
            processWriter.flush();
        }
    }


    // 通过 SSE 推送世界创建进度
    public void streamProgress(SseEmitter emitter) {
        final Process processToMonitor;
        synchronized (processLock) {
            if (activeProcess == null || processReader == null) {
                emitter.completeWithError(new IllegalStateException("无运行中的进程"));
                return;
            }
            processToMonitor = this.activeProcess;
        }

        this.progressEmitter = emitter;

        executor.execute(() -> {
            try {
                String line;
                // readLine 为阻塞读取，返回 null 代表流已关闭
                while (processToMonitor.isAlive() && (line = safeReadLine()) != null) {

                    sendSseEvent(line);

                    // 成功判定
                    if (line.contains("n") && line.contains("New World")) {
                        sendSseEvent(SseEmitter.event().name("complete").data("世界已成功创建！"));
                        return;
                    }

                    // 错误判定：匹配行首 ERROR
                    if (line.trim().toUpperCase().startsWith("ERROR")) {
                        sendSseEvent(SseEmitter.event().name("error").data(line));
                        stopProcess();
                        return;
                    }
                }

                // 退出码检查
                if (!processToMonitor.isAlive() && processToMonitor.exitValue() != 0) {
                     sendSseEvent(SseEmitter.event().name("error").data("进程异常退出: 请检查模组兼容性"));
                }

            } catch (Exception e) {
                sendSseEvent(SseEmitter.event().name("error").data("流处理异常: " + e.getMessage()));
            } finally {
                if (progressEmitter != null) {
                    progressEmitter.complete();
                    stopProcess();
                }
            }
        });
    }


    // 安全读取一行：避免 reader 在 cleanup 后抛异常
    private String safeReadLine() {
        synchronized (processLock) {
            if (processReader == null) return null;

            try {
                return processReader.readLine();
            } catch (IOException e) {
                return null;
            }
        }
    }


    // 停止进程及其子进程
    public void stopProcess() {
        synchronized (processLock) {

            if (processWriter != null) try { processWriter.close(); } catch (IOException ignored) {}
            if (processReader != null) try { processReader.close(); } catch (IOException ignored) {}

            if (activeProcess != null) {
                long pid = activeProcess.pid();
                System.out.println("正在销毁进程树 (PID = " + pid + ")");

                try {
                    ProcessHandle handle = ProcessHandle.of(pid)
                            .orElseThrow(() -> new IllegalStateException("无法获取进程句柄"));

                    // 先杀子进程
                    handle.children().forEach(child -> {
                        System.out.println("杀死子进程: " + child.pid());
                        child.destroyForcibly();
                    });

                    // 再杀主进程
                    handle.destroyForcibly();

                } catch (Exception e) {
                    e.printStackTrace();
                }
            }

            activeProcess = null;
            processWriter = null;
            processReader = null;
        }
    }

    // 发送 SSE 事件
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