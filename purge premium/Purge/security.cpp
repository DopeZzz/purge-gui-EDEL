#include <iostream>
#include <string>
#include <thread> 
#include <chrono>
#include <cstdlib>
#include <memory>           
#include <cstring>          
#include <sstream>
#include <iomanip>
#include <algorithm>
#if defined(_WIN32) || defined(_WIN64)
#include <windows.h>
#include "login.h"
#else
#include <sys/ptrace.h>
#endif
#include "magic.h"
#include "security.h"
#include "config.h"
#include <cpr/cpr.h>
#include <nlohmann/json.hpp>

bool autorizated = false, firstTime = true, isreal = false, startmagicvar = true, startantifuck = true, firstmultfucker = true, firstcrashier = true, exit01 = false, firstf2 = true, firstf3 = true;
int simplerintegrity = 0, autenticado = 1, autenticado2 = 1, multifoka = 1, crash = 1, startantifok = 12, simpleCheck = 3, g_flowIntegrity = 0, crashf2 = 0, crashf3 = 0;
volatile bool exit02, exit03 = false;
static int dummyLocalScore = 0, gScore = 0;
static unsigned char gChecks[6];

void flowIntegrityAdd(int value) {
	g_flowIntegrity += value;
}

void flowIntegrityCheck(int expected, const char* msg) {
	//std::cerr << g_flowIntegrity << " [FLOW-INTEGRITY] " << msg << " - Valor inesperado, posible salto/parche.\n";
	if (expected != 0 && (g_flowIntegrity % expected == 0)) {
		crashf3 = 21;
		autorizated = true;

	}
	//std::cerr << g_flowIntegrity << " [FLOW-INTEGRITY] " << msg << " - Valor inesperado, posible salto/parche.\n";

	//ExitProcess(0);

}

constexpr uint8_t KEY = 0xA7;

const char SECRET_KEY_XOR[] = "\xC1\x94\x93\x94\xC1\x93\x94\xC0\xCD\xCC\x91\x90\x90\xCC\x91\x90\xCC\x91\xCF\xCF\xCF\x90\xCB\x9F\xCB\x9F\x90\xCB\x9F\x90\x92\x91\xCF\xCF\x92\x91\x91\xCF\xC0\xD1\x93";

const char XOR_AUTH[] = "\xCF\xD3\xD3\xD7\xD4\x9D\x88\x88\xC0\xCE\xC0\xC6\xCA\xC6\xC4\x89\xD7\xD5\xC8\x88\xC8\xC8\x88\xC6"; // "https://gigamac.pro/oo/a"
const char XOR_GETAUTH[] = "\xCF\xD3\xD3\xD7\xD4\x9D\x88\x88\xC0\xCE\xC0\xC6\xCA\xC6\xC4\x89\xD7\xD5\xC8\x88\xC8\xC8\x88\xC0\xC6"; // "https://gigamac.pro/oo/ga"
const char XOR_GETAUTH_ALT[] = "\xCF\xD3\xD3\xD7\xD4\x9D\x88\x88\xD4\xD2\xCB\xC2\xC6\xD0\xC2\xC6\x89\xDF\xDE\xDD\x88\xC8\xC8\x88\xC0\xC6"; // "https://suleawea.xyz/oo/ga"


const char XOR_01[] = "\xE2\xD5\xD5\xC8\xD5\x87\xC0\xC2\xD3\xD3\xCE\xC9\xC0\x87\xE6\xD2\xD3\xCF";
const char XOR_02[] = "\xF2\xC9\xC2\xDF\xD7\xC2\xC4\xD3\xC2\xC3\x87\xE6\xD2\xD3\xCF\x87\xC2\xD5\xD5\xC8\xD5";
const char XOR_03[] = "\xE2\xD5\xD5\xC8\xD5\x87\xD7\xCF\xC6\xD5\xD4\xCE\xC9\xC0\x87\xCD\xD4\xC8\xC9";
const char XOR_04[] = "\xE1\xC6\xD3\xC6\xCB\x87\xC2\xD5\xD5\xC8\xD5";
const char XOR_A1[] = "\xE8\xEC";
const char XOR_A2[] = "\xEB\xE8\xE0\xEE\xE9\xF8\xE0\xE8\xE8\xE3";
const char XOR_A3[] = "\xF1\xE6\xEB\xEE\xE3";
const char XOR_A4[] = "\xEA\xE6\xF3\xE4\xEF";
const char XOR_A5[] = "\xEF\xF0\xEE\xE3\xF8\xF5\xE2\xE0\xEE\xF4\xF3\xE2\xF5\xE2\xE3";

