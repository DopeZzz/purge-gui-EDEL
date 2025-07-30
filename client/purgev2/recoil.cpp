#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <array>
#include <atomic>
#include <chrono>
#include <fstream>
#include <ixwebsocket/IXNetSystem.h>
#include <ixwebsocket/IXWebSocket.h>
#include <nlohmann/json.hpp>
#include "recoil.h"
#include "ur_fast.h"
#include <thread>
#include <mutex>
#include <condition_variable>
#include <unordered_map>
#include <unordered_set>
#include "thread_worker.h"
#include "auth.h" 
#include <bcrypt.h>
#include <wincrypt.h>
#pragma comment(lib, "bcrypt.lib")

#include <algorithm>
#include <cstring>
#include <iostream>
#include "zoom.h"
#pragma comment(lib, "crypt32.lib")

static bool cursor_visible()
{
    CURSORINFO ci{ sizeof(ci) };
    if (!GetCursorInfo(&ci))
        return true; // Por seguridad: si falla, asumimos visible
    return (ci.flags & CURSOR_SHOWING) != 0;
}

std::string ws_base_;   
std::string url_;

static std::string b64url_decode(const std::string& in)
{
    std::string s = in;
    std::replace(s.begin(), s.end(), '-', '+');
    std::replace(s.begin(), s.end(), '_', '/');
    while (s.size() % 4) s.push_back('=');

    DWORD len = 0;
    if (!CryptStringToBinaryA(s.c_str(),
        static_cast<DWORD>(s.size()),
        CRYPT_STRING_BASE64,
        nullptr, &len, nullptr, nullptr))
        return {};                        

    std::string out(len, '\0');
    if (!CryptStringToBinaryA(s.c_str(),
        static_cast<DWORD>(s.size()),
        CRYPT_STRING_BASE64,
        reinterpret_cast<BYTE*>(&out[0]),
        &len, nullptr, nullptr))
        return {};
    out.resize(len);
    return out;
}

static std::string aes_gcm_dec(std::string_view ct, std::string_view key)
{
    if (ct.size() < 12 + 16) return {};

    BCRYPT_ALG_HANDLE a{};
    if (BCryptOpenAlgorithmProvider(&a, BCRYPT_AES_ALGORITHM, nullptr, 0)) return {};
    BCryptSetProperty(a, BCRYPT_CHAINING_MODE,
        (PUCHAR)BCRYPT_CHAIN_MODE_GCM,
        (ULONG)((wcslen(BCRYPT_CHAIN_MODE_GCM) + 1) * sizeof(wchar_t)), 0);

    BCRYPT_KEY_HANDLE h{};
    if (BCryptGenerateSymmetricKey(a, &h, nullptr, 0,
        (PUCHAR)key.data(), (ULONG)key.size(), 0))
    {
        BCryptCloseAlgorithmProvider(a, 0);
        return {};
    }

    std::string out(ct.size() - 12 - 16, '\0');
    DWORD outlen{};

    BCRYPT_AUTHENTICATED_CIPHER_MODE_INFO info;
    BCRYPT_INIT_AUTH_MODE_INFO(info);
    info.pbNonce = (PUCHAR)ct.data();
    info.cbNonce = 12;
    info.pbTag = (PUCHAR)ct.data() + ct.size() - 16;
    info.cbTag = 16;

    NTSTATUS res = BCryptDecrypt(h,
        (PUCHAR)ct.data() + 12,
        (ULONG)(ct.size() - 12 - 16),
        &info,
        nullptr,
        0,
        (PUCHAR)out.data(),
        (ULONG)out.size(),
        &outlen,
        0);

    BCryptDestroyKey(h);
    BCryptCloseAlgorithmProvider(a, 0);
    if (res) return {};
    out.resize(outlen);
    return out;
}

static std::string jwt_sub(const std::string& jwt)
{
    auto p1 = jwt.find('.'), p2 = jwt.find('.', p1 + 1);
    if (p1 == std::string::npos || p2 == std::string::npos) return {};
    std::string payload = b64url_decode(jwt.substr(p1 + 1, p2 - p1 - 1));
    return nlohmann::json::parse(payload).value("sub", "");
}



using json = nlohmann::json;
using Clock = std::chrono::steady_clock;

namespace recoil {


