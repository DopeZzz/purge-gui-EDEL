#include "auto.h"
#include "gui.h"
#include "login.h"
#include <tchar.h>
#include <dwmapi.h>
#pragma comment(lib, "Dwmapi.lib")
#include <windows.h> 
#include <shlobj.h>  
#include <direct.h>  
#include <ctime>
#include <iomanip>
#include <iostream>
#include "security.h"
#include "rextractor.h"
#include "keydetector.h"
#include "magic.h"
#include "config.h"
#include <TlHelp32.h>
#include <processthreadsapi.h>
#include <shellapi.h>

#pragma comment(lib, "Shell32.lib") 
void DisableBackgroundThrottling()
{
    PROCESS_POWER_THROTTLING_STATE pts = {};
    pts.Version = PROCESS_POWER_THROTTLING_CURRENT_VERSION;
    pts.ControlMask =
        PROCESS_POWER_THROTTLING_EXECUTION_SPEED |
        PROCESS_POWER_THROTTLING_IGNORE_TIMER_RESOLUTION;

    pts.StateMask = 0;
    SetProcessInformation(
        GetCurrentProcess(),
        ProcessPowerThrottling,
        &pts,
        sizeof(pts));
}

//chekar que hacen
bool loginSuccess = false;
using namespace ImGui;
bool windowVisible = true;
float color_edit[2], esp_preview_colors[4][4];

static ImVec2 esp_preview_pos;

std::string line;

ImColor rectColor = ImColor(12, 12, 12, 255);


void bgthemes() {
    switch (themesselection) {
    case 0:
        ImGui::GetStyle().Colors[ImGuiCol_WindowBg] = ImVec4(0.031f, 0.031f, 0.031f, 1.00f);
        break;
    case 1:
        ImGui::GetStyle().Colors[ImGuiCol_WindowBg] = ImVec4(0.01f, 0.012f, 0.042f, 1.0f);
        break;
    case 2:
        ImGui::GetStyle().Colors[ImGuiCol_WindowBg] = ImVec4(0.01f, 0.03f, 0.01f, 1.0f);
        break;
    case 3:
        ImGui::GetStyle().Colors[ImGuiCol_WindowBg] = ImVec4(0.02f, 0.01f, 0.05f, 1.0f);
        break;
    case 4:
        ImGui::GetStyle().Colors[ImGuiCol_WindowBg] = ImVec4(0.05f, 0.01f, 0.01f, 1.0f);
        break;
    case 5:
        ImGui::GetStyle().Colors[ImGuiCol_WindowBg] = ImVec4(0.17f, 0.17f, 0.17f, 1.0f);
        break;
    default:
        break;
    }

    switch (themesselection) {
    case 0:
        rectColor = ImColor(12, 12, 12, 255);
        break;
    case 1:
        rectColor = ImColor(13, 15, 22, 255);
        break;
    case 2:
        rectColor = ImColor(15, 29, 15, 255);
        break;
    case 3:
        rectColor = ImColor(17, 12, 32, 255);
        break;
    case 4:
        rectColor = ImColor(38, 15, 15, 255);
        break;
    case 5:
        rectColor = ImColor(60, 60, 60, 255);
        break;
    default:
        break;
    }
}



void OpenURL(const char* url)
{
    ShellExecuteA(NULL, "open", url, NULL, NULL, SW_SHOWNORMAL);
}

//////


bool isProcessRunning(const wchar_t* processName) {
    bool found = false;
    HANDLE hSnap = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnap != INVALID_HANDLE_VALUE) {
        PROCESSENTRY32W pe;
        pe.dwSize = sizeof(pe);
        if (Process32FirstW(hSnap, &pe)) {
            do {
                if (_wcsicmp(pe.szExeFile, processName) == 0) {
                    found = true;
                    break;
                }
            } while (Process32NextW(hSnap, &pe));
        }
        CloseHandle(hSnap);
    }
    return found;
}

