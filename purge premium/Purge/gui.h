#include "imgui.h"
#include "imgui_impl_win32.h"
#include "imgui_impl_dx9.h"

#include <d3d9.h>
#include <d3dx9.h>
#pragma comment (lib, "d3dx9.lib")

#include <tchar.h>
#include "Fonts.h"
#include "imgui_settings.h"
#define IMGUI_DEFINE_MATH_OPERATORS
#include <imgui_internal.h>
#include <map>
#include <string>
#include "image.h"

static int iTabs = 0;
static int iSubTabs = 0;



static LPDIRECT3D9              g_pD3D = NULL;
static LPDIRECT3DDEVICE9        g_pd3dDevice = NULL;
static D3DPRESENT_PARAMETERS    g_d3dpp = {};

bool CreateDeviceD3D(HWND hWnd);
void CleanupDeviceD3D();
void CreateRenderTarget();
void CleanupRenderTarget();
LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

static bool images_loaded = false;

static ImVec2 menu_size = ImVec2(755, 680);


static PDIRECT3DTEXTURE9  bg = nullptr;
static IDirect3DTexture9* model_img = nullptr;
static IDirect3DTexture9* skeleton_img = nullptr;
IDirect3DTexture9* Logotip = nullptr;



void Circle_background()
{
    ImVec2 screen_size = { (float)GetSystemMetrics(SM_CXSCREEN), (float)GetSystemMetrics(SM_CYSCREEN) };

    static ImVec2 partile_pos[100]; 
    static ImVec2 partile_target_pos[100];
    static float partile_speed[100]; 
    static float partile_size[100]; 
    static float partile_radius[100]; 
    static float partile_rotate[100]; 

    for (int i = 1; i < 100; i++)
    {
        if (partile_pos[i].x == 0 || partile_pos[i].y == 0)
        {
            partile_pos[i].x = rand() % (int)screen_size.x + 1;
            partile_pos[i].y = 1.f;
            partile_speed[i] = 0.5 + rand() % 10; 
            partile_size[i] = 1.5f + rand() % 2;

            partile_target_pos[i].x = rand() % (int)screen_size.x;
            partile_target_pos[i].y = screen_size.y * 2;
        }

        partile_pos[i] = ImLerp(partile_pos[i], partile_target_pos[i], ImGui::GetIO().DeltaTime * (partile_speed[i] / 250));
        partile_rotate[i] += ImGui::GetIO().DeltaTime;

        if (partile_pos[i].y > screen_size.y)
        {
            partile_pos[i].x = 0;
            partile_pos[i].y = 0;
            partile_rotate[i] = 0;
        }

        ImU32 particle_color = ImGui::GetColorU32(color_particle);

        particle_color = (particle_color & 0x00FFFFFF) | (static_cast<ImU32>(0.2f * 255) << 24);

        ImGui::GetWindowDrawList()->AddShadowCircle(partile_pos[i], partile_size[i], particle_color, 35, ImVec2(0, 0), 0, 30);

        ImGui::GetWindowDrawList()->AddCircleFilled(partile_pos[i], partile_size[i], particle_color, 30);
    }
}

HWND hwnd;
RECT rc;

namespace ImGui
{

    struct bindbox_cursor
    {
        ImVec2 cursor_pos;
    };

    void BindBox(const char* label, bool* v, const char* hint, int* key)
    {
        std::string key_label = "bind_";
        std::string keybid_label = key_label + label;

        const ImGuiID id = GetCurrentWindow()->GetID(keybid_label.c_str());

        static std::map<ImGuiID, bindbox_cursor> anim;
        auto it_anim = anim.find(id);

        if (it_anim == anim.end())
        {
            anim.insert({ id, bindbox_cursor() });
            it_anim = anim.find(id);
        }

        it_anim->second.cursor_pos = GetCursorPos();

        ImGui::SetCursorPos(it_anim->second.cursor_pos + ImVec2(470 + (frame_size.x - 605), 6));
        Keybind(keybid_label.c_str(), key);

        SetCursorPos(it_anim->second.cursor_pos);
        Checkbox(label, v, hint);
    }

    void SoloBindBox(const char* label, const char* hint, int* key)
    {
        std::string key_label = "bind_";
        std::string keybid_label = key_label + label;

        const ImGuiID id = GetCurrentWindow()->GetID(keybid_label.c_str());

        static std::map<ImGuiID, bindbox_cursor> anim;
        auto it_anim = anim.find(id);

        if (it_anim == anim.end())
        {
            anim.insert({ id, bindbox_cursor() });
            it_anim = anim.find(id);
        }

        it_anim->second.cursor_pos = GetCursorPos();

        ImGui::SetCursorPos(it_anim->second.cursor_pos + ImVec2(470 + (frame_size.x - 558), 6));
        Keybind(keybid_label.c_str(), key);

        SetCursorPos(it_anim->second.cursor_pos);
        SoloKeybinBox(label, hint);
    }

