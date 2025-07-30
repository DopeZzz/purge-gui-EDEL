#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <timeapi.h>
#pragma comment(lib,"gdi32.lib")
#pragma comment(lib,"winmm.lib")

#include <opencv2/opencv.hpp>
#include "recoil.h"
#include "thread_worker.h"

#include <iostream>
#include <vector>
#include <string>
#include <thread>
#include <atomic>
#include <chrono>
#include <mutex>
#include <condition_variable>
#include <algorithm>
#include <stdexcept>
#include "zoom.h"

namespace auto_det {

    constexpr float BASE_W = 1920.0f;
    constexpr float BASE_H = 1080.0f;
    constexpr float ROI_X_MIN_R = 670.0f / BASE_W;
    constexpr float ROI_Y_MIN_R = 934.0f / BASE_H;
    constexpr float ROI_X_MAX_R = 1228.0f / BASE_W;
    constexpr float ROI_Y_MAX_R = 1099.0f / BASE_H;

    static inline cv::Rect getROI(int W, int H)
    {
        if (W == 1440 && H == 1080)  return { 536, 1003, 365, 76 };
        if (W == 900 && H == 1080)  return { 300, 1014, 286, 60 };

        int x1 = std::clamp(int(W * ROI_X_MIN_R), 0, W - 1);
        int y1 = std::clamp(int(H * ROI_Y_MIN_R), 0, H - 1);
        int x2 = std::clamp(int(W * ROI_X_MAX_R), 0, W);
        int y2 = std::clamp(int(H * ROI_Y_MAX_R), 0, H);
        return { x1, y1, x2 - x1, y2 - y1 };
    }

    struct MonitorInfo { int idx; RECT rc; };

    static BOOL CALLBACK enumProc(HMONITOR, HDC, LPRECT r, LPARAM p)
    {
        auto* v = reinterpret_cast<std::vector<MonitorInfo>*>(p);
        v->push_back({ (int)v->size(), *r });
        return TRUE;
    }

    static std::vector<MonitorInfo> enumerateMonitors()
    {
        std::vector<MonitorInfo> mons;
        EnumDisplayMonitors(nullptr, nullptr, enumProc, reinterpret_cast<LPARAM>(&mons));
        return mons;
    }

    static bool capturarMonitor(int idx, const std::vector<MonitorInfo>& mons,
        cv::Mat& rgb, bool ensureNonBlack = false)
    {
        if (idx < 0 || idx >= (int)mons.size()) return false;
        const RECT& rc = mons[idx].rc;
        int W = rc.right - rc.left;
        int H = rc.bottom - rc.top;

        HDC hScreen = GetDC(nullptr);
        HDC hMem = CreateCompatibleDC(hScreen);
        HBITMAP hBmp = CreateCompatibleBitmap(hScreen, W, H);
        SelectObject(hMem, hBmp);

        if (!BitBlt(hMem, 0, 0, W, H, hScreen, rc.left, rc.top, SRCCOPY | CAPTUREBLT))
        {
            DeleteObject(hBmp); DeleteDC(hMem); ReleaseDC(nullptr, hScreen);
            return false;
        }

        BITMAPINFO bmi{};
        bmi.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
        bmi.bmiHeader.biWidth = W;
        bmi.bmiHeader.biHeight = -H;
        bmi.bmiHeader.biPlanes = 1;
        bmi.bmiHeader.biBitCount = 32;
        bmi.bmiHeader.biCompression = BI_RGB;

        cv::Mat bgra(H, W, CV_8UC4);
        if (!GetDIBits(hMem, hBmp, 0, H, bgra.data, &bmi, DIB_RGB_COLORS))
        {
            DeleteObject(hBmp); DeleteDC(hMem); ReleaseDC(nullptr, hScreen);
            return false;
        }
        cv::cvtColor(bgra, rgb, cv::COLOR_BGRA2BGR);

        DeleteObject(hBmp); DeleteDC(hMem); ReleaseDC(nullptr, hScreen);

        if (!ensureNonBlack) return true;
        if (cv::sum(rgb)[0] + cv::sum(rgb)[1] + cv::sum(rgb)[2] > 64.0) return true;

        std::this_thread::sleep_for(std::chrono::milliseconds(16));
        return false;
    }

    struct DetectionResult { std::string label; float conf; cv::Rect box; };
    static std::mutex detMtx;
    static std::vector<DetectionResult> lastDetections;

    static bool sendROI(const cv::Mat& roi, std::vector<DetectionResult>& out)
    {
        auto* runner = recoil::g_runner;
        if (!runner || !runner->auto_detection()) return false;

        std::vector<uchar> jpg;
        if (!cv::imencode(".jpg", roi, jpg, { cv::IMWRITE_JPEG_QUALITY, 90 }))
            return false;

        std::vector<::Detection> dets;
        if (!runner->detect(jpg, dets)) return false;

        float thr = runner->detection_accuracy();
        out.clear();

        for (const auto& d : dets)
        {
            if (d.conf < thr) continue;
            out.push_back({ d.label, d.conf, { d.x, d.y, d.w, d.h } });
        }
        { std::lock_guard lk(detMtx); lastDetections = out; }
        return true;
    }

