import crypto from 'crypto'
import { getApiOrigin } from '../apiClient'
import type { RecoilApiPayload, SubmitResult } from '../recoilApi'
import { canonicalizePayload } from '../payloadUtils'
import { fetchVoid } from '../apiHelpers'

const API_ORIGIN = getApiOrigin()
const POST_ENDPOINT = `${API_ORIGIN}/recoil_license`
const API_SECRET = process.env.RECOIL_API_SECRET || ''

function hmacSignature(ts: string, raw: string): string {
  if (!API_SECRET) {
    throw new Error('RECOIL_API_SECRET is not configured')
  }
  return crypto.createHmac('sha256', API_SECRET).update(ts + raw).digest('hex')
}


export async function callRecoilApi(payload: RecoilApiPayload): Promise<SubmitResult> {
  if (!API_SECRET) {
    return { success: false, error: 'Server misconfiguration: RECOIL_API_SECRET is not set.' }
  }
  const rawBody = canonicalizePayload(payload)
  const timestamp = Date.now().toString()
  const signature = hmacSignature(timestamp, rawBody)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  }

  try {
    await fetchVoid(POST_ENDPOINT, { method: 'POST', headers, body: rawBody })
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'Unexpected error' }
  }
}