    class Runner::Impl {
        static constexpr int kBackoffMs = 1000;
        int  aim_key_{ VK_RBUTTON }; 
        std::string serial_;
        std::unordered_map<int, std::string> wkeys_;   
        std::unordered_map<int, std::string> skeys_;   
        std::unordered_map<int, std::string> bkeys_;   
        std::string cur_weapon_, cur_scope_, cur_barrel_;
        std::array<SHORT, 256> prev_{};
        std::atomic<bool> script_on_{ true };   
        std::atomic<bool> auto_detection_{ false };
        float detection_accuracy_{ 0.8f };
        std::atomic<bool> hipfire_{ false };
        double hipfire_multi_{ 0.5 };
        int hipfire_key_{ 0 };
        double ads_factor_{ 1.0 };
        double imsens_{ 1.0 };
        int script_toggle_key_{ 0 };
        int auto_detection_toggle_key_{ 0 };
        std::atomic<bool> need_reconnect_{ false };
        std::atomic<bool> reconnecting_{ false };
        std::vector<int> key_list_;
        void update_key_list()
        {
            std::unordered_set<int> keys;
            keys.insert(aim_key_);
            keys.insert(VK_LBUTTON);
            for (auto& [k, _] : wkeys_) keys.insert(k);
            for (auto& [k, _] : skeys_) keys.insert(k);
            if (hipfire_key_ > 0) keys.insert(hipfire_key_);
            if (script_toggle_key_ > 0) keys.insert(script_toggle_key_);
            if (auto_detection_toggle_key_ > 0) keys.insert(auto_detection_toggle_key_);
            for (auto& [k, _] : bkeys_) keys.insert(k);
            key_list_.assign(keys.begin(), keys.end());
        }



        std::atomic<bool> opened_{ false };
        std::atomic<int>  close_code_{ 0 };

        std::string url_;
        std::string dec_key_;

        std::mutex pat_mtx_;
        Pattern pat_;
        std::vector<Multi> mul_;
        ThreadWorker worker_;
        ix::WebSocket ws_;
        std::mutex det_mtx_;
        std::condition_variable det_cv_;
        std::vector<Detection> det_res_;
        bool det_ready_{ false };
        static bool kd(int v) { return GetAsyncKeyState(v) & 0x8000; }
        bool pressed()
        {
            if (!kd(VK_LBUTTON)) return false;
            if (kd(aim_key_)) return true;
            return hipfire_ && !kd(aim_key_) && !cursor_visible();
        }
        void select(const char* type, const std::string& id)
        {
            json j = { {"cmd","select"}, {"type",type}, {"id",id} };
            ws_.send(j.dump());

            if (std::strcmp(type, "weapon") == 0)
                cur_weapon_ = id;
            else if (std::strcmp(type, "scope") == 0)
                cur_scope_ = id;
            else if (std::strcmp(type, "barrel") == 0)
                cur_barrel_ = id;


        }
        static void mv(int dx, int dy)
        {
            static URClient ur;
            static bool ready = false;

            auto tryConnect = [&]() -> bool {
                ur.disconnect();
                ready = ur.connect() && ur.hello();
                return ready;
                };

            auto sendMove = [&](int x, int y) {
                if (!ready) return;
                if (!ur.move(x, y)) {
                    if (tryConnect())
                        ur.move(x, y);
                }
                };

            if (!ready && !tryConnect()) return;

            while (dx || dy) {
                int stepX = std::clamp(dx, -127, 127);
                int stepY = std::clamp(dy, -127, 127);
                sendMove(stepX, stepY);
                dx -= stepX;
                dy -= stepY;
            }
        }

