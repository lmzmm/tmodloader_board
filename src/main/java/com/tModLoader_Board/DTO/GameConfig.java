package com.tModLoader_Board.DTO;
import java.util.List;

public class GameConfig {
    private List<String> mods;
    private String world;
    private String maxPlayers;
    private String port;
    private String password;
    private String packageName;
    private boolean packaged;


    public List<String> getMods() {
        return mods;
    }

    public void setMods(List<String> mods) {
        this.mods = mods;
    }

    public String getWorld() {
        return world;
    }

    public void setWorld(String world) {
        this.world =world;
    }

    public String getMaxPlayers() {
        return maxPlayers;
    }

    public void setMaxPlayers(String maxPlayers) {
        this.maxPlayers = maxPlayers;
    }

    public String getPort() {
        return port;
    }

    public void setPort(String port) {
        this.port = port;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isPackaged() {
        return packaged;
    }

    public void setPackaged(boolean isPackage) {
        this.packaged = isPackage;
    }

}