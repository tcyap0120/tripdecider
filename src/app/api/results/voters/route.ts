import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip, getTripSettings } from '@/lib/trip'

// Who voted for which destination. Only available once the organiser has made results public.
export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const s = await getTripSettings(ctx.trip.id)
  if (s['resultsPublic'] !== 'true') return NextResponse.json({ error: 'Results are not public yet' }, { status: 403 })

  const [members, votes] = await Promise.all([
    prisma.tripParticipant.findMany({
      where: { tripId: ctx.trip.id },
      orderBy: { participant: { createdAt: 'asc' } },
      select: { participant: { select: { id: true, username: true, displayName: true } } },
    }),
    prisma.vote.findMany({
      where: { destination: { tripId: ctx.trip.id } },
      orderBy: { createdAt: 'asc' },
      select: { participantId: true, destinationId: true },
    }),
  ])

  return NextResponse.json(
    members.map(({ participant: p }) => ({
      id: p.id,
      name: p.displayName || p.username,
      isMe: p.id === ctx.participantId,
      destinationIds: votes.filter((v) => v.participantId === p.id).map((v) => v.destinationId),
    }))
  )
}
