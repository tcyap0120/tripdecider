import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { dataUrl, filename } = await req.json()
  if (!dataUrl) return NextResponse.json({ error: 'No image data' }, { status: 400 })

  // If no Blob token, return the dataUrl as-is (graceful fallback)
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ url: dataUrl })
  }

  const base64 = dataUrl.split(',')[1]
  const mimeType = dataUrl.split(';')[0].split(':')[1] || 'image/jpeg'
  const buffer = Buffer.from(base64, 'base64')

  const blob = await put(filename || `photo-${Date.now()}.jpg`, buffer, {
    access: 'public',
    contentType: mimeType,
  })

  return NextResponse.json({ url: blob.url })
}