        static void smooth(int dx, int dy, double ms) {
            if (ms <= 0) { mv(dx, dy); return; }
            auto end = Clock::now() + std::chrono::duration<double, std::milli>(ms);
            int ax = 0, ay = 0;
            while (Clock::now() < end) {
                double el = ms - std::chrono::duration<double, std::milli>(end - Clock::now()).count();
                double p = el / ms;
                int tx = int(dx * p), ty = int(dy * p);
                int mx = tx - ax, my = ty - ay;
                if (mx || my) mv(mx, my);
                ax += mx; ay += my;
                std::this_thread::sleep_for(std::chrono::microseconds(100));
            }
            mv(dx - ax, dy - ay);
        }
        void fire() {
            if (!script_on_) return;
            Pattern local_pat;
            std::vector<Multi> local_mul;
            {
                std::lock_guard lk(pat_mtx_);
                local_pat = pat_;
                local_mul = mul_;
            }
            auto t0 = Clock::now(); double fx = 0, fy = 0, lq = 0;
            for (const auto& s : local_pat) {
                if (!pressed()) break;
                for (auto q : s) {
                    double dx = q[0], dy = q[1], dur = q[2], fac = 1.0;
                    for (const auto& m : local_mul)
                        if (std::any_of(m.vks.begin(), m.vks.end(), [](int v) {return GetAsyncKeyState(v) & 0x8000; }))
                            fac *= m.multi;
                    if (hipfire_ && !kd(aim_key_)) {
                        double hf = hipfire_multi_;
                        hf /= ads_factor_;
                        hf *= imsens_;
                        fac *= hf;
                    }
                    dx *= fac; dy *= fac; dx += fx; dy += fy;
                    int ix = int(dx), iy = int(dy);
                    fx = dx - ix; fy = dy - iy;
                    double dt = dur - lq; if (dt < 0) dt = 0;
                    smooth(ix, iy, dt);
                    double el = std::chrono::duration<double, std::milli>(Clock::now() - t0).count();
                    lq = el - q[3];
                }
            }
        }
        void loop(std::atomic<bool>& stop)
        {
            while (!stop.load())
            {
                if (need_reconnect_.load(std::memory_order_acquire) &&
                    !reconnecting_.load(std::memory_order_relaxed))
                {
                    reconnecting_.store(true, std::memory_order_release);

                    std::thread([this]
                        {
                            reconnect();        
                        }).detach();
                }

                std::this_thread::sleep_for(std::chrono::milliseconds(16));

                for (int vk : key_list_)
                {
                    SHORT now = GetAsyncKeyState(vk);

                    if ((now & 0x8000) && !(prev_[vk] & 0x8000))
                    {
                        if (wkeys_.count(vk) && wkeys_[vk] != cur_weapon_) {
                            cur_weapon_ = wkeys_[vk];
                            select("weapon", cur_weapon_);
                        }
                        if (skeys_.count(vk) && skeys_[vk] != cur_scope_) {
                            cur_scope_ = skeys_[vk];
                            select("scope", cur_scope_);
                        }
                        if (bkeys_.count(vk) && bkeys_[vk] != cur_barrel_) {
                            cur_barrel_ = bkeys_[vk];
                            select("barrel", cur_barrel_);
                        }
                        if (vk == hipfire_key_) {
                            hipfire_ = !hipfire_;
                            json j = { {"cmd","set_hipfire"}, {"value", hipfire_.load()} };

                            ws_.send(j.dump());
                        }
                        if (vk == script_toggle_key_) {
                            script_on_ = !script_on_;
                            json j = { {"cmd","set_script_on"}, {"value", script_on_.load()} };

                            ws_.send(j.dump());
                        }
                        if (vk == auto_detection_toggle_key_) {
                            auto_detection_ = !auto_detection_.load();
                            json j = { {"cmd","set_auto_detection"}, {"value", auto_detection_.load()} };
                            ws_.send(j.dump());
                        }
                    }
                    prev_[vk] = now;
                }

                bool has_pat = false;
                {
                    std::lock_guard lk(pat_mtx_);
                    has_pat = !pat_.empty();
                }
                if (script_on_ && has_pat && pressed())
                    fire();
            }
        }

        bool reauth()
        {
            auth::AuthInfo info = auth::token_request(serial_);
            if (info.token.empty() || info.key.empty())
                return false;                   

            dec_key_ = b64url_decode(info.key);
            url_ = ws_base_ + "?token=" + info.token;
            return true;
        }

