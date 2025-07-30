#pragma once
#include <string>

namespace auth
{
    struct AuthInfo {
        std::string token;
        std::string key;
    };
    AuthInfo token_request(const std::string& serial,
        std::string* error = nullptr);
    void        open_console();
    AuthInfo authenticate_loop();
}

namespace hwid
{
    std::string value();
}
