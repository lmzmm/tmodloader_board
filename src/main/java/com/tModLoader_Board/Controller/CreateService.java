package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.GameConfig;
import com.tModLoader_Board.Service.ControlService;
import com.tModLoader_Board.Service.FileService;
import com.tModLoader_Board.Service.StartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


@RestController
public class CreateService {

    private String modPath;
    private String worldPath;

    @Autowired
    private FileService fileService;
    @Autowired
    private  StartService startService;
    @Autowired
    private ControlService controlService;

    public void setPath(){
        String os = System.getProperty("os.name").toLowerCase();
        // 根据不同的系统执行不同的命令
        String tmodloaderPath;
        if (!os.contains("win")){
            tmodloaderPath = "/home/abc/.local/share/Terraria/tModLoader/";
            this.modPath = tmodloaderPath + "Mods/";
            this.worldPath = tmodloaderPath + "Worlds/";
        }
        else {
            tmodloaderPath = "E:\\project\\java\\tmodloader_board\\src\\main\\resources\\up\\";
            this.modPath = tmodloaderPath + "Mods\\";
            this.worldPath = tmodloaderPath + "Worlds\\";
        }
    }

    @PostMapping("/uploadmod")
    public String upload(MultipartFile file) {
        fileService.save_file(file, modPath);
        return "OK";
    }

    @PostMapping("/uploadworld")
    public String uploadworld(MultipartFile file) {
        fileService.save_file(file, worldPath);
        return "OK";
    }

    @PostMapping("/create")
    public String start(@RequestBody GameConfig config) {
        System.out.println(config.getWorld());
        try {
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

    @GetMapping("/modlist")
    public List<String> modlist() {
        setPath();
        String path = modPath;
        String filename = ".tmod";
        return fileService.getfilelist(path, filename);
    }

    @GetMapping("/worldlist")
    public List<String> worldlist() {
        String path = worldPath;
        String filename = ".wld";
        return fileService.getfilelist(path, filename);
    }

    @PostMapping("/test1")
    public String test1(){
        try {
            System.out.println(controlService.getPlayersOnline("tmodloader-20250715"));
        } catch (IOException | InterruptedException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

}
