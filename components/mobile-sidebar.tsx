"use client"

import { useState } from "react"
import { Menu, X, Settings, Download, MessageCircle, ArrowLeft, Target, HelpCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Image from "next/image"

interface MobileSidebarProps {
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

export function MobileSidebar({ activeTab, setActiveTab }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-[#141b3c] border-b border-[#2a3284]/30 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-white hover:bg-[#2a3284]/20 p-2 h-auto"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="relative h-8 w-8">
              <Image src="/purgewhite.png" alt="Purge Logo" fill className="object-contain" priority />
            </div>
            <h1 className="text-white text-lg font-bold">PURGE 2.0</h1>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white hover:bg-[#2a3284]/20 p-2 h-auto"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setIsOpen(false)}>
          <div className="bg-[#141b3c] w-72 h-full border-r border-[#2a3284]/30" onClick={(e) => e.stopPropagation()}>
            <div className="p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setIsOpen(false)
                      }}
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
          </div>
        </div>
      )}
    </>
  )
}
