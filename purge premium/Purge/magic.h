#include <vector>
#include <string>
#include <map>
#include <mutex>
#include <array>
#include <atomic>


extern std::atomic<bool> runMagicThread;


extern std::array<int*, 16> weaponKeys;
extern std::array<int*, 5> scopeKeys;
extern std::array<int*, 2> modKeys;


void updateMod(int modIndex);
void updateScope(int scopeIndex);
void updateWeapon(int weaponIndex);
bool magic();


extern bool islost;
