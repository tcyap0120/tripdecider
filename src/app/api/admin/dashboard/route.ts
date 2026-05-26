import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [destinations, participants, settingsRows, tierTwoVotes] = await Promise.all([
    prisma.destination.findMany({
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
      include: {
        _count: { select: { votes: true } },
        media: { orderBy: { createdAt: 'asc' } },
        votes: { include: { participant: { select: { displayName: true, username: true } } } },
      },
    }),
    prisma.participant.findMany({
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { votes: true } },
        votes: { select: { destinationId: true } },
      },
    }),
    prisma.settings.findMany(),
    // graceful fallback if TierTwoVote table not yet migrated in production
    prisma.tierTwoVote.findMany({
      include: { participant: { select: { username: true } } },
    }).catch(() => [] as { destinationId: string; participantId: string; participant: { username: string } }[]),
  ])

  const s: Record<string, string> = {}
  for (const r of settingsRows) s[r.key] = r.value

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
    destinations: destinations.map((d) => ({
      ...d,
      tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
      voteCount: d._count.votes,
      voters: d.votes.map((v) => v.participant.displayName || v.participant.username),
    })),
    participants: participants.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.displayName || '',
      voteCount: p.voteCount,
      votesUsed: p._count.votes,
      remainingVotes: p.voteCount - p._count.votes,
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
      totalParticipants: participants.length,
      votedCount: uniqueT2Voters.size,
      destinations: tierTwoDestinations,
    },
  })
}
