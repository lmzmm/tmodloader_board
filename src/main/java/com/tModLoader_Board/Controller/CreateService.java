package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.GameConfig;
import com.tModLoader_Board.Service.ControlService;
import com.tModLoader_Board.Service.CreateWorld;
import com.tModLoader_Board.Service.FileService;
import com.tModLoader_Board.Service.StartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;


@RestController
public class CreateService {

    private String modPath;
    private String worldPath;

    @Autowired
    private FileService fileService;
    @Autowired
    private  StartService startService;
    @Autowired
    private CreateWorld createWorld;

    public void setPath(){
        String os = System.getProperty("os.name").toLowerCase();
        // 根据不同的系统执行不同的命令
        String tmodloaderPath;
        if (!os.contains("win")){
            tmodloaderPath = System.getProperty("user.home") + "/.local/share/Terraria/tModLoader/";
            this.modPath = tmodloaderPath + "Mods/";
            this.worldPath = tmodloaderPath + "Worlds/";
        }
        else {
            tmodloaderPath = "E:\\project\\java\\tmodloader_board\\src\\main\\resources\\up\\";
            this.modPath = tmodloaderPath + "Mods\\";
            this.worldPath = tmodloaderPath + "Worlds\\";
        }
    }

    @PostMapping("/create/uploadmod")
    public String upload(MultipartFile file) {
        fileService.save_file(file, modPath);
        return "OK";
    }

    @PostMapping("/create/uploadworld")
    public String uploadworld(MultipartFile file) {
        fileService.save_file(file, worldPath);
        return "OK";
    }

    @PostMapping("/create/create")
    public String start(@RequestBody GameConfig config) {
        System.out.println(config.getWorld());
        try {
            System.out.println(config.getMods());
            startService.enableMods(config.getMods(), modPath + "enabled.json");
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
            startService.enableMods(config.getMods(), modPath + "enabled.json");
            createWorld.startConfigurationProcess();
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

    @GetMapping("/create/modlist")
    public List<String> modlist() {
        setPath();
        String path = modPath;
        String filename = ".tmod";
        return fileService.getfilelist(path, filename);
    }

    @GetMapping("/create/worldlist")
    public List<String> worldlist() {
        String path = worldPath;
        String filename = ".wld";
        return fileService.getfilelist(path, filename);
    }

}
