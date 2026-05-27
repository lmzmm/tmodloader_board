package com.tModLoader_Board.Service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.IOException;

@Service
public class PlayerService {

    private static final Logger log = LoggerFactory.getLogger(PlayerService.class);

    private final ControlService controlService;

    public PlayerService(ControlService controlService) {
        this.controlService = controlService;
    }

    public void kickOrBanPlayer(String playerName, String sessionName, String action) {
        try {
            controlService.sendCommand(sessionName, action + " " + playerName);
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
    }
}