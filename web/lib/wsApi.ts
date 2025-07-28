import { getWsOrigin } from './apiClient'
import type { RecoilApiPayload } from './recoilApi'
import { canonicalizePayload } from './payloadUtils'

let nodeCrypto: typeof import('crypto') | null = null
if (typeof window === 'undefined') {
  try {
    nodeCrypto = require('crypto')
  } catch {
    nodeCrypto = null
  }
}


async function hmacSignature(secret: string, ts: string, raw: string): Promise<string> {
  if (nodeCrypto) {
    return nodeCrypto.createHmac('sha256', secret).update(ts + raw).digest('hex')
  }
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(ts + raw))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function sendAndWait(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${getWsOrigin()}/ws`)
    ws.onerror = (ev) => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CLOSING) {
        ws.close()
      }
      reject(new Error('ws error'))
    }
    ws.onmessage = (ev) => {
      try {
        const res = JSON.parse(ev.data)
        resolve(res)
      } catch {
        reject(new Error('bad response'))
      } finally {
        ws.close()
      }
    }
    ws.onopen = () => {
      ws.send(JSON.stringify(data))
    }
  })
}

export async function wsLogin(serial: string) {
  const res = await sendAndWait({ cmd: 'login', serial })
  if (res.ok) return res.data
  throw new Error(res.error || 'login failed')
}

export async function wsRecoil(payload: RecoilApiPayload, secret: string) {
  const raw = canonicalizePayload(payload)
  const ts = Date.now().toString()
  const sig = await hmacSignature(secret, ts, raw)
  const res = await sendAndWait({ cmd: 'recoil_license', raw, ts, sig })
  if (!res.ok) throw new Error(res.error || 'recoil error')
}

export async function wsDashboardConfig(serial: string) {
  const res = await sendAndWait({ cmd: 'dashboard_config', serial })
  if (res.ok) return res.config as any
  throw new Error(res.error || 'config error')
}
