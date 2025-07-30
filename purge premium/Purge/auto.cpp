#include <dxgi1_2.h>
#include "auto.h"
#include "yconf.h"
#include "yw.h"
#include "config.h"

#include <windows.h>
#include <d3d11.h>
#pragma comment(lib,"d3d11.lib")
#pragma comment(lib,"dxgi.lib")
#pragma comment(lib,"dxguid.lib")
#pragma comment(lib,"Ws2_32.lib")
#pragma comment(lib,"Crypt32.lib")

#include <openssl/evp.h>

#include <opencv2/opencv.hpp>
#include <opencv2/dnn.hpp>

#include <atomic>
#include <thread>
#include <vector>
#include <chrono>
#include <iomanip>
#include <iostream>
#include <stdexcept>
#include <algorithm>
#include <atlbase.h>

std::vector<MonitorInfo>  gMonitors;       // aquí SÍ defino
std::vector<const char*>  gMonitorLabels;

using ATL::CComPtr;

constexpr float BASE_W = 1920.0f;
constexpr float BASE_H = 1080.0f;

constexpr float ROI_X_MIN_R = 670.0f / BASE_W;
constexpr float ROI_Y_MIN_R = 934.0f / BASE_H;
constexpr float ROI_X_MAX_R = 1228.0f / BASE_W;
constexpr float ROI_Y_MAX_R = 1099.0f / BASE_H;

static inline cv::Rect getROI(int W, int H)
{
    if (W == 1440 && H == 1080)
        return { 536, 1003, 365, 76 }; 
    if (W == 900 && H == 1080)
        return { 300, 1014, 286, 60 }; 

    int x1 = std::clamp(int(W * ROI_X_MIN_R), 0, W - 1);
    int y1 = std::clamp(int(H * ROI_Y_MIN_R), 0, H - 1);
    int x2 = std::clamp(int(W * ROI_X_MAX_R), 0, W);
    int y2 = std::clamp(int(H * ROI_Y_MAX_R), 0, H);

    int w = x2 - x1;
    int h = y2 - y1;
    return { x1, y1, w > 0 ? w : 0, h > 0 ? h : 0 };
}

void UpdateMonitorList()
{
    gMonitors.clear();
    gMonitorLabels.clear();

    CComPtr<IDXGIFactory1> factory;
    if (FAILED(CreateDXGIFactory1(__uuidof(IDXGIFactory1),
        reinterpret_cast<void**>(&factory))))
        return;

    CComPtr<IDXGIAdapter1> adapter;
    if (FAILED(factory->EnumAdapters1(0, &adapter)))
        return;

    for (UINT i = 0;; ++i)
    {
        CComPtr<IDXGIOutput> output;
        if (adapter->EnumOutputs(i, &output) == DXGI_ERROR_NOT_FOUND)
            break;

        DXGI_OUTPUT_DESC od;
        output->GetDesc(&od);

        UINT w = od.DesktopCoordinates.right - od.DesktopCoordinates.left;
        UINT h = od.DesktopCoordinates.bottom - od.DesktopCoordinates.top;

        char devName[64]{};
        WideCharToMultiByte(CP_UTF8, 0, od.DeviceName, -1,
            devName, _countof(devName), nullptr, nullptr);

        char buf[128];
        std::snprintf(buf, sizeof(buf), "%ux%u (%s)", w, h, devName);

        gMonitors.push_back({ buf, w, h });
    }

    for (auto& m : gMonitors)
        gMonitorLabels.push_back(m.label.c_str());
}

