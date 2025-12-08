package com.tModLoader_Board.config;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Objects;

@Component
public class TmodloaderPathConfig {

    final String userHome = System.getProperty("user.home");
    final String modsPath;
    final String worldsPath;
    final String packagesPath;
    final String tmlPath;
    final String serverPath;

    public TmodloaderPathConfig(){
        String savePath = System.getenv("SAVE_PATH");
        String tmlPath = System.getenv("TML_PATH");

        savePath = Objects.requireNonNullElseGet(savePath, () -> userHome + "/.local/share/Terraria/tModLoader/");
        // 确保路径以 / 结尾
        if (!savePath.endsWith("/")) {
            savePath += "/";
        }
        this.modsPath = savePath + "Mods/";
        this.worldsPath = savePath + "Worlds/";
        this.packagesPath = savePath + "Packages/";

        if (tmlPath != null) {
            if (!tmlPath.endsWith("/")) {
                tmlPath += "/";
            }
            this.tmlPath = tmlPath;
        }
        else {
            this.tmlPath = userHome + "/tmodloader/";
        }
        this.serverPath = tmlPath + "start-tModLoaderServer.sh";

        // 创建目录
        new File(modsPath).mkdirs();
        new File(worldsPath).mkdirs();
        new File(packagesPath).mkdirs();

        ensureExecutable(serverPath);

        try {
            setConfig();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void ensureExecutable(String path) {
        File file = new File(path);
        if (!file.canExecute()) {
            boolean success = file.setExecutable(true);
            if (success) {
                System.out.println("已设置 " + path + " 为可执行文件");
            }
            else {
                System.out.println("无法设置 " + path + " 为可执行文件");
            }
        }
    }

    private void setConfig() throws  Exception {
        String content = String.format("""
                priority=1
                modpath=%s
                worldpath=%s
                """, this.modsPath, this.worldsPath);

        Files.writeString(Path.of(this.tmlPath, "serverconfig.txt"), content, StandardOpenOption.TRUNCATE_EXISTING);
    }

    public String getModsPath() {
        return modsPath;
    }

    public String getWorldsPath() {
        return worldsPath;
    }

    public String getPackagesPath() {
        return packagesPath;
    }

    public String getServerPath() {
        return serverPath;
    }
}