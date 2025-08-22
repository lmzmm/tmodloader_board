package com.tModLoader_Board.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

/**
 * 【职责】: 负责启动一个新的 tModLoader 服务器进程。
 * 这个服务就像一个服务器的"工厂"或"启动器"。
 */
@Service
public class StartService {

    @Autowired
    private ControlService controlService;

    /**
     * 启动 tModLoader 服务器。
     *
     * @param world      世界文件名 (例如 "MyWorld.wld")。
     * @param maxPlayers 最大玩家数。
     * @param port       服务器端口。
     * @param password   服务器密码，可为 null 或空。
     * @return           成功启动或已在运行时，返回 tmux 会话名。启动失败则返回 null。
     */
    public String startServer(String world, String maxPlayers, String port, String password) throws IOException, InterruptedException {
        String os = System.getProperty("os.name").toLowerCase();

        if (os.contains("win")) {
            // Windows 平台的逻辑
            List<String> command = new ArrayList<>();
            command.add("cmd");
            command.add("/c");
            command.add("F:\\steam\\steamapps\\common\\tModLoader\\start-tModLoaderServer.bat");
            // ... 添加其他参数 ...
            new ProcessBuilder(command).inheritIO().start();
            return "windows-server"; // 返回一个静态标识符
        } else {
            // --- Linux 平台的启动逻辑 ---

            // 【重点】根据世界名生成一个干净、唯一的会话名。
            String sessionName = "tmodloader-" + world.substring(0, world.length() - 4).replaceAll("[^a-zA-Z0-9_.-]", "");

            // 【重点】调用 ControlService 来检查会话是否已存在。
            if (controlService.isSessionRunning(sessionName)) {
                System.out.println("服务器会话 '" + sessionName + "' 已经在运行中，无需重复启动。");
                return sessionName; // 返回已存在的会话名
            }

            List<String> command = new ArrayList<>();
            command.add("tmux");
            command.add("new-session");
            command.add("-d");
                command.add("-s");
            command.add(sessionName);
            command.add("/home/abc/tmodloader/start-tModLoaderServer.sh");
            command.add("-nosteam");
            command.add("-world");
            command.add("/home/abc/.local/share/Terraria/tModLoader/Worlds/" + world);
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
                System.out.println("服务器已在 tmux 会话 '" + sessionName + "' 中成功启动。");
                // 【重点】成功后返回会话名，调用者可以保存这个名字，并用它来操作 ControlService。
                return sessionName;
            } else {
                System.err.println("启动 tmux 会话失败！");
                return null; // 启动失败
            }
        }
    }

    public void enableMods(List<String> modFilenames, String enabledJsonPath) throws IOException {

    // --- 步骤 1: 将文件名列表转换为内部模组名列表 ---

    // 防御性编程，处理 null 输入
    if (modFilenames == null) {
        modFilenames = new ArrayList<>();
    }

    List<String> modNames = modFilenames.stream()
            .map(filename -> filename.replaceAll("\\.tmod$", ""))
            .collect(Collectors.toList());

    System.out.println("处理后，准备写入文件的模组名: " + modNames);

    // --- 步骤 2: 创建并配置 ObjectMapper 以生成美化格式的 JSON ---

    ObjectMapper objectMapper = new ObjectMapper();

    // 【这是实现“每个单独一行”的关键！】
    // 开启 INDENT_OUTPUT 功能，它会自动添加换行和缩进，生成您要的格式。
    objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

    File modsConfigFile = new File(enabledJsonPath);

    // 确保父目录存在
    File parentDir = modsConfigFile.getParentFile();
    if (parentDir != null && !parentDir.exists()) {
        if (!parentDir.mkdirs()) {
            throw new IOException("无法创建模组配置目录: " + parentDir.getAbsolutePath());
        }
    }

    // --- 步骤 3: 将处理后的模组名列表写入文件 ---
    // objectMapper 会自动生成如下格式：
    // [
    //   "CalamityMod",
    //   "BossChecklist",
    //   "CalamityModMusic"
    // ]
    try {
        objectMapper.writeValue(modsConfigFile, modNames);
        System.out.println("成功将 " + modNames.size() + " 个模组名以【正确格式】写入到 " + enabledJsonPath);
    } catch (IOException e) {
        System.err.println("写入 enabled.json 文件时发生严重错误: " + e.getMessage());
        throw e;
    }
    }
}