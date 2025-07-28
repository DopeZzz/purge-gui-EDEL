import { getWsOrigin } from '@/lib/apiClient'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${getWsOrigin()}/${params.path.join('/')}`
  return NextResponse.json({ error: 'WebSocket proxy not implemented', target }, { status: 501 })
}
