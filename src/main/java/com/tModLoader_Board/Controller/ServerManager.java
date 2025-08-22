package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.PlayerManager;
import com.tModLoader_Board.DTO.ServerMessage;
import com.tModLoader_Board.Service.ControlService;
import com.tModLoader_Board.Service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
public class ServerManager {

    @Autowired
    private ControlService controlService;

    @Autowired
    private PlayerService playerService;

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
            controlService.sendCommand(message.getSessionName(), "say " + message.getMessage());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

    @PostMapping("/manage/kickOrban)")
    public String kickOrban(@RequestBody PlayerManager playerManager) {
        playerService.kickOrBanPlayer(playerManager.getPlayerName(), playerManager.getSessionName(), playerManager.getAction());
        return "OK";
    }

    @GetMapping("/manage/serverlist")
    public List<String> ServerLis(){
        try {
            return controlService.getServerList();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/manage/playerlist")
    public List<String> PlayerLis(@RequestParam String sessionName){
        try {
            return controlService.getPlayersOnline(sessionName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
