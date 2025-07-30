#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <magnification.h>
#include <mmsystem.h>
#include <atomic>
#include <thread>
#include <chrono>
#include <algorithm>
#include "zoom.h"
#pragma comment(lib,"Magnification.lib")
#pragma comment(lib,"winmm.lib")

namespace {
    std::atomic<bool> g_running{ false };
    std::atomic<bool> g_inited{ false };
    std::atomic<bool> g_enabled{ true };
    std::atomic<bool> g_active{ false };

    std::thread g_thr;
    HINSTANCE   g_hInst = nullptr;
    HWND        g_host = nullptr;
    HWND        g_mag = nullptr;

    std::atomic<int>   g_vk{ 0 };
    std::atomic<int>   g_factor{ 2 };
    std::atomic<int>   g_patch{ 160 };
    std::atomic<float> g_uiScale{ 1.0f };

    POINT g_center{ 0,0 };
    UINT  g_timerMs = 8;

    LRESULT CALLBACK HostProc(HWND hwnd, UINT msg, WPARAM wp, LPARAM lp) {
        if (msg == WM_NCHITTEST)     return HTTRANSPARENT;
        if (msg == WM_MOUSEACTIVATE) return MA_NOACTIVATE;
        if (msg == WM_TIMER) {
            if (wp == 1) {
                bool down = g_enabled.load() && g_vk.load() > 0 && (GetAsyncKeyState(g_vk.load()) & 0x8000);
                if (down && !g_active.load()) {
                    POINT cur; GetCursorPos(&cur);
                    HMONITOR mon = MonitorFromPoint(cur, MONITOR_DEFAULTTONEAREST);
                    MONITORINFO mi{ sizeof(mi) }; GetMonitorInfoW(mon, &mi);
                    g_center.x = mi.rcMonitor.left + (mi.rcMonitor.right - mi.rcMonitor.left) / 2;
                    g_center.y = mi.rcMonitor.top + (mi.rcMonitor.bottom - mi.rcMonitor.top) / 2;
                    int p = g_patch.load(); int f = g_factor.load(); float s = g_uiScale.load();
                    int W = (int)(p * f * s); int H = (int)(p * f * s);
                    SetWindowPos(g_host, HWND_TOPMOST, g_center.x - W / 2, g_center.y - H / 2, W, H, SWP_NOACTIVATE | SWP_NOOWNERZORDER);
                    SetWindowPos(g_mag, nullptr, 0, 0, W, H, SWP_NOACTIVATE | SWP_NOZORDER | SWP_NOOWNERZORDER);
                    MAGTRANSFORM m{}; m.v[0][0] = (float)g_factor.load(); m.v[1][1] = (float)g_factor.load(); m.v[2][2] = 1.0f; MagSetWindowTransform(g_mag, &m);
                    HMONITOR m2 = MonitorFromPoint(g_center, MONITOR_DEFAULTTONEAREST);
                    MONITORINFOEXW mi2{ sizeof(mi2) }; GetMonitorInfoW(m2, (MONITORINFO*)&mi2);
                    DEVMODEW dm{}; dm.dmSize = sizeof(dm); EnumDisplaySettingsW(mi2.szDevice, ENUM_CURRENT_SETTINGS, &dm);
                    int hz = (int)dm.dmDisplayFrequency; if (hz < 30 || hz>240) hz = 60; g_timerMs = (UINT)std::max(1, (1000 + hz / 2) / hz);
                    ShowWindow(g_host, SW_SHOWNOACTIVATE);
                    g_active.store(true);
                }
                if (!down && g_active.load()) {
                    ShowWindow(g_host, SW_HIDE);
                    g_active.store(false);
                }
                if (down) {
                    int p = g_patch.load();
                    int half = p / 2;
                    int L = GetSystemMetrics(SM_XVIRTUALSCREEN);
                    int T = GetSystemMetrics(SM_YVIRTUALSCREEN);
                    int W = GetSystemMetrics(SM_CXVIRTUALSCREEN);
                    int H = GetSystemMetrics(SM_CYVIRTUALSCREEN);
                    int x = g_center.x - half;
                    int y = g_center.y - half;
                    if (x < L) x = L; if (y < T) y = T; if (x + p > L + W) x = L + W - p; if (y + p > T + H) y = T + H - p;
                    RECT src{ x,y,x + p,y + p };
                    MagSetWindowSource(g_mag, src);
                    InvalidateRect(g_mag, nullptr, FALSE);
                }
            }
            return 0;
        }
        if (msg == WM_DESTROY) { KillTimer(hwnd, 1); PostQuitMessage(0); return 0; }
        return DefWindowProcW(hwnd, msg, wp, lp);
    }

