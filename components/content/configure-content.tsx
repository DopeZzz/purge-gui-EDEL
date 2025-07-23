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
          Configure Purge 2.0 settings for optimal performance and learn how to use it effectively in-game. Proper
          configuration is essential for maximum effectiveness.
        </p>
      </div>

      <Alert className="mb-8 bg-blue-500/10 border-blue-500/20">
        <Info className="h-5 w-5 text-blue-400" />
        <AlertDescription className="text-blue-300 text-base">
          <strong>Pro Tip:</strong> Take your time with configuration - proper setup ensures the best experience and
          reduces detection risk!
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        <div className="order-2 xl:order-1 space-y-6">
          <YouTubeEmbed videoId="dQw4w9WgXcQ" title="Purge 2.0 Configuration & Usage Guide" />

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

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#00ff88]" />
              Advanced Configuration
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Profile Management:</strong>
                  <p className="text-sm mt-1">
                    Create multiple configuration profiles for different game modes. Use "Competitive" profile for
                    ranked matches with lower randomness, and "Casual" profile for regular gameplay with higher
                    variation.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Backup Settings:</strong>
                  <p className="text-sm mt-1">
                    Regularly backup your configuration files to avoid losing custom settings. Export your profiles
                    before major updates and store them in a safe location for easy restoration.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Custom Weapon Profiles:</strong>
                  <p className="text-sm mt-1">
                    Fine-tune individual weapon settings beyond the default profiles. Adjust recoil compensation, aim
                    smoothness, and trigger delays for each weapon type to match your playstyle perfectly.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Hotkey Customization:</strong>
                  <p className="text-sm mt-1">
                    Set up custom hotkeys for quick profile switching, temporary disable functions, and emergency panic
                    modes. Assign keys that don't conflict with your game bindings for seamless operation.
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

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Keyboard className="w-6 h-6 text-[#00ff88]" />
              Keybind Configuration
            </h2>
            <div className="grid grid-cols-1 gap-4 text-gray-300">
              <div className="flex justify-between items-center p-3 bg-[#2a3284]/20 rounded-lg">
                <span className="text-base">Toggle Script On/Off:</span>
                <code className="bg-[#2a3284]/40 px-3 py-2 rounded text-[#00ff88] font-mono">F1</code>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#2a3284]/20 rounded-lg">
                <span className="text-base">Aim Assistance Key:</span>
                <code className="bg-[#2a3284]/40 px-3 py-2 rounded text-[#00ff88] font-mono">Right Mouse</code>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#2a3284]/20 rounded-lg">
                <span className="text-base">Settings Menu:</span>
                <code className="bg-[#2a3284]/40 px-3 py-2 rounded text-[#00ff88] font-mono">Insert</code>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#2a3284]/20 rounded-lg">
                <span className="text-base">Emergency Panic Key:</span>
                <code className="bg-[#2a3284]/40 px-3 py-2 rounded text-[#00ff88] font-mono">F4</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#141b3c]/80 rounded-lg p-8 border border-[#2a3284]/40 mb-8">
        <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-[#00ff88]" />
          In-Game Usage Guide
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-semibold text-[#00ff88] mb-4">Getting Started</h3>
            <ol className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Launch Rust and Join Server</span>
                  <span className="text-sm text-gray-400 mt-1">
                    Make sure to join a server with good ping for optimal performance
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Activate Purge 2.0</span>
                  <span className="text-sm text-gray-400 mt-1">
                    Press F1 to activate the system and wait for confirmation
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Verify Active Status</span>
                  <span className="text-sm text-gray-400 mt-1">
                    Look for the green "Active" indicator in the top-left corner
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  4
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Equip Weapon and Play</span>
                  <span className="text-sm text-gray-400 mt-1">
                    The system will automatically detect your weapon and apply settings
                  </span>
                </div>
              </li>
            </ol>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-[#00ff88] mb-4">Weapon-Specific Tips</h3>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">AK-47 Assault Rifle:</strong>
                  <p className="text-sm text-gray-400 mt-1">
                    Use controlled burst fire for best results. The recoil pattern is aggressive but predictable with
                    proper compensation.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">M249 Machine Gun:</strong>
                  <p className="text-sm text-gray-400 mt-1">
                    Excellent for long-range engagements with high damage output. Best used from cover or elevated
                    positions.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">Bolt Action Rifle:</strong>
                  <p className="text-sm text-gray-400 mt-1">
                    One-shot headshot potential at any range. Perfect for long-distance eliminations and area denial.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Target className="w-5 h-5 text-[#00ff88] mt-0.5 flex-shrink-0" />
                <div>
                  <strong className="text-white text-base">Auto Detection System:</strong>
                  <p className="text-sm text-gray-400 mt-1">
                    Automatically recognizes equipped weapons and applies optimal settings for each weapon type.
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
