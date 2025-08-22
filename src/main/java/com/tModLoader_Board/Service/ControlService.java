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
        /**
     * 【重写后】智能地抓取指定命令的输出。
     * 此方法会从下往上查找包含 commandString 的行，并只返回该行之后的所有内容。
     *
     * @param commandString  您刚刚发送的命令（例如 "playing"），用于在输出中定位。
     * @param sessionName    目标 tmux 会话名。
     * @param linesToCapture 要抓取的最新行数（这个数字应足够大以包含命令和其完整输出）。
     * @return               命令的精确输出。如果找不到命令，则返回空字符串。
     */
    public String getTmuxOutput(String commandString, String sessionName, int linesToCapture) throws IOException, InterruptedException {
        // 步骤 1: 像以前一样，执行 tmux capture-pane 获取原始输出
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

        // 步骤 2: 将原始输出分割成行数组
        String[] lines = rawOutput.split(System.lineSeparator());

        // 步骤 3: 从下往上遍历，查找包含命令的行
        int commandLineIndex = -1;
        for (int i = lines.length - 1; i >= 0; i--) {
            // A simple .contains() is usually robust enough to find the command prompt line.
            // e.g., it will match "> playing"
            if (lines[i].contains(commandString)) {
                commandLineIndex = i;
                break; // 找到最近的一次命令，停止搜索
            }
        }

        // 步骤 4: 如果找到了命令，提取其之后的所有行
        if (commandLineIndex != -1) {
            StringBuilder commandResult = new StringBuilder();
            for (int i = commandLineIndex + 1; i < lines.length; i++) {
                commandResult.append(lines[i]).append(System.lineSeparator());
            }
            // 返回提取到的精确输出，并去除首尾可能存在的空白
            return commandResult.toString().trim();
        }

        // 如果在捕获的行中找不到命令，返回空字符串
        return "";
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
        String output = getTmuxOutput("playing", sessionName, 30);
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
        System.out.println(players);
        return players;
    }

    /**
     * 获取所有正在运行的 tModLoader 服务器 tmux 会话列表。
     *
     * @return 一个包含所有 tModLoader 会话名称的 List<String>。
     */
    public List<String> getServerList() throws IOException, InterruptedException {
        List<String> serverList = new ArrayList<>();
        List<String> command = new ArrayList<>();
        command.add("tmux");
        command.add("ls"); // "ls" 命令用于列出所有会话

        Process process = new ProcessBuilder(command).start();

        // 读取 tmux ls 的输出
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                // tmux ls 的输出格式通常是: "session_name: 1 windows (created ...)"
                // 我们需要提取冒号 ":" 之前的部分
                int colonIndex = line.indexOf(':');
                if (colonIndex != -1) {
                    String sessionName = line.substring(0, colonIndex);
                    // 只添加 tmodloader 的会话
                    if (sessionName.startsWith("tmodloader-")) {
                        serverList.add(sessionName);
                    }
                }
            }
        }

        process.waitFor(5, TimeUnit.SECONDS);

        // 如果 tmux 命令执行失败 (例如 tmux 服务未运行)，返回空列表
        if (process.exitValue() != 0) {
            System.err.println("执行 'tmux ls' 失败，可能 tmux 服务未运行。");
            return new ArrayList<>(); // 返回空列表而不是null，更安全
        }

        return serverList;
    }
}