    void SoloBoolBindBox(const char* label, const char* hint, bool* key)
    {
        std::string key_label = "bind_";
        std::string keybid_label = key_label + label;

        const ImGuiID id = GetCurrentWindow()->GetID(keybid_label.c_str());

        static std::map<ImGuiID, bindbox_cursor> anim;
        auto it_anim = anim.find(id);

        if (it_anim == anim.end())
        {
            anim.insert({ id, bindbox_cursor() });
            it_anim = anim.find(id);
        }

        it_anim->second.cursor_pos = GetCursorPos();

        ImGui::SetCursorPos(it_anim->second.cursor_pos + ImVec2(470 + (frame_size.x - 558), 6));

        SetCursorPos(it_anim->second.cursor_pos);
        SoloKeybinBox(label, hint);
    }



    void ColorBox(const char* label, bool* v, const char* hint, float col[4])
    {
        std::string col_label = "color_picker_";
        std::string color_label = col_label + label;

        const ImGuiID id = GetCurrentWindow()->GetID(color_label.c_str());
        static std::map<ImGuiID, bindbox_cursor> anim;
        auto it_anim = anim.find(id);

        if (it_anim == anim.end())
        {
            anim.insert({ id, bindbox_cursor() });
            it_anim = anim.find(id);
        }

        it_anim->second.cursor_pos = GetCursorPos();

        ImGui::SetCursorPos(it_anim->second.cursor_pos + ImVec2(510 + (frame_size.x - 605), 18));
        ColorEdit4(color_label.c_str(), (float*)col, ImGuiColorEditFlags_NoSidePreview | ImGuiColorEditFlags_PickerHueBar | ImGuiColorEditFlags_NoOptions | ImGuiColorEditFlags_NoInputs);
        ImGui::SetCursorPos(it_anim->second.cursor_pos);
        Checkbox(label, v, hint);
    }
}

bool CreateDeviceD3D(HWND hWnd)
{
    if ((g_pD3D = Direct3DCreate9(D3D_SDK_VERSION)) == NULL)
        return false;

    // Create the D3DDevice
    ZeroMemory(&g_d3dpp, sizeof(g_d3dpp));
    g_d3dpp.Windowed = TRUE;
    g_d3dpp.SwapEffect = D3DSWAPEFFECT_DISCARD;
    g_d3dpp.BackBufferFormat = D3DFMT_UNKNOWN; // Need to use an explicit format with alpha if needing per-pixel alpha composition.
    g_d3dpp.EnableAutoDepthStencil = TRUE;
    g_d3dpp.AutoDepthStencilFormat = D3DFMT_D16;
    g_d3dpp.PresentationInterval = D3DPRESENT_INTERVAL_ONE;           // Present with vsync
    //g_d3dpp.PresentationInterval = D3DPRESENT_INTERVAL_IMMEDIATE;   // Present without vsync, maximum unthrottled framerate
    if (g_pD3D->CreateDevice(D3DADAPTER_DEFAULT, D3DDEVTYPE_HAL, hWnd, D3DCREATE_HARDWARE_VERTEXPROCESSING, &g_d3dpp, &g_pd3dDevice) < 0)
        return false;

    return true;
}

void CleanupDeviceD3D()
{
    if (g_pd3dDevice) { g_pd3dDevice->Release(); g_pd3dDevice = NULL; }
    if (g_pD3D) { g_pD3D->Release(); g_pD3D = NULL; }
}

void ResetDevice()
{
    ImGui_ImplDX9_InvalidateDeviceObjects();
    HRESULT hr = g_pd3dDevice->Reset(&g_d3dpp);
    if (hr == D3DERR_INVALIDCALL)
        IM_ASSERT(0);
    ImGui_ImplDX9_CreateDeviceObjects();
}

void move_window() {
    ImGui::SetCursorPos(ImVec2(0, 0));
    if (ImGui::InvisibleButton("Move_detector", ImVec2(menu_size.x, menu_size.y)));
    if (ImGui::IsItemActive()) {

        GetWindowRect(hwnd, &rc);
        MoveWindow(hwnd, rc.left + ImGui::GetMouseDragDelta().x, rc.top + ImGui::GetMouseDragDelta().y, menu_size.x, menu_size.y, TRUE);
    }
}

extern IMGUI_IMPL_API LRESULT ImGui_ImplWin32_WndProcHandler(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam);

LRESULT WINAPI WndProc(HWND hWnd, UINT msg, WPARAM wParam, LPARAM lParam)
{
    if (ImGui_ImplWin32_WndProcHandler(hWnd, msg, wParam, lParam))
        return true;

    switch (msg)
    {
    case WM_SIZE:
        if (g_pd3dDevice != NULL && wParam != SIZE_MINIMIZED)
        {
            g_d3dpp.BackBufferWidth = LOWORD(lParam);
            g_d3dpp.BackBufferHeight = HIWORD(lParam);
            ResetDevice();
        }
        return 0;
    case WM_SYSCOMMAND:
        if ((wParam & 0xfff0) == SC_KEYMENU)
            return 0;

        else if ((wParam & 0xfff0) == SC_RESTORE)
        {
            if (g_pd3dDevice != NULL)
            {
                ImGui_ImplDX9_InvalidateDeviceObjects();
                HRESULT result = g_pd3dDevice->Reset(&g_d3dpp);
                if (SUCCEEDED(result))
                {
                    ImGui_ImplDX9_CreateDeviceObjects();
                }
            }
        }
        break;
    case WM_DESTROY:
        ::PostQuitMessage(0);
        ExitProcess(0);
        return 0;
    }

    return ::DefWindowProc(hWnd, msg, wParam, lParam);
}