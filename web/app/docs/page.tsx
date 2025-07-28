"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ContentArea } from "@/components/content-area"
import { MobileSidebar } from "@/components/mobile-sidebar"

export default function PurgeDocsPage() {
  const [activeTab, setActiveTab] = useState("install")

  return (
    <div
      className="h-screen overflow-hidden"
      style={{ background: "var(--background-gradient)" }}
    >
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
