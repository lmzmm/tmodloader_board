package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.ModsPackage;
import com.tModLoader_Board.Service.FileService;
import com.tModLoader_Board.config.TmodloaderPathConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;


@RestController
public class ResourceManager {
    @Autowired
    private TmodloaderPathConfig pathConfig;

    @Autowired
    private FileService fileService;

    @PostMapping("/resource/uploadmod")
    public String upload(MultipartFile file) {
        fileService.saveFile(file, pathConfig.getModsPath());
        return "OK";
    }

    @PostMapping("/resource/uploadworld")
    public String uploadworld(MultipartFile file) {
        fileService.saveFile(file, pathConfig.getWorldsPath());
        return "OK";
    }

    @GetMapping("/resource/modlist")
    public List<String> modlist() {
        String filename = ".tmod";
        return fileService.getfilelist(pathConfig.getModsPath(), filename);
    }

    @GetMapping("/resource/worldlist")
    public List<String> worldlist() {
        String filename = ".wld";
        return fileService.getfilelist(pathConfig.getWorldsPath(), filename);
    }

    @GetMapping("/resource/packagelist")
    public List<String> packagelist() {
        String filename = ".json";
        return fileService.getfilelist(pathConfig.getPackagesPath(), filename);
    }

    @PostMapping("/resource/deletemods")
    public String delMods(@RequestBody List<String> mods){
        fileService.deleteFile(pathConfig.getModsPath(), mods);
        return "OK";
    }

    @PostMapping("/resource/deleteworlds")
    public String delWorlds(@RequestBody List<String> worlds){
        fileService.deleteFile(pathConfig.getWorldsPath(), worlds);
        return "OK";
    }

    @PostMapping("/resource/deletepackages")
    public String delPackages(@RequestBody List<String> packages){
        fileService.deleteFile(pathConfig.getPackagesPath(), packages);
        return "OK";
    }

    @PostMapping("/resource/packmods")
    public String packMods(@RequestBody ModsPackage req){
        try {
            fileService.packMods(req.getMods(), req.getPackageName(), pathConfig.getPackagesPath());
            return "OK";
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/resource/usepackage")
    public String usePackage(@RequestBody String packageName){
        try {
            fileService.usePackage(packageName, pathConfig.getPackagesPath(), pathConfig.getModsPath());
            return "OK";
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}
