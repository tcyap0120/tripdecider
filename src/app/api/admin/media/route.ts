import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null
  return session
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { destinationId, photoUrl, caption } = await req.json()
  if (!destinationId || !photoUrl) {
    return NextResponse.json({ error: 'destinationId and photoUrl required' }, { status: 400 })
  }

  const media = await prisma.destinationMedia.create({
    data: { destinationId, photoUrl, caption: caption || '' },
  })

  return NextResponse.json(media, { status: 201 })
}
