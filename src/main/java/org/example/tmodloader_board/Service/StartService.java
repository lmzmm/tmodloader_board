package org.example.tmodloader_board.Service;

import org.springframework.stereotype.Service;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
public class StartService {

    public void startServer(String world, String maxPlayers, String port, String password) throws IOException {
        List<String> command = new ArrayList<>();

        // 获取操作系统
        String os = System.getProperty("os.name").toLowerCase();

        if (os.contains("win")) {
            // Windows 使用 cmd 调用 bat
            command.add("cmd");
            command.add("/c");
            command.add("F:\\steam\\steamapps\\common\\tModLoader\\start-tModLoaderServer.bat");
        } else {
            // Linux / macOS 直接运行可执行文件
            command.add("/bin/bash");
            command.add("-c");
            command.add("/home/abc/tModLoader/start-tModLoaderServer.sh");
            // ↑ 你需要自己写一个简单的 .sh 脚本，里面调用 ./tModLoaderServer
        }

        // 固定参数
        command.add("-nosteam");

        // 世界文件
        command.add(world);

        // 动态参数
        command.add("-maxplayers");
        command.add(maxPlayers);

        command.add("-port");
        command.add(port);

        if (password != null && !password.isEmpty()) {
            command.add("-password");
            command.add(password);
        }

        // 启动进程
        ProcessBuilder pb = new ProcessBuilder(command);
        pb.inheritIO(); // 让输出直接映射到控制台
        pb.start();
    }
}
