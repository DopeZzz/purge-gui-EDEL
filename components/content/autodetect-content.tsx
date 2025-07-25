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
        Learn how Purge 2.0's advanced autodetect system automatically recognizes weapons for maximum performance.
        </p>
      </div>

      <Alert className="mb-8 bg-blue-500/10 border-blue-500/20">
        <Info className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-300">
          <strong>Premium Feature:</strong> The autodetect system uses cloud-based image recognition and is available only to premium users.
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
                <strong className="text-white">AI Recognition:</strong> Utilizes advanced image recognition powered by AI to visually identify your equipped weapon in real time, regardless of skin, or viewmodel.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Cloud-Based System:</strong> The detection system runs entirely in the cloud, offloading all processing to ensure zero performance loss on your PC while maintaining high accuracy.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Full Weapon Support:</strong> Supports every weapon and skin in Rust, instantly applying the correct recoil pattern the moment you switch weapons, no manual input needed.
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
                <strong className="text-white">Detection Speed:</strong> Managed entirely by the cloud. Weapon recognition is triggered automatically and typically completes within 1 to 4 seconds after switching. No manual input is needed.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Detection Accuracy:</strong> Defines the confidence threshold required to confirm a weapon change. A value of 0.8 is recommended for optimal balance between speed and accuracy.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white">Fallback Mode:</strong> If the system fails to detect a weapon, it will temporarily fall back to your last selected weapon. Autodetect reactivates only when a new weapon is equipped.
              </div>
            </li>
          </ul>
        </div>
      </div>

      
    </div>
  )
}
