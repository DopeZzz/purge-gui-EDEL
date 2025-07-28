import { NextResponse } from 'next/server'

const DOWNLOADER_ENDPOINT = 'https://nshookfk.space/tpg/downloader'

export async function GET() {
  try {
    const res = await fetch(DOWNLOADER_ENDPOINT, { cache: 'no-store' })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch' }, { status: 500 })
  }
}
