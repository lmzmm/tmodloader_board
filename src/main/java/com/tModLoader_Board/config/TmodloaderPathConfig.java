package com.tModLoader_Board.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardOpenOption;
import java.util.Objects;

@Component
public class TmodloaderPathConfig {

    private static final Logger log = LoggerFactory.getLogger(TmodloaderPathConfig.class);

    private final String modsPath;
    private final String worldsPath;
    private final String packagesPath;
    private final String serverPath;

    public TmodloaderPathConfig() {
        String userHome = System.getProperty("user.home");
        String savePath = System.getenv("SAVE_PATH");
        String tmlPath = System.getenv("TML_PATH");

        savePath = Objects.requireNonNullElseGet(savePath, () -> userHome + "/.local/share/Terraria/tModLoader/");
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
        } else {
            tmlPath = userHome + "/tmodloader/";
        }
        this.serverPath = tmlPath + "start-tModLoaderServer.sh";

        new File(modsPath).mkdirs();
        new File(worldsPath).mkdirs();
        new File(packagesPath).mkdirs();

        ensureExecutable(serverPath);

        try {
            setConfig();
        } catch (Exception e) {
            throw new RuntimeException("Failed to write serverconfig.txt", e);
        }
    }

    private void ensureExecutable(String path) {
        File file = new File(path);
        if (file.exists() && !file.canExecute()) {
            boolean success = file.setExecutable(true);
            if (success) {
                log.info("Set {} as executable", path);
            } else {
                log.warn("Unable to set {} as executable", path);
            }
        }
    }

    private void setConfig() throws Exception {
        String tmlPath = System.getenv("TML_PATH");
        String userHome = System.getProperty("user.home");
        if (tmlPath == null) {
            tmlPath = userHome + "/tmodloader/";
        }
        if (!tmlPath.endsWith("/")) {
            tmlPath += "/";
        }

        String content = String.format("""
                priority=1
                modpath=%s
                worldpath=%s
                """, this.modsPath, this.worldsPath);

        Path configFile = Path.of(tmlPath, "serverconfig.txt");
        Files.createDirectories(configFile.getParent());
        Files.writeString(configFile, content, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
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