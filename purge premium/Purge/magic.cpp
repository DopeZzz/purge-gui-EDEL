#include <iostream>
#include <Windows.h>
#include <random>
#include <thread>
#include "magic.h"
#include <mmsystem.h>
#include "config.h"
#include "security.h"
#include <string>
#include <map>
#include <vector>
#include <atomic>
#include "ur_fast.h"
          
#pragma comment(lib, "winmm.lib")
std::array<int*, 16> weaponKeys = { &onak, &onlr, &onmp5, &onsmg, &ont, &onm2, &onhm, &onse, &onp2, &onpy, &onm9, &onre, &onm39, &onhc, &ont1s, &onsks };
std::array<int*, 5> scopeKeys = { &on8, &on16, &onholo, &onhandmade, &offscope };
std::array<int*, 2> modKeys = { &onmuz, &offbarrel };

const double MAX_SPEED = 5.5;
double currentSpeed = 0.0, movementPenalty = 0.1;
std::chrono::steady_clock::time_point movementStartTime;

//Magic things
std::atomic<bool> runMagicThread(true);
double adsensTemp = 1.0;
LONGLONG atime, itime, mtime;

//Key simplify

bool IsCrouching() {
	return GetAsyncKeyState(keycrouch) & 0x8000;
}
bool IsAiming() {
	return GetAsyncKeyState(keyaim) & 0x8000;
}
bool IsShooting() {
	return GetAsyncKeyState(VK_LBUTTON) & 0x8000;
}
bool IsMoving() {
	return (GetAsyncKeyState('W') & 0x8000) || (GetAsyncKeyState('A') & 0x8000) || (GetAsyncKeyState('S') & 0x8000) || (GetAsyncKeyState('D') & 0x8000);
}

//

enum class WeaponType {
	AK, LR, MP5, SMG, THOMPSON, M2, HMLG, SEMI, P2, PYTHON, M92, REVO, M39, HCREVO, T1S, SKS, NONE
};

enum class ScopeType {
	SCOPE_8X, SCOPE_16X, HOLO, HANDMADE, NONE
};

enum class ModType {
	MUZZLE, NONE
};

struct point {
	double x;
	double y;
};

struct WeaponData {
	std::string name;
	std::vector<point> pattern;
	double mValue;
	double* fValue;
	double time;
};


struct ScopeData {
	double baseValue;
	std::map<WeaponType, double> adjustments;
};

struct ModData {
	double multiplier;
};

WeaponType currentWeapon = WeaponType::AK;
ScopeType currentScope = ScopeType::NONE;
ModType currentMod = ModType::NONE;



