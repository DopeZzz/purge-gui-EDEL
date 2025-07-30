#pragma once
namespace zoommag {
    bool init(int zoomVk, int factor = 2, int patch = 200);
    void update_key(int zoomVk);
    void set_enabled(bool enabled);
    void reconfigure(int factor, int patch);
    void shutdown();
}
