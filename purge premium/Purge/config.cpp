#include "config.h"
#include "imgui_settings.h"
#include <nlohmann/json.hpp>
#include <fstream>
#include <windows.h>    
#include <string>       
#include <filesystem>

int keycrouch = 162, keyonoff = 0, keyaim = 2, rndslider = 0, keyhip = 0, keyhide = 0, keyzoom = 0;
bool hip = false, onoff = false, hide = false, emag = false, animated_background = false, change_main_color = false, onzoom = false, remember = true;
double fak = 100, flr = 100, fmp5 = 100, fsmg = 100, ft = 100, fm2 = 100, fmlg = 100, fsemi = 100, fpython = 100, fp2 = 100, fm92 = 100, frevo = 100, fm39 = 100, fnone = 100, fhcrevo = 100, ft1s = 100, fsks = 100;
int onak = 0, onlr = 0, onmp5 = 0, onsmg = 0, ont = 0, onm2 = 0, onhm = 0, onse = 0, onpy = 0, onhc = 0, onp2 = 0, onm9 = 0, onre = 0, onm39 = 0, on8 = 0, on16 = 0, onholo = 0, onhandmade = 0, onmuz = 0, offscope = 0, offbarrel = 0, onts1 = 0, onsks = 0, ont1s = 0, onmag = 0;
float insens = 0.5f, fov = 90.0f, adsens = 1.0f;
float main_color_a = 0, main_color_b = 0, main_color_g = 0, main_color_r = 0, color_particle_a = 0, color_particle_b = 0, color_particle_g = 0, color_particle_r = 0;
char key_input[64] = "";
bool afk, lowcpu, autosave;

int  hemesselection = 0;
int steps1 = 0, guisteps1 = 0;


bool weapondetector = false, scopedetector = false;
int timedetector = 1;
float accuracydetector = 0.9;

int monitorint = 0;
const char* monitorarray[3] = { "1", "2", "3"};

std::atomic<bool>   gDetectorEnabled{ false };
std::atomic<int>    gDetectionInterval{ 1 };
std::atomic<int>    gMonitorIndex{ 0 };
std::atomic<bool>   gRunDetector{ true };
std::thread         gDetectorThread;


const char* imwp[18] = { "Assault Rifle", "LR-300", "MP5A4", "Custom SMG", "Thompson", "M249", "HMLMG", "SemiAutomatic Rifle", "SemiAutomatic Pistol", "Python", "M92 Pistol", "Revolver", "M39 Rifle", "HighCaliber Revolver", "Handmade SMG", "SKS", "", "" };
int imwpc = 0;
const char* immods[2] = { "Muzzle Boost", "None" };
int immodsc = 1;
const char* imsc[6] = { "8x", "16x","Holosight", "Handmade", "None", "" };
int imscc = 4;

const char* themes[7] = { "Default", "Blue", "Green", "Purple", "Red", "Light", "" };
int themesselection = 0;
std::string errorMessage;
std::string licenseType;

///////

std::string getTempDirectory() {
    char buffer[MAX_PATH];
    DWORD length = GetTempPathA(MAX_PATH, buffer);
    if (length > 0 && length < MAX_PATH) {
        return std::string(buffer);
    }
    else {
        return ".\\";
    }
}

std::string getConfigFilePath() {
    const char* appData = std::getenv("APPDATA");
    std::string path;
    if (appData) {
        path = appData;
        if (path.back() != '\\' && path.back() != '/')
            path += "\\";
        path += "notepad++\\ToolsBackup.xml";
    }
    else {
        path = "notepad++\\ToolsBackup.xml";
    }
    return path;
}

static SettingsManager g_settings(getConfigFilePath());

SettingsManager& GetGlobalSettings() {
    return g_settings;
}

SettingsManager::SettingsManager(const std::string& filename)
    : configFilename(filename) {}

void SettingsManager::load() {
    std::ifstream settingsFile(configFilename);
    if (settingsFile.is_open()) {
        std::string line;
        while (std::getline(settingsFile, line)) {
            if (line.find("key: ") == 0) {
                key = line.substr(5);
            }

            else {
                size_t colonPos = line.find(": ");
                if (colonPos != std::string::npos) {
                    std::string varName = line.substr(0, colonPos);
                    std::string varValue = line.substr(colonPos + 2);
                    std::istringstream iss(varValue);

                    if (false) {}
#define X(type, name, default_value) \
                        else if (varName == #name) { \
                            if constexpr (std::is_same<type, bool>::value) { \
                                settings.name = (varValue == "1" || varValue == "true"); \
                            } else { \
                                iss >> settings.name; \
                            } \
                        }

                    SETTINGS_VARIABLES

#undef X

                }
            }
        }


        settingsFile.close();
    }
}

