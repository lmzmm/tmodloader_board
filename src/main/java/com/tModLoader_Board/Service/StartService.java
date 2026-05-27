package com.tModLoader_Board.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.tModLoader_Board.config.TmodloaderPathConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class StartService {

    private static final Logger log = LoggerFactory.getLogger(StartService.class);

    private final ControlService controlService;
    private final TmodloaderPathConfig pathConfig;

    public StartService(ControlService controlService, TmodloaderPathConfig pathConfig) {
        this.controlService = controlService;
        this.pathConfig = pathConfig;
    }

    public String startServer(String world, String maxPlayers, String port, String password) throws IOException, InterruptedException {
        String os = System.getProperty("os.name").toLowerCase();

        if (os.contains("win")) {
            List<String> command = new ArrayList<>();
            command.add("cmd");
            command.add("/c");
            command.add("F:\\steam\\steamapps\\common\\tModLoader\\start-tModLoaderServer.bat");
            new ProcessBuilder(command).inheritIO().start();
            return "windows-server";
        } else {
            String sessionName = "tmodloader-" + world.substring(0, world.length() - 4);

            if (controlService.isSessionRunning(sessionName)) {
                log.info("Server session '{}' is already running, skipping duplicate start", sessionName);
                return sessionName;
            }

            List<String> command = new ArrayList<>();
            command.add("tmux");
            command.add("new-session");
            command.add("-d");
            command.add("-s");
            command.add(sessionName);
            command.add(pathConfig.getServerPath());
            command.add("-nosteam");
            command.add("-world");
            command.add(pathConfig.getWorldsPath() + world);
            command.add("-maxplayers");
            command.add(maxPlayers);
            command.add("-port");
            command.add(port);
            if (password != null && !password.isEmpty()) {
                command.add("-password");
                command.add(password);
            }

            Process process = new ProcessBuilder(command).start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);

            if (finished && process.exitValue() == 0) {
                log.info("Server started successfully in tmux session '{}'", sessionName);
                return sessionName;
            } else {
                log.error("Failed to start tmux session");
                return null;
            }
        }
    }

    public void enableMods(List<String> modFilenames, String enabledJsonPath) throws IOException {
        if (modFilenames == null) {
            modFilenames = new ArrayList<>();
        }

        List<String> modNames = modFilenames.stream()
                .map(filename -> filename.replaceAll("\\.tmod$", ""))
                .collect(Collectors.toList());

        log.info("Writing mod names to enabled.json: {}", modNames);

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        File modsConfigFile = new File(enabledJsonPath);

        try {
            objectMapper.writeValue(modsConfigFile, modNames);
            log.info("Successfully wrote {} mod names to {}", modNames.size(), enabledJsonPath);
        } catch (IOException e) {
            log.error("Failed to write enabled.json: {}", e.getMessage());
            throw e;
        }
    }
}