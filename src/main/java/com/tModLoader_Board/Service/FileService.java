package com.tModLoader_Board.Service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FileService {

    private static final Logger log = LoggerFactory.getLogger(FileService.class);

    public void saveFile(MultipartFile file, String path) {
        try {
            String fileName = sanitizeFilename(file.getOriginalFilename());
            String destPath = path + fileName;
            file.transferTo(new File(destPath));
            log.info("Saved file: {}", destPath);
        } catch (Exception e) {
            log.error("Failed to save file: {}", e.getMessage(), e);
        }
    }

    public void deleteFile(String path, List<String> fileList) {
        for (String fileName : fileList) {
            String sanitized = sanitizeFilename(fileName);
            File file = new File(path + sanitized);
            if (file.exists()) {
                file.delete();
                log.info("Deleted file: {}", sanitized);
            }
        }
    }

    public List<String> getFileList(String path, String extension) {
        List<String> fileList = new ArrayList<>();
        File dir = new File(path);

        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(extension));
            if (files != null) {
                for (File file : files) {
                    fileList.add(file.getName());
                }
            }
        }
        return fileList;
    }

    public void packMods(List<String> mods, String packageName, String packagePath) throws IOException {
        if (mods == null) {
            mods = new ArrayList<>();
        }

        List<String> modNames = mods.stream()
                .map(filename -> filename.replaceAll("\\.tmod$", ""))
                .collect(Collectors.toList());

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        String safeName = sanitizeFilename(packageName);
        File modsConfigFile = new File(packagePath + safeName + ".json");

        try {
            objectMapper.writeValue(modsConfigFile, modNames);
            log.info("Successfully created package: {}", packageName);
        } catch (IOException e) {
            log.error("Error creating package: {}", e.getMessage());
            throw e;
        }
    }

    public void usePackage(String packageName, String packagePath, String modsPath) throws IOException {
        String safeName = sanitizeFilename(packageName);
        Path src = Paths.get(packagePath + safeName);
        Path dest = Paths.get(modsPath + "enabled.json");
        log.info("Using package: {}", packageName);
        Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
    }

    private String sanitizeFilename(String filename) {
        if (filename == null) {
            return "unknown";
        }
        String sanitized = filename.replace("\\", "/");
        int lastSlash = sanitized.lastIndexOf('/');
        if (lastSlash >= 0) {
            sanitized = sanitized.substring(lastSlash + 1);
        }
        sanitized = sanitized.replaceAll("[^a-zA-Z0-9._\\-\\u4e00-\\u9fff]", "_");
        if (sanitized.isEmpty() || sanitized.equals(".") || sanitized.equals("..")) {
            sanitized = "unknown";
        }
        return sanitized;
    }
}