"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DownloadPage() {
  const params = useParams()
  const licenseKey = params.license as string | undefined
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [downloadStarted, setDownloadStarted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function fetchDownload() {
      try {
        const endpoint = licenseKey ? `/api/downloader?serial=${licenseKey}` : "/api/downloader"
        const res = await fetch(endpoint)
        if (!res.ok) throw new Error("Failed to start download")
        const data = await res.json()
        const url = data.download_url as string | undefined
        if (!url) throw new Error("No download url")
        const link = document.createElement("a")
        link.href = url
        link.download = ""
        document.body.appendChild(link)
        link.click()
        link.remove()
        setLoading(false)
        setDownloadStarted(true)
      } catch (err: any) {
        setLoading(false)
        setError(err.message || "Unexpected error")
      }
    }
    fetchDownload()
  }, [])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 text-white"
      style={{ background: "var(--background-gradient)" }}
    >
      <div className="text-center space-y-4">
        <Image src="/images/purge-logo.png" alt="PURGE Logo" width={80} height={80} className="mx-auto" />
        {error ? (
          <p className="text-red-400">{error}</p>
        ) : loading ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="text-xl font-semibold">Downloading...</p>
            <p className="text-sm text-gray-300">Please wait while your file is prepared.</p>
          </div>
        ) : downloadStarted ? (
          <div className="flex flex-col items-center space-y-4">
            <p className="text-xl font-semibold">Your download should begin shortly.</p>
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/${licenseKey ?? ""}`)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white px-8 py-3 rounded-lg transition-all duration-200"
            >
              Go Back
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}
