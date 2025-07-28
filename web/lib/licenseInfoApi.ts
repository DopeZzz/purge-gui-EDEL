import { getApiOrigin } from './apiClient'
import { fetchJson } from './apiHelpers'

export interface LicenseInfo {
  expires_at: string | null
  time_left: number | null
}

const ENDPOINT = `${getApiOrigin()}/license_info`

export async function fetchLicenseInfo(serial: string): Promise<LicenseInfo> {
  return fetchJson<LicenseInfo>(`${ENDPOINT}/${serial}`)
}