static bool capturarMonitor(int idx, cv::Mat& rgb)
{
    static bool                         initDev = false;
    static CComPtr<ID3D11Device>        dev;
    static CComPtr<ID3D11DeviceContext> ctx;
    static CComPtr<IDXGIFactory1>       fac;
    static CComPtr<IDXGIAdapter1>       adp;
    static CComPtr<IDXGIOutputDuplication> dupl;
    static CComPtr<ID3D11Texture2D>     staging;
    static int                          lastDupMonitor = -1;

    if (!initDev)
    {
        D3D_FEATURE_LEVEL lvl;
        if (FAILED(D3D11CreateDevice(
            nullptr, D3D_DRIVER_TYPE_HARDWARE, nullptr,
            D3D11_CREATE_DEVICE_BGRA_SUPPORT,
            nullptr, 0, D3D11_SDK_VERSION,
            &dev, &lvl, &ctx)))
            return false;

        if (FAILED(CreateDXGIFactory1(__uuidof(IDXGIFactory1), (void**)&fac)))
            return false;
        if (FAILED(fac->EnumAdapters1(0, &adp)))
            return false;

        initDev = true;
    }

    if (idx != lastDupMonitor)
    {
        dupl.Release();
        staging.Release();

        CComPtr<IDXGIOutput> out;
        if (FAILED(adp->EnumOutputs(idx, &out)))
            return false;

        CComPtr<IDXGIOutput1> out1;
        if (FAILED(out->QueryInterface(__uuidof(IDXGIOutput1), (void**)&out1)))
            return false;
        if (FAILED(out1->DuplicateOutput(dev, &dupl)))
            return false;

        lastDupMonitor = idx;
    }

    DXGI_OUTDUPL_FRAME_INFO fi;
    CComPtr<IDXGIResource> res;
    HRESULT hr = dupl->AcquireNextFrame(16, &fi, &res);
    if (hr == DXGI_ERROR_WAIT_TIMEOUT)
        return false;                      

    if (hr == DXGI_ERROR_ACCESS_LOST || hr == DXGI_ERROR_DEVICE_REMOVED)
    {
        dupl.Release();
        staging.Release();
        lastDupMonitor = -1;                

        if (hr == DXGI_ERROR_DEVICE_REMOVED)   
        {                                   
            dev.Release();                  
            ctx.Release();
            initDev = false;                
        }                                   
        return false;
    }

    if (FAILED(hr))
        return false;



    CComPtr<ID3D11Texture2D> tex;
    res->QueryInterface(__uuidof(ID3D11Texture2D), (void**)&tex);
    D3D11_TEXTURE2D_DESC desc;
    tex->GetDesc(&desc);

    if (!staging)
    {
        desc.CPUAccessFlags = D3D11_CPU_ACCESS_READ;
        desc.Usage = D3D11_USAGE_STAGING;
        desc.BindFlags = 0;
        desc.MiscFlags = 0;
        if (FAILED(dev->CreateTexture2D(&desc, nullptr, &staging)))
        {
            dupl->ReleaseFrame();
            return false;
        }
    }

    ctx->CopyResource(staging, tex);
    D3D11_MAPPED_SUBRESOURCE map;
    if (FAILED(ctx->Map(staging, 0, D3D11_MAP_READ, 0, &map)))
    {
        dupl->ReleaseFrame();
        return false;
    }

    cv::Mat bgra(desc.Height, desc.Width, CV_8UC4, map.pData, map.RowPitch);
    cv::cvtColor(bgra, rgb, cv::COLOR_BGRA2BGR);
    ctx->Unmap(staging, 0);
    dupl->ReleaseFrame();

    return true;
}

static std::vector<unsigned char> deriveKey()
{
    return {
        0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,
        0x88,0x99,0xAA,0xBB,0xCC,0xDD,0xEE,0xFF,
        0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,
        0x88,0x99,0xAA,0xBB,0xCC,0xDD,0xEE,0xFF
    };
}

