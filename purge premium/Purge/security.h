#include <functional>
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>

extern bool autorizated;
extern int autenticado, autenticado2, simplerintegrity, crash, simpleCheck, startantifok, multifoka;

extern int crashf2, crashf3;

void timeCheckRoutine();
void dede();
void startantif();
void antifuck(const std::string& serial);
void crashier();
void multifucka();
void startexit01();
void startmagic();
void f2();
void f3();

////LOGIN////

extern const uint8_t KEY;
extern const char SECRET_KEY_XOR[];
extern const char XOR_GETAUTH_ALT[];
extern const char XOR_AUTH[];
extern const char XOR_SAVE[];
extern const char XOR_GETAUTH[];
extern const char XOR_01[];
extern const char XOR_02[];
extern const char XOR_03[];
extern const char XOR_04[];
extern const char XOR_A1[];
extern const char XOR_A2[];
extern const char XOR_A3[];
extern const char XOR_A4[];
extern const char XOR_A5[];

extern const char XOR_SERIAL[];
extern const char XOR_HWID[];
extern const char XOR_STATUS[];
extern const char XOR_MESSAGE[];
extern const char XOR_AUTHMSG[];
extern const char XOR_LICENSE_STATUS[];
extern const char XOR_HWID_STATUS[];
extern const char XOR_ERROR[];

void flowIntegrityAdd(int value);
void flowIntegrityCheck(int expected, const char* msg);
void ephemeralUseXor(const char* data, size_t length, uint8_t key, const std::function<void(const char*)>& f);
std::string ephemeralXorResult(const char* data, size_t length, uint8_t key);
bool ephemeralCompareXor(const std::string& text, const char* xorData, size_t xorLen, uint8_t key);
std::string ephemeralGetErrorString(const char* x);
std::string ephemeralGetSecretKey();
std::string sha256(const std::string& input);
std::string computeSignature(const std::string& bodyJson);
std::string ephemeralAnother(const char* x);
bool docheckandlogin(const std::string& s, const std::string& m, const std::string& l, const std::string& h, int& autenticado2, int& crash, int& simpleCheck, std::string& errorMessage, const nlohmann::json& responseJson);


////

