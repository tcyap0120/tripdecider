import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getViewer } from '@/lib/trip'

const KEY = 'login-music'

// Login music, only for logged-in participants/admin. Never publicly reachable.
// Supports HTTP Range requests: Safari/iOS won't play audio without them.
export async function GET(req: NextRequest) {
  if (!(await getViewer())) return new NextResponse('Unauthorized', { status: 401 })

  const meta = await prisma.$queryRaw<{ size: number; mimeType: string }[]>`
    SELECT octet_length(data)::int AS size, "mimeType" FROM "AppFile" WHERE key = ${KEY}`
  if (!meta[0]) return new NextResponse('No music', { status: 404 })
  const { size, mimeType } = meta[0]

  const headers: Record<string, string> = {
    'Content-Type': mimeType,
    'Accept-Ranges': 'bytes',
    // private: browser may cache it, shared caches/CDN must not
    'Cache-Control': 'private, max-age=86400',
  }

  const range = req.headers.get('range')
  const match = range?.match(/^bytes=(\d*)-(\d*)$/)
  if (match && (match[1] || match[2])) {
    let start: number
    let end: number
    if (match[1]) {
      start = parseInt(match[1])
      end = match[2] ? Math.min(parseInt(match[2]), size - 1) : size - 1
    } else {
      // suffix range: last N bytes
      start = Math.max(size - parseInt(match[2]), 0)
      end = size - 1
    }
    if (start >= size || start > end) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
    }
    const length = end - start + 1
    const rows = await prisma.$queryRaw<{ chunk: Buffer }[]>`
      SELECT substring(data FROM ${start + 1}::int FOR ${length}::int) AS chunk FROM "AppFile" WHERE key = ${KEY}`
    return new NextResponse(new Uint8Array(rows[0].chunk), {
      status: 206,
      headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': String(length) },
    })
  }

  const file = await prisma.appFile.findUnique({ where: { key: KEY }, select: { data: true } })
  if (!file) return new NextResponse('No music', { status: 404 })
  return new NextResponse(new Uint8Array(file.data), {
    headers: { ...headers, 'Content-Length': String(size) },
  })
}
