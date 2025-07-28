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
        "Yes, Purge 2.0 uses cutting-edge anti-detection methods including unique builds, memory encryption, and randomized execution patterns. Our system has remained undetected for over 2 years, with frequent updates to stay ahead of anti-cheat technologies. These techniques ensure maximum safety for all users.",
    },
    {
      question: "How do I install Purge 2.0 if Windows Defender blocks it?",
      answer:
        "This is a false positive caused by unsigned modules. To ensure proper installation, especially for the Module Connector, you must disable real-time protection and antivirus temporarily during setup. Once installed, you can safely turn your protection back on.",
    },
    {
      question: "Will the script stop working after a game update?",
      answer:
        "No, Purge 2.0 will continue working normally even right after a game update. There's no need to stop or pause its use. The only exception is if the update includes changes to weapons or recoil patterns—in that case, we’ll release a quick update. Otherwise, the script remains fully functional and undetected.",
    },
    {
      question: "How do I configure Purge 2.0 for the best performance?",
      answer:
        "You don’t need to change your playstyle or settings — just match your exact in-game configuration (sensitivity, ADS, and FOV) in the script. Purge 2.0 is designed to work perfectly with your personal setup. If you're not sure how to do it, visit the How to Configure It section for a quick guide.",
    },
    {
      question: "Can I get banned for using Purge 2.0?",
      answer:
        "It’s extremely unlikely to be banned while using Purge 2.0. The script runs entirely in the cloud, meaning nothing is injected or executed on your PC — game anti-cheats have no access to it. The Module Connector is a unique build, adding an extra layer of protection and making detection nearly impossible. As always, play naturally and avoid drawing attention in-game.",
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
