import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip, getTripSettings } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tripId = ctx.trip.id

  const [s, totalParticipants] = await Promise.all([
    getTripSettings(tripId),
    prisma.tripParticipant.count({ where: { tripId } }),
  ])

  const tierTwoOpen = s['tierTwoOpen'] === 'true'
  const destinationIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)

  if (destinationIds.length < 2) {
    return NextResponse.json({ tierTwoOpen, destinations: [], totalParticipants, votedCount: 0 })
  }

  const [destinations, allTierTwoVotes] = await Promise.all([
    prisma.destination.findMany({
      where: { id: { in: destinationIds }, tripId },
      include: {
        _count: { select: { tierTwoVotes: true } },
        tierTwoVotes: { include: { participant: { select: { username: true } } } },
      },
    }),
    prisma.tierTwoVote.findMany({
      where: { destination: { tripId } },
      select: { participantId: true },
      distinct: ['participantId'],
    }),
  ])

  return NextResponse.json({
    tierTwoOpen,
    totalParticipants,
    votedCount: allTierTwoVotes.length,
    destinations: destinations.map((d) => ({
      id: d.id,
      name: d.name,
      photoUrl: d.photoUrl,
      voteCount: d._count.tierTwoVotes,
      voters: d.tierTwoVotes.map((v) => v.participant.username),
    })),
  })
}
