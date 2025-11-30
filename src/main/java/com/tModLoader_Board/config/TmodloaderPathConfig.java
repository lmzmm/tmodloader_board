package com.tModLoader_Board.config;
import org.springframework.stereotype.Component;

import java.io.File;
import java.util.Objects;

@Component
public class TmodloaderPathConfig {

    private String userHome = System.getProperty("user.home");
    private String mods;
    private String worlds;
    private String serverPath;

    public TmodloaderPathConfig(){
        String savePath = System.getenv("SAVE_PATH");
        String tmlPath = System.getenv("TML_PATH");

        savePath = Objects.requireNonNullElseGet(savePath, () -> userHome + "/.local/share/Terraria/tModLoader/");
        this.mods = savePath + "Mods/";
        this.worlds = savePath + "Worlds/";

        if (tmlPath != null) {
            this.serverPath = tmlPath + "/start-tModLoaderServer.sh";
        }
        else {
            this.serverPath = userHome + "/tmodloader/start-tModLoaderServer.sh";
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

    public String getMods() {
        return mods;
    }

    public String getWorlds() {
        return worlds;
    }

    public String getServerPath() {
        return serverPath;
    }
}