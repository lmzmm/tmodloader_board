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

    @Autowired
    private FileService fileService;
    @Autowired
    private  StartService startService;


    @PostMapping("/uploadmod")
    public String upload(MultipartFile file) {
        fileService.save_file(file, "E:\\project\\java\\tmodloader_board\\src\\main\\resources\\up\\mod\\");
        return "OK";
    }

    @PostMapping("/uploadworld")
    public String uploadworld(MultipartFile file) {
        fileService.save_file(file, "E:\\project\\java\\tmodloader_board\\src\\main\\resources\\up\\world\\");
        return "OK";
    }

    @PostMapping("/create")
    public String start(@RequestBody GameConfig config) {
        System.out.println(config.getWorld());
        try {
            startService.startServer(config.getWorld(), config.getMaxPlayers(), config.getPort(), config.getPassword());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return "OK";
    }

    @GetMapping("/modlist")
    public List<String> modlist() {
        String path = "E:\\project\\java\\tmodloader_board\\src\\main\\resources\\up\\mod";
        String filename = ".tmod";
        return fileService.getfilelist(path, filename);
    }

    @GetMapping("/worldlist")
    public List<String> worldlist() {
        String path = "D:\\文档\\My Games\\Terraria\\tModLoader\\Worlds";
        String filename = ".wld";
        return fileService.getfilelist(path, filename);
    }
}
