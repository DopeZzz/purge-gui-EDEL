import { type RecoilApiPayload, type SubmitResult } from '@/lib/recoilApi'

export async function submitConfiguration(payload: RecoilApiPayload): Promise<SubmitResult> {
  try {
    const res = await fetch('/api/recoil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return data as SubmitResult
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export type DashboardConfig = Partial<RecoilApiPayload> & Record<string, any>

export async function fetchDashboardConfig(serial: string): Promise<DashboardConfig | null> {
  try {
    const res = await fetch(`/api/dashboard-config/${serial}`)
    if (!res.ok) return null
    const data = await res.json()
    return data
  } catch (_) {
    return null
  }
}
