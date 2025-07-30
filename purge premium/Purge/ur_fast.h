#pragma once
#define WIN32_LEAN_AND_MEAN          // evita incluir winsock.h
#include <winsock2.h>
#include <ws2tcpip.h>
#include <cstdint>
#include <string>
#include <vector>

#pragma comment(lib,"Ws2_32.lib")

class URClient
{
public:
    bool connect(const char* host = "127.0.0.1", uint16_t port = 9512);
    bool hello();                       // handshake (solo 1-vez)
    bool move(int dx, int dy);          // mueve ratón ?x,?y
    void disconnect();
private:
    bool sendAll(const uint8_t* data, size_t len);
    SOCKET sock = INVALID_SOCKET;
};
