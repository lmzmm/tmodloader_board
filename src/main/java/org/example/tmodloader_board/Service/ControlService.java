package org.example.tmodloader_board.Service;

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
     *
     * @param sessionName 目标 tmux 会话名。
     * @param commandString 要发送的指令, 例如 "playing"。
     */
    public void sendCommand(String sessionName, String commandString) throws IOException, InterruptedException {
        // 【重点】所有控制命令都依赖于一个精确的 sessionName 来定位目标服务器。
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("send-keys");
        command.add("-t"); // -t 用于指定目标会话
        command.add(sessionName);
        command.add(commandString);
        // 【重点】"C-m" 是 Control-M 的缩写，代表回车键。发送命令后必须模拟回车，否则命令不会被执行。
        command.add("C-m");

        Process p = new ProcessBuilder(command).start();
        p.waitFor(5, TimeUnit.SECONDS); // 等待命令执行完毕
    }

    /**
     * 从指定的 tmux 会话中抓取最新的屏幕输出内容。
     *
     * @param sessionName    目标 tmux 会话名。
     * @param linesToCapture 要抓取的最新行数。
     * @return 包含屏幕输出内容的字符串。
     */
    public String getTmuxOutput(String sessionName, int linesToCapture) throws IOException, InterruptedException {
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("capture-pane");
        // 【重点】"-p" 参数让 tmux 将捕获的内容打印到标准输出(stdout)，这样我们的 Java 程序才能读到它。
        command.add("-p");
        command.add("-t");
        command.add(sessionName);
        command.add("-S"); // -S 指定开始行
        command.add("-" + linesToCapture); // 负数表示从末尾倒数，例如 -100 表示最新的 100 行。

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
     *
     * @param sessionName 服务器所在的 tmux 会话名。
     * @return 一个包含玩家名称的 List<String>。
     */
    public List<String> getPlayersOnline(String sessionName) throws IOException, InterruptedException {
        sendCommand(sessionName, "playing");
        Thread.sleep(500); // 等待服务器响应
        String output = getTmuxOutput(sessionName, 30);
        return parsePlayerList(output);
    }

    /**
     * 优雅地停止服务器。
     * @param sessionName 服务器所在的 tmux 会话名。
     */
    public void stopServer(String sessionName) throws IOException, InterruptedException {
        if (isSessionRunning(sessionName)) {
            System.out.println("正在向会话 '" + sessionName + "' 发送 'exit' 命令以关闭服务器...");
            sendCommand(sessionName, "exit");
            Thread.sleep(2000); // 等待进程优雅退出
            // (可选) 强制关闭以防万一
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
     *
     * @param sessionName 要检查的会话名。
     * @return 如果正在运行，返回 true。
     */
    public boolean isSessionRunning(String sessionName) throws IOException, InterruptedException {
        // 【重点】"tmux has-session" 是一个专门用来检查会话是否存在的命令。
        Process process = new ProcessBuilder("tmux", "has-session", "-t", sessionName).start();
        process.waitFor(5, TimeUnit.SECONDS);
        return process.exitValue() == 0;
    }

    /**
     * 私有辅助方法，从 tModLoader 的原始输出中解析出玩家列表。
     */
    private List<String> parsePlayerList(String rawOutput) {
        List<String> players = new ArrayList<>();
        boolean playerSectionFound = false;
        for (String line : rawOutput.split(System.lineSeparator())) {
            String trimmedLine = line.trim();
            if (playerSectionFound) {
                if (trimmedLine.isEmpty() || trimmedLine.startsWith(">")) {
                    break;
                }
                players.add(trimmedLine);
            }
            if (trimmedLine.equalsIgnoreCase("Players:")) {
                playerSectionFound = true;
            }
        }
        return players;
    }
}