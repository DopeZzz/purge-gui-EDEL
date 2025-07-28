"use client"

import { InstallContent } from "./content/install-content"
import { ConfigureContent } from "./content/configure-content"
import { AutodetectContent } from "./content/autodetect-content"
import { FaqsContent } from "./content/faqs-content"
import { DiscordContent } from "./content/discord-content"

interface ContentAreaProps {
  activeTab: string
}

export function ContentArea({ activeTab }: ContentAreaProps) {
  const renderContent = () => {
    switch (activeTab) {
      case "install":
        return <InstallContent />
      case "configure":
        return <ConfigureContent />
      case "autodetect":
        return <AutodetectContent />
      case "faqs":
        return <FaqsContent />
      case "discord":
        return <DiscordContent />
      default:
        return <InstallContent />
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-[#2a3284] via-[#1e2a5e] to-[#1a1f3a]">
      <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">{renderContent()}</div>
    </div>
  )
}
