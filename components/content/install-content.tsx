"use client"

import { YouTubeEmbed } from "../youtube-embed"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Download, CheckCircle, FileText, Settings, Shield } from "lucide-react"

export function InstallContent() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
          <Download className="w-10 h-10 text-[#00ff88]" />
          How to Install
        </h1>
        <p className="text-gray-300 text-lg">
          Complete installation guide for Purge 2.0 - Follow these steps carefully to get started with the most advanced
          Rust scripting solution.
        </p>
      </div>

      <Alert className="mb-8 bg-red-500/10 border-red-500/20">
        <AlertTriangle className="h-5 w-5 text-red-400" />
        <AlertDescription className="text-red-300 text-base">
          <strong>Important:</strong> Make sure Steam is completely closed before starting the installation process.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-10">
        <div className="order-2 xl:order-1 space-y-6">
          <YouTubeEmbed
            videoId="gtFegSY36es"
            title="Purge 2.0 Installation Tutorial"
          />

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Shield className="w-6 h-6 text-[#00ff88]" />
              Environment Requirements
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Operating System:</strong>
                  <p className="text-sm mt-1">
                    Windows 10/11 (64-bit) with latest updates. 
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Internet Connection:</strong>
                  <p className="text-sm mt-1">
                    A stable internet connection is required for communication with the cloud API.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">USB Not Required:</strong>
                  <p className="text-sm mt-1">
                    No external USB device is needed. Everything runs directly from your system.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Mouse Compatibility:</strong>
                  <p className="text-sm mt-1">
                    Works with all mouse brands and models, including wireless. 
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-6 order-1 xl:order-2">
      <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-[#00ff88]" />
              Pre-Installation Checklist
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Disable Antivirus Temporarily:</strong>
                  <p className="text-sm mt-1">
                    Temporarily disable real-time protection during installation.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Completely Close Steam:</strong>
                  <p className="text-sm mt-1">
                    Make sure both Steam and Rust are fully closed before starting the installation. 
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[#00ff88] mt-1">•</span>
                <div>
                  <strong className="text-white text-base">Installation System Components Overview:</strong>
                   <div className="text-sm mt-1">
                    These components are automatically installed by the <strong>Installer</strong>
                    <div className="mt-1">
                    • Connection Module: Establishes a secure connection with the cloud API.<br />
                    • Notepad++: Installed to a fixed path where the Connection Module will reside.<br />                                                           
                    • Unified Remote: Required for proper in-game script operation.
                    </div>                                     
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <Settings className="w-6 h-6 text-[#00ff88]" />
              Step 1 — Install the System Components
            </h2>
            <ol className="space-y-4 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Download the Installer from Dashboard</span>
                  <span className="text-gray-300 text-sm mt-1 block">
                    Return to the previous page and download the file. Before running it, close Steam and temporarily disable real-time antivirus.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Run the Installers</span>
                  <span className="text-gray-300 text-sm mt-1 block">
                    Run the first .exe and wait for the second one to appear. Once the first closes and deletes itself, run the second and wait for the notice message.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </span>
                <div>
                  <span className="block text-base font-medium text-white">Verify Installation</span>
                  <span className="text-gray-300 text-sm mt-1 block">
                    Make sure the Connection Module is installed. Ensure Unified Remote is running in the hidden icons tray, Steam is closed, then launch Notepad++.
                  </span>
                </div>
              </li>
            </ol>
          </div>

          <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-[#00ff88]" />
              Step 2 — Launch the Connection Module
            </h2>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  1
                </span>
                <span className="text-base">Verify Unified Remote is running</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  2
                </span>
                <span className="text-base">Close Steam and launch Notepad++</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  3
                </span>
                <span className="text-base">Enter your valid license in the Connection Module</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="bg-[#00ff88] text-black rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mt-0.5 flex-shrink-0">
                  4
                </span>
                <span className="text-base">Check the Dashboard for API connection status</span>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}


