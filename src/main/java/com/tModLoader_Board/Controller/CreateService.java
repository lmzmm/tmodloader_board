package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.GameConfig;
import com.tModLoader_Board.Service.ControlService;
import com.tModLoader_Board.Service.CreateWorld;
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
    public String startworldcreator(@RequestBody Map<String, List<String>> payload) {
        // 从 Map 中根据键 "mods" 获取列表
        List<String> mods = payload.get("mods");
        try {
            startService.enableMods(mods, modPath + "enabled.json");
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        System.out.println("收到的 Mods 列表: " + mods);

        createWorld.startWorldCreator();

        return "OK";
    }

    @PostMapping("/create/worldConfig")
    public String worldConfig(@RequestBody String config) {
        try {
            System.out.println(config);
            createWorld.sendCommand(config);
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
