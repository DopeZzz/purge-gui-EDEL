"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Key, Lock, Shield, LogIn } from "lucide-react"
import { handleLogin } from "./actions"

export default function LoginPage() {
  const [licenseKey, setLicenseKey] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (error) setError(null)
  }, [licenseKey, error])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!licenseKey.trim()) {
      setError("License key cannot be empty.")
      return
    }
    setIsLoading(true)
    setError(null)

    const result = await handleLogin(licenseKey)

    if (result.success && result.license) {
      if (result.licenseType) {
        try {
          localStorage.setItem('licenseType', result.licenseType)
          if (result.expiresAt) {
            localStorage.setItem('licenseExpiresAt', result.expiresAt)
          }
        } catch (_) {
          /* ignore */
        }
      }
      router.push(`/dashboard/${result.license}`)
    } else {
      setError(result.error || "Login failed. Please check your license key.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/images/purge-logo.png" alt="PURGE Logo" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Purge 2.0
          </h1>
          <p className="text-gray-400 mb-4">Rust Cloud Scripting</p>
        </div>

        <Card className="bg-gray-900/50 border-gray-700/50 shadow-2xl backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              
                <label className="flex justify-center items-center gap-2 mb-2 text-sm text-gray-300">
                  <Key className="w-4 h-4 text-green-400" />
                  Enter your license key:
                </label>

                <Input
                  id="licenseKey"
                  type="password"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="•••••••••••••••"
                  className="w-full bg-gray-800 border-gray-600 text-white placeholder-gray-500 h-12 text-center tracking-wider focus:border-green-500 focus:ring-green-500"
                  required
                />
              

              {error && <p className="text-sm text-red-400 bg-red-900/30 p-2 rounded-md text-center">{error}</p>}

              <Button
                type="submit"
                disabled={!licenseKey.trim() || isLoading}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-green-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="w-5 h-5 mr-2" />
                    Login
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-8">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} Purge 2.0. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