std::map<WeaponType, WeaponData> weaponDataMap = {
	{WeaponType::AK, {"AK", {{0, -2.25}, {0.3271462, -2.25}, {0.6086477, -2.25}, {0.8468592, -2.25}, {1.0441349, -2.25}, {1.2028298, -2.25}, {1.3252983, -2.25}, {1.4138949, -2.25}, {1.4709743, -2.25}, {1.4988912, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}, {1.5, -2.25}},-0.0292, &fak, 133.3333}}, 
	{WeaponType::LR, {"LR", {{0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}, {0, -1.875}},-0.029, &flr, 120}},
	{WeaponType::MP5, {"MP5", {{0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}, {0, -1}},-0.029, &fmp5, 100}},
	{WeaponType::SMG, {"SMG", {{-0.114414,-0.680635},{0.008685,-0.676597},{0.010312,-0.682837},{0.064825,-0.691344},{0.104075,-0.655617},{-0.088118,-0.660429},{0.089906,-0.675183},{0.037071,-0.632623},{0.178466,-0.634737},{0.034653,-0.669444},{-0.082658,-0.664827},{0.025551,-0.636631},{0.082413,-0.647118},{-0.123305,-0.662104},{0.028164,-0.662354},{-0.117345,-0.693474},{-0.268777,-0.661122},{-0.053086,-0.677493},{0.004238,-0.647037},{0.014169,-0.551440},{-0.009907,-0.552079},{0.044076,-0.577694},{-0.043187,-0.549581}, {-0.114414,-0.680635},{0.008685,-0.676597},{0.010312,-0.682837},{0.064825,-0.691344},{0.104075,-0.655617},{-0.088118,-0.660429},{0.089906,-0.675183},{0.037071,-0.632623},{0.178466,-0.634737},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444},{0.034653,-0.669444}},-0.029, &fsmg, 90}},
	{WeaponType::THOMPSON, {"THOMPSON", {{-0.114413,-0.680635},{0.008686,-0.676598},{0.010312,-0.682837},{0.064825,-0.691345},{0.104075,-0.655618},{-0.088118,-0.660429},{0.089906,-0.675183},{0.037071,-0.632623},{0.178465,-0.634737},{0.034654,-0.669443},{-0.082658,-0.664826},{0.025550,-0.636631},{0.082414,-0.647118},{-0.123305,-0.662104},{0.028164,-0.662354},{-0.117346,-0.693475},{-0.268777,-0.661123},{-0.053086,-0.677493},{0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}, {0.04238,-0.647038}},-0.029, &ft, 113}},
	{WeaponType::M2, {"M2", {{0, -1.49}, {0.39375, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.720, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900},{0.0, -1.4900}, {0.0, -1.4900},{0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900},{0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}, {0.0, -1.4900}},-0.0293, &fm2, 100}},
	{WeaponType::HMLG, {"HMLG", {{0, -1.4}, {-0.39, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}, {-0.73, -1.4}},-0.029, &fmlg, 100}},
	{WeaponType::T1S, {"T1S", {{0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}, {0, -0.71590906}},-0.029, &ft1s, 110}},
	{WeaponType::SEMI, {"SEMI", {{0, -1.48769}},-0.029, &fsemi, 30}}, 
	{WeaponType::P2, {"P2", {{0, -0.9396000000000000462740956}},-0.029, &fp2, 30}}, 
	{WeaponType::PYTHON, {"PYTHON", {{0, -5.638}},-0.029, &fpython, 120}}, 
	{WeaponType::M92, {"M92", {{0, -2.98}},-0.029, &fm92, 30}}, 
	{WeaponType::REVO, {"REVO", {{0, -1.8}},-0.029, &frevo, 30}}, 
	{WeaponType::M39, {"M39", {{0.902464, -1.533322}},-0.029, &fm39, 30}}, 
	{WeaponType::HCREVO, {"HCREVO", {{0, -5.638}},-0.029, &fhcrevo, 120}},
	{WeaponType::SKS, {"SKS", {{0, -1.9}},-0.029, &fsks, 30}},
	{WeaponType::NONE, {"NONE", {}, 0.0, &fnone, 0.0}},
};

std::map<ScopeType, ScopeData> scopeDataMap = {
	{ScopeType::SCOPE_8X, {7.2, {
		{WeaponType::LR, -0.2},
		{WeaponType::M2, -0.2},
		{WeaponType::HMLG, -0.26},
		{WeaponType::THOMPSON, +0.8},
		{WeaponType::SMG, +1.2},
		{WeaponType::PYTHON, +2.28},
		{WeaponType::P2, +3.0},
		{WeaponType::M92, +3.4},
		{WeaponType::SEMI, +0.2},
		{WeaponType::M39, +2.4},
		{WeaponType::HCREVO, +2.28},
		{WeaponType::T1S, +1.6},
		{WeaponType::SKS, -0.4},
	}}},
	{ScopeType::SCOPE_16X, {3.6, {
		{WeaponType::SMG, +0.67},
		{WeaponType::T1S, +0.8},
		{WeaponType::THOMPSON, +0.5},
		{WeaponType::M2, -0.1},
		{WeaponType::SEMI, -0.1},
		{WeaponType::P2, +1.55},
		{WeaponType::PYTHON, +1.3},
		{WeaponType::M92, +1.7},
		{WeaponType::M39, +1.1},
		{WeaponType::HCREVO, +1.2},
	}}},
	{ScopeType::HOLO, {1.2, {
		{WeaponType::THOMPSON, +0.3},
		{WeaponType::SMG, +0.3},
		{WeaponType::PYTHON, +0.39},
		{WeaponType::P2, +0.24},
		{WeaponType::M92, +0.55},
		{WeaponType::M39, +0.37},
		{WeaponType::HCREVO, +0.39},
		{WeaponType::T1S, +0.3},
		{WeaponType::M2, -0.09},
		{WeaponType::SKS, -0.07},
	}}},
	{ScopeType::HANDMADE, {0.8, {
		{WeaponType::THOMPSON, +0.1},
		{WeaponType::SMG, +0.1},
		{WeaponType::SEMI, +0.05},
		{WeaponType::PYTHON, +0.0968},
		{WeaponType::P2, +0.2},
		{WeaponType::M92, +0.17},
		{WeaponType::M39, +0.069},
		{WeaponType::HCREVO, +0.0968},
		{WeaponType::T1S, +0.07},
		{WeaponType::M2, -0.09},
		
	}}},
	{ScopeType::NONE, {1.0, {}}}
};

