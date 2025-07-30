#include <windows.h>
#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <stdexcept>
#include "magic.h"
#include "rextractor.h"
#include "config.h"

int RustKeyToVirtualKey(const std::string& rust_key) {
    for (size_t virtual_key = 0; virtual_key < RustKeys.size(); virtual_key++) {
        if (RustKeys[virtual_key] == rust_key) {
            return static_cast<int>(virtual_key);
        }
    }
    return 0;
}


std::string GetRustInstallationPath() {
    HKEY hKey;
    char value[64];
    DWORD value_length = sizeof(value);
    if (RegOpenKey(HKEY_LOCAL_MACHINE, TEXT("SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Steam App 252490"), &hKey) == ERROR_SUCCESS) {
        RegQueryValueExA(hKey, "InstallLocation", NULL, NULL, (LPBYTE)&value, &value_length);
        RegCloseKey(hKey);
        return std::string(value, value_length - 1);
    }
    return "";
}

std::string ExtractCfgValue(const std::string& file_name, const std::string& search_string, char delimiter) {
    std::ifstream file(file_name);
    std::string line;
    if (file.is_open()) {
        while (std::getline(file, line)) {
            if (line.find(search_string) != std::string::npos) {
                size_t start_pos = line.find(delimiter) + 1;
                size_t end_pos = line.find(delimiter, start_pos);
                return line.substr(start_pos, end_pos - start_pos);
            }
        }
    }
    return "";
}


std::string KeysCfgExtractor(std::string file_name, std::string search_string)
{
    std::string line;
    std::ifstream myfile(file_name);
    if (myfile.is_open())
    {
        while (getline(myfile, line))
        {
            if (line.find(search_string) != std::string::npos)
            {
                std::string::size_type pos = line.find(" ");
                std::string::size_type pos2 = line.find(" ", pos + 1);
                return line.substr(pos + 1, pos2 - pos - 1);
            }
        }
        myfile.close();
    }
    return "";
}


void getcfg() {
    std::string install_path = GetRustInstallationPath();
    if (install_path.empty()) {
        return;
    }

    std::string clientCfgPath = install_path + "\\cfg\\client.cfg";
    std::string keysCfgPath = install_path + "\\cfg\\keys.cfg";

    std::ifstream clientCfgFile(clientCfgPath);
    if (!clientCfgFile.good()) {
        return;
    }

    std::ifstream keysCfgFile(keysCfgPath);
    if (!keysCfgFile.good()) {
        return;
    }

    try {
        std::string sensitivityStr = ExtractCfgValue(clientCfgPath, "input.sensitivity", '"');
        std::string adsStr = ExtractCfgValue(clientCfgPath, "input.ads_sensitivity", '"');
        std::string fovStr = ExtractCfgValue(clientCfgPath, "graphics.fov", '"');

        if (!sensitivityStr.empty()) {
            insens = std::stof(sensitivityStr);
        }


        if (!adsStr.empty()) {
            adsens = std::stof(adsStr);
        }


        if (!fovStr.empty()) {
            fov = std::stoi(fovStr);
        }


        std::vector<std::pair<std::string, std::string>> commands = {
            {"Scope", "+attack2"},
            {"Duck", "+duck"},
        };


        for (const auto& cmd : commands) {
            std::string key_str = KeysCfgExtractor(keysCfgPath, cmd.second);
            if (!key_str.empty()) {
                int virtual_key = RustKeyToVirtualKey(key_str);

                if (cmd.first == "Duck") {
                    keycrouch = virtual_key;
                }
                if (cmd.first == "Scope") {
                    keyaim = virtual_key;
                }
            }

        }

    }
    catch (const std::invalid_argument& e) {
    }
}


int RustKeyToVirtualKey(const char* rust_key)
{
    for (int virtual_key = 0; virtual_key < RustKeys.size(); virtual_key++)
    {
        std::string this_key = RustKeys[virtual_key];

        if (this_key == std::string(rust_key))
        {
            return virtual_key;
        }
    }
}
