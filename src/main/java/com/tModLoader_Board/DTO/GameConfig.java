package com.tModLoader_Board.DTO;

import java.util.List;

public record GameConfig(
    List<String> mods,
    String world,
    String maxPlayers,
    String port,
    String password,
    String packageName,
    boolean packaged
) {}