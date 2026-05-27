package com.tModLoader_Board.Controller;

import com.tModLoader_Board.DTO.ModsPackage;
import com.tModLoader_Board.Service.FileService;
import com.tModLoader_Board.config.TmodloaderPathConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
public class ResourceManager {

    private static final Logger log = LoggerFactory.getLogger(ResourceManager.class);

    private final TmodloaderPathConfig pathConfig;
    private final FileService fileService;

    public ResourceManager(TmodloaderPathConfig pathConfig, FileService fileService) {
        this.pathConfig = pathConfig;
        this.fileService = fileService;
    }

    @PostMapping("/resource/uploadmod")
    public String uploadMod(MultipartFile file) {
        fileService.saveFile(file, pathConfig.getModsPath());
        return "OK";
    }

    @PostMapping("/resource/uploadworld")
    public String uploadWorld(MultipartFile file) {
        fileService.saveFile(file, pathConfig.getWorldsPath());
        return "OK";
    }

    @GetMapping("/resource/modlist")
    public List<String> modList() {
        return fileService.getFileList(pathConfig.getModsPath(), ".tmod");
    }

    @GetMapping("/resource/worldlist")
    public List<String> worldList() {
        return fileService.getFileList(pathConfig.getWorldsPath(), ".wld");
    }

    @GetMapping("/resource/packagelist")
    public List<String> packageList() {
        return fileService.getFileList(pathConfig.getPackagesPath(), ".json");
    }

    @PostMapping("/resource/deletemods")
    public String deleteMods(@RequestBody List<String> mods) {
        fileService.deleteFile(pathConfig.getModsPath(), mods);
        return "OK";
    }

    @PostMapping("/resource/deleteworlds")
    public String deleteWorlds(@RequestBody List<String> worlds) {
        fileService.deleteFile(pathConfig.getWorldsPath(), worlds);
        return "OK";
    }

    @PostMapping("/resource/deletepackages")
    public String deletePackages(@RequestBody List<String> packages) {
        fileService.deleteFile(pathConfig.getPackagesPath(), packages);
        return "OK";
    }

    @PostMapping("/resource/packmods")
    public String packMods(@RequestBody ModsPackage req) {
        try {
            fileService.packMods(req.mods(), req.packageName(), pathConfig.getPackagesPath());
            return "OK";
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @PostMapping("/resource/usepackage")
    public String usePackage(@RequestBody String packageName) {
        try {
            fileService.usePackage(packageName, pathConfig.getPackagesPath(), pathConfig.getModsPath());
            return "OK";
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }
}