package org.example.tmodloader_board.DTO;
import java.util.List;

public class GameConfig {
    private List<String> mods;
    private String world;
    private String maxPlayers;
    private String port;
    private String password;

    // getter 和 setter（Lombok的话用 @Data 就行）
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
        this.world ="-world D:\\文档\\My Games\\Terraria\\tModLoader\\Worlds\\" + world;
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

}