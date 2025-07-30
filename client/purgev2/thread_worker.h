#pragma once
#include <thread>
#include <atomic>

class ThreadWorker {
    std::atomic<bool> stop_{false};
    std::thread th_;
public:
    ThreadWorker() = default;
    ThreadWorker(const ThreadWorker&) = delete;
    ThreadWorker& operator=(const ThreadWorker&) = delete;

    template<class F, class... Args>
    void start(F&& func, Args&&... args) {
        stop_ = false;
        th_ = std::thread(std::forward<F>(func), std::forward<Args>(args)..., std::ref(stop_));
    }

    void stop() { stop_ = true; }

    void join() {
        if (th_.joinable()) th_.join();
    }

    bool stopping() const { return stop_.load(); }

    ~ThreadWorker() { stop(); join(); }
};
