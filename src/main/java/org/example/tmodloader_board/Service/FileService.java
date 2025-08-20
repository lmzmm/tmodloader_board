package org.example.tmodloader_board.Service;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.ArrayList;
import java.util.List;


@Service
public class FileService {
    public void save_file(MultipartFile file, String path) {
        try {
            String fileName = file.getOriginalFilename();
            path = path + fileName;
            file.transferTo(new File(path));
        }
        catch (Exception e) {
            System.out.println(e);
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
}
