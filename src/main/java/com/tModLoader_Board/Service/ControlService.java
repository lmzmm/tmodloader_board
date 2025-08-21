package com.tModLoader_Board.Service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * 【职责】: 负责与一个已经存在的、正在运行的 tModLoader 服务器 tmux 会话进行交互。
 * 这个服务就像一个服务器的"遥控器"。
 */
@Service
public class ControlService {

    // ===================================================================================
    // 核心交互方法 (发送命令 & 获取输出)
    // ===================================================================================

    /**
     * 向指定的 tmux 会话发送一条指令。
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
     * 从指定的 tmux 会话中抓取最新的屏幕输出内容。
     */
    public String getTmuxOutput(String sessionName, int linesToCapture) throws IOException, InterruptedException {
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("capture-pane");
        command.add("-p");
        command.add("-t");
        command.add(sessionName);
        command.add("-S");
        command.add("-" + linesToCapture);

        Process process = new ProcessBuilder(command).start();

        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append(System.lineSeparator());
            }
        }

        process.waitFor(5, TimeUnit.SECONDS);
        return output.toString();
    }

    // ===================================================================================
    // 应用层封装 (获取玩家列表 & 停止服务器)
    // ===================================================================================

    /**
     * 获取指定服务器上的在线玩家列表。
     */
    public List<String> getPlayersOnline(String sessionName) throws IOException, InterruptedException {
        sendCommand(sessionName, "playing");
        Thread.sleep(500); // 等待服务器响应
        String output = getTmuxOutput(sessionName, 30);
        // 【重点】调用下面已修改的解析方法
        return parsePlayerList(output);
    }

    /**
     * 优雅地停止服务器。
     */
    public void stopServer(String sessionName) throws IOException, InterruptedException {
        if (isSessionRunning(sessionName)) {
            System.out.println("正在向会话 '" + sessionName + "' 发送 'exit' 命令以关闭服务器...");
            sendCommand(sessionName, "exit");
            Thread.sleep(2000);
            if (isSessionRunning(sessionName)) {
                new ProcessBuilder("tmux", "kill-session", "-t", sessionName).start();
            }
        } else {
            System.out.println("会话 '" + sessionName + "' 未在运行。");
        }
    }

    // ===================================================================================
    // 辅助工具方法 (解析 & 状态检查)
    // ===================================================================================

    /**
     * 检查指定的 tmux 会话当前是否正在运行。
     */
    public boolean isSessionRunning(String sessionName) throws IOException, InterruptedException {
        Process process = new ProcessBuilder("tmux", "has-session", "-t", sessionName).start();
        process.waitFor(5, TimeUnit.SECONDS);
        return process.exitValue() == 0;
    }

    /**
     * 私有辅助方法，从 tModLoader 的原始输出中解析出玩家列表。
     * 此方法已根据实际输出格式 ": PlayerName (IP:Port)" 进行重写。
     *
     * @param rawOutput 从 tmux 抓取的原始文本。
     * @return 解析后的玩家名列表。
     */
    private List<String> parsePlayerList(String rawOutput) {
        List<String> players = new ArrayList<>();
        String[] lines = rawOutput.split(System.lineSeparator());

        for (String line : lines) {
            String trimmedLine = line.trim();

            // 1. 检查行是否以 ": " 开头。
            // 2. 检查行是否包含 " ("，这是玩家名和IP地址的分隔符。
            if (trimmedLine.startsWith(": ") && trimmedLine.contains(" (")) {
                try {
                    // 玩家名是从第3个字符(索引为2)开始，直到 " (" 出现之前的位置。
                    int nameEndIndex = trimmedLine.indexOf(" (");
                    String playerName = trimmedLine.substring(2, nameEndIndex);
                    players.add(playerName);
                } catch (Exception e) {
                    // 如果解析出现意外，打印错误但程序不中断
                    System.err.println("解析玩家行时出错: " + trimmedLine);
                }
            }
        }
        return players;
    }
}