package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.PlayerManager;
import com.tModLoader_Board.DTO.ServerMessage;
import com.tModLoader_Board.Service.ControlService;
import com.tModLoader_Board.Service.PlayerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
public class ServerManager {

    private static final Logger log = LoggerFactory.getLogger(ServerManager.class);

    private final ControlService controlService;
    private final PlayerService playerService;

    public ServerManager(ControlService controlService, PlayerService playerService) {
        this.controlService = controlService;
        this.playerService = playerService;
    }

    @PostMapping("/manage/stop")
    public String stop(@RequestParam String sessionName) {
        try {
            controlService.stopServer(sessionName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

    @PostMapping("/manage/broadcast")
    public String broadcast(@RequestBody ServerMessage message) {
        try {
            controlService.sendCommand(message.sessionName(), "say " + message.message());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

    @PostMapping("/manage/kickOrban")
    public String kickOrban(@RequestBody PlayerManager playerManager) {
        playerService.kickOrBanPlayer(playerManager.playerName(), playerManager.sessionName(), playerManager.action());
        return "OK";
    }

    @GetMapping("/manage/serverlist")
    public List<String> serverList() {
        try {
            return controlService.getServerList();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/manage/playerlist")
    public List<String> playerList(@RequestParam String sessionName) {
        try {
            return controlService.getPlayersOnline(sessionName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}