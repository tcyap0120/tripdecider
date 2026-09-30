import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { getParticipantTrip } from '@/lib/trip'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.isLoggedIn || !session.userId || session.isAdmin) {
    return NextResponse.json({ isLoggedIn: false })
  }

  const participant = await prisma.participant.findUnique({ where: { id: session.userId } })
  if (!participant) {
    return NextResponse.json({ isLoggedIn: false })
  }

  const ctx = await getParticipantTrip()
  const votesUsed = ctx
    ? await prisma.vote.count({ where: { participantId: participant.id, destination: { tripId: ctx.trip.id } } })
    : 0
  const voteCount = ctx?.voteCount ?? 0

  return NextResponse.json({
    isLoggedIn: true,
    userId: session.userId,
    username: session.username,
    displayName: participant.displayName || participant.username,
    voteCount,
    votesUsed,
    remainingVotes: voteCount - votesUsed,
    trip: ctx ? { id: ctx.trip.id, name: ctx.trip.name, status: ctx.trip.status } : null,
    welcomeSeen: ctx?.welcomeSeen ?? true,
    resultsSeen: ctx?.resultsSeen ?? true,
  })
}