std::map<ModType, ModData> modDataMap = {
	{ModType::MUZZLE, {1.12}},
	{ModType::NONE, {1.0}}
};

//Penalty

double GetMultiplier() {
	if (!IsCrouching() &&
		(currentWeapon == WeaponType::P2 ||
			currentWeapon == WeaponType::PYTHON ||
			currentWeapon == WeaponType::SEMI ||
			currentWeapon == WeaponType::M92 ||
			currentWeapon == WeaponType::REVO ||
			currentWeapon == WeaponType::M39 ||
			currentWeapon == WeaponType::HCREVO ||
			currentWeapon == WeaponType::SKS)) {
		return 1.0;
	}
	return IsCrouching() ? 2.0 : 1.019243; //1.019243
}

double GetHip() {
	if (!hip || IsAiming()) {
		adsensTemp = adsens;
		return 1.0;
	}
	else {
		adsensTemp = 1.0;

		switch (currentWeapon) {
		case WeaponType::AK:
			return 0.81;
		case WeaponType::LR:
			return 0.81;
		case WeaponType::MP5:
			return 1.2;
		case WeaponType::SMG:
			return 1.5;
		case WeaponType::THOMPSON:
			return 1.4;
		case WeaponType::M2:
			return 1.165;
		case WeaponType::HMLG:
			return 1.19;
		case WeaponType::SEMI:
			return 1.027;
		case WeaponType::PYTHON:
			return 1.5861;
		case WeaponType::P2:
			return 1.5;
		case WeaponType::M92:
			return 1.46;
		case WeaponType::REVO:
			return 1.46;
		case WeaponType::M39:
			return 1.37;
		case WeaponType::HCREVO:
			return 1.5861;
		case WeaponType::T1S:
			return 1.5;
		case WeaponType::SKS:
			return 0.99;
		default:
			return 1.0;
		}
	}
}

void UpdateSpeed() {
	auto now = std::chrono::steady_clock::now();
	double deltaTime = std::chrono::duration<double>(now - movementStartTime).count();
	currentSpeed = std::min<double>(MAX_SPEED, MAX_SPEED * deltaTime);
}

double getMovementPenalty() {
	double speedPercentage = currentSpeed / MAX_SPEED;
	return 1.0 + speedPercentage * movementPenalty;
}

double penal = 0;

double GetMovementMultiplier() {
	double penalty = getMovementPenalty();

	if (IsMoving()) {
		if (currentSpeed == 0.0) {
			movementStartTime = std::chrono::steady_clock::now();
		}
		UpdateSpeed();

		penalty = getMovementPenalty();

		if (!IsCrouching()) {
			if (currentWeapon == WeaponType::HMLG || currentWeapon == WeaponType::M2) {
				penalty *= 1.9;
			}
			if (currentWeapon == WeaponType::THOMPSON) {
				penalty *= 1.06;
			}
			else {
				penalty *= 1.0865;
			}
		}
		else {
			if (currentWeapon == WeaponType::HMLG) {
				penalty *= 1.529;
			}
			if (currentWeapon == WeaponType::M2) {
				penalty *= 1.5;
			}
		}
	}
	else {
		currentSpeed = 0.0;
	}

	return penalty;
}

