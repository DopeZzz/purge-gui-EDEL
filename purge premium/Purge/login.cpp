#include <windows.h>
#include <TlHelp32.h>
#include <iostream>
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <string>
#include <vector>
#include <sstream>
#include <iomanip>
#include <array>
#include <intrin.h>
#include <algorithm>
#include <cstring>
#include "security.h"
#include "config.h"
#include "imgui_settings.h"

constexpr auto CURRENT_VERSION = "5.0";

void checkUpdate()
{
    auto r = cpr::Get(cpr::Url{ "http://gigamac.pro/oo/v" });
    if (r.status_code != 200) return;

    const std::string remote = nlohmann::json::parse(r.text).value("v", "");
    if (remote.empty() || remote == CURRENT_VERSION) return;


    MessageBoxW(nullptr, L"", L"New Purge update! Please reinstall",
        MB_OK | MB_ICONINFORMATION | MB_SETFOREGROUND);
    ExitProcess(0);

}

inline std::string getProcessorID() {
    flowIntegrityAdd(6);
    std::array<int, 4> c = {};
    __cpuid(c.data(), 0);
    char id[33];
    _snprintf_s(id, sizeof(id), "%08X%08X", c[3], c[0]);
    return std::string(id);
}

inline std::string getVolumeSerialNumber() {
    DWORD s = 0;
    if (!GetVolumeInformationA("C:\\", NULL, 0, &s, NULL, NULL, NULL, 0)) return {};
    char buf[10];
    _snprintf_s(buf, sizeof(buf), "%08X", s);
    flowIntegrityAdd(8);
    return std::string(buf);
}

inline std::string getHWID() {
    flowIntegrityAdd(10);
    std::string p = getProcessorID();
    std::string v = getVolumeSerialNumber();
    return p + v;
}

bool simplecheck(const std::string& serial) {
    std::string hwid = getHWID();
    nlohmann::json jreq = {
        {ephemeralAnother(XOR_SERIAL), serial},
        {ephemeralAnother(XOR_HWID), hwid}
    };
    std::string bodyJson = jreq.dump();
    std::string signature = computeSignature(bodyJson);


    bool ok = false;
    ephemeralUseXor(XOR_AUTH, std::strlen(XOR_AUTH), KEY, [&](const char* u) {
        auto r = cpr::Post(
            cpr::Url{ u },
            cpr::Body{ bodyJson },
            cpr::Header{ {"Content-Type", "application/json"}, {"XD", signature} }
        );

        ok = (r.status_code == 200);
        });

    std::fill(bodyJson.begin(), bodyJson.end(), '\0');
    std::fill(signature.begin(), signature.end(), '\0');

    return ok;
}

bool processAuthResponse(const nlohmann::json& responseJson) {
    if (!responseJson.contains(ephemeralAnother(XOR_AUTHMSG))) {
        errorMessage = ephemeralGetErrorString(XOR_01);
        return false;
    }
    flowIntegrityAdd(88);
    const auto& a = responseJson[ephemeralAnother(XOR_AUTHMSG)];
    std::string s = a.value(ephemeralAnother(XOR_STATUS), "");
    std::string m = a.value(ephemeralAnother(XOR_MESSAGE), "");
    std::string l = a.value(ephemeralAnother(XOR_LICENSE_STATUS), "");
    std::string h = a.value(ephemeralAnother(XOR_HWID_STATUS), "");
    licenseType = a.value("license", "");
    bool checksOK = docheckandlogin(s, m, l, h, autenticado2, crash, simpleCheck, errorMessage, responseJson);
    if (!checksOK) return false;
    return true;
}


bool authenticate(const std::string& serial) {
    try {
        flowIntegrityAdd(100);
        std::string hwid = getHWID();
        nlohmann::json rj = { {ephemeralAnother(XOR_SERIAL), serial}, {ephemeralAnother(XOR_HWID), hwid} };
        std::string rb = rj.dump();
        flowIntegrityAdd(300);
        std::string sig = computeSignature(rb);
        flowIntegrityAdd(400);
        bool ok = false;
        ephemeralUseXor(XOR_GETAUTH, std::strlen(XOR_GETAUTH), KEY, [&](const char* u) {
            auto resp = cpr::Post(cpr::Url{ u }, cpr::Body{ rb }, cpr::Header{ {"Content-Type", "application/json"}, {"XD", sig} });
            flowIntegrityAdd(600);
            if (resp.status_code != 200) {
                try {
                    auto e = nlohmann::json::parse(resp.text);
                    if (e.contains(ephemeralAnother(XOR_ERROR))) {
                        flowIntegrityAdd(21);
                        errorMessage = e[ephemeralAnother(XOR_ERROR)].get<std::string>();
                        flowIntegrityAdd(88);
                        flowIntegrityAdd(31);
                    }
                }
                catch (...) {
                    std::string altUrl;
                    ephemeralUseXor(XOR_GETAUTH_ALT, std::strlen(XOR_GETAUTH_ALT), KEY, [&](const char* u2) {
                        altUrl = std::string(u2);
                        });
                    auto altResp = cpr::Post(cpr::Url{ altUrl }, cpr::Body{ rb }, cpr::Header{ {"Content-Type", "application/json"}, {"XD", sig} });
                    if (altResp.status_code != 200) {
                        try {
                            auto e = nlohmann::json::parse(altResp.text);
                            if (e.contains(ephemeralAnother(XOR_ERROR))) {
                                flowIntegrityAdd(21);
                                errorMessage = e[ephemeralAnother(XOR_ERROR)].get<std::string>();
                                flowIntegrityAdd(88);
                                flowIntegrityAdd(31);
                            }
                        }
                        catch (...) {
                            errorMessage = ephemeralGetErrorString(XOR_04);
                        }
                    }
                    else {
                        try {
                            nlohmann::json jAlt = nlohmann::json::parse(altResp.text);
                            if (processAuthResponse(jAlt)) ok = true;
                            flowIntegrityAdd(21);
                        }
                        catch (...) {
                            errorMessage = ephemeralGetErrorString(XOR_03);
                        }
                    }
                }
            }
            else {
                try {
                    nlohmann::json j = nlohmann::json::parse(resp.text);
                    if (processAuthResponse(j)) ok = true;
                    flowIntegrityAdd(21);
                }
                catch (...) {
                    errorMessage = ephemeralGetErrorString(XOR_03);
                }
            }
            });
        flowIntegrityAdd(21);
        std::fill(rb.begin(), rb.end(), '\0');
        std::fill(sig.begin(), sig.end(), '\0');
        if (!ok) return false;
        crashf2 = 43;
        flowIntegrityCheck(1592, "");
        simplerintegrity += 342;
        return true;
    }
    catch (...) {
        errorMessage = ephemeralGetErrorString(XOR_02);
        return false;
    }
}



