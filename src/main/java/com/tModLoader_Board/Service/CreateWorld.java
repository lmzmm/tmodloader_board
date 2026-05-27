package com.tModLoader_Board.Service;

import com.tModLoader_Board.config.TmodloaderPathConfig;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(CreateWorld.class);

    private final String serverPath;
    private final ExecutorService executor = Executors.newCachedThreadPool();
    private final Object processLock = new Object();

    private volatile Process activeProcess;
    private volatile BufferedWriter processWriter;
    private volatile BufferedReader processReader;
    private volatile SseEmitter progressEmitter;

    public CreateWorld(TmodloaderPathConfig pathConfig) {
        this.serverPath = pathConfig.getServerPath();
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutting down CreateWorld executor service");
        stopProcess();
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            executor.shutdownNow();
            Thread.currentThread().interrupt();
        }
    }

    public void startConfigurationProcess(String modsPath, String worldPath) throws Exception {
        synchronized (processLock) {
            if (activeProcess != null && activeProcess.isAlive()) {
                log.warn("A world creation process is already running, forcefully cleaning up");
                stopProcess();
            }

            log.info("Starting world creation configuration process");

            List<String> command = new ArrayList<>();
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

        CompletableFuture<Void> readyFuture = new CompletableFuture<>();

        executor.execute(() -> {
            try {
                String line;
                while ((line = safeReadLine()) != null) {
                    log.debug("INIT: {}", line);

                    if (line.contains("n") && line.contains("New World")) {
                        log.info("Detected 'New World' option, server is ready");
                        sendCommand("n");
                        readyFuture.complete(null);
                        return;
                    }
                }

                readyFuture.completeExceptionally(
                        new IOException("Did not detect 'New World', process ended prematurely"));

            } catch (Exception e) {
                readyFuture.completeExceptionally(e);
            }
        });

        readyFuture.get(240, TimeUnit.SECONDS);
    }

    public void sendCommand(String command) throws IOException {
        synchronized (processLock) {
            if (processWriter == null) {
                throw new IOException("Writer not initialized or process already stopped");
            }

            log.info("SENDING COMMAND: {}", command);
            processWriter.write(command);
            processWriter.newLine();
            processWriter.flush();
        }
    }

    public void streamProgress(SseEmitter emitter) {
        final Process processToMonitor;
        synchronized (processLock) {
            if (activeProcess == null || processReader == null) {
                emitter.completeWithError(new IllegalStateException("No running process"));
                return;
            }
            processToMonitor = this.activeProcess;
            this.progressEmitter = emitter;
        }

        executor.execute(() -> {
            try {
                String line;
                while (processToMonitor.isAlive() && (line = safeReadLine()) != null) {

                    sendSseEvent(line);

                    if (line.contains("n") && line.contains("New World")) {
                        sendSseEvent(SseEmitter.event().name("complete").data("World created successfully!"));
                        return;
                    }

                    if (line.trim().toUpperCase().startsWith("ERROR")) {
                        sendSseEvent(SseEmitter.event().name("error").data(line));
                        stopProcess();
                        return;
                    }
                }

                if (!processToMonitor.isAlive() && processToMonitor.exitValue() != 0) {
                    sendSseEvent(SseEmitter.event().name("error").data("Process exited abnormally: check mod compatibility"));
                }

            } catch (Exception e) {
                sendSseEvent(SseEmitter.event().name("error").data("Stream error: " + e.getMessage()));
            } finally {
                SseEmitter localEmitter;
                synchronized (processLock) {
                    localEmitter = this.progressEmitter;
                    this.progressEmitter = null;
                }
                if (localEmitter != null) {
                    localEmitter.complete();
                }
                stopProcess();
            }
        });
    }

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

    public void stopProcess() {
        synchronized (processLock) {
            if (processWriter != null) try { processWriter.close(); } catch (IOException ignored) {}
            if (processReader != null) try { processReader.close(); } catch (IOException ignored) {}

            if (activeProcess != null) {
                long pid = activeProcess.pid();
                log.info("Destroying process tree (PID = {})", pid);

                try {
                    ProcessHandle handle = ProcessHandle.of(pid)
                            .orElseThrow(() -> new IllegalStateException("Cannot get process handle"));

                    handle.children().forEach(child -> {
                        log.info("Killing child process: {}", child.pid());
                        child.destroyForcibly();
                    });

                    handle.destroyForcibly();

                } catch (Exception e) {
                    log.error("Error destroying process", e);
                }
            }

            activeProcess = null;
            processWriter = null;
            processReader = null;
        }
    }

    private void sendSseEvent(Object data) {
        SseEmitter emitter;
        synchronized (processLock) {
            emitter = this.progressEmitter;
        }
        if (emitter != null) {
            try {
                if (data instanceof SseEmitter.SseEventBuilder) {
                    emitter.send((SseEmitter.SseEventBuilder) data);
                } else {
                    emitter.send(SseEmitter.event().data(data));
                }
            } catch (IOException e) {
                log.warn("Failed to send SSE event (client may have disconnected): {}", e.getMessage());
            }
        }
    }
}