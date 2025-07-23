"use client"

import { Play, ExternalLink } from "lucide-react"

export function YouTubeEmbed() {
  const videoId = "gtFegSY36es"
  const title = "Video Tutorial"

  return (
    <div className="bg-[#141b3c]/80 rounded-lg p-4 border border-[#2a3284]/40">
      <div className="flex items-center gap-2 mb-3">
        <Play className="w-4 h-4 text-[#00ff88]" />
        <h3 className="text-white text-sm font-medium">Video Tutorial</h3>
      </div>
      <div className="aspect-video rounded-md overflow-hidden bg-black mb-3">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[#00ff88] hover:text-[#00cc6a] text-xs font-medium flex items-center gap-1 transition-colors"
      >
        <ExternalLink className="w-3 h-3" />
        Watch on YouTube
      </a>
    </div>
  )
  
}
