"use client"

import { MessageCircle, Users, HelpCircle, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"

export function DiscordContent() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-3 flex items-center gap-3">
          <MessageCircle className="w-10 h-10 text-[#00ff88]" />
          Discord Support
        </h1>
        <p className="text-gray-300 text-lg">
          Join our active community for instant support, updates, feature requests, and to connect with other Purge 2.0
          users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-[#141b3c]/80 rounded-lg p-8 border border-[#2a3284]/40 text-center">
          <div className="w-16 h-16 bg-[#5865F2] rounded-full flex items-center justify-center mx-auto mb-6">
            <MessageCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">Public Discord Server</h2>
          <p className="text-gray-300 mb-6 text-base">
            Primary community hub with general support, discussions, announcements, and community events. 
          </p>
          <Button
            className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-8 py-3 font-semibold w-full text-base"
            onClick={() => window.open("https://discord.gg/BZCA4fNceS", "_blank")}
          >
            Join Public Server
          </Button>
        </div>

        <div className="bg-[#141b3c]/80 rounded-lg p-8 border border-[#2a3284]/40 text-center">
          <div className="w-16 h-16 bg-[#00ff88] rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-semibold text-white mb-4">Private Discord Server</h2>
          <p className="text-gray-300 mb-6 text-base">
            Exclusive server for premium users with priority support, beta features, advanced configurations, and direct
            developer access.
          </p>
          <Button
            className="bg-[#00ff88] hover:bg-[#00cc6a] text-black px-8 py-3 font-semibold w-full text-base"
            onClick={() => window.open("https://discord.gg/hJKKdbBFDE", "_blank")}
          >
            Join Private Server
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
          <div className="flex items-center gap-3 mb-4">
            <HelpCircle className="w-6 h-6 text-[#00ff88]" />
            <h3 className="text-xl font-semibold text-white">Support Services</h3>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">24/7 Technical Support:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Round-the-clock assistance from our experienced support team
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Installation Assistance:</strong>
                <p className="text-sm text-gray-400 mt-1">Step-by-step help with installation and initial setup</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Configuration Help:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Personalized settings optimization for your playstyle and hardware
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Troubleshooting Guides:</strong>
                <p className="text-sm text-gray-400 mt-1">Comprehensive guides and solutions for common issues</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-[#00ff88]" />
            <h3 className="text-xl font-semibold text-white">Community Features</h3>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Active Community:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Over 5,000+ active members sharing tips, strategies, and gameplay clips
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Gameplay Sharing:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Dedicated channels for sharing your best moments and learning from others
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Team Finding:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Connect with other players to form teams and dominate servers together
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Weekly Events:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Participate in community events, tournaments, and giveaways
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-[#141b3c]/80 rounded-lg p-6 border border-[#2a3284]/40">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-3">
          <Shield className="w-6 h-6 text-[#00ff88]" />
          Discord Rules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">No Spamming:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Avoid flooding channels with messages, emojis, or tags.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Use Appropriate Channels:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Stick to the intended topic of each channel.
                </p>
              </div>
            </li>
          </ul>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">No NSFW Content:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Do not share inappropriate or adult content.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-[#00ff88] mt-1">•</span>
              <div>
                <strong className="text-white text-base">Respect Others:</strong>
                <p className="text-sm text-gray-400 mt-1">
                  Harassment, hate speech, and toxic behavior will not be tolerated.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
