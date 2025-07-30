#pragma once

#include <vector>
#include <string>
#include <dxgi1_2.h>
#include <windows.h>    // para UINT, WideCharToMultiByte
#include <atlbase.h>    // para CComPtr<>

struct MonitorInfo {
    std::string label;
    UINT        width;
    UINT        height;
};

// Sólo DECLARO aquí:
extern std::vector<MonitorInfo>  gMonitors;
extern std::vector<const char*>  gMonitorLabels;

void UpdateMonitorList();



void StartDetector();
void StopDetector();

