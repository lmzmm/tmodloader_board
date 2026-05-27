package com.tModLoader_Board.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class ControlService {

    private static final Logger log = LoggerFactory.getLogger(ControlService.class);

    public void sendCommand(String sessionName, String commandString) throws IOException, InterruptedException {
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("send-keys");
        command.add("-t");
        command.add(sessionName);
        command.add(commandString);
        command.add("C-m");

        Process p = new ProcessBuilder(command).start();
        p.waitFor(5, TimeUnit.SECONDS);
    }

    public String getTmuxOutput(String commandString, String sessionName, int linesToCapture) throws IOException, InterruptedException {
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("capture-pane");
        command.add("-p");
        command.add("-t");
        command.add(sessionName);
        command.add("-S");
        command.add("-" + linesToCapture);

        Process process = new ProcessBuilder(command).start();

        StringBuilder rawOutputBuilder = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                rawOutputBuilder.append(line).append(System.lineSeparator());
            }
        }
        process.waitFor(5, TimeUnit.SECONDS);
        String rawOutput = rawOutputBuilder.toString();

        String[] lines = rawOutput.split(System.lineSeparator());

        int commandLineIndex = -1;
        for (int i = lines.length - 1; i >= 0; i--) {
            if (lines[i].contains(commandString)) {
                commandLineIndex = i;
                break;
            }
        }

        if (commandLineIndex != -1) {
            StringBuilder commandResult = new StringBuilder();
            for (int i = commandLineIndex + 1; i < lines.length; i++) {
                commandResult.append(lines[i]).append(System.lineSeparator());
            }
            return commandResult.toString().trim();
        }

        return "";
    }

    public List<String> getPlayersOnline(String sessionName) throws IOException, InterruptedException {
        sendCommand(sessionName, "playing");
        Thread.sleep(500);
        String output = getTmuxOutput("playing", sessionName, 30);
        return parsePlayerList(output);
    }

    public void stopServer(String sessionName) throws IOException, InterruptedException {
        if (isSessionRunning(sessionName)) {
            log.info("Sending 'exit' to session '{}' to shut down server", sessionName);
            sendCommand(sessionName, "exit");
            Thread.sleep(2000);
            if (isSessionRunning(sessionName)) {
                new ProcessBuilder("tmux", "kill-session", "-t", sessionName).start();
            }
        } else {
            log.info("Session '{}' is not running", sessionName);
        }
    }

    public boolean isSessionRunning(String sessionName) throws IOException, InterruptedException {
        Process process = new ProcessBuilder("tmux", "has-session", "-t", sessionName).start();
        process.waitFor(5, TimeUnit.SECONDS);
        return process.exitValue() == 0;
    }

    private List<String> parsePlayerList(String rawOutput) {
        List<String> players = new ArrayList<>();
        String[] lines = rawOutput.split(System.lineSeparator());

        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.startsWith(": ") && trimmedLine.contains(" (")) {
                try {
                    int nameEndIndex = trimmedLine.indexOf(" (");
                    String playerName = trimmedLine.substring(2, nameEndIndex);
                    players.add(playerName);
                } catch (Exception e) {
                    log.warn("Error parsing player line: {}", trimmedLine, e);
                }
            }
        }
        log.debug("Players online: {}", players);
        return players;
    }

    public List<String> getServerList() throws IOException, InterruptedException {
        List<String> serverList = new ArrayList<>();
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("ls");

        Process process = new ProcessBuilder(command).start();

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                int colonIndex = line.indexOf(':');
                if (colonIndex != -1) {
                    String sessionName = line.substring(0, colonIndex);
                    if (sessionName.startsWith("tmodloader-")) {
                        serverList.add(sessionName);
                    }
                }
            }
        }

        process.waitFor(5, TimeUnit.SECONDS);

        if (process.exitValue() != 0) {
            log.warn("tmux ls returned non-zero exit code. Is tmux running?");
            return new ArrayList<>();
        }

        return serverList;
    }
}