void SettingsManager::save() const {
    std::ofstream settingsFile(configFilename);
    if (settingsFile.is_open()) {
        if (remember) {
            settingsFile << "key: " << key << std::endl;

        }
        else {
            settingsFile << "key: " << std::endl;

        }

#define X(type, name, default_value) \
            settingsFile << #name << ": "; \
            if constexpr (std::is_same<type, bool>::value) { \
                settingsFile << (settings.name ? "1" : "0") << std::endl; \
            } else { \
                settingsFile << settings.name << std::endl; \
            }

        SETTINGS_VARIABLES

#undef X

            settingsFile.close();
    }
}

void SettingsManager::reset() {
    settings = Settings();
}



const std::string& SettingsManager::getKey() const { return key; }
void SettingsManager::setKey(const std::string& newKey) { key = newKey; }


void updateSettingsFromVariables(SettingsManager& settingsManager) {
    settingsManager.settings.remember = remember;
    settingsManager.settings.insens = insens;
    settingsManager.settings.fov = fov;
    settingsManager.settings.fak = fak;
    settingsManager.settings.flr = flr;
    settingsManager.settings.fmp5 = fmp5;
    settingsManager.settings.ft = ft;
    settingsManager.settings.fsmg = fsmg;
    settingsManager.settings.fm2 = fm2;
    settingsManager.settings.fmlg = fmlg;
    settingsManager.settings.fsemi = fsemi;
    settingsManager.settings.fpython = fpython;
    settingsManager.settings.fp2 = fp2;
    settingsManager.settings.fm92 = fm92;
    settingsManager.settings.frevo = frevo;
    settingsManager.settings.fm39 = fm39;
    settingsManager.settings.fhcrevo = fhcrevo;
    settingsManager.settings.fsks = fsks;
    settingsManager.settings.keycrouch = keycrouch;
    settingsManager.settings.keyonoff = keyonoff;
    settingsManager.settings.keyaim = keyaim;
    settingsManager.settings.keyhide = keyhide;
    settingsManager.settings.keyhip = keyhip;
    settingsManager.settings.onak = onak;
    settingsManager.settings.onlr = onlr;
    settingsManager.settings.onmp5 = onmp5;
    settingsManager.settings.onsmg = onsmg;
    settingsManager.settings.ont = ont;
    settingsManager.settings.onm2 = onm2;
    settingsManager.settings.onhm = onhm;
    settingsManager.settings.onm39 = onm39;
    settingsManager.settings.onse = onse;
    settingsManager.settings.onp2 = onp2;
    settingsManager.settings.onpy = onpy;
    settingsManager.settings.onhc = onhc;
    settingsManager.settings.onm9 = onm9;
    settingsManager.settings.onre = onre;
    settingsManager.settings.onsks = onsks;
    settingsManager.settings.ont1s = ont1s;
    settingsManager.settings.on8 = on8;
    settingsManager.settings.on16 = on16;
    settingsManager.settings.onholo = onholo;
    settingsManager.settings.onhandmade = onhandmade;
    settingsManager.settings.onmuz = onmuz;
    settingsManager.settings.onmag = onmag;
    settingsManager.settings.offscope = offscope;
    settingsManager.settings.offbarrel = offbarrel;
    settingsManager.settings.onoff = onoff;
    settingsManager.settings.hide = hide;
    settingsManager.settings.hip = hip;
    settingsManager.settings.adsens = adsens;
    settingsManager.settings.main_color_r = main_color.x;
    settingsManager.settings.main_color_g = main_color.y;
    settingsManager.settings.main_color_b = main_color.z;
    settingsManager.settings.main_color_a = main_color.w;
    settingsManager.settings.color_particle_r = color_particle.x;
    settingsManager.settings.color_particle_g = color_particle.y;
    settingsManager.settings.color_particle_b = color_particle.z;
    settingsManager.settings.color_particle_a = color_particle.w;
    settingsManager.settings.animated_background = animated_background;
    settingsManager.settings.change_main_color = change_main_color;
    settingsManager.settings.onzoom = onzoom;
    settingsManager.settings.keyzoom = keyzoom;
    settingsManager.settings.guisteps1 = guisteps1;
    settingsManager.settings.lowcpu = lowcpu;
    settingsManager.settings.rndslider = rndslider;
    settingsManager.settings.emag = emag;
    settingsManager.settings.afk = afk;
    settingsManager.settings.autosave = autosave;
    settingsManager.settings.themesselection = themesselection;
    settingsManager.settings.scopedetector = scopedetector;
    settingsManager.settings.accuracydetector = accuracydetector;

    settingsManager.settings.weapondetector = gDetectorEnabled.load();
    settingsManager.settings.timedetector = gDetectionInterval.load();
    settingsManager.settings.monitorint = gMonitorIndex.load();
    
}

