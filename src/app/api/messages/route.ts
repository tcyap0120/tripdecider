import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await prisma.message.findMany({
    orderBy: { createdAt: 'asc' },
    take: 200,
    select: {
      id: true,
      username: true,
      content: true,
      destinationId: true,
      createdAt: true,
      participantId: true,
    },
  })

  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { content, destinationId } = await req.json()
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Message content required' }, { status: 400 })
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 })
  }

  const participantId = session.isAdmin ? null : session.userId

  if (!participantId) {
    return NextResponse.json({ error: 'Only participants can send messages' }, { status: 403 })
  }

  const participant = await prisma.participant.findUnique({ where: { id: participantId }, select: { displayName: true, username: true } })
  const authorName = participant?.displayName || participant?.username || session.username!

  const message = await prisma.message.create({
    data: {
      participantId,
      username: authorName,
      content: content.trim(),
      destinationId: destinationId || null,
    },
  })

  return NextResponse.json(message, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 })

  await prisma.message.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
