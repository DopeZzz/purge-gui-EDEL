"use client"

import { YouTubeEmbed } from "../youtube-embed"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Settings, Target, Keyboard, Gamepad2, Zap } from "lucide-react"

export function ConfigureContent() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
          <Settings className="w-10 h-10 text-[#00ff88]" />
          How to Configure & Use
        </h1>
        <p className="text-gray-300 text-lg">
          Configure Purge 2.0 settings for optimal performance and learn how to use it effectively in-game.
        </p>
      </div>

      <Alert className="mb-8 bg-blue-500/10 border-blue-500/20">
        <Info className="h-5 w-5 text-blue-400" />
        <AlertDescription className="text-blue-300 text-base">
          <strong>Pro Tip:</strong> For the best results, make sure your in-game settings perfectly align with your script configuration.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        <div className="order-2 xl:order-1 space-y-6">
          <YouTubeEmbed videoId="" title="Purge 2.0 Configuration & Usage Guide" />

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Zap className="w-6 h-6 text-[#00ff88]" />
              Performance Optimization
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">CPU Priority:</strong>
                  <p className="text-sm mt-1">
                    Set Purge 2.0 to high priority in Task Manager for better performance and reduced input lag during
                    gameplay.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Memory Usage:</strong>
                  <p className="text-sm mt-1">
                    Enable memory optimization mode if you have less than 16GB RAM to reduce system resource usage.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Graphics Settings:</strong>
                  <p className="text-sm mt-1">
                    Disable Windows Game Mode and fullscreen optimizations for better compatibility and performance.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Network Optimization:</strong>
                  <p className="text-sm mt-1">
                    Use wired connection and disable background applications that may interfere with network stability.
                  </p>
                </div>
              </li>
            </ul>
          </div>

        </div>

        <div className="space-y-6 order-1 xl:order-2">
          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Target className="w-6 h-6 text-[#00ff88]" />
              Aim Settings Configuration
            </h2>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Sensitivity Settings:</strong>
                  <p className="text-sm mt-1">
                    Start with 0.5 and adjust based on your mouse DPI. Higher DPI users should use lower sensitivity
                    values (0.3-0.4), while lower DPI users can use higher values (0.6-0.8).
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Scope Sensitivity:</strong>
                  <p className="text-sm mt-1">
                    Recommended value is 0.5 for most users. This controls aim assistance when using scoped weapons like
                    the Bolt Action Rifle or L96. Lower values provide more precise control.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Precision Mode:</strong>
                  <p className="text-sm mt-1">
                    Enable for better accuracy at long range. This mode reduces sensitivity when aiming at distant
                    targets and provides smoother tracking for sniper rifles.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#00ff88]" />
              General Settings
            </h2>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Field of View (FOV):</strong>
                  <p className="text-sm mt-1">
                    Set to 90° for optimal performance. This must match your in-game FOV setting exactly. Higher FOV
                    values (100-110°) are supported but may reduce accuracy.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Randomness Factor:</strong>
                  <p className="text-sm mt-1">
                    50% provides natural movement variation. Lower values (30-40%) for competitive play, higher values
                    (60-70%) for casual gaming to appear more human-like.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Auto Detection:</strong>
                  <p className="text-sm mt-1">
                    Enable for automatic weapon recognition. The system will automatically detect your equipped weapon
                    and apply appropriate recoil patterns and settings.
                  </p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>

      <div className="bg-[#141b3c]/80 rounded-lg p-8 border border-[#2a3284]/40 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-[#00ff88]" />
          Getting Started
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-[#00ff88] mb-4">Before Launching Rust</h3>
            <ol className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Close Steam and Check Unified Remote</span>
                  <span className="text-sm text-gray-400 mt-1">
                  Ensure Unified Remote is running correctly and that Steam is fully closed before continuing
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Run Notepad++</span>
                  <span className="text-sm text-gray-400 mt-1">
                  The connection module will open. Once your license is loaded, it should display “Connected” 
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Verify API Connection in Dashboard</span>
                  <span className="text-sm text-gray-400 mt-1">
                  Open the dashboard and confirm that the API connection is active by checking the status indicator
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  4
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Open Steam</span>
                  <span className="text-sm text-gray-400 mt-1">
                  Start Steam and launch Rust and apply the necessary configuration
                  </span>
                </div>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#00ff88] mb-4">In-Game Usage Guide</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">Launch Rust and Join Server</strong>
                  <p className="text-sm text-gray-400 mt-1">
                  Join a training server with targets to test the script right away, with access to all available weapons
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">Match Your Settings</strong>
                  <p className="text-sm text-gray-400 mt-1">
                  Press F1 in-game to open the console and copy your exact sens, ads, and fov values into the script
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">Activate Purge 2.0</strong>
                  <p className="text-sm text-gray-400 mt-1">
                  Enable the script from the dashboard by switching it to ON
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">Equip Weapon and Play</strong>
                  <p className="text-sm text-gray-400 mt-1">
                  Once everything is set up, equip a weapon, test the script, and start playing
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
