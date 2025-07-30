#pragma once

#define IMGUI_DEFINE_MATH_OPERATORS
#include "imgui_internal.h"

inline ImVec4 main_color(0.4f, 0.8f, 1.0f, 1.0f);
inline ImVec4 color_particle(0.4f, 0.8f, 1.0f, 1.0f);

inline ImVec4 text_color(1.f, 1.f, 1.f, 1.f);


inline ImColor background_color(24, 24, 24, 255);

inline ImVec4 second_color(0.09f, 0.09f, 0.09f, 1.f);

inline ImVec2 center_text(ImVec2 min, ImVec2 max, const char* text)
{
    return min + (max - min) / 2 - ImGui::CalcTextSize(text) / 2;
}

inline ImColor GetColorWithAlpha(ImColor color, float alpha)
{
    return ImColor(color.Value.x, color.Value.y, color.Value.z, alpha);
}


inline ImVec2 frame_size = ImVec2(605, 65);

inline float anim_speed = 8.f;

inline bool draw_grind;

inline float pos_offset;
inline bool size_change;

inline ImFont* icon_font;
inline ImFont* tab_font;
inline ImFont* hint_font;
inline ImFont* second_font;

inline ImFont* icon_font2;
