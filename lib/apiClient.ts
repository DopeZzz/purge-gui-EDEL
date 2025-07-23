export function getApiOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_RECOIL_API_ORIGIN || process.env.RECOIL_API_ORIGIN
  if (!raw) {
    throw new Error('RECOIL_API_ORIGIN is not configured')
  }
  return raw.replace(/\/$/, '')
}

export function getWsOrigin(): string {
  const api = getApiOrigin()
  if (api.startsWith('https://')) return api.replace('https://', 'wss://')
  if (api.startsWith('http://')) return api.replace('http://', 'ws://')
  return api
}
