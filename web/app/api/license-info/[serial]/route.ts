import { NextResponse } from 'next/server'
import { fetchLicenseInfoServer } from '@/lib/server/licenseInfoApi'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ serial: string }> }
) {
  const { serial } = await ctx.params
  const info = await fetchLicenseInfoServer(serial)
  return NextResponse.json(info)
}
