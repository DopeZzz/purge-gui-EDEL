"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContentArea } from "@/components/content-area"
import { MobileSidebar } from "@/components/mobile-sidebar"

export default function PurgeDocsPage() {
  const [activeTab, setActiveTab] = useState("install")

  return (
    <div className="h-screen bg-gradient-to-br from-[#2a3284] via-[#1e2a5e] to-[#1a1f3a] overflow-hidden">
      <MobileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex h-full">
        <div className="hidden lg:block">
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <ContentArea activeTab={activeTab} />
      </div>
    </div>
  )
}