        bool ws_conn(const std::string& url)
        {
            url_ = url;
            auto p = url.find('?');
            ws_base_ = (p == std::string::npos) ? url : url.substr(0, p);

            if (auto p = url.find("token="); p != std::string::npos)
            {
                std::string jwt = url.substr(p + 6);
                serial_ = jwt_sub(jwt);
            }

            ws_.setPingInterval(30);          
            ws_.setUrl(url);


            ws_.setOnMessageCallback([this](const ix::WebSocketMessagePtr& m)
                {
                    using ix::WebSocketMessageType;

                    switch (m->type)
                    {
                    case WebSocketMessageType::Open:
                        opened_ = true;
                        need_reconnect_ = false;  
                        reconnecting_ = false;   
                        break;

                    case WebSocketMessageType::Close:
                        close_code_ = m->closeInfo.code;
                        opened_ = false;
                        need_reconnect_ = true;   
                        break;

                    case WebSocketMessageType::Error:
                        close_code_ = m->errorInfo.http_status;
                        opened_ = false;
                        need_reconnect_ = true;
                        break;

                    case WebSocketMessageType::Message:
                    {
                        std::string raw = m->str;

                        if (!raw.empty() && raw[0] != '{')
                        {
                            std::string ct = b64url_decode(raw);
                            if (!ct.empty() && !dec_key_.empty())
                                raw = aes_gcm_dec(ct, dec_key_);
                        }

                        json d;
                        try { d = json::parse(raw); }
                        catch (...) { break; }      

                        if (d.value("cmd", "") == "detect_resp")
                        {
                            std::vector<Detection> dets;
                            for (const auto& it : d["detections"])
                            {
                                Detection dt{};
                                dt.label = it["label"].get<std::string>();
                                dt.conf = it["conf"].get<float>();
                                auto b = it["bbox"];
                                dt.x = b[0].get<int>();
                                dt.y = b[1].get<int>();
                                dt.w = b[2].get<int>();
                                dt.h = b[3].get<int>();
                                dets.push_back(dt);
                            }
                            {
                                std::lock_guard lk(det_mtx_);
                                det_res_ = std::move(dets);
                                det_ready_ = true;
                            }
                            det_cv_.notify_one();
                            break;
                        }

                        Pattern p; std::vector<Multi> m2;

                        for (const auto& s : d["r"])
                        {
                            Salvo sv;
                            for (const auto& q : s)
                                sv.push_back({ q[0], q[1], q[2], q[3] });
                            p.push_back(std::move(sv));
                        }

                        for (const auto& mj : d["m"])
                        {
                            std::string       id = mj.value("id", "");
                            const auto& codes = mj["keyCodes"];

                            if (id == "aim" && !codes.empty())
                            {
                                aim_key_ = codes.front();
                                update_key_list();
                                continue;
                            }

                            if (d.contains("settings"))
                            {
                                const auto& s = d["settings"];

                                wkeys_.clear(); skeys_.clear(); bkeys_.clear();
                                auto fill = [](auto& dst, const json& src)
                                    {
                                        for (auto& [id2, v] : src.items())
                                            dst[v.get<int>()] = id2;
                                    };
                                if (s.contains("weapon_hotkeys")) fill(wkeys_, s["weapon_hotkeys"]);
                                if (s.contains("scope_hotkeys"))  fill(skeys_, s["scope_hotkeys"]);
                                if (s.contains("barrel_hotkeys")) fill(bkeys_, s["barrel_hotkeys"]);

                                script_on_ = s.value("script_on", true);
                                auto_detection_.store(s.value("auto_detection", false));
                                detection_accuracy_ = s.value("detection_accuracy", 0.8f);
                                hipfire_ = s.value("hipfire", false);
                                hipfire_key_ = 0;
                                script_toggle_key_ = 0;
                                auto_detection_toggle_key_ = 0;
                                hipfire_multi_ = s.value("hipfire_multi", 0.5);
                                ads_factor_ = s.value("ads_factor", 1.0);
                                imsens_ = s.value("imsens", 1.0);
                                if (s.contains("hipfire_key") && !s["hipfire_key"].is_null())
                                {
                                    try {
                                        hipfire_key_ = s["hipfire_key"].get<int>();
                                    }
                                    catch (...) {}
                                }
                                if (s.contains("script_toggle_key") && !s["script_toggle_key"].is_null())
                                {
                                    try {
                                        script_toggle_key_ = s["script_toggle_key"].get<int>();
                                    }
                                    catch (...) {}
                                }
                                if (s.contains("auto_detection_toggle_key") && !s["auto_detection_toggle_key"].is_null())
                                {
                                    try {
                                        auto_detection_toggle_key_ = s["auto_detection_toggle_key"].get<int>();
                                    }
                                    catch (...) {}
                                }

                                // ---- LECTURA DINÁMICA ZOOM (AÑADIDO) ----
                                if (s.contains("zoom")) {
                                    try {
                                        bool z = s["zoom"].get<bool>();
                                        zoommag::set_enabled(z);
                                    }
                                    catch (...) {}
                                }
                                if (s.contains("zoom_key")) {
                                    try {
                                        int zk = s["zoom_key"].get<int>();
                                        if (zk > 0)
                                            zoommag::update_key(zk);
                                    }
                                    catch (...) {}
                                }
                                // ------------------------------------------

                                update_key_list();
                            }

                            Multi mu;  mu.multi = mj.value("multi", 1.0);
                            for (int vk : codes) mu.vks.push_back(vk);
                            m2.push_back(std::move(mu));
                        }
                        {
                            std::lock_guard lk(pat_mtx_);
                            pat_ = std::move(p);
                            mul_ = std::move(m2);
                        }
                    }
                    break;

                    default:
                        break;
                    }
                });


            ws_.start();

            for (int i = 0; i < 30 && !opened_ && close_code_ == 0; ++i)
                std::this_thread::sleep_for(std::chrono::milliseconds(100));

            return opened_;
        }

