"use server"

import { callLoginApi } from "@/lib/loginApi"

interface LoginResult {
  success: boolean
  license?: string
  licenseType?: string
  expiresAt?: string
  error?: string
}

export async function handleLogin(licenseKey: string): Promise<LoginResult> {
  if (!licenseKey || licenseKey.trim() === "") {
    return { success: false, error: "License key cannot be empty." }
  }

  const result = await callLoginApi(licenseKey)

  if (result.success) {
    return { 
      success: true, 
      license: licenseKey, 
      licenseType: result.licenseType || result.license,
      expiresAt: result.expiresAt
    }
  }
  return {
    success: false,
    error: result.error || "Invalid license key or API error."
  }
}
