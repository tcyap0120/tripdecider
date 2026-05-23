import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function POST(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.isLoggedIn || session.isAdmin || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const votingOpenRow = await prisma.settings.findUnique({ where: { key: 'votingOpen' } })
  if (votingOpenRow?.value === 'false') {
    return NextResponse.json({ error: 'Voting is closed' }, { status: 403 })
  }

  const { destinationId } = await req.json()
  if (!destinationId) return NextResponse.json({ error: 'destinationId required' }, { status: 400 })

  const participant = await prisma.participant.findUnique({
    where: { id: session.userId },
    include: { _count: { select: { votes: true } } },
  })

  if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 })

  if (participant._count.votes >= participant.voteCount) {
    return NextResponse.json({ error: 'No votes remaining' }, { status: 400 })
  }

  const destination = await prisma.destination.findUnique({ where: { id: destinationId } })
  if (!destination) return NextResponse.json({ error: 'Destination not found' }, { status: 404 })

  const existing = await prisma.vote.findUnique({
    where: { participantId_destinationId: { participantId: session.userId, destinationId } },
  })
  if (existing) return NextResponse.json({ error: 'Already voted for this destination' }, { status: 409 })

  await prisma.vote.create({ data: { participantId: session.userId, destinationId } })

  const updatedCount = await prisma.vote.count({ where: { participantId: session.userId } })

  return NextResponse.json({
    ok: true,
    remainingVotes: participant.voteCount - updatedCount,
  })
}

export async function DELETE(req: NextRequest) {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.isLoggedIn || session.isAdmin || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { destinationId } = await req.json()
  if (!destinationId) return NextResponse.json({ error: 'destinationId required' }, { status: 400 })

  await prisma.vote.deleteMany({
    where: { participantId: session.userId, destinationId },
  })

  const participant = await prisma.participant.findUnique({
    where: { id: session.userId },
    include: { _count: { select: { votes: true } } },
  })

  return NextResponse.json({
    ok: true,
    remainingVotes: participant ? participant.voteCount - participant._count.votes : 0,
  })
}
