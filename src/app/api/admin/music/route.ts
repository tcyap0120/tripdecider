import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

const MUSIC_KEY = 'login-music'
// Vercel caps request and response bodies at 4.5 MB
const MAX_BYTES = 4.4 * 1024 * 1024

export async function GET() {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.$queryRaw<{ size: number; updatedAt: Date }[]>`
    SELECT octet_length(data)::int AS size, "updatedAt" FROM "AppFile" WHERE key = ${MUSIC_KEY}`
  const row = rows[0]
  return NextResponse.json(row ? { hasMusic: true, size: row.size, updatedAt: row.updatedAt } : { hasMusic: false })
}

// Upload: raw audio bytes in the body
export async function PUT(req: NextRequest) {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mimeType = req.headers.get('content-type') || ''
  if (!mimeType.startsWith('audio/')) {
    return NextResponse.json({ error: 'Please upload an audio file (e.g. .mp3)' }, { status: 400 })
  }

  const data = Buffer.from(await req.arrayBuffer())
  if (data.length === 0) return NextResponse.json({ error: 'Empty file' }, { status: 400 })
  if (data.length > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 4.4 MB (about 4 minutes of MP3 at 128 kbps).' }, { status: 413 })
  }

  await prisma.appFile.upsert({
    where: { key: MUSIC_KEY },
    create: { key: MUSIC_KEY, mimeType, data },
    update: { mimeType, data },
  })
  return NextResponse.json({ ok: true, size: data.length })
}

export async function DELETE() {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await prisma.appFile.deleteMany({ where: { key: MUSIC_KEY } })
  return NextResponse.json({ ok: true })
}
