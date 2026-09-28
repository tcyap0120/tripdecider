import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip, getParticipantTrip } from '@/lib/trip'

export async function GET() {
  // Used by participant pages and the admin discussion page
  const ctx = (await getParticipantTrip()) ?? (await getAdminTrip())
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const messages = await prisma.message.findMany({
    where: { tripId: ctx.trip.id },
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
  const ctx = await getParticipantTrip()
  if (!ctx) {
    return NextResponse.json({ error: 'Only participants can send messages' }, { status: 403 })
  }

  const { content, destinationId } = await req.json()
  if (!content || !content.trim()) {
    return NextResponse.json({ error: 'Message content required' }, { status: 400 })
  }
  if (content.trim().length > 500) {
    return NextResponse.json({ error: 'Message too long (max 500 chars)' }, { status: 400 })
  }

  const participant = await prisma.participant.findUnique({ where: { id: ctx.participantId }, select: { displayName: true, username: true } })
  const authorName = participant?.displayName || participant?.username || ctx.session.username!

  const message = await prisma.message.create({
    data: {
      tripId: ctx.trip.id,
      participantId: ctx.participantId,
      username: authorName,
      content: content.trim(),
      destinationId: destinationId || null,
    },
  })

  return NextResponse.json(message, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 })

  await prisma.message.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
