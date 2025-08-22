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

    public void enableMods(List<String> modsToEnable, String MODS_PATH) throws IOException {
        // 1. 创建 Jackson 的核心转换类 ObjectMapper
        ObjectMapper objectMapper = new ObjectMapper();

        // 2. (可选) 开启 "pretty print" 功能，让生成的 JSON 文件格式更美观，易于阅读。
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        // 3. 创建文件对象
        File modsConfigFile = new File(MODS_PATH);

        // 4. (可选但推荐) 确保父目录存在，如果不存在则创建它
        File parentDir = modsConfigFile.getParentFile();
        if (!parentDir.exists()) {
            if (parentDir.mkdirs()) {
                System.out.println("创建了新的模组配置目录: " + parentDir.getAbsolutePath());
            } else {
                throw new IOException("无法创建模组配置目录: " + parentDir.getAbsolutePath());
            }
        }

        // 5. 【核心】使用 ObjectMapper 将 Java List<String> 对象直接写入到文件中
        // Jackson 会自动处理转义、引号、逗号和方括号，生成完全合规的 JSON。
        try {
            objectMapper.writeValue(modsConfigFile, modsToEnable);
            System.out.println("成功将 " + modsToEnable.size() + " 个模组写入");
        } catch (IOException e) {
            System.err.println("写入 enabled.json 文件时发生错误: " + e.getMessage());
            // 将异常向上抛出，让 Controller 层来处理并返回给前端一个错误响应
            throw e;
        }
    }
}