const char XOR_SERIAL[] = "\xD4\xC2\xD5\xCE\xC6\xCB";
const char XOR_HWID[] = "\xCF\xD0\xCE\xC3";
const char XOR_STATUS[] = "\xD4\xD3\xC6\xD3\xD2\xD4";
const char XOR_MESSAGE[] = "\xCA\xC2\xD4\xD4\xC6\xC0\xC2";
const char XOR_AUTHMSG[] = "\xC6\xD2\xD3\xCF";
const char XOR_LICENSE_STATUS[] = "\xCB\xCE\xC4\xC2\xC9\xD4\xC2\xF4\xD3\xC6\xD3\xD2\xD4";
const char XOR_HWID_STATUS[] = "\xCF\xD0\xCE\xC3\xF4\xD3\xC6\xD3\xD2\xD4";
const char XOR_ERROR[] = "\xC2\xD5\xD5\xC8\xD5";

void ephemeralUseXor(const char* data, size_t length, uint8_t key, const std::function<void(const char*)>& f) {
	std::unique_ptr<char[]> tmp(new char[length + 1]);
	for (size_t i = 0; i < length; i++) tmp[i] = data[i] ^ key;
	tmp[length] = '\0';
	f(tmp.get());
	SecureZeroMemory(tmp.get(), length + 1);
}

std::string ephemeralXorResult(const char* data, size_t length, uint8_t key) {
	std::string r;
	ephemeralUseXor(data, length, key, [&](const char* d) { r.assign(d); });
	return r;
}

bool ephemeralCompareXor(const std::string& text, const char* xorData, size_t xorLen, uint8_t key) {
	bool eq = false;
	ephemeralUseXor(xorData, xorLen, key, [&](const char* dec) { eq = (text == dec); });
	return eq;
}

std::string ephemeralGetErrorString(const char* x) {
	return ephemeralXorResult(x, std::strlen(x), KEY);
}

std::string ephemeralAnother(const char* x) {
	return ephemeralXorResult(x, std::strlen(x), KEY);
}

std::string ephemeralGetSecretKey() {
	return ephemeralXorResult(SECRET_KEY_XOR, sizeof(SECRET_KEY_XOR) - 1, KEY);
}

std::string sha256(const std::string& input) {
	static const size_t B = 64;
	static const unsigned int K[64] = {
		0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,
		0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,
		0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,
		0x0FC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,
		0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,
		0x06CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,
		0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,
		0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,
		0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,
		0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,
		0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2
	};
	auto r = [](unsigned int v, unsigned int c) { return (v >> c) | (v << (32 - c)); };
	unsigned int H[8] = { 0x6A09E667,0xBB67AE85,0x3C6EF372,0xA54FF53A,0x510E527F,0x9B05688C,0x1F83D9AB,0x5BE0CD19 };
	size_t ilen = input.size();
	size_t bitLen = ilen * 8;
	std::string p = input + char(0x80);
	while ((p.size() % B) != 56) p.push_back(char(0));
	for (int i = 7; i >= 0; i--) p.push_back(char((bitLen >> (i * 8)) & 0xFF));
	for (size_t off = 0; off < p.size(); off += B) {
		unsigned int w[64];
		for (int i = 0; i < 16; i++) {
			size_t idx = off + i * 4;
			w[i] = (unsigned char)(p[idx]) << 24 | (unsigned char)(p[idx + 1]) << 16 | (unsigned char)(p[idx + 2]) << 8 | (unsigned char)(p[idx + 3]);
		}
		for (int i = 16; i < 64; i++) {
			unsigned int s0 = r(w[i - 15], 7) ^ r(w[i - 15], 18) ^ (w[i - 15] >> 3);
			unsigned int s1 = r(w[i - 2], 17) ^ r(w[i - 2], 19) ^ (w[i - 2] >> 10);
			w[i] = w[i - 16] + s0 + w[i - 7] + s1;
		}
		unsigned int a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
		for (int i = 0; i < 64; i++) {
			unsigned int S1 = r(e, 6) ^ r(e, 11) ^ r(e, 25);
			unsigned int ch = (e & f) ^ ((~e) & g);
			unsigned int t1 = h + S1 + ch + K[i] + w[i];
			unsigned int S0 = r(a, 2) ^ r(a, 13) ^ r(a, 22);
			unsigned int m = (a & b) ^ (a & c) ^ (b & c);
			unsigned int t2 = S0 + m;
			h = g; g = f; f = e; e = d + t1; d = c; c = b; b = a; a = t1 + t2;
		}
		H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
	}
	std::ostringstream oss;
	for (int i = 0; i < 8; i++) oss << std::hex << std::setw(8) << std::setfill('0') << H[i];
	return oss.str();
}

