import { NextResponse } from 'next/server'
import { fetchReadNotificationsServer, updateReadNotificationsServer } from '@/lib/server/readNotificationsApi'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ serial: string }> }
) {
  const { serial } = await ctx.params
  try {
    const ids = await fetchReadNotificationsServer(serial)
    return NextResponse.json(ids)
  } catch (_) {
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(
  request: Request,
  ctx: { params: Promise<{ serial: string }> }
) {
  const { serial } = await ctx.params
  try {
    const { ids } = await request.json()
    await updateReadNotificationsServer(serial, ids)
    return NextResponse.json({ ok: true })
  } catch (_) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
