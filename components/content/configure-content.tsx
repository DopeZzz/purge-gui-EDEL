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
              System Compatibility
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Resolution:</strong>
                  <p className="text-sm mt-1">
                  No need to set your resolution manually, Purge 2.0 auto-adjusts and works with any screen size.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">DPI:</strong>
                  <p className="text-sm mt-1">
                  Your mouse DPI is automatically detected. No configuration needed for proper recoil control.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Mouse:</strong>
                  <p className="text-sm mt-1">
                  Compatible with all mouse types and brands, no special hardware required.
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
              Script Configuration
            </h2>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Settings:</strong>
                  <p className="text-sm mt-1">
                  Open Rust, press F1, and type sens, ads, and fov. Copy the exact values into the script settings.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Randomness:</strong>
                  <p className="text-sm mt-1">
                  Set to 0 for best precision. Increase slightly (up to 100) to add human-like randomness at the cost of accuracy.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Activation & Weapon Selection:</strong>
                  <p className="text-sm mt-1">
                  Make sure the script is switched ON to activate.
                  Select your weapon and any attachments you're using, like scopes or barrels, to ensure proper recoil control.
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
                  <strong className="text-white text-base">Sensitivity:</strong>
                  <p className="text-sm mt-1">
                    Set this to match your exact in-game sens value (check via F1 console). It directly affects recoil compensation precision.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Aim Sensitivity:</strong>
                  <p className="text-sm mt-1">
                  This must match your input.ads_sensitivity value in Rust. Accurate input here ensures the script adjusts recoil correctly when aiming down sights.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Field of View (FOV):</strong>
                  <p className="text-sm mt-1">
                  Enter your in-game graphics.fov value. Correct FOV is crucial for recoil patterns to behave consistently across all weapon types.
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
