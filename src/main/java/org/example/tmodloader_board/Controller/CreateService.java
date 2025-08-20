package org.example.tmodloader_board.Controller;

import org.example.tmodloader_board.DTO.GameConfig;
import org.example.tmodloader_board.Service.FileService;
import org.example.tmodloader_board.Service.StartService;
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

    private String tmodloaderPath;
    private String modPath;
    private String worldPath;

    @Autowired
    private FileService fileService;
    @Autowired
    private  StartService startService;


    public void setPath(){
        String os = System.getProperty("os.name").toLowerCase();
        // 根据不同的系统执行不同的命令
        if (!os.contains("win")){
            this.tmodloaderPath = "/home/abc/.local/share/Terraria/tModLoader/";
            this.modPath = this.tmodloaderPath + "mods/";
            this.worldPath = this.tmodloaderPath + "world/";
        }
        else {
            this.tmodloaderPath = "E:\\project\\java\\tmodloader_board\\src\\main\\resources\\up\\";
            this.modPath = this.tmodloaderPath + "mods\\";
            this.worldPath = this.tmodloaderPath + "world\\";
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
        } catch (IOException e) {
            throw new RuntimeException(e);
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
}