std::string computeSignature(const std::string& bodyJson) {
	flowIntegrityAdd(4);
	std::string secret = ephemeralGetSecretKey();
	flowIntegrityAdd(1);
	std::string raw = bodyJson + secret;
	std::string d = sha256(raw);
	std::fill(secret.begin(), secret.end(), '\0');
	std::fill(raw.begin(), raw.end(), '\0');
	flowIntegrityAdd(2);
	return d;
}


void dummyRedundant(const std::string& v) {
	if (v.size() % 2) dummyLocalScore += 11; else dummyLocalScore -= 5;
	if (dummyLocalScore > 9999) dummyLocalScore = 0;
}

unsigned int calcFunctionHash(const unsigned char* ptr, size_t size) {
	unsigned int h = 5381;
	for (size_t i = 0; i < size; i++) {
		h = ((h << 5) + h) + ptr[i];
	}
	return h;
}

bool checkFunctionIntegrity(const void* funcPtr, size_t size, unsigned int expected) {
	unsigned int real = calcFunctionHash((const unsigned char*)funcPtr, size);
	return (real == expected);
}
void recordCheck(int index, bool passed) {
	gChecks[index] = passed ? 0xA5 : 0x5A;
	if (passed) gScore += 7; else gScore -= 3;
}

static const unsigned int expectedC1 = 0xDEADBEEF;
static const unsigned int expectedC2 = 0xABCDEF12;
static const unsigned int expectedC3 = 0xCAFEBABE;
static const unsigned int expectedC4C5 = 0x12345678;

bool doCheckC1(const std::string& s) {
	dummyRedundant(s);
	if (!checkFunctionIntegrity((void*)&doCheckC1, 0x80, expectedC1)) {}
	bool c1 = false;
	ephemeralUseXor(XOR_A1, std::strlen(XOR_A1), KEY, [&](const char* d) {
		if (s == d) c1 = true;
		});
	recordCheck(1, c1);
	return c1;
}

bool doCheckC2(const std::string& m) {
	dummyRedundant(m);
	if (!checkFunctionIntegrity((void*)&doCheckC2, 0x80, expectedC2)) {}
	bool c2 = false;
	ephemeralUseXor(XOR_A2, std::strlen(XOR_A2), KEY, [&](const char* d) {
		if (m == d) c2 = true;
		});
	recordCheck(2, c2);
	if (c2) gScore ^= 0x55;
	return c2;
}

bool doCheckC3(const std::string& l) {
	dummyRedundant(l);
	if (!checkFunctionIntegrity((void*)&doCheckC3, 0x80, expectedC3)) {}
	bool c3 = false;
	ephemeralUseXor(XOR_A3, std::strlen(XOR_A3), KEY, [&](const char* d) {
		if (l == d) c3 = true;
		});
	recordCheck(3, c3);
	return c3;
}

bool doCheckC4C5(const std::string& h) {
	dummyRedundant(h);
	if (!checkFunctionIntegrity((void*)&doCheckC4C5, 0x80, expectedC4C5)) {}
	bool c4 = false;
	ephemeralUseXor(XOR_A4, std::strlen(XOR_A4), KEY, [&](const char* d) {
		if (h == d) c4 = true;
		});
	bool c5 = false;
	ephemeralUseXor(XOR_A5, std::strlen(XOR_A5), KEY, [&](const char* d) {
		if (h == d) c5 = true;
		});
	bool passed = (c4 || c5);
	recordCheck(4, passed);
	return passed;
}

