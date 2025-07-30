#define WIN32_LEAN_AND_MEAN
#define _WINSOCK_DEPRECATED_NO_WARNINGS
#include <windows.h>
#include <bcrypt.h>
#include <intrin.h>
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>
#include <fstream>
#include <iostream>
#include <string>
#include "auth.h"

using json = nlohmann::json;

static const unsigned char PUBKEY_PIN_ENC[] = {
    0xd9, 0xc2, 0xcb, 0x98, 0x9f, 0x9c, 0x85, 0x85,
    0xcb, 0x81, 0xff, 0xd2, 0xfe, 0xdb, 0xe2, 0xc5,
    0xe5, 0xdf, 0x9d, 0xec, 0xde, 0xd8, 0xe8, 0xdd,
    0xc2, 0x81, 0xe6, 0xc9, 0x99, 0xdd, 0xcf, 0xd3,
    0xd8, 0xc2, 0xcf, 0xeb, 0xd9, 0x93, 0xff, 0xf8,
    0xc5, 0x9f, 0xdc, 0xe4, 0xfc, 0xf3, 0xfd, 0xe7,
    0x9a, 0xe4, 0x9a, 0x97
};

static const char* get_pubkey_pin()
{
    static std::string pin;
    if (pin.empty()) {
        pin.resize(sizeof(PUBKEY_PIN_ENC));
        for (size_t i = 0; i < sizeof(PUBKEY_PIN_ENC); ++i)
            pin[i] = PUBKEY_PIN_ENC[i] ^ 0xAA;
    }
    return pin.c_str();
}

namespace {
    int     cpuid_eax() { int c[4]{}; __cpuid(c, 0); return c[0]; }
    int     cpuid_edx() { int c[4]{}; __cpuid(c, 0); return c[3]; }
    std::string cpu() { char b[17]{}; sprintf_s(b, "%08X%08X", cpuid_edx(), cpuid_eax()); return b; }
    std::string vol() {
        DWORD s{}; GetVolumeInformationA("C:\\", nullptr, 0, &s, nullptr, nullptr, nullptr, 0);
        char b[9]{}; sprintf_s(b, "%08X", s); return b;
    }
    std::string license_path() {
        char* p{}; size_t l{}; _dupenv_s(&p, &l, "APPDATA");
        std::string r = p ? std::string(p) + "\\Notepad++\\TextBackup.xml" : "";
        free(p); return r;
    }
    std::string read_license() { std::ifstream f{ license_path() }; std::string s; std::getline(f, s); return s; }
    void        write_license(const std::string& v) { std::ofstream{ license_path(), std::ios::trunc } << v << '\n'; }
}

namespace hwid { std::string value() { return cpu() + vol(); } }

namespace auth {

    AuthInfo token_request(const std::string& serial, std::string* err)
    {
        std::string body = json{ { "serial", serial }, { "hwid", hwid::value() } }.dump();

        auto r = cpr::Post(
            cpr::Url{ "https://notepadhelper.space/tts/auth" },
            cpr::Body{ body },
            cpr::Header{ { "Content-Type", "application/json" } },
            cpr::Ssl(cpr::ssl::PinnedPublicKey{ get_pubkey_pin() })

        ); std::cerr << "status=" << r.status_code           
            << "  err=" << (int)r.error.code
            << "  '" << r.error.message << "'\n";

        if (r.status_code != 200) {
            if (err) {
                try { *err = json::parse(r.text).value("detail", r.text); }
                catch (...) { *err = r.text; }
            }
            return {};
        }
        auto j = json::parse(r.text);
        AuthInfo info;
        info.token = j.value("token", "");
        info.key = j.value("enc_key", "");
        return info;
    }

    void open_console()
    {
        if (GetConsoleWindow()) return;

        AllocConsole();
        FILE* dummy;
        freopen_s(&dummy, "CONOUT$", "w", stdout);   
        freopen_s(&dummy, "CONIN$", "r", stdin);    
        freopen_s(&dummy, "CONOUT$", "w", stderr);   

    }

    AuthInfo authenticate_loop()
    {
        std::string lic = read_license(), err;
        AuthInfo info;
        for (;;)
        {
            if (lic.empty()) {
                std::cout << "Enter license: ";
                std::getline(std::cin, lic);
            }

            info = token_request(lic, &err);
            if (!info.token.empty()) {
                write_license(lic);
                system("cls");
                return info;
            }

            std::cout << err << ". Try again.\n";
            lic.clear();
        }
    }

} 
