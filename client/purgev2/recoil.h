#pragma once
#include <string>
#include <vector>
#include <array>

using Vec4 = std::array<double, 4>;
using Salvo = std::vector<Vec4>;
using Pattern = std::vector<Salvo>;

struct Multi { double multi{ 1.0 }; std::vector<int> vks; };

struct Detection { std::string label; float conf; int x, y, w, h; };

namespace recoil {
    class Runner {
    public:
        Runner(const std::string& ws_url, const std::string& dec_key);
        ~Runner();
        void load(Pattern p, std::vector<Multi> m);
        bool detect(const std::vector<unsigned char>& jpg,
                    std::vector<Detection>& out);
        bool auto_detection() const;
        float detection_accuracy() const;
        void select(const std::string& type, const std::string& id);
        std::string current_weapon() const;
    private:
        class Impl; Impl* impl_;
    };

    extern Runner* g_runner;
}
