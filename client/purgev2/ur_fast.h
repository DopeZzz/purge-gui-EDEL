#pragma once
#define WIN32_LEAN_AND_MEAN          
#include <winsock2.h>
#include <ws2tcpip.h>
#include <cstdint>
#include <string>
#include <vector>

#pragma comment(lib,"Ws2_32.lib")

class URClient
{
public:
    URClient();
    ~URClient();

    bool connect(const char* host = "127.0.0.1", uint16_t port = 9512);
    bool hello();
    bool move(int dx, int dy);
    void disconnect();

private:
    bool  sendAll(const uint8_t* data, size_t len);
    SOCKET sock = INVALID_SOCKET;
    bool  wsaInitialized_ = false;
};
