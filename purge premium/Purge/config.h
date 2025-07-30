#include <string>
#include <fstream>
#include <sstream>
#include <type_traits>
#include "magic.h"
#include <imgui.h>

extern std::string errorMessage;
extern std::string licenseType;
extern int keycrouch, keyaim, keyonoff, keyhide, keyhip, keyzoom;
extern bool hip, onoff, hide, emag, animated_background, change_main_color, onzoom, remember, afk; 
extern double fak, flr, fmp5, fsmg, ft, fm2, fmlg, fsemi, fpython, fp2, fm92, frevo, fm39, fnone, fhcrevo, ft1s, fsks;
extern int onak, onlr, onmp5, onsmg, ont, onm2, onhm, onse, onpy, onp2, onm9, onre, onpr, onm39, on8, on16, onholo, onhandmade, onmuz, offscope, offbarrel, onhc, ont1s, onsks, onmag;
extern float insens, fov, adsens;
extern float main_color_a, main_color_b, main_color_g, main_color_r, color_particle_a, color_particle_b, color_particle_g, color_particle_r;
extern char key_input[64];

extern int themesselection, keyonoff, keyhip, rndslider, imwpc, imscc, immodsc, steps1, guisteps1;
extern bool lowcpu, autosave;

extern bool weapondetector, scopedetector;
extern float accuracydetector;
extern int timedetector;

extern int monitorint;
extern const char* monitorarray[3];

extern const char* imwp[18];
extern int imwpc;
extern const char* immods[2];
extern int immodsc;
extern const char* imsc[6];
extern int imscc;

extern const char* themes[7];

extern int themesselection;

extern std::atomic<bool>   gDetectorEnabled;
extern std::atomic<int>    gDetectionInterval;
extern std::atomic<int>    gMonitorIndex;
extern std::atomic<bool>   gRunDetector;
extern std::thread         gDetectorThread;


void updateSettingsFromVariables(class SettingsManager& settingsManager);
void updateVariablesFromSettings(const class SettingsManager& settingsManager);

#define SETTINGS_VARIABLES \
    X(int, monitorint, 0) \
    X(bool, weapondetector, 0) \
    X(bool, scopedetector, 0) \
    X(float, accuracydetector, 0.9) \
    X(int, timedetector, 1) \
    X(bool, remember, 2) \
    X(float, insens, 0.5f) \
    X(float, fov, 90) \
    X(double, fak, 100) \
    X(double, flr, 100) \
    X(double, fmp5, 100) \
    X(double, ft, 100) \
    X(double, fsmg, 100) \
    X(double, fm2, 100) \
    X(double, fmlg, 100) \
    X(double, fsemi, 100) \
    X(double, fpython, 100) \
    X(double, fhcrevo, 100) \
    X(double, fp2, 100) \
    X(double, fm92, 100) \
    X(double, frevo, 100) \
    X(double, fm39, 100) \
    X(double, ft1s, 100) \
    X(double, fsks, 100) \
    X(int, keycrouch, 162) \
    X(int, keyonoff, 0) \
    X(int, keyaim, 2) \
    X(int, keyhide, 0) \
    X(int, keyhip, 0) \
    X(int, onak, 0) \
    X(int, onlr, 0) \
    X(int, onmp5, 0) \
    X(int, onsmg, 0) \
    X(int, ont, 0) \
    X(int, onm2, 0) \
    X(int, onhm, 0) \
    X(int, onm39, 0) \
    X(int, onse, 0) \
    X(int, onp2, 0) \
    X(int, onpy, 0) \
    X(int, onhc, 0) \
    X(int, onm9, 0) \
    X(int, onre, 0) \
    X(int, onsks, 0) \
    X(int, ont1s, 0) \
    X(int, on8, 0) \
    X(int, on16, 0) \
    X(int, onholo, 0) \
    X(int, onhandmade, 0) \
    X(int, onmuz, 0) \
    X(int, onmag, 0) \
    X(int, offscope, 0) \
    X(int, offbarrel, 0) \
    X(bool, onoff, false) \
    X(bool, hide, false) \
    X(bool, hip, false) \
    X(float, adsens, 1.0f) \
    X(bool, animated_background, true) \
    X(bool, change_main_color, false) \
    X(bool, onzoom, false) \
    X(int, keyzoom, 0) \
    X(int, guisteps1, 0) \
    X(bool, lowcpu, false) \
    X(int, rndslider, 0) \
    X(bool, emag, false) \
    X(bool, afk, false) \
    X(bool, autosave, false) \
    X(int, themesselection, 0) \
    X(float, main_color_r, 0.4f) \
    X(float, main_color_g, 0.8f) \
    X(float, main_color_b, 1.0f) \
    X(float, main_color_a, 1.0f) \
    X(float, color_particle_r, 0.4f) \
    X(float, color_particle_g, 0.8f) \
    X(float, color_particle_b, 1.0f) \
    X(float, color_particle_a, 1.0f) 


struct Settings {
#define X(type, name, default_value) type name = default_value;
    SETTINGS_VARIABLES
#undef X
};

class SettingsManager {
public:
    SettingsManager(const std::string& filename);
    void load();
    void save() const;
    void reset();
    const std::string& getKey() const;
    void setKey(const std::string& newKey);
    Settings settings;

private:
    std::string configFilename;
    std::string key;

};

SettingsManager& GetGlobalSettings();