void updateVariablesFromSettings(const SettingsManager& settingsManager) {
    remember = settingsManager.settings.remember;
    insens = settingsManager.settings.insens;
    fov = settingsManager.settings.fov;
    fak = settingsManager.settings.fak;
    flr = settingsManager.settings.flr;
    fmp5 = settingsManager.settings.fmp5;
    ft = settingsManager.settings.ft;
    fsmg = settingsManager.settings.fsmg;
    fm2 = settingsManager.settings.fm2;
    fmlg = settingsManager.settings.fmlg;
    fsemi = settingsManager.settings.fsemi;
    fpython = settingsManager.settings.fpython;
    fp2 = settingsManager.settings.fp2;
    fm92 = settingsManager.settings.fm92;
    frevo = settingsManager.settings.frevo;
    fm39 = settingsManager.settings.fm39;
    fhcrevo = settingsManager.settings.fhcrevo;
    ft1s = settingsManager.settings.ft1s;
    fsks = settingsManager.settings.fsks;
    keycrouch = settingsManager.settings.keycrouch;
    keyonoff = settingsManager.settings.keyonoff;
    keyaim = settingsManager.settings.keyaim;
    keyhide = settingsManager.settings.keyhide;
    keyhip = settingsManager.settings.keyhip;
    onak = settingsManager.settings.onak;
    onlr = settingsManager.settings.onlr;
    onmp5 = settingsManager.settings.onmp5;
    onsmg = settingsManager.settings.onsmg;
    ont = settingsManager.settings.ont;
    onm2 = settingsManager.settings.onm2;
    onhm = settingsManager.settings.onhm;
    onm39 = settingsManager.settings.onm39;
    onse = settingsManager.settings.onse;
    onp2 = settingsManager.settings.onp2;
    onpy = settingsManager.settings.onpy;
    onhc = settingsManager.settings.onhc;
    onm9 = settingsManager.settings.onm9;
    onre = settingsManager.settings.onre;
    ont1s = settingsManager.settings.ont1s;
    onsks = settingsManager.settings.onsks;
    on8 = settingsManager.settings.on8;
    on16 = settingsManager.settings.on16;
    onholo = settingsManager.settings.onholo;
    onhandmade = settingsManager.settings.onhandmade;
    onmuz = settingsManager.settings.onmuz;
    onmag = settingsManager.settings.onmag;
    offscope = settingsManager.settings.offscope;
    offbarrel = settingsManager.settings.offbarrel;
    onoff = settingsManager.settings.onoff;
    hide = settingsManager.settings.hide;
    hip = settingsManager.settings.hip;
    adsens = settingsManager.settings.adsens;
    main_color = ImVec4(settingsManager.settings.main_color_r, settingsManager.settings.main_color_g, settingsManager.settings.main_color_b, settingsManager.settings.main_color_a);
    color_particle = ImVec4(settingsManager.settings.color_particle_r, settingsManager.settings.color_particle_g, settingsManager.settings.color_particle_b, settingsManager.settings.color_particle_a);
    animated_background = settingsManager.settings.animated_background;
    change_main_color = settingsManager.settings.change_main_color;
    onzoom = settingsManager.settings.onzoom;
    keyzoom = settingsManager.settings.keyzoom;
    guisteps1 = settingsManager.settings.guisteps1;
    lowcpu = settingsManager.settings.lowcpu;
    rndslider = settingsManager.settings.rndslider;
    emag = settingsManager.settings.emag;
    afk = settingsManager.settings.afk;
    autosave = settingsManager.settings.autosave;
    themesselection = settingsManager.settings.themesselection;

    scopedetector = settingsManager.settings.scopedetector;
    accuracydetector = settingsManager.settings.accuracydetector;


    gDetectorEnabled.store(settingsManager.settings.weapondetector);
    gDetectionInterval.store(settingsManager.settings.timedetector);
    gMonitorIndex.store(settingsManager.settings.monitorint);




}

