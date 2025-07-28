import { NextResponse } from 'next/server'
import { callLoginApiServer } from '@/lib/server/loginApi'

export async function POST(request: Request) {
  try {
    const { serial } = await request.json()
    const result = await callLoginApiServer(serial)
    if (result.success) {
      return NextResponse.json(result)
    } else {
      return NextResponse.json(result, { status: 400 })
    }
  } catch (_) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
