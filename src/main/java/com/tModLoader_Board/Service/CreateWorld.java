package com.tModLoader_Board.Service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.ArrayList;
import java.util.List;

@Service
public class CreateWorld {
    private String serverPath = System.getProperty("user.home") + "/tmodloader/start-tModLoaderServer.sh";
    private Process process;
    private BufferedWriter writer;
    private BufferedReader reader;

    public void startWorldCreator() {
        List<String> command = new ArrayList<>();
        System.out.println(serverPath);
        command.add(serverPath);
        command.add("-nosteam");
        try {
            ProcessBuilder processBuilder = new ProcessBuilder(command);
            // 将错误输出流重定向到标准输出流
            processBuilder.redirectErrorStream(true);
            this.process = processBuilder.start();
            // 获取进程的输出流，用于向其写入指令
            this.writer = new BufferedWriter(new OutputStreamWriter(process.getOutputStream()));
            // 获取进程的输入流，用于读取其输出
            this.reader = new BufferedReader(new InputStreamReader(process.getInputStream()));

        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    /**
     * 向进程输入指令。
     *
     * @param command 要发送给进程的指令。
     * @throws IOException 如果写入指令时发生 I/O 错误。
     */
    public void sendCommand(String command) throws IOException {
        if (writer != null) {
            writer.write(command);
            writer.newLine(); // 添加换行符以表示指令结束
            writer.flush(); // 确保指令被立即发送
        }
    }

    /**
     * 从进程读取一行输出。
     *
     * @return 进程的一行输出，如果没有更多输出则返回 null。
     * @throws IOException 如果读取输出时发生 I/O 错误。
     */
    public String readOutput() throws IOException {
        if (reader != null && reader.ready()) {
            return reader.readLine();
        }
        return null;
    }

    public void readAll() {
        String r = null;
        while (true) {
            try {
                r = readOutput();
            } catch (IOException e) {
                throw new RuntimeException(e);
            }
            if (r != null) {
                System.out.println(r);
                try {
                    Thread.sleep(100);
                } catch (InterruptedException e) {
                    throw new RuntimeException(e);
                }
            }
            else {
                System.out.println("over");
                break;
            }
        }
    }
    
    /**
     * 停止正在运行的进程。
     */
    public void stopProcess() {
        if (process != null) {
            process.destroy();
        }
    }
}