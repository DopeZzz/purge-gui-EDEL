"use client"

import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="bg-[#141b3c]/80 rounded-lg border border-[#2a3284]/40 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-center justify-between hover:bg-[#2a3284]/10 transition-colors"
      >
        <h3 className="text-xl font-semibold text-white pr-4">{question}</h3>
        {isOpen ? (
          <ChevronDown className="w-6 h-6 text-[#00ff88] flex-shrink-0" />
        ) : (
          <ChevronRight className="w-6 h-6 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="p-6 pt-0 text-gray-300 leading-relaxed text-base">{answer}</div>
      </div>
    </div>
  )
}

export function FaqsContent() {
  const [openItems, setOpenItems] = useState<number[]>([0])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  const faqs = [
    {
      question: "Is Purge 2.0 safe to use and undetectable?",
      answer:
        "Yes, Purge 2.0 uses advanced anti-detection technology including kernel-level protection, memory encryption, and randomized execution patterns. Our system has been undetected for over 2 years with regular updates to stay ahead of anti-cheat systems. We use HWID spoofing and process hollowing techniques to ensure maximum safety for our users.",
    },
    {
      question: "What games does Purge 2.0 support?",
      answer:
        "Purge 2.0 primarily supports Rust with full weapon detection and recoil compensation for all major weapons. We also have beta support for CS2, Valorant, and Apex Legends. Each game has specific features tailored to its mechanics, including weapon-specific recoil patterns, aim assistance, and trigger bot functionality with customizable settings.",
    },
    {
      question: "How do I install Purge 2.0 if Windows Defender blocks it?",
      answer:
        "This is normal behavior for security software when dealing with kernel-level applications. Add Purge 2.0 to your Windows Defender exclusions before installation. Go to Windows Security > Virus & threat protection > Exclusions > Add exclusion > Folder, then select your Purge 2.0 installation directory. Also disable real-time protection temporarily during the installation process.",
    },
    {
      question: "What should I do if Purge 2.0 stops working after a game update?",
      answer:
        "Game updates often change memory addresses and detection patterns, which can temporarily affect functionality. Check our Discord server for immediate updates and patches - we usually release compatibility updates within 2-6 hours of major game updates. Make sure to always use the latest version of Purge 2.0 and never use outdated versions as they may be detected by anti-cheat systems.",
    },
    {
      question: "How do I configure Purge 2.0 for the best performance?",
      answer:
        "Start with our recommended settings: Sensitivity 0.5, FOV 90°, Randomness 50%, and enable autodetect for automatic weapon recognition. For competitive play, use lower randomness (30-40%) and faster detection speed. For casual gaming, higher randomness (60-70%) provides more natural movement patterns. Always test your settings in aim training servers before using them in actual matches.",
    },
    {
      question: "Can I get banned for using Purge 2.0?",
      answer:
        "While Purge 2.0 is designed to be undetectable with our advanced anti-detection systems, there's always an inherent risk when using any third-party software in online games. We maintain a 99.8% undetection rate across all supported games, but we cannot guarantee 100% safety. Use at your own risk and avoid obvious cheating behaviors like impossible flick shots or perfect spray patterns. Play naturally and don't make it obvious to other players.",
    },
  ]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
          <HelpCircle className="w-10 h-10 text-[#00ff88]" />
          Frequently Asked Questions
        </h1>
        <p className="text-gray-300 text-lg">
          Find answers to the most common questions about Purge 2.0 installation, configuration, and usage. These FAQs
          cover the essential information you need to get started.
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <FAQItem
            key={index}
            question={faq.question}
            answer={faq.answer}
            isOpen={openItems.includes(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>
    </div>
  )
}
