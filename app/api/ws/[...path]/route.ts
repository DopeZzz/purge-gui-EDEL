import { getWsOrigin } from '@/lib/apiClient'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const target = `${getWsOrigin()}/${params.path.join('/')}`
  // WebSocket traffic is handled via Next.js rewrites.
  // This endpoint is kept for completeness but returns 501.
  return NextResponse.json({ error: 'WebSocket proxy not implemented', target }, { status: 501 })
}