void SleepTime(int wt) {
	if (lowcpu) {

		HANDLE hTimer = CreateWaitableTimer(nullptr, TRUE, nullptr);
		if (!hTimer) return;

		LARGE_INTEGER li = { 0 };
		li.QuadPart = -(static_cast<LONGLONG>(wt) * 9900LL); //9900LL

		SetWaitableTimer(hTimer, &li, 0, nullptr, nullptr, FALSE);
		WaitForSingleObject(hTimer, INFINITE);

		CloseHandle(hTimer);

	}
	else {

		QueryPerformanceFrequency((LARGE_INTEGER*)&atime);
		atime /= 1000;
		QueryPerformanceCounter((LARGE_INTEGER*)&mtime);
		itime = mtime / atime + wt;
		mtime = 0;
		while (mtime < itime)
		{
			QueryPerformanceCounter((LARGE_INTEGER*)&mtime);
			mtime /= atime;
		}
	}
}
void SlowRec(double wt, double ct, int x1, int y1)
{
	static URClient ur;
	static bool ready = false;

	auto tryConnect = [&]() -> bool {
		ur.disconnect();
		ready = ur.connect() && ur.hello();
		return ready;
		};

	if (!ready && !tryConnect()) return;

	auto sendMove = [&](int dx, int dy)
		{
			if (!ready) return;
			if (!ur.move(dx, dy))
			{
				if (tryConnect())
					ur.move(dx, dy);
			}
		};

	if (lowcpu)
	{
		int actualSteps = steps1;
		if (steps1 > static_cast<int>(ct)) actualSteps = static_cast<int>(ct);
		if (actualSteps < 1) actualSteps = 1;

		int x_ = 0, y_ = 0, t_ = 0;
		for (int i = 1; i <= actualSteps; ++i)
		{
			int xI = i * x1 / actualSteps;
			int yI = i * y1 / actualSteps;
			int tI = i * static_cast<int>(ct) / actualSteps;

			sendMove(xI - x_, yI - y_);

			SleepTime(tI - t_);
			x_ = xI;  y_ = yI;  t_ = tI;
		}
		SleepTime(static_cast<int>(wt) - static_cast<int>(ct));
	}
	else
	{
		int x_ = 0, y_ = 0, t_ = 0;
		for (int i = 1; i <= static_cast<int>(ct); ++i)
		{
			int xI = i * x1 / static_cast<int>(ct);
			int yI = i * y1 / static_cast<int>(ct);
			int tI = i * static_cast<int>(ct) / static_cast<int>(ct);

			sendMove(xI - x_, yI - y_);

			SleepTime(static_cast<int>(tI) - static_cast<int>(t_));
			x_ = xI;  y_ = yI;  t_ = tI;
		}
		SleepTime(static_cast<int>(wt) - static_cast<int>(ct));
	}
}

int checkboost(double Delay) {
	return (int)Delay;
}

double bdata() {
	return modDataMap[currentMod].multiplier;
}

double scdata() {
	double resultado = 1.0;
	if (currentScope != ScopeType::NONE && (!hip || (hip && IsAiming()))) {
		auto scopeIt = scopeDataMap.find(currentScope);
		if (scopeIt != scopeDataMap.end()) {
			resultado = scopeIt->second.baseValue;
			auto adjIt = scopeIt->second.adjustments.find(currentWeapon);
			if (adjIt != scopeIt->second.adjustments.end()) {
				resultado += adjIt->second;
			}
		}
	}
	return resultado;
}

namespace mathwp {
	double calculate(double value, double multiplier, double customMult) {
		double penalty = GetMovementMultiplier();
		return value * scdata() * bdata() * GetHip() * penalty  / ((customMult * ((insens * multiplier) * adsensTemp) * 3.0) * (fov / 100.0));
	}

