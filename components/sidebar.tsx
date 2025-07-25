"use client"

import { Settings, Download, MessageCircle, Target, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const tabs = [
  { id: "install", label: "How to Install", icon: Download },
  { id: "configure", label: "How to Configure", icon: Settings },
  { id: "autodetect", label: "Autodetect", icon: Target },
  { id: "faqs", label: "FAQs", icon: HelpCircle },
  { id: "discord", label: "Discord Support", icon: MessageCircle },
]

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {

  return (
    <div className="w-72 bg-[#141b3c] border-r border-[#2a3284]/30 h-full flex flex-col relative">
      {/* Header */}
      <div className="p-4 border-b border-[#2a3284]/30 bg-[#141b3c]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative h-10 w-10 flex-shrink-0">
              <Image src="/purgewhite.png" alt="Purge Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-white text-xl font-bold">PURGE 2.0</h1>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-3 bg-[#141b3c] overflow-y-auto">
        <nav className="space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-all duration-200 text-sm",
                  activeTab === tab.id
                    ? "bg-[#00ff88]/15 text-[#00ff88] border border-[#00ff88]/25"
                    : "text-gray-300 hover:bg-[#2a3284]/20 hover:text-white",
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Background overlay to ensure consistent background */}
      <div className="absolute inset-0 bg-[#141b3c] -z-10"></div>
    </div>
  )
}
