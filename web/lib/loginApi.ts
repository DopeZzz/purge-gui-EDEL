export interface AuthApiResult {
  success: boolean
  license?: string
  licenseType?: string
  expiresAt?: string
  timeLeft?: number
  token?: string
  config?: any
  error?: string
}

import { getApiOrigin } from './apiClient'
import { postJson } from './apiHelpers'

const LOGIN_ENDPOINT = `${getApiOrigin()}/login`

export async function callLoginApi(serial: string): Promise<AuthApiResult> {
  try {
    const data = await postJson<any>(LOGIN_ENDPOINT, { serial })
    return {
      success: true,
      license: serial,
      licenseType: data.license_type || data.license,
      expiresAt: data.expires_at,
      timeLeft: typeof data.time_left === 'number' ? data.time_left : undefined,
      token: data.token,
      config: data.config,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error' }
  }
}
