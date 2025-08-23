package com.tModLoader_Board.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class PlayerService {

    @Autowired
    private ControlService controlService;

    public void kickOrBanPlayer(String playerName, String sessionName, String action) {
        try {
            controlService.sendCommand(sessionName, action + " " + playerName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }

}