    bool create_windows() {
        if (!MagInitialize()) return false;
        WNDCLASSEXW wc{ sizeof(wc) }; wc.lpfnWndProc = HostProc; wc.hInstance = g_hInst; wc.lpszClassName = L"MagCenterHost"; wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH); wc.style = CS_OWNDC; RegisterClassExW(&wc);
        POINT p; GetCursorPos(&p); g_center = p;
        int ps = g_patch.load(); int f = g_factor.load(); float s = g_uiScale.load(); int W = (int)(ps * f * s); int H = (int)(ps * f * s);
        g_host = CreateWindowExW(WS_EX_TOPMOST | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE | WS_EX_TRANSPARENT | WS_EX_LAYERED,
            wc.lpszClassName, L"", WS_POPUP,
            p.x - W / 2, p.y - H / 2, W, H, nullptr, nullptr, g_hInst, nullptr);
        if (!g_host) { MagUninitialize(); return false; }
        SetLayeredWindowAttributes(g_host, 0, 255, LWA_ALPHA);
        g_mag = CreateWindowW(WC_MAGNIFIER, L"", WS_CHILD | WS_VISIBLE, 0, 0, W, H, g_host, nullptr, g_hInst, nullptr);
        if (!g_mag) { DestroyWindow(g_host); g_host = nullptr; MagUninitialize(); return false; }
        HWND excl[1] = { g_host };
        MagSetWindowFilterList(g_mag, MW_FILTERMODE_EXCLUDE, 1, excl);
        MAGTRANSFORM m{}; m.v[0][0] = (float)g_factor.load(); m.v[1][1] = (float)g_factor.load(); m.v[2][2] = 1.0f; MagSetWindowTransform(g_mag, &m);
        ShowWindow(g_host, SW_HIDE);
        return true;
    }

    void destroy_windows() { if (g_mag) { DestroyWindow(g_mag); g_mag = nullptr; } if (g_host) { DestroyWindow(g_host); g_host = nullptr; } MagUninitialize(); }

    void thread_proc() {
        if (!create_windows()) return;
        SetTimer(g_host, 1, g_timerMs, nullptr);
        MSG msg; while (GetMessageW(&msg, nullptr, 0, 0)) { TranslateMessage(&msg); DispatchMessageW(&msg); if (!g_running.load()) break; }
    }
}

namespace zoommag {
    bool init(int vk, int factor, int patch) {
        if (g_inited.load()) { update_key(vk); reconfigure(factor, patch); set_enabled(true); return true; }
        timeBeginPeriod(1);
        g_hInst = GetModuleHandleW(nullptr);
        g_vk = vk; g_factor = (factor > 0 ? factor : 2); g_patch = (patch > 0 ? patch : 160);
        g_running = true;
        g_thr = std::thread(thread_proc);
        SetThreadPriority(g_thr.native_handle(), THREAD_PRIORITY_BELOW_NORMAL);
        g_inited = true;
        return true;
    }
    void update_key(int vk) { g_vk = vk; }
    void set_enabled(bool e) { g_enabled.store(e); if (!e && g_host) ShowWindow(g_host, SW_HIDE); }
    void reconfigure(int factor, int patch) { if (!g_inited.load()) return; if (factor > 0) g_factor = factor; if (patch > 0) g_patch = patch; }
    void shutdown() { if (!g_inited.load()) return; g_running = false; if (g_host) PostMessageW(g_host, WM_CLOSE, 0, 0); if (g_thr.joinable()) g_thr.join(); destroy_windows(); timeEndPeriod(1); g_inited = false; }
    bool is_active() { return g_active.load(); }
}
