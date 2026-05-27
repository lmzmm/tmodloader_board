package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.GameConfig;
import com.tModLoader_Board.Service.CreateWorld;
import com.tModLoader_Board.Service.StartService;
import com.tModLoader_Board.config.TmodloaderPathConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;

@RestController
public class CreateService {

    private static final Logger log = LoggerFactory.getLogger(CreateService.class);

    private final StartService startService;
    private final CreateWorld createWorld;
    private final String modPath;
    private final String worldPath;

    public CreateService(StartService startService, CreateWorld createWorld, TmodloaderPathConfig pathConfig) {
        this.startService = startService;
        this.createWorld = createWorld;
        this.modPath = pathConfig.getModsPath();
        this.worldPath = pathConfig.getWorldsPath();
    }

    @PostMapping("/create/create")
    public String start(@RequestBody GameConfig config) {
        log.info("Starting server with world: {}", config.world());
        try {
            log.info("Mods to enable: {}", config.mods());
            if (!config.packaged()) {
                startService.enableMods(config.mods(), modPath + "enabled.json");
            }
            startService.startServer(config.world(), config.maxPlayers(), config.port(), config.password());
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        try {
            Thread.sleep(30000);
        } catch (InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

    @PostMapping("/create/startworldcreator")
    public String startWorldCreatorProcess(@RequestBody GameConfig config) {
        try {
            if (!config.packaged()) {
                startService.enableMods(config.mods(), modPath + "enabled.json");
            }
            createWorld.startConfigurationProcess(modPath, worldPath);
            return "OK";
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping(value = "/create/worldprogress-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamWorldCreationProgress() {
        SseEmitter emitter = new SseEmitter(3600_000L);
        createWorld.streamProgress(emitter);
        return emitter;
    }

    @PostMapping("/create/cancelworldcreation")
    public String cancelWorldCreation() {
        log.info("Received request to cancel world creation");
        createWorld.stopProcess();
        return "OK";
    }

    @PostMapping("/create/worldconfig")
    public String worldConfig(@RequestBody(required = false) String config) {
        try {
            if (config != null && !config.trim().isEmpty()) {
                log.info("Received config param: {}", config);
                createWorld.sendCommand(config);
            } else {
                createWorld.sendCommand("");
            }
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }
}