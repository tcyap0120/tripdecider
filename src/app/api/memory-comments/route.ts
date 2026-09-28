import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip, getParticipantTrip } from '@/lib/trip'

async function getContext() {
  return (await getParticipantTrip()) ?? (await getAdminTrip())
}

export async function GET(req: NextRequest) {
  const ctx = await getContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memoryId = req.nextUrl.searchParams.get('memoryId')
  if (!memoryId) return NextResponse.json({ error: 'Missing memoryId' }, { status: 400 })

  const comments = await prisma.memoryComment.findMany({
    where: { memoryId, memory: { tripId: ctx.trip.id } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, username: true, content: true, createdAt: true, participantId: true },
  })

  return NextResponse.json(comments)
}

export async function POST(req: NextRequest) {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { memoryId, content } = await req.json()
  if (!memoryId || !content?.trim()) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  if (content.trim().length > 300) return NextResponse.json({ error: 'Too long' }, { status: 400 })

  const memory = await prisma.memory.findUnique({ where: { id: memoryId } })
  if (!memory || memory.tripId !== ctx.trip.id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const participant = await prisma.participant.findUnique({ where: { id: ctx.participantId } })
  if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comment = await prisma.memoryComment.create({
    data: {
      memoryId,
      participantId: ctx.participantId,
      username: participant.displayName || participant.username,
      content: content.trim(),
    },
    select: { id: true, username: true, content: true, createdAt: true, participantId: true },
  })

  return NextResponse.json(comment)
}

export async function DELETE(req: NextRequest) {
  const participantCtx = await getParticipantTrip()
  const ctx = participantCtx ?? (await getAdminTrip())
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const comment = await prisma.memoryComment.findUnique({ where: { id } })
  if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only allow deleting own comment (or admin)
  if (participantCtx && comment.participantId !== participantCtx.participantId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.memoryComment.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
