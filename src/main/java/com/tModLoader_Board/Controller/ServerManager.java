package com.tModLoader_Board.Controller;

import com.tModLoader_Board.Service.ControlService;
import com.tModLoader_Board.Service.PlayerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
public class ServerManager {

    @Autowired
    private ControlService controlService;

    @Autowired
    private PlayerService playerService;

    @PostMapping("/stop")
    public String stop(@RequestParam String sessionName) {
        try {
            controlService.stopServer(sessionName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

    @GetMapping("/serverlist")
    public List<String> ServerLis(){
        try {
            return controlService.getServerList();
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/playerlist")
    public List<String> PlayerLis(@RequestParam String sessionName){
        try {
            return controlService.getPlayersOnline(sessionName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}
