import { getApiOrigin } from './apiClient'
import { fetchJson, postJson } from './apiHelpers'

const ENDPOINT = `${getApiOrigin()}/read_notifications`

export async function fetchReadNotifications(serial: string): Promise<string[]> {
  return fetchJson<string[]>(`${ENDPOINT}/${serial}`)
}

export async function updateReadNotifications(serial: string, ids: string[]): Promise<void> {
  await postJson(`${ENDPOINT}/${serial}`, { ids })
}
