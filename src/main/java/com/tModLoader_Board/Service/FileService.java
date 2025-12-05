package com.tModLoader_Board.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;


@Service
public class FileService {
    public void saveFile(MultipartFile file, String path) {
        try {
            String fileName = file.getOriginalFilename();
            path = path + fileName;
            file.transferTo(new File(path));
        }
        catch (Exception e) {
            System.out.println(e);
        }
    }

    public void deleteFile(String path, List<String> fileList){
        for (String fileName : fileList) {
            File file = new File(path + fileName);
            if (file.exists()) {
                file.delete();
                System.out.println("成功删除文件：" + fileName);
            }
        }
    }

    public List<String> getfilelist(String path, String fileName) {

        List<String> fileList = new ArrayList<>();
        File dir = new File(path);

        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((d, name) -> name.toLowerCase().endsWith(fileName));
            if (files != null) {
                for (File file : files) {
                    fileList.add(file.getName()); // 只返回文件名，不含路径
                }
            }
        }
        return fileList;
    }

    public void packMods(List<String> mods, String packageName, String packagePath) throws IOException {

        // 将文件名列表转换为内部模组名列表

        // 处理 null 输入
        if (mods == null) {
            mods = new ArrayList<>();
        }

        List<String> modNames = mods.stream()
                .map(filename -> filename.replaceAll("\\.tmod$", ""))
                .collect(Collectors.toList());

        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.enable(SerializationFeature.INDENT_OUTPUT);

        File modsConfigFile = new File(packagePath + packageName + ".json");

        // 生成.json 文件
        try {
            objectMapper.writeValue(modsConfigFile, modNames);
            System.out.println("成功创建整合包：" + packageName);
        } catch (IOException e) {
            System.err.println("发生错误: " + e.getMessage());
            throw e;
        }
    }

    public void usePackage(String packageName, String packagePath, String modsPath) throws  IOException{
        Path src = Paths.get(packagePath + packageName);
        Path dest = Paths.get(modsPath + "enabled.json");
        System.out.println("使用整合包：" + packageName);
        Files.copy(src, dest, StandardCopyOption.REPLACE_EXISTING);
    }
}