    static HANDLE g_evt = nullptr;

    static LRESULT CALLBACK kbLL(int c, WPARAM w, LPARAM l)
    {
        if (c == HC_ACTION && w == WM_KEYDOWN)
        {
            auto* k = reinterpret_cast<KBDLLHOOKSTRUCT*>(l);
            if (k->vkCode >= '0' && k->vkCode <= '6') SetEvent(g_evt);
        }
        return CallNextHookEx(nullptr, c, w, l);
    }

    static LRESULT CALLBACK msLL(int c, WPARAM w, LPARAM l)
    {
        if (c == HC_ACTION && w == WM_MOUSEWHEEL) SetEvent(g_evt);
        return CallNextHookEx(nullptr, c, w, l);
    }

    class InputHooks {
        HHOOK kb_{ nullptr };
        HHOOK ms_{ nullptr };
    public:
        InputHooks()
        {
            g_evt = CreateEvent(nullptr, TRUE, FALSE, nullptr);
            kb_ = SetWindowsHookEx(WH_KEYBOARD_LL, kbLL, nullptr, 0);
            ms_ = SetWindowsHookEx(WH_MOUSE_LL, msLL, nullptr, 0);
            if (!g_evt || !kb_ || !ms_) throw std::runtime_error("fail");
        }
        ~InputHooks()
        {
            if (kb_) UnhookWindowsHookEx(kb_);
            if (ms_) UnhookWindowsHookEx(ms_);
            if (g_evt) CloseHandle(g_evt);
            g_evt = nullptr;
        }
        HANDLE event() const { return g_evt; }
    };

    static std::mutex              mtx;
    static std::condition_variable cvReq;
    static std::atomic<bool>       busy{ false };
    static bool                    pending = false;

    static int monitorFromCursor(const std::vector<MonitorInfo>& m)
    {
        POINT p{}; GetCursorPos(&p);
        for (const auto& mo : m)
            if (p.x >= mo.rc.left && p.x < mo.rc.right &&
                p.y >= mo.rc.top && p.y < mo.rc.bottom)
                return mo.idx;
        return 0;
    }

    static void worker(const std::vector<MonitorInfo>& mons, std::atomic<bool>& stop)
    {
        while (true)
        {
            std::unique_lock lk(mtx);
            cvReq.wait(lk, [&] { return pending || stop.load(); });
            if (stop.load()) break;
            pending = false; lk.unlock();
            std::this_thread::sleep_for(std::chrono::milliseconds(200));
            if (stop.load()) break;

            busy = true;
            auto* runner = recoil::g_runner;
            if (!runner || !runner->auto_detection()) { busy = false; continue; }

            int midx = monitorFromCursor(mons);
            cv::Mat frame;
            if (!capturarMonitor(midx, mons, frame, true)) { busy = false; continue; }

            cv::Mat roi = frame(getROI(frame.cols, frame.rows)).clone();

            std::vector<DetectionResult> dets;
            sendROI(roi, dets);

            if (!dets.empty())
            {
                const auto& best = *std::max_element(
                    dets.begin(), dets.end(),
                    [](const DetectionResult& a, const DetectionResult& b) { return a.conf < b.conf; });
                if (best.conf >= runner->detection_accuracy())
                    runner->select("weapon", best.label);
            }
            busy = false;
        }
    }

    static void guiLoop(const std::vector<MonitorInfo>& mons, InputHooks& hooks)
    {
        MSG msg{};
        using Clock = std::chrono::steady_clock;
        auto last_evt = Clock::now();
        bool confirm = false;

        while (true)
        {
            HANDLE evt = hooks.event();
            DWORD s = MsgWaitForMultipleObjects(1, &evt, FALSE, 100, QS_ALLINPUT);

            if (s == WAIT_OBJECT_0)
            {
                ResetEvent(evt);
                if (!busy.load() && !pending)
                {
                    std::lock_guard lg(mtx);
                    pending = true;
                    cvReq.notify_one();
                }
                last_evt = Clock::now();
                confirm = true;
            }

            if (confirm && Clock::now() - last_evt >= std::chrono::seconds(1))
            {
                if (!busy.load() && !pending)
                {
                    std::lock_guard lg(mtx);
                    pending = true;
                    cvReq.notify_one();
                    confirm = false;
                }
            }

            while (PeekMessage(&msg, nullptr, 0, 0, PM_REMOVE))
            {
                if (msg.message == WM_QUIT) return;
                TranslateMessage(&msg);
                DispatchMessage(&msg);
            }
        }
    }

    class Runner {
        std::vector<MonitorInfo> mons_;
        ThreadWorker            worker_;
        InputHooks              hooks_;
    public:
        Runner() {
            zoommag::init(88, 3, 160);    //cambiar

            mons_ = enumerateMonitors();
            if (mons_.empty()) throw std::runtime_error("no monitor");
            worker_.start(worker, std::cref(mons_));
        }
        ~Runner() {
            worker_.stop(); cvReq.notify_one(); worker_.join();
            zoommag::shutdown();               
        }
        void run() { guiLoop(mons_, hooks_); }
    };

    int autoloot()
    {
        try { Runner r; r.run(); }
        catch (...) { return 1; }
        return 0;
    }

} 
