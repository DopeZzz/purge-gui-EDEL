import type { RecoilApiPayload } from './recoilApi'

export function canonicalizePayload(payload: RecoilApiPayload): string {
  const entries = Object.entries(payload)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => {
      let valueStr: string
      if (typeof v === 'number') {
        valueStr = Number.isInteger(v) ? v.toFixed(1) : v.toString()
      } else {
        valueStr = JSON.stringify(v)
      }
      return `"${k}":${valueStr}`
    })
  return `{${entries.join(',')}}`
}
