import { NextResponse } from 'next/server'
import { fetchDashboardConfigFromApi } from '@/lib/dashboardConfigApi'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ serial: string }> }   // ahora es Promise
) {
  const { serial } = await ctx.params            // ⬅️ await obligatorio
  const cfg = await fetchDashboardConfigFromApi(serial)

  return NextResponse.json(cfg ?? {})
}
