import { getApiOrigin } from './apiClient'
import { fetchJson } from './apiHelpers'

export type DashboardConfig = Record<string, any>

export async function fetchDashboardConfigFromApi(serial: string): Promise<DashboardConfig | null> {
  try {
    return await fetchJson<DashboardConfig>(`${getApiOrigin()}/dashboard_config/${serial}`)
  } catch (_) {
    return null
  }
}
