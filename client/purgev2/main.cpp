#include <windows.h>
#include <winternl.h>
#include <tlhelp32.h>
#include <thread>
#include <iostream>
#include <cstdint>
#include <cstring>
#include "thread_worker.h"
#include "auth.h"
#include "recoil.h"
#include "auto.h"
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>



static const char* CLIENT_VERSION = "1.0.3";
volatile bool exit01;

static bool dede();
static bool check_version();

static std::uint32_t simpleHash(const unsigned char* data, std::size_t len)
{
    std::uint32_t h = 5381;
    for (std::size_t i = 0; i < len; ++i)
        h = (h * 33) ^ data[i];
    return h;
}

static std::uint32_t expected_dede_hash;

static void init_integrity()
{
    auto* start = reinterpret_cast<const unsigned char*>(&dede);
    auto* end   = reinterpret_cast<const unsigned char*>(&check_version);
    expected_dede_hash = simpleHash(start, end - start);
}

static bool verify_integrity()
{
    auto* start = reinterpret_cast<const unsigned char*>(&dede);
    auto* end   = reinterpret_cast<const unsigned char*>(&check_version);
    return simpleHash(start, end - start) == expected_dede_hash;
}

DWORD WINAPI exitThreadFunc(LPVOID param) {
    for (int i = 0; i < 200; i++) {
        volatile int temp = (i * 37) % 89;
        (void)temp;
    }
    Sleep(50000);
    exit(EXIT_FAILURE);
    return 0;
}

void startexit01() {
    if (!exit01) {
        exit01 = true;
        HANDLE thread = CreateThread(NULL, 0, exitThreadFunc, NULL, 0, NULL);
        if (thread) {
            CloseHandle(thread);
        }

    }
}

static bool dede()
{
#if defined(_WIN32) || defined(_WIN64)
    BOOL dbg = IsDebuggerPresent();
    if (dbg)
        startexit01();
    return dbg != 0;            
#else
    if (ptrace(PTRACE_TRACEME, 0, 0, 0) == -1) {
        startexit01();
        return true;
    }
    return false;
#endif
}

static bool check_version()
{
    auto r = cpr::Get(cpr::Url{ "https://notepadhelper.space/tts/version" });
    if (r.status_code != 200)
        return true; 

    try {
        auto j = nlohmann::json::parse(r.text);
        if (j.value("version", "") != CLIENT_VERSION) {
            MessageBoxA(nullptr,
                "",
                "Outdated version. Please reinstall the program.", MB_OK | MB_ICONINFORMATION);
            return false;
        }
    }
    catch (...) {
    }
    return true;
}


static ThreadWorker mainWorker;

static bool is_process_running(const wchar_t* name)
{
    HANDLE snap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (snap == INVALID_HANDLE_VALUE) return false;

    PROCESSENTRY32W pe{};
    pe.dwSize = sizeof(pe);
    bool found = false;
    if (Process32FirstW(snap, &pe)) {
        do {
            if (_wcsicmp(pe.szExeFile, name) == 0) {
                found = true;
                break;
            }
        } while (Process32NextW(snap, &pe));
    }
    CloseHandle(snap);
    return found;
}

bool isProcessRunning(const wchar_t* processName) {
    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap == INVALID_HANDLE_VALUE) return false;
    PROCESSENTRY32W pe{};
    pe.dwSize = sizeof(pe);
    bool found = false;
    if (Process32FirstW(hSnap, &pe)) {
        do {
            if (_wcsicmp(pe.szExeFile, processName) == 0) {
                found = true;
                break;
            }
        } while (Process32NextW(hSnap, &pe));
    }
    CloseHandle(hSnap);
    return found;
}

static void worker(std::atomic<bool>& stop)
{
    if (isProcessRunning(L"steam.exe")) return;
    if (!check_version()) return;
    auth::open_console();
    auth::AuthInfo info = auth::authenticate_loop();
    if (!is_process_running(L"remoteserverwin.exe"))
        std::cout << "Please open Unified Remote before using this client." << std::endl;
    std::cout << "Connected." << std::endl;
    Pattern            pat;
    std::vector<Multi> mul;

    recoil::Runner runner("wss://notepadhelper.space/tts/ws?token=" + info.token,
        info.key);
    recoil::g_runner = &runner;
    runner.load(std::move(pat), std::move(mul));

    auto_det::autoloot();

    if (!verify_integrity())
        ExitProcess(1);

    while (!stop.load()) {
        if (!verify_integrity() || dede())
            ExitProcess(1);
        std::this_thread::sleep_for(std::chrono::seconds(1));
    }
}

BOOL APIENTRY DllMain(HINSTANCE hinst, DWORD reason, LPVOID)
{
    if (reason == DLL_PROCESS_ATTACH) {
        if (dede())
            return FALSE;
        init_integrity();
        DisableThreadLibraryCalls(hinst);
        mainWorker.start(worker);
    }
    else if (reason == DLL_PROCESS_DETACH) {
        mainWorker.stop();
    }
    return TRUE;
}