bool docheckandlogin(const std::string& s, const std::string& m, const std::string& l, const std::string& h, int& autenticado2, int& crash, int& simpleCheck, std::string& errorMessage, const nlohmann::json& responseJson) {
	if (doCheckC1(s)) autenticado2 = 6;
	if (doCheckC2(m)) crash = 213;
	if (doCheckC3(l)) simpleCheck -= 2;
	if (doCheckC4C5(h)) {
		simpleCheck += 3;
	}
	else {
		if (responseJson.contains(ephemeralAnother(XOR_ERROR))) errorMessage = responseJson[ephemeralAnother(XOR_ERROR)].get<std::string>(); else errorMessage = ephemeralGetErrorString(XOR_01);
		flowIntegrityAdd(31);
		return false;
	}
	flowIntegrityAdd(31);
	if (gScore < 0) return false;
	return true;
}

void multifucka() {
	if (firstmultfucker) {
		if (!(simplerintegrity == 342)) {
			multifoka = 232543252345345763;
		}
		firstmultfucker = false;
	}
}

void crashier() {
	if (firstcrashier) {
		if (!(crash == 213)) {
			while (true) {}
		}
		firstcrashier = false;
	}
}

void performLightJunk() {
	for (int i = 0; i < 100; i++) {
		int a = i * i;
		a /= 2;
		volatile int b = a + 1;
		(void)b;
	}
}

DWORD WINAPI delayedExit(LPVOID arg) {
	int delay = *((int*)arg);
	performLightJunk();
	Sleep(delay * 10);
	exit(EXIT_FAILURE);
	return 0;
}

void startexit01() {
	if (simpleCheck != 4 && !exit01) {
		exit01 = true;
		DWORD threadId;
		int delay = 9030;
		HANDLE thread = CreateThread(NULL, 0, delayedExit, &delay, 0, &threadId);
		if (thread != NULL) {
			CloseHandle(thread);
		}
		else {
			exit(EXIT_FAILURE);
		}
	}
}

DWORD WINAPI exitThreadFunc(LPVOID param) {
	for (int i = 0; i < 200; i++) {
		volatile int temp = (i * 37) % 89;
		(void)temp;
	}
	Sleep(50000);
	exit(EXIT_FAILURE);
	return 0;
}

void startexit02() {
	if (!exit02) {
		exit02 = true;
		HANDLE thread = CreateThread(NULL, 0, exitThreadFunc, NULL, 0, NULL);
		if (thread) {
			CloseHandle(thread);
		}

	}
}

void f2() {
	if (firstf2) {
		firstf2 = false;
		if (crashf2 != 43) {
			startexit02();
		}
	}
}

DWORD WINAPI hiloSalida(LPVOID param) {
	for (int i = 0; i < 100; i++) { volatile int x = i * i; }
	Sleep(30000);
	exit(EXIT_FAILURE);
	return 0;
}

void startexit03() {
	if (!exit03) {
		exit03 = true;
		HANDLE hilo = CreateThread(NULL, 0, hiloSalida, NULL, 0, NULL);
		if (hilo) {
			CloseHandle(hilo);
		}
	}
}

void f3() {
	if (firstf3) {
		firstf3 = false;
		if (crashf3 != 21) {
			startexit03();
		}
	}
}

void dede() {
#if defined(_WIN32) || defined(_WIN64)
	if (IsDebuggerPresent()) {
		startexit02();
	}
#else
	if (ptrace(PTRACE_TRACEME, 0, 0, 0) == -1) {
		startexit02();
	}
#endif
}

void timeCheckRoutine() {

	static DWORD lastCheck = 0;
	DWORD now = GetTickCount64();
	if (lastCheck != 0 && (now - lastCheck) > 5000) {
		ExitProcess(0);
	}
	lastCheck = now;

}

void hehe()
{
	//if (simpleCheck != 4 ){
	//	exit(EXIT_FAILURE);
	//}
}

void startmagic() {
	if (startmagicvar) {
		startmagicvar = false;
		std::thread magicThread(magic);
		magicThread.detach();
	}
}