DWORD WINAPI MyThreadProc(LPVOID lpParameter)
{
    if (isProcessRunning(L"steam.exe"))
        return 0;
    checkUpdate();
   
    //
    gDetectorEnabled.store(false);
    gDetectionInterval.store(1);
    gMonitorIndex.store(0);
    //
    DWORD processID = GetCurrentProcessId();
    std::wstringstream ss;
    ss << processID;
    std::wstring uniqueClassName = ss.str();
    //AllocConsole();
    //FILE* fDummy;
    //freopen_s(&fDummy, "CONIN$", "r", stdin);
    //freopen_s(&fDummy, "CONOUT$", "w", stderr);
    //freopen_s(&fDummy, "CONOUT$", "w", stdout);

    SettingsManager& settings = GetGlobalSettings();
    settings.load();
    strncpy(key_input, settings.getKey().c_str(), sizeof(key_input));
    updateVariablesFromSettings(settings);
    steps1 = guisteps1 + 4;
    WNDCLASSEXW wc;
    wc.cbSize = sizeof(WNDCLASSEXW);
    wc.style = CS_CLASSDC;
    wc.lpfnWndProc = WndProc;
    wc.cbClsExtra = NULL;
    wc.cbWndExtra = NULL;
    wc.hInstance = nullptr;
    wc.hIcon = LoadIcon(0, IDI_APPLICATION);
    wc.hCursor = LoadCursor(0, IDC_ARROW);
    wc.hbrBackground = nullptr;
    wc.lpszMenuName = NULL;
    wc.lpszClassName = uniqueClassName.c_str();
    wc.hIconSm = LoadIcon(0, IDI_APPLICATION);

    RegisterClassExW(&wc);
    menu_size.x = 755;
    menu_size.y = 680;
    hwnd = CreateWindowExW(NULL, wc.lpszClassName, NULL, WS_POPUP, (GetSystemMetrics(SM_CXSCREEN) / 2) - (menu_size.x / 2), (GetSystemMetrics(SM_CYSCREEN) / 2) - (menu_size.y / 2), menu_size.x, menu_size.y, 0, 0, 0, 0);

    SetWindowLongA(hwnd, GWL_EXSTYLE, GetWindowLong(hwnd, GWL_EXSTYLE) | WS_EX_LAYERED);
    SetLayeredWindowAttributes(hwnd, RGB(0, 0, 0), 255, LWA_ALPHA);

    MARGINS margins = { -1 };
    //DwmExtendFrameIntoClientArea(hwnd, &margins);
    SetWindowRgn(hwnd, CreateRoundRectRgn(0, 0, menu_size.x, menu_size.y, 20, 20), TRUE);
    POINT mouse;
    rc = { 0 };
    GetWindowRect(hwnd, &rc);

    if (!CreateDeviceD3D(hwnd))
    {
        CleanupDeviceD3D();
        ::UnregisterClassW(wc.lpszClassName, wc.hInstance);
        return 1;
    }

    ::ShowWindow(hwnd, SW_SHOWDEFAULT);
    ::UpdateWindow(hwnd);

    IMGUI_CHECKVERSION();
    ImGui::CreateContext();
    ImGuiIO& io = ImGui::GetIO(); (void)io;
    ImGui::GetIO().IniFilename = NULL;

    io.Fonts->AddFontFromMemoryTTF(&RobotoBold, sizeof RobotoBold, 22, NULL, io.Fonts->GetGlyphRangesCyrillic());

    tab_font = io.Fonts->AddFontFromMemoryTTF(&icomoon, sizeof icomoon, 30, NULL, io.Fonts->GetGlyphRangesCyrillic());

    icon_font = io.Fonts->AddFontFromMemoryTTF(&icomoon, sizeof icomoon, 26, NULL, io.Fonts->GetGlyphRangesCyrillic());

    icon_font2 = io.Fonts->AddFontFromMemoryTTF(&icomoon2, sizeof icomoon2, 26, NULL, io.Fonts->GetGlyphRangesCyrillic());

    hint_font = io.Fonts->AddFontFromMemoryTTF(&RobotoRegular, sizeof RobotoRegular, 16, NULL, io.Fonts->GetGlyphRangesCyrillic());

    second_font = io.Fonts->AddFontFromMemoryTTF(&RobotoMedium, sizeof RobotoMedium, 19, NULL, io.Fonts->GetGlyphRangesCyrillic());

    //ImGui::StyleColorsDark();

    ImGui_ImplWin32_Init(hwnd);
    ImGui_ImplDX9_Init(g_pd3dDevice);

    ImVec4 clear_color = ImVec4(0.1f, 0.1f, 0.1f, 1.00f);

    ImGuiStyle& s = ImGui::GetStyle();

    s.FramePadding = ImVec2(5, 3);
    s.WindowPadding = ImVec2(0, 0);
    s.FrameRounding = 5.f;
    s.WindowRounding = 4.f;
    s.WindowBorderSize = 0.f;
    s.PopupBorderSize = 0.f;
    s.WindowPadding = ImVec2(0, 0);
    s.ChildBorderSize = 10;
    s.WindowShadowSize = 0.f;
    s.PopupRounding = 4.f;
    s.ScrollbarSize = 2;
    s.Colors[ImGuiCol_TextSelectedBg] = ImColor(0.4f, 0.8f, 1.0f, 0.25f);
    ImGui::GetStyle().ItemSpacing = ImVec2(9.f, 9.f);
    bool done = false;


    while (!done)
    {
        MSG msg;
        while (::PeekMessage(&msg, NULL, 0U, 0U, PM_REMOVE))
        {
            ::TranslateMessage(&msg);
            ::DispatchMessage(&msg);
            if (msg.message == WM_QUIT)
                done = true;
        }
        if (done)
            break;

        //notcrash
        HRESULT result = g_pd3dDevice->TestCooperativeLevel();
        if (result == D3DERR_DEVICELOST)
        {
            islost = true;
            Sleep(100);
            continue;
        }

        else if (result == D3DERR_DEVICENOTRESET)
        {
            ImGui_ImplDX9_InvalidateDeviceObjects();
            if (g_pd3dDevice->Reset(&g_d3dpp) == D3D_OK)
            {
                ImGui_ImplDX9_CreateDeviceObjects();

                D3DPRESENT_PARAMETERS temp = g_d3dpp;
                temp.Windowed = !temp.Windowed;


                ImGui_ImplDX9_InvalidateDeviceObjects();
                if (g_pd3dDevice->Reset(&g_d3dpp) == D3D_OK)
                {
                    ImGui_ImplDX9_CreateDeviceObjects();
                    islost = false;
                }
            }
            continue;
        }


        ImGui_ImplDX9_NewFrame();
        ImGui_ImplWin32_NewFrame();
        ImGui::NewFrame();
        {
            ImGui::GetBackgroundDrawList()->AddImage(bg, ImVec2(0, 0), ImVec2(1920, 1080));

            ImGui::SetNextWindowPos(ImVec2(-1, 0));
            ImGui::SetNextWindowSize(ImVec2(755, 680));
            ImGui::Begin("General", nullptr, ImGuiWindowFlags_NoResize | ImGuiWindowFlags_NoDecoration | ImGuiWindowFlags_NoCollapse | ImGuiWindowFlags_NoTitleBar | ImGuiWindowFlags_NoBringToFrontOnFocus);
            {
                auto draw = ImGui::GetWindowDrawList();
                const auto& p = ImGui::GetWindowPos();

                esp_preview_pos = ImGui::GetWindowPos() + ImVec2(765, 0);

                if (animated_background) {
                    Circle_background();
                }

                if (!autorizated) {
                    ImGui::SetCursorPos(ImVec2(122.5f, 230));
                    frame_size = ImVec2(510, 65);
                    ImGui::BeginGroup();
                    draw->AddText(center_text(p + ImVec2(0, 165), p + ImVec2(755, 165), "PURGE "), ImColor(1.f, 1.f, 1.f, 1.f), "PURGE ");
                    draw->AddText(center_text(p + ImVec2(0, 185), p + ImVec2(755, 185), "purgerecoil.club"), ImColor(0.6f, 0.6f, 0.6f, 0.5f), "purgerecoil.club");

                    ImGui::InputTextEx("Enter license key", NULL, key_input, 64, ImVec2(510, 35), 0);


                    ImGui::SimpleCheckbox(" ", &remember, "Remember me");

                    if (!remember) {
                        settings.setKey("");
                    }

                    ImGui::Spacing();
                    if (ImGui::Button("Authorization", frame_size)) {

                        settings.setKey(key_input);
                        updateSettingsFromVariables(settings);
                        settings.save();

                        loginSuccess = authenticate(key_input);
                        if (loginSuccess) {
                            autenticado = 6;
                            bgthemes();

                        }

                    }
                    if (!errorMessage.empty()) {
                        ImGui::TextColored(ImVec4(1, 0, 0, 1), "%s", errorMessage.c_str());

                    }

                    ImGui::EndGroup();
                    frame_size = ImVec2(605, 65);
                }

                //hacer algo para si meten jump de autorizated que pete jeje
                if (autorizated) {
                    StartDetector();
                    startmagic();
                    startkeys();

                    draw->AddLine(p + ImVec2(0, 70), p + ImVec2(755, 70), ImColor(16, 16, 16, 255), 3.f);

                    draw->AddRectFilled(p, p + ImVec2(80, 680), rectColor, 4.f, ImDrawFlags_RoundCornersLeft);

                    draw->AddLine(p + ImVec2(80, 0), p + ImVec2(80, 680), ImColor(16, 16, 16, 255), 3.f);

                    draw->AddLine(p + ImVec2(10, 70), p + ImVec2(70, 70), ImColor(24, 24, 24, 255), 3.f);
                    f3();
                    draw->AddLine(p + ImVec2(10, 600), p + ImVec2(70, 600), ImColor(24, 24, 24, 255), 3.f);//bajar la linea



                    if (Logotip == nullptr)
                        D3DXCreateTextureFromFileInMemoryEx(g_pd3dDevice, Logo, sizeof(Logo), 600, 600, D3DX_DEFAULT, 0, D3DFMT_UNKNOWN, D3DPOOL_MANAGED, D3DX_DEFAULT, D3DX_DEFAULT, 0, NULL, NULL, &Logotip);
                    float offset_y = 488.0f;
                    ImVec2 image_position = ImVec2(p.x + 1, p.y + 113 + offset_y);
                    ImGui::GetWindowDrawList()->AddImageRounded(Logotip, image_position, ImVec2(image_position.x + 80, image_position.y + 80), ImVec2(0, 0), ImVec2(1, 1), ImColor(main_color.x, main_color.y, main_color.z, main_color.w), 0);
                    ImVec2 imageSize = ImVec2(80, 80);
                    startexit01();
                    if (ImGui::IsMouseHoveringRect(image_position, ImVec2(image_position.x + imageSize.x, image_position.y + imageSize.y), true) && ImGui::IsMouseClicked(ImGuiMouseButton_Left))
                    {
                        OpenURL("https://purgerecoil.club/");
                    }

                    multifucka();
                    
                    ImGui::SetCursorPos(ImVec2(1, 80));
                    ImGui::BeginChild("Tabs");
                    ImGui::Tab("1", &iTabs, 0);
                    ImGui::Tab("0", &iTabs, 4);
                    ImGui::Tab("2", &iTabs, 2);
                    ImGui::Tab("4", &iTabs, 3);
                    ImGui::Tab("8", &iTabs, 8);
                    ImGui::Tab("6", &iTabs, 1);
                    ImGui::Tab("5", &iTabs, 5);
                    ImGui::Tab("7", &iTabs, 6);
                    ImGui::Tab("3", &iTabs, 7);


                    f2();
                    //aqui tengo metido el antifuck lol

                    ImGui::EndChild();

                    pos_offset = ImLerp(pos_offset, size_change ? 910.f : 75.f, ImGui::GetIO().DeltaTime * 16.f);

                    if (pos_offset > 900 && size_change)
                        size_change = false;

                    if (!autorizated) { while (true) {} }

                    if (iTabs == 0)
                    {
                        // puede ser buena xdd if (autenticado && autenticado2 != 6) {fov = 0, insens = 0, adsens = 0;

                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub");
                        ImGui::SubTab("Selection", &iSubTabs, 0); ImGui::SameLine();
                        move_window();
                        ImGui::EndChild();

                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Selection");

                        ImGui::SetCursorPos(ImVec2(0, 9));

                        //ImGui::Checkbox("Draw", &draw_grind, "");

                        if (ImGui::Combo("Weapon", &imwpc, imwp, IM_ARRAYSIZE(imwp), 0, ""))
                        {
                            updateWeapon(imwpc);
                        }

                        if (ImGui::Combo("Scope", &imscc, imsc, IM_ARRAYSIZE(imsc), 0, ""))
                        {
                            updateScope(imscc);

                        }
                        if (ImGui::Combo("Barrel", &immodsc, immods, IM_ARRAYSIZE(immods), 0, ""))
                        {
                            updateMod(immodsc);
                        }
                        crashier();

                        ImGui::SimpleCheckbox("Extended Magazine", &emag, "Enable only when using an extended magazine on your weapon");

                        ImGui::BindBox("On", &onoff, "Select a binding to toggle between On and Off", &keyonoff);

                        ImGui::EndChild();


                    }
                    if (iTabs == 1)
                    {
                        static int iSubTabs = 0;
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub1");
                        ImGui::SubTab("Hotkeys", &iSubTabs, 0);

                        move_window();
                        ImGui::EndChild();

                        ImGui::PushStyleVar(ImGuiStyleVar_ItemSpacing, ImVec2(2.f, 2.f));
                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Hotkeys");

                        ImGui::SetCursorPos(ImVec2(0, 9));

                        ImGui::TextColored(ImVec4(main_color.x, main_color.y, main_color.z, main_color.w), "Weapons:");
                        ImGui::Dummy(ImVec2(0.0f, 15.0f));
                        ImGui::SoloBindBox("Assault Rifle", "Assign a hotkey for Assault Rifle", &onak);
                        ImGui::SoloBindBox("LR-300", "Assign a hotkey for LR-300", &onlr);
                        ImGui::SoloBindBox("MP5A4", "Assign a hotkey for MP5A4", &onmp5);
                        ImGui::SoloBindBox("Custom SMG", "Assign a hotkey for Custom SMG", &onsmg);
                        ImGui::SoloBindBox("Thompson", "Assign a hotkey for Thompson", &ont);
                        ImGui::SoloBindBox("M249", "Assign a hotkey for M249", &onm2);
                        ImGui::SoloBindBox("HMLMG", "Assign a hotkey for HMLMG", &onhm);
                        ImGui::SoloBindBox("Handmade SMG", "Assign a hotkey for Handmade SMG", &ont1s);

                        //if (license == "LIFETIME") {
                        ImGui::SoloBindBox("SemiAutomatic  Rifle", "Assign a hotkey for SemiAutomatic Rifle", &onse);
                        ImGui::SoloBindBox("SemiAutomatic Pistol", "Assign a hotkey for SemiAutomatic Pistol", &onp2);
                        ImGui::SoloBindBox("Python", "Assign a hotkey for Python", &onpy);
                        ImGui::SoloBindBox("M92 Pistol", "Assign a hotkey for M92 Pistol", &onm9);
                        ImGui::SoloBindBox("Revolver", "Assign a hotkey for Revolver", &onre);
                        ImGui::SoloBindBox("M39 Rifle", "Assign a hotkey for M39 Rifle", &onm39);
                        ImGui::SoloBindBox("HighCaliber Revolver", "Assign a hotkey for HighCaliber Revolver", &onhc);
                        ImGui::SoloBindBox("SKS", "Assign a hotkey for SKS", &onsks);

                        //}

                        ImGui::Dummy(ImVec2(0.0f, 30.0f));
                        ImGui::TextColored(ImVec4(main_color.x, main_color.y, main_color.z, main_color.w), "Scopes:");
                        ImGui::Dummy(ImVec2(0.0f, 15.0f));
                        ImGui::SoloBindBox("None", "Assign a hotkey for No Scope", &offscope);
                        ImGui::SoloBindBox("Holosight", "Assign a hotkey for Holosight", &onholo);
                        ImGui::SoloBindBox("Handmade", "Assign a hotkey for Handmade", &onhandmade);
                        ImGui::SoloBindBox("8x", "Assign a hotkey for 8x", &on8);
                        ImGui::SoloBindBox("16x", "Assign a hotkey for 16x", &on16);
                        ImGui::Dummy(ImVec2(0.0f, 30.0f));

                        ImGui::TextColored(ImVec4(main_color.x, main_color.y, main_color.z, main_color.w), "Barrels:");
                        ImGui::Dummy(ImVec2(0.0f, 15.0f));
                        ImGui::SoloBindBox("None ", "Assign a hotkey for No Barrel", &offbarrel);
                        ImGui::SoloBindBox("Muzzle Boost", "Assign a hotkey for Muzzle Boost", &onmuz);

                        ImGui::Dummy(ImVec2(0.0f, 30.0f));
                        ImGui::TextColored(ImVec4(main_color.x, main_color.y, main_color.z, main_color.w), "Mags:");
                        ImGui::Dummy(ImVec2(0.0f, 15.0f));
                        ImGui::SoloBindBox("Extended Magazine", "Assign a hotkey to use a Extended Magazine", &onmag);

                        ImGui::Dummy(ImVec2(0.0f, 30.0f));

                        ImGui::PopStyleVar();
                        ImGui::EndChild();


                    }
                    if (iTabs == 2)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub2");
                        ImGui::SubTab("        Custom Configs", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();

                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Custom Configs");

                        ImGui::SetCursorPos(ImVec2(0, 9));
                        ImGui::TextColored(ImVec4(main_color.x, main_color.y, main_color.z, main_color.w), "Multiplier");
                        ImGui::Dummy(ImVec2(0.0f, 5));

                        ImGui::InputDouble("Assault Rifle", &fak, 1.0f, 1.0f, "%.2f"); //Assault Rifle

                        ImGui::InputDouble("LR-300", &flr, 1.0f, 1.0f, "%.2f"); //LR-300

                        ImGui::InputDouble("MP5A4", &fmp5, 1.0f, 1.0f, "%.2f"); //MP5A4

                        ImGui::InputDouble("Custom SMG", &fsmg, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("Thompson", &ft, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("M249", &fm2, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("HMLMG", &fmlg, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("Handmade SMG", &ft1s, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("SemiAutomatic Rifle", &fsemi, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("SemiAutomatic Pistol", &fp2, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("Python", &fpython, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("M92 Pistol", &fm92, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("Revolver", &frevo, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("M39 Rifle", &fm39, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("HighCaliber Revolver", &fhcrevo, 1.0f, 1.0f, "%.2f");

                        ImGui::InputDouble("SKS", &fsks, 1.0f, 1.0f, "%.2f");

                        ImGui::Dummy(ImVec2(0.0f, 30.0f));

                        ImGui::EndChild();
                    }
                    if (iTabs == 3)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub3");
                        ImGui::SubTab("Settings", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();

                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Settings");

                        ImGui::SetCursorPos(ImVec2(0, 9));

                        ImGui::SetCursorPos(ImVec2(0, 9));
                        ImGui::SliderFloat("Field of view", &fov, 70.0f, 90.0f, "%.1f", 0, "Set up the Fov you are using in-game");
                        ImGui::SliderFloat("Sensitivity", &insens, 0, 2, "%.2f", 0, "Set up the Sens you are using in-game");
                        ImGui::SliderFloat("Aiming sensitivity", &adsens, 0, 2, "%.2f", 0, "Set up the Ads sens you are using in-game");
                        ImGui::SoloBindBox("Aim key", "Select the key you use to aim in-game", &keyaim);
                        ImGui::SoloBindBox("Crouch key", "Select the key you use to crouch in-game", &keycrouch);

                        ImGui::EndChild();
                    }
                    if (iTabs == 4)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub4");
                        ImGui::SubTab("  Options", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();
                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Options");
                        ImGui::SetCursorPos(ImVec2(0, 9));
                        ImGui::SetCursorPos(ImVec2(0, 9));
                        ImGui::SimpleCheckbox("CPU Optimization Mode", &lowcpu, "Enable it for 0% CPU usage when shooting");

                        if (lowcpu) {
                            // Slider cuando lowcpu es true
                            if (ImGui::SliderInt("Recoil Smoothness", &guisteps1, 0, 20, "%d", 1, "A higher value makes the control smoother")) {
                                steps1 = guisteps1 + 4;
                            }
                        }

                        ImGui::SliderInt("Randomization scale", &rndslider, 0, 20, "%d", 0, "Value of randomization applied to recoil");
                        ImGui::BindBox("Hip Fire", &hip, "Activate using a hotkey only when you are about to Hip Fire", &keyhip);


                        ImGui::EndChild();
                    }

                    if (iTabs == 5)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub5");
                        ImGui::SubTab("     Customization", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();
                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Customization");
                        ImGui::SetCursorPos(ImVec2(0, 9));

                        if (ImGui::Combo("Background Themes", &themesselection, themes, IM_ARRAYSIZE(themes), 6)) {

                            bgthemes();
                        }

                        ImGui::ColorBox("Render animated background", &animated_background, "Switch off if your computer has limited resources", (float*)&color_particle);

                        ImGui::ColorBox("Change menu color", &change_main_color, "Change main menu color", (float*)&main_color);
                        if (!change_main_color) {
                            main_color = ImVec4(0.4f, 0.8f, 1.0f, 1.0f);
                        }

                        ImGui::EndChild();
                    }

                    if (iTabs == 6)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub6");
                        ImGui::SubTab("Misc", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();
                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Misc");
                        ImGui::SetCursorPos(ImVec2(0, 9));

                        bool last_change_hide = hide;
                        ImGui::BindBox("Hide in Task", &hide, "Enable the checkbox and assign a key to toggle Hide in Task", &keyhide);
                        if (hide != last_change_hide) {
                            last_change_hide = hide;
                        }

                        ImGui::BindBox("Alternate FOV", &onzoom, "Activate the script's FOV adjustment to 70 when you press the assigned hotkey", &keyzoom);
                        ImGui::SimpleCheckbox("Anti AFK", &afk, "Only enable this if you're AFK on servers that kick for inactivity (60s)");

                        ImGui::EndChild();
                    }

                    if (iTabs == 7)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub7");
                        ImGui::SubTab("Save", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();
                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Save");
                        ImGui::SetCursorPos(ImVec2(0, 9));

                        ImGui::SimpleCheckbox("Auto Save", &autosave, "Activate Auto Save (60s)");

                        if (ImGui::Button("Save Changes", frame_size)) {
                            updateSettingsFromVariables(settings);

                            settings.save();

                        }

                        if (ImGui::Button("Reset to Default", frame_size)) {
                            settings.reset();
                            updateVariablesFromSettings(settings);
                            bgthemes();
                        }

                        ImGui::EndChild();
                    }

                    if (iTabs == 8)
                    {
                        ImGui::SetCursorPos(ImVec2(110, 0));
                        ImGui::BeginChild("Sub8");
                        ImGui::SubTab("     Auto-Detection", &iSubTabs, 0);
                        move_window();
                        ImGui::EndChild();
                        ImGui::SetCursorPos(ImVec2(110, pos_offset));
                        ImGui::BeginChild("Auto-Detection");
                        ImGui::SetCursorPos(ImVec2(0, 9));



                        bool enabled = gDetectorEnabled.load();
                        if (licenseType == "PREMIUM")
                        {
                            if (ImGui::SimpleCheckbox("Weapon Auto-Detection", &enabled, "Enable automatic weapon detection"))
                            {
                                gDetectorEnabled.store(enabled);
                            }
                        }
                        else
                        {
                            ImGui::TextDisabled("Weapon Auto-Detection (Premium only)");
                        }

                        //ImGui::SimpleCheckbox("Scope Auto-Detection", &scopedetector,"Enable automatic scope detection");

                        ImGui::SliderFloat("Detection Accuracy", &accuracydetector, 0, 1, "%.2f", 1, "Confidence level (%)");

                        int interval = gDetectionInterval.load();
                        if (ImGui::SliderInt("Detection Interval",
                            &interval,
                            1, 30, "%d", 0,
                            "Seconds between detections (s)"))
                        {
                            gDetectionInterval.store(interval);
                        }

                        UpdateMonitorList();                     

                        int monitor = gMonitorIndex.load();
                        if (ImGui::Combo("Game Monitor",
                            &monitor,
                            gMonitorLabels.data(),
                            static_cast<int>(gMonitorLabels.size())))
                        {
                            gMonitorIndex.store(monitor);
                        }



                        ImGui::EndChild();
                    }

                    ImRect close_button_bb = ImRect(ImVec2(p.x + 717, p.y + 20), ImVec2(p.x + 717, p.y + 20) + ImVec2(10, 10));
                    ImRect mini_button_bb = ImRect(ImVec2(p.x + 685, p.y + 20), ImVec2(p.x + 685, p.y + 20) + ImVec2(10, 10));

                    ImGui::PushFont(icon_font2);
                    draw->AddText(center_text(close_button_bb.Min, close_button_bb.Max, "2"), ImGui::IsMouseHoveringRect(close_button_bb.Min, close_button_bb.Max, true) ? ImGui::GetColorU32(main_color) : ImGui::GetColorU32(text_color), "2");
                    draw->AddText(center_text(mini_button_bb.Min, mini_button_bb.Max, "1"), ImGui::IsMouseHoveringRect(mini_button_bb.Min, mini_button_bb.Max, true) ? ImGui::GetColorU32(main_color) : ImGui::GetColorU32(text_color), "1");
                    ImGui::PopFont();

                    if (ImGui::IsMouseHoveringRect(mini_button_bb.Min, mini_button_bb.Max, true) && ImGui::IsMouseClicked(ImGuiMouseButton_Left))
                    {
                        ShowWindow(hwnd, SW_MINIMIZE);
                    }

                    if (ImGui::IsMouseHoveringRect(close_button_bb.Min, close_button_bb.Max, true) && ImGui::IsMouseClicked(ImGuiMouseButton_Left))
                    {
                        exit(0);
                    }

                    static bool keyPreviouslyPressed = false;
                    static DWORD lastPressTime = 0;
                    const DWORD debounceTime = 200;

                    DWORD currentTime = GetTickCount64();

                    if ((GetAsyncKeyState(keyhide) & 0x8000) && hide) {
                        if (!keyPreviouslyPressed && (currentTime - lastPressTime > debounceTime)) {
                            if (windowVisible) {
                                ShowWindow(hwnd, SW_HIDE);
                                windowVisible = false;
                            }
                            else {
                                ShowWindow(hwnd, SW_SHOW);
                                windowVisible = true;
                            }
                            keyPreviouslyPressed = true;
                            lastPressTime = currentTime;
                        }
                    }
                    else {
                        keyPreviouslyPressed = false;
                    }

                }
            }
            move_window();
            ImGui::End();
        }

        g_pd3dDevice->Clear(0, NULL, D3DCLEAR_TARGET, D3DCOLOR_ARGB(255, 0, 0, 0), 0.0f, 0);

        if (g_pd3dDevice->BeginScene() >= 0)
        {
            ImGui::Render();
            ImGui_ImplDX9_RenderDrawData(ImGui::GetDrawData());
            g_pd3dDevice->EndScene();
        }

        g_pd3dDevice->Present(NULL, NULL, NULL, NULL);
    }



}

BOOL APIENTRY DllMain(HINSTANCE hInst, DWORD fdwReason, LPVOID lpReserved)
{
    switch (fdwReason)
    {
    case DLL_PROCESS_ATTACH:
        DisableBackgroundThrottling();
        DisableThreadLibraryCalls(hInst);
        CreateThread(nullptr, 0, (LPTHREAD_START_ROUTINE)MyThreadProc, nullptr, 0, nullptr);
        break;

    case DLL_PROCESS_DETACH:
        break;
    }
    return TRUE;
}