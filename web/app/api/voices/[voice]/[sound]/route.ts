import { promises as fs } from 'fs'
import { join } from 'path'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: Request,
  ctx: { params: { voice: string; sound: string } },
) {
  const { voice, sound } = ctx.params
  const normalizedSound = sound.endsWith('.mp3')
    ? sound.slice(0, -4)
    : sound
  const filePath = join(
    process.cwd(),
    'public',
    'voices',
    voice,
    `${normalizedSound}.mp3`,
  )
  try {
    const data = await fs.readFile(filePath)
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Voice not found' }, { status: 404 })
  }
}
