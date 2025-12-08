package com.tModLoader_Board.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.tModLoader_Board.config.TmodloaderPathConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
public class StartService {

    @Autowired
    private ControlService controlService;
    @Autowired
    private TmodloaderPathConfig pathConfig;

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
            // Windows 平台（已弃用）
            List<String> command = new ArrayList<>();
            command.add("cmd");
            command.add("/c");
            command.add("F:\\steam\\steamapps\\common\\tModLoader\\start-tModLoaderServer.bat");
            new ProcessBuilder(command).inheritIO().start();
            return "windows-server";
        } else {//Linux
            // 根据世界名生成一个唯一的会话名。
            String sessionName = "tmodloader-" + world.substring(0, world.length() - 4);

            // 调用 ControlService 来检查会话是否已存在。
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
            command.add(pathConfig.getServerPath());
            command.add("-nosteam");
            command.add("-world");
            command.add(pathConfig.getWorldsPath()+ world);
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
                return sessionName;
            } else {
                System.err.println("启动 tmux 会话失败！");
                return null; // 启动失败
            }
        }
    }

    public void enableMods(List<String> modFilenames, String enabledJsonPath) throws IOException {

        // 将文件名列表转换为内部模组名列表

        // 处理 null 输入
        if (modFilenames == null) {
            modFilenames = new ArrayList<>();
        }

        List<String> modNames = modFilenames.stream()
                .map(filename -> filename.replaceAll("\\.tmod$", ""))
                .collect(Collectors.toList());

        System.out.println("准备写入文件的模组名: " + modNames);


        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        File modsConfigFile = new File(enabledJsonPath);

        // 生成 enabled.json 文件
        try {
            objectMapper.writeValue(modsConfigFile, modNames);
            System.out.println("成功将 " + modNames.size() + " 个模组名以写入到 " + enabledJsonPath);
        } catch (IOException e) {
            System.err.println("写入 enabled.json 文件时发生错误: " + e.getMessage());
            throw e;
        }
    }
}