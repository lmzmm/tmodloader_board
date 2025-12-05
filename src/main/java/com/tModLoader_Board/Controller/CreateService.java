package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.GameConfig;
import com.tModLoader_Board.Service.CreateWorld;
import com.tModLoader_Board.Service.StartService;
import com.tModLoader_Board.config.TmodloaderPathConfig;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;


@RestController
public class CreateService {

    private final StartService startService;
    private final CreateWorld createWorld;
    private final String modPath;

    public CreateService(StartService startService, CreateWorld createWorld, TmodloaderPathConfig pathConfig) {
        this.startService = startService;
        this.createWorld = createWorld;

        this.modPath = pathConfig.getModsPath();
    }

    @PostMapping("/create/create")
    public String start(@RequestBody GameConfig config) {
        System.out.println(config.getWorld());
        try {
            System.out.println(config.getMods());
            if (!config.isPackaged()) {
                startService.enableMods(config.getMods(), modPath + "enabled.json");
            }
            startService.startServer(config.getWorld(), config.getMaxPlayers(), config.getPort(), config.getPassword());
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
            if (!config.isPackaged()) {
                startService.enableMods(config.getMods(), modPath + "enabled.json");
            }
            createWorld.startConfigurationProcess(modPath);
            return "OK";
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "无法启动服务器进程", e);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }


    @GetMapping(value = "/create/worldprogress-stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamWorldCreationProgress() {
        SseEmitter emitter = new SseEmitter(3600_000L); // 1小时超时
        createWorld.streamProgress(emitter);
        return emitter;
    }

    @PostMapping("/create/cancelworldcreation")
    public String cancelWorldCreation() {
        System.out.println("收到取消世界创建的请求...");
        createWorld.stopProcess(); // 调用服务中的 stopProcess 方法
        return "OK";
    }

    @PostMapping("/create/worldconfig")
    public String worldConfig(@RequestBody(required = false) String config) {
        try {
            if (config != null && !config.trim().isEmpty()) {
                System.out.println("收到参数: " + config);
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
