import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip, getTripSettings } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const tripId = ctx.trip.id

  const [destinations, members, s, tierTwoVotes] = await Promise.all([
    prisma.destination.findMany({
      where: { tripId },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { votes: true } },
        media: { orderBy: { createdAt: 'asc' } },
        votes: { include: { participant: { select: { displayName: true, username: true } } } },
      },
    }),
    prisma.tripParticipant.findMany({
      where: { tripId },
      orderBy: { participant: { createdAt: 'asc' } },
      include: {
        participant: {
          include: { votes: { where: { destination: { tripId } }, select: { destinationId: true } } },
        },
      },
    }),
    getTripSettings(tripId),
    // graceful fallback if TierTwoVote table not yet migrated in production
    prisma.tierTwoVote.findMany({
      where: { destination: { tripId } },
      include: { participant: { select: { username: true } } },
    }).catch(() => [] as { destinationId: string; participantId: string; participant: { username: string } }[]),
  ])

  const tierTwoOpen = s['tierTwoOpen'] === 'true'
  const tierTwoDestinationIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)

  const tierTwoDestinations = tierTwoDestinationIds.length >= 2
    ? destinations
        .filter((d) => tierTwoDestinationIds.includes(d.id))
        .map((d) => {
          const t2votes = tierTwoVotes.filter((v) => v.destinationId === d.id)
          return {
            id: d.id,
            name: d.name,
            photoUrl: d.photoUrl,
            voteCount: t2votes.length,
            voters: t2votes.map((v) => v.participant.username),
          }
        })
    : []

  const uniqueT2Voters = new Set(tierTwoVotes.map((v) => v.participantId))

  return NextResponse.json({
    trip: ctx.trip,
    destinations: destinations.map((d) => ({
      ...d,
      tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
      voteCount: d._count.votes,
      voters: d.votes.map((v) => v.participant.displayName || v.participant.username),
    })),
    participants: members.map(({ participant: p, voteCount }) => ({
      id: p.id,
      username: p.username,
      displayName: p.displayName || '',
      voteCount,
      votesUsed: p.votes.length,
      remainingVotes: voteCount - p.votes.length,
      createdAt: p.createdAt,
      votedFor: p.votes.map((v) => v.destinationId),
    })),
    settings: {
      resultsPublic: s['resultsPublic'] === 'true',
      votingOpen: s['votingOpen'] !== 'false',
      announcement: s['announcement'] || '',
      dateVotingOpen: s['dateVotingOpen'] === 'true',
      tierTwoOpen,
      tierTwoResultsPublic: s['tierTwoResultsPublic'] === 'true',
    },
    tierTwo: {
      tierTwoOpen,
      totalParticipants: members.length,
      votedCount: uniqueT2Voters.size,
      destinations: tierTwoDestinations,
    },
  })
}