	double computeCoordinate(int kzzz, char coord) {
		double multiplier = GetMultiplier();

		auto it = weaponDataMap.find(currentWeapon);
		if (it == weaponDataMap.end()) {
			return 0.0;
		}

		const WeaponData& weapon = it->second;

		double multValue = weapon.mValue - (100.0 - *(weapon.fValue)) * 0.001;

		double patternValue = (coord == 'x') ? weapon.pattern[kzzz].x : weapon.pattern[kzzz].y;
		double baseValue = calculate(patternValue, multiplier, multValue);

		double rndFactor = rndslider / 100.0;
		double maxOffset = std::abs(baseValue) * 4; //0.6 probar

		static std::mt19937 gen(std::random_device{}());
		static std::uniform_real_distribution<> dis(-1.0, 1.0);

		double randValue = dis(gen);
		double randomOffset = rndFactor * randValue * maxOffset;

		static double previousOffsetX = 0.0;
		static double previousOffsetY = 0.0;
		double& previousOffset = (coord == 'x') ? previousOffsetX : previousOffsetY;

		constexpr double smoothingFactor = 0.1;
		double smoothOffset = previousOffset * (1.0 - smoothingFactor) + randomOffset * smoothingFactor;
		previousOffset = smoothOffset;

		return baseValue + smoothOffset;
	}


	double x(int kzzz) {
		return computeCoordinate(kzzz, 'x');
	}

	double y(int kzzz) {
		return computeCoordinate(kzzz, 'y');
	}

	double delay() {
		auto it = weaponDataMap.find(currentWeapon);
		if (it != weaponDataMap.end()) {
			return it->second.time;
		}
		return 0.0;
	}

	//AJUSTAR ESTO
	int bcheck() {
		auto it = weaponDataMap.find(currentWeapon);
		if (it != weaponDataMap.end()) {
			int sz = static_cast<int>(it->second.pattern.size());
			if (!emag) {
				if (currentWeapon == WeaponType::AK || currentWeapon == WeaponType::LR || currentWeapon == WeaponType::MP5) {
					sz = 30;
				}
				else if (currentWeapon == WeaponType::THOMPSON || currentWeapon == WeaponType::T1S) {
					sz = 22;
				}
				else if (currentWeapon == WeaponType::SMG) {
					sz = 33;
				}
			}
			// No forzar un tamaño mínimo de 3
			return sz;
		}
		return 0;
	}

	bool wpcheck() {
		return currentWeapon != WeaponType::NONE;
	}
}
bool islost = false;
bool magic()
{
	while (runMagicThread)
	{
		if (mathwp::wpcheck() && onoff)
		{
			if (IsShooting() && (hip || IsAiming()))
			{
				int bursts = mathwp::bcheck();
				for (int i = 0; i < bursts; ++i)
				{
					if (!IsShooting() || !(hip || IsAiming()))
						break;

					double delay = mathwp::delay();

					SlowRec(delay,               // wt
						delay,               // ct
						static_cast<int>(mathwp::x(i)),
						static_cast<int>(mathwp::y(i)));
				}

				while (IsShooting() && (hip || IsAiming()))
					::Sleep(10);
			}
		}
		::Sleep(1);
	}
	return false;
}


// Weapon/mods mode

void updateMod(int modIndex) {
	ModType mods[] = { ModType::MUZZLE, ModType::NONE };
	currentMod = mods[modIndex];

}

void updateScope(int scopeIndex) {
	ScopeType scopes[] = { ScopeType::SCOPE_8X, ScopeType::SCOPE_16X, ScopeType::HOLO, ScopeType::HANDMADE, ScopeType::NONE };
	currentScope = scopes[scopeIndex];

}

void updateWeapon(int weaponIndex) {
	WeaponType weapons[] = { WeaponType::AK, WeaponType::LR, WeaponType::MP5, WeaponType::SMG, WeaponType::THOMPSON, WeaponType::M2, WeaponType::HMLG,
							 WeaponType::SEMI, WeaponType::P2, WeaponType::PYTHON, WeaponType::M92, WeaponType::REVO, WeaponType::M39, WeaponType::HCREVO, WeaponType::T1S, WeaponType::SKS, WeaponType::NONE };
	currentWeapon = weapons[weaponIndex];
}

//