#include <thread>
#include <atomic>
#include <chrono>
#include <array>
#include <windows.h>
#include <iostream>
#include "magic.h"
#include "config.h"
#include "security.h"


bool startk = true;
float previousFov = 70;
constexpr int keyPressDelayMs = 100;

std::atomic<bool> isKeyCurrentlyDown{ false };
std::atomic<bool> isKeyCurrentlyDown2{ false };
std::atomic<bool> isKeyCurrentlyDown3{ false };
std::atomic<bool> isKeyCurrentlyDown4{ false };


bool handleKeyPress(int* key, std::atomic<bool>& isKeyDown, bool* toggleState) {
	bool keyPressed = GetAsyncKeyState(*key) & 0x8000;

	if (keyPressed && !isKeyDown.load()) {
		*toggleState = !(*toggleState);
		isKeyDown.store(true);
		std::this_thread::sleep_for(std::chrono::milliseconds(keyPressDelayMs));
	}
	else if (!keyPressed) {
		isKeyDown.store(false);
	}

	return isKeyDown.load();
}

template <size_t N>
void handleKeySelection(const std::array<int*, N>& keys, void (*updateFunction)(int), int& currentIndex) {
        for (size_t i = 0; i < keys.size(); ++i) {
                int vk = *keys[i];
                if (vk == 0)
                        continue;

                SHORT state = GetAsyncKeyState(vk);
                if (state & 0x1 || state & 0x8000) {
                        currentIndex = static_cast<int>(i);
                        updateFunction(currentIndex);
                        break;
                }
        }
}

void checkKeyTrigger(int* onmagx, int* keyonoffx, bool* afk, bool* onoffx, bool* hipx, int* keyhipx, int* keyzoomx, bool* onzoomx, bool* autosave,
	std::array<int*, 16>& weaponKeys, std::array<int*, 5>& scopeKeys, std::array<int*, 2>& modKeys) {

	auto lastMoveTime = std::chrono::steady_clock::now();

	while (true) {
		handleKeyPress(keyonoffx, isKeyCurrentlyDown, onoffx);
		handleKeyPress(keyhipx, isKeyCurrentlyDown2, hipx);
		handleKeyPress(onmagx, isKeyCurrentlyDown4, &emag);
		if (GetAsyncKeyState(*keyzoomx) & 0x8000) {
			if (fov != 70.0f) {
				previousFov = fov;
				fov = 70.0f;
			}
		}
		else {
			if (fov == 70.0f) {
				fov = previousFov;
			}
		}
		handleKeySelection(weaponKeys, updateWeapon, imwpc);
		handleKeySelection(scopeKeys, updateScope, imscc);
		handleKeySelection(modKeys, updateMod, immodsc);

		auto now = std::chrono::steady_clock::now();
		if (std::chrono::duration_cast<std::chrono::seconds>(now - lastMoveTime).count() >= 60) {

			if (*afk) {
				int randomX = -800 + rand() % 500; 
				int randomY = -800 + rand() % 500; 

				mouse_event(1, randomX, randomY, 0, 0);
			}

			if (*autosave) {
				
				updateSettingsFromVariables(GetGlobalSettings());
				GetGlobalSettings().save();
			
			}

			lastMoveTime = now;
		}

		std::this_thread::sleep_for(std::chrono::milliseconds(1));
	}
}

void startkeys() {
	if (startk) {
		startk = false;
		std::thread keyTriggerThread(checkKeyTrigger, &onmag, &keyonoff, &afk, &onoff, &hip, &keyhip, &keyzoom, &onzoom, &autosave, std::ref(weaponKeys), std::ref(scopeKeys), std::ref(modKeys));
		keyTriggerThread.detach();
	}
}

//