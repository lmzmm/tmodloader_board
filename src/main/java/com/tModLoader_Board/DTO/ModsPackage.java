package com.tModLoader_Board.DTO;

import java.util.List;

public class ModsPackage {
    private String packageName;
    private List<String> mods;

    public String getPackageName() {
        return packageName;
    }
    public void setPackageName(String packageName) {
        this.packageName = packageName;
    }
    public List<String> getMods() {
        return mods;
    }
    public void setMods(List<String> mods) {
        this.mods = mods;
    }
}