static std::vector<unsigned char> decryptWeights()
{
    auto key = deriveKey();
    if (encryptedWeightsLen < 12 + 16)
        throw std::runtime_error("Sb");

    const unsigned char* iv = encryptedWeights;
    const unsigned char* cipher = encryptedWeights + 12;
    size_t cipherLen = encryptedWeightsLen - 12 - 16;
    const unsigned char* tag = encryptedWeights + 12 + cipherLen;

    EVP_CIPHER_CTX* ctx = EVP_CIPHER_CTX_new();
    if (!ctx) throw std::runtime_error("GCM");
    EVP_DecryptInit_ex(ctx, EVP_aes_256_gcm(), nullptr, nullptr, nullptr);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_IVLEN, 12, nullptr);
    EVP_DecryptInit_ex(ctx, nullptr, nullptr, key.data(), iv);

    std::vector<unsigned char> plaintext(cipherLen);
    int len = 0;
    EVP_DecryptUpdate(ctx, plaintext.data(), &len, cipher, (int)cipherLen);
    EVP_CIPHER_CTX_ctrl(ctx, EVP_CTRL_GCM_SET_TAG, 16, (void*)tag);

    if (EVP_DecryptFinal_ex(ctx, nullptr, &len) <= 0) {
        EVP_CIPHER_CTX_free(ctx);
        throw std::runtime_error("GCM2");
    }
    EVP_CIPHER_CTX_free(ctx);
    return plaintext;
}


void DetectorLoop()
{
    int lastMonitor = -1;

    try {
        cv::setNumThreads(1);

        std::vector<uchar> bufW = decryptWeights();
        std::vector<uchar> bufC(cfgText.begin(), cfgText.end());
        cv::dnn::Net net = cv::dnn::readNetFromDarknet(bufC, bufW);
        net.setPreferableBackend(cv::dnn::DNN_BACKEND_OPENCV);
        net.setPreferableTarget(cv::dnn::DNN_TARGET_CPU);

        const int inpSize = 640;
        cv::Mat frame;

        while (gRunDetector.load()) {
            if (!gDetectorEnabled.load()) {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
                continue;
            }

            const float thr = std::clamp(accuracydetector - 0.1f, 0.0f, 1.0f);

            int currentMon = gMonitorIndex.load();
            if (currentMon != lastMonitor) {
                lastMonitor = currentMon;
            }

            if (!capturarMonitor(currentMon, frame)) {
                std::this_thread::sleep_for(std::chrono::milliseconds(100));
                continue;
            }

            auto roi = getROI(frame.cols, frame.rows);
            cv::Mat view = frame(roi);
            cv::Mat blob = cv::dnn::blobFromImage(
                view, 1 / 255.f, { inpSize, inpSize }, {}, true, false);
            net.setInput(blob);

            std::vector<cv::Mat> outs;
            net.forward(outs, net.getUnconnectedOutLayersNames());

            std::vector<int>   ids;
            std::vector<float> confs;
            for (auto& out : outs) {
                for (int i = 0; i < out.rows; ++i) {
                    const float* d = out.ptr<float>(i);
                    if (d[4] < thr) continue;
                    cv::Mat scores = out.row(i).colRange(5, out.cols);
                    cv::Point cid; double cs;
                    cv::minMaxLoc(scores, nullptr, &cs, nullptr, &cid);
                    if (cs < thr) continue;
                    ids.push_back(cid.x);
                    confs.push_back(d[4] * float(cs));
                }
            }

            std::vector<cv::Rect> dummy(ids.size());
            std::vector<int>      idx;
            cv::dnn::NMSBoxes(dummy, confs, thr, thr, idx);

            if (idx.empty()) {
                updateWeapon(0);
            }
            else {
                int sel = idx[0];
                int cid = ids[sel];


                imwpc = cid;
                updateWeapon(imwpc);
            }

            int intervalSec = gDetectionInterval.load();
            if (intervalSec < 1) intervalSec = 1;
            std::this_thread::sleep_for(std::chrono::seconds(intervalSec));


        }
    }
    catch (const std::exception& e) {
    }
}



void StartDetector()
{
    if (gDetectorThread.joinable()) return;
    gRunDetector.store(true);
    gDetectorThread = std::thread(DetectorLoop);
}

void StopDetector()
{
    gRunDetector.store(false);
    if (gDetectorThread.joinable())
        gDetectorThread.join();
}
