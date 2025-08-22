package com.tModLoader_Board.DTO;

public class ServerMessage {
    private String message;
    private String sessionName;

    public void setMessage(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }

    public void setSessionName(String sessionName) {
        this.sessionName = sessionName;
    }

    public String getSessionName() {
        return sessionName;
    }
}
