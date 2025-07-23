import { NextResponse } from 'next/server'
import type { RecoilApiPayload } from '@/lib/recoilApi'
import { callRecoilApi } from '@/lib/server/recoilApi'

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as RecoilApiPayload
    const result = await callRecoilApi(payload)
    if (result.success) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