        void sync_state()
        {
            if (!cur_weapon_.empty()) select("weapon", cur_weapon_);
            if (!cur_scope_.empty())  select("scope", cur_scope_);
            if (!cur_barrel_.empty()) select("barrel", cur_barrel_);

            if (auto_detection_.load())
            {
                json j = { {"cmd","set_auto_detection"}, {"value", auto_detection_.load()} };
                ws_.send(j.dump());
            }
            {
                json j = { {"cmd","set_script_on"}, {"value", script_on_.load()} };
                ws_.send(j.dump());
            }
            {
                json j = { {"cmd","set_hipfire"}, {"value", hipfire_.load()} };
                ws_.send(j.dump());
            }
        }

        void reconnect()
        {
            ws_.stop();

            while (!worker_.stopping())
            {
                if (reauth()) break;

                std::this_thread::sleep_for(std::chrono::seconds(1));
            }

            while (!worker_.stopping())
            {
                if (ws_conn(url_)) {
                    sync_state();
                    reconnecting_ = false;
                    return;
                }

                std::this_thread::sleep_for(std::chrono::milliseconds(kBackoffMs));
            }

            reconnecting_ = false;
        }

    public:
        Impl(const std::string& url, std::string key_b64) {
            dec_key_ = b64url_decode(key_b64);
            ix::initNetSystem();
            if (!ws_conn(url))
                reconnect();
            update_key_list();
            worker_.start(&Impl::loop, this);
        }
        ~Impl()
        {
            worker_.stop();
            ws_.stop();
            worker_.join();
            mv(0, 0);
            ix::uninitNetSystem();
        }
        void select_public(const char* type, const std::string& id) { select(type, id); }
        void load(Pattern p, std::vector<Multi> m) {
            std::lock_guard lk(pat_mtx_);
            pat_ = std::move(p);
            mul_ = std::move(m);
        }

        bool detect(const std::vector<unsigned char>& jpg,
                    std::vector<Detection>& out)
        {
            {
                std::lock_guard lk(det_mtx_);
                det_ready_ = false;
            }
            ws_.sendBinary(std::string(reinterpret_cast<const char*>(jpg.data()), jpg.size()));
            std::unique_lock lk(det_mtx_);
            if (!det_cv_.wait_for(lk, std::chrono::seconds(5), [this]{return det_ready_;}))
                return false;
            out = det_res_;
            return true;
        }

        bool auto_detection() const { return auto_detection_.load(); }
        float detection_accuracy() const { return detection_accuracy_; }
        std::string current_weapon() const { return cur_weapon_; }
    };

    Runner::Runner(const std::string& url, const std::string& key)
        :impl_(new Impl(url, key)) {}
    Runner::~Runner() { delete impl_; }
    void Runner::load(Pattern p, std::vector<Multi> m) { impl_->load(std::move(p), std::move(m)); }

    bool Runner::detect(const std::vector<unsigned char>& jpg, std::vector<Detection>& out)
    {
        return impl_->detect(jpg, out);
    }

    bool Runner::auto_detection() const { return impl_->auto_detection(); }
    float Runner::detection_accuracy() const { return impl_->detection_accuracy(); }
    std::string Runner::current_weapon() const { return impl_->current_weapon(); }

    void Runner::select(const std::string& type, const std::string& id)
    {
        impl_->select_public(type.c_str(), id);
    }

    Runner* g_runner = nullptr;

}
