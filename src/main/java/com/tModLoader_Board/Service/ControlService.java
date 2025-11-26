package com.tModLoader_Board.Service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * 与正在运行的 tModLoader 服务器 tmux 会话进行交互的服务。
 */
@Service
public class ControlService {

    /**
     * 向指定的 tmux 会话发送命令。
     */
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

    /**
     * 从 tmux 会话中获取指定命令的输出。
     * 会查找包含 commandString 的行，并返回该行之后的内容。
     *
     * @param commandString  发送的命令（如 "playing"）
     * @param sessionName    tmux 会话名
     * @param linesToCapture 要获取的行数
     * @return               命令的输出结果
     */
    public String getTmuxOutput(String commandString, String sessionName, int linesToCapture) throws IOException, InterruptedException {
        // 执行 tmux capture-pane 获取原始输出
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

        // 将原始输出分割成行数组
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
            // 返回提取到的精确输出，并去除首尾可能存在的空白
            return commandResult.toString().trim();
        }

        return "";
    }

    /**
     * 获取指定服务器上的在线玩家列表。
     */
    public List<String> getPlayersOnline(String sessionName) throws IOException, InterruptedException {
        sendCommand(sessionName, "playing");
        Thread.sleep(500); // 等待服务器响应
        String output = getTmuxOutput("playing", sessionName, 30);

        return parsePlayerList(output);
    }

    /**
     * 停止服务器。
     */
    public void stopServer(String sessionName) throws IOException, InterruptedException {
        if (isSessionRunning(sessionName)) {
            System.out.println("正在向会话 '" + sessionName + "' 发送 'exit' 命令以关闭服务器");
            sendCommand(sessionName, "exit");
            Thread.sleep(2000);
            if (isSessionRunning(sessionName)) {
                new ProcessBuilder("tmux", "kill-session", "-t", sessionName).start();
            }
        } else {
            System.out.println("会话 '" + sessionName + "' 未在运行。");
        }
    }

    /**
     * 检查指定的 tmux 会话是否正在运行。
     */
    public boolean isSessionRunning(String sessionName) throws IOException, InterruptedException {
        Process process = new ProcessBuilder("tmux", "has-session", "-t", sessionName).start();
        process.waitFor(5, TimeUnit.SECONDS);
        return process.exitValue() == 0;
    }

    /**
     * 从 tModLoader 的原始输出中解析出玩家列表。
     *
     * @param rawOutput 从 tmux 抓取的原始文本
     * @return 解析后的玩家名列表
     */
    private List<String> parsePlayerList(String rawOutput) {
        List<String> players = new ArrayList<>();
        String[] lines = rawOutput.split(System.lineSeparator());

        for (String line : lines) {
            String trimmedLine = line.trim();

            // 检查行是否以 ": " 开头，以及是否包含 " ("
            if (trimmedLine.startsWith(": ") && trimmedLine.contains(" (")) {
                try {
                    // 玩家名是从第3个字符开始，直到 " (" 出现之前的位置
                    int nameEndIndex = trimmedLine.indexOf(" (");
                    String playerName = trimmedLine.substring(2, nameEndIndex);
                    players.add(playerName);
                } catch (Exception e) {
                    System.err.println("解析玩家行时出错: " + trimmedLine);
                }
            }
        }
        System.out.println(players);
        return players;
    }

    /**
     * 获取所有正在运行的 tModLoader 服务器 tmux 会话列表。
     *
     * @return 包含所有 tModLoader 会话名称的列表
     */
    public List<String> getServerList() throws IOException, InterruptedException {
        List<String> serverList = new ArrayList<>();
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("ls");

        Process process = new ProcessBuilder(command).start();

        // 读取 tmux ls 的输出
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // 提取冒号之前的部分作为会话名
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

        // 如果 tmux 命令执行失败，返回空列表
        if (process.exitValue() != 0) {
            System.err.println("未找到服务器，可能 tmux 服务未运行");
            return new ArrayList<>();
        }

        return serverList;
    }
}