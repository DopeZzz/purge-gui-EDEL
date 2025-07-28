export interface AuthApiResult {
  success: boolean
  license?: string
  licenseType?: string
  expiresAt?: string
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
      license: data.license,
      licenseType: data.license_type,
      expiresAt: data.expires_at,
      token: data.token,
      config: data.config,
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unexpected error' }
  }
}
