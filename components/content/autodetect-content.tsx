"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Target, Info, CheckCircle, Settings, Zap, Eye } from "lucide-react"

export function AutodetectContent() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
          <Target className="w-10 h-10 text-[#00ff88]" />
          Autodetect System
        </h1>
        <p className="text-gray-300 text-lg">
          Learn how Purge 2.0's advanced autodetect system automatically recognizes weapons and optimizes settings for
          maximum performance.
        </p>
      </div>

      <Alert className="mb-8 bg-blue-500/10 border-blue-500/20">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          <strong>Pro Tip:</strong> The autodetect system works best when you allow it to scan your inventory for a few
          seconds after switching weapons.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <Eye className="w-6 h-6 text-[#00ff88]" />
            How Autodetect Works
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Real-time Scanning:</strong> Continuously monitors your equipped weapon
                and automatically adjusts recoil patterns, sensitivity, and aim settings based on the detected weapon
                type.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Weapon Database:</strong> Contains over 50+ weapon profiles including all
                assault rifles, SMGs, sniper rifles, and pistols with their specific recoil patterns and optimal
                settings.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Instant Adaptation:</strong> Switches between weapon profiles in under
                100ms, ensuring seamless transitions during combat situations.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Smart Learning:</strong> Adapts to your playstyle over time, fine-tuning
                settings based on your accuracy and performance metrics.
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <Settings className="w-6 h-6 text-[#00ff88]" />
            Autodetect Configuration
          </h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Detection Speed:</strong> Adjust how quickly the system recognizes weapon
                changes. Recommended: Fast (100ms) for competitive play, Normal (250ms) for casual gaming.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Confidence Threshold:</strong> Set the minimum confidence level (70-95%)
                before applying weapon-specific settings. Higher values reduce false positives.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Fallback Mode:</strong> Choose what happens when weapon detection fails -
                use default settings, maintain last known weapon, or disable assistance temporarily.
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <Zap className="w-6 h-6 text-[#00ff88]" />
            Supported Weapons
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#00ff88] mb-2">Assault Rifles</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• AK-47 - Full recoil compensation with burst fire optimization</li>
                <li>• LR-300 - Medium-range precision settings with spray control</li>
                <li>• M249 - Heavy weapon mode with stability enhancements</li>
                <li>• M39 - Semi-automatic precision with reduced sensitivity</li>
                <li>• HMLMG - High-damage mode with recoil prediction</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#00ff88] mb-2">Sniper Rifles</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Bolt Action Rifle - One-shot optimization with breath control</li>
                <li>• L96 - Long-range precision with wind compensation</li>
                <li>• M24 - Military-grade accuracy with bullet drop calculation</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-[#00ff88]" />
            Troubleshooting
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-[#00ff88] mb-2">Common Issues</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#00ff88] mt-1">•</span>
                  <div>
                    <strong>Weapon not detected:</strong> Ensure you're holding the weapon for at least 2 seconds and
                    that your inventory is visible on screen.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00ff88] mt-1">•</span>
                  <div>
                    <strong>Wrong weapon detected:</strong> Lower the detection speed or increase confidence threshold
                    in settings.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00ff88] mt-1">•</span>
                  <div>
                    <strong>Delayed switching:</strong> Check if other overlays are interfering with the detection
                    system.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00ff88] mt-1">•</span>
                  <div>
                    <strong>Performance issues:</strong> Reduce detection frequency or disable learning mode for better
                    FPS.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Alert className="bg-[#00ff88]/10 border-[#00ff88]/20">
        <CheckCircle className="h-4 w-4 text-[#00ff88]" />
        <AlertDescription className="text-[#00ff88]">
          <strong>Success!</strong> Autodetect is now configured and ready to enhance your gameplay experience
          automatically.
        </AlertDescription>
      </Alert>
    </div>
  )
}
