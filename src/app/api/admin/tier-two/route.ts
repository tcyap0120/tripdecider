import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [settingsRows, totalParticipants] = await Promise.all([
    prisma.settings.findMany(),
    prisma.participant.count(),
  ])

  const s: Record<string, string> = {}
  for (const r of settingsRows) s[r.key] = r.value

  const tierTwoOpen = s['tierTwoOpen'] === 'true'
  const destinationIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)

  if (destinationIds.length < 2) {
    return NextResponse.json({ tierTwoOpen, destinations: [], totalParticipants, votedCount: 0 })
  }

  const [destinations, allTierTwoVotes] = await Promise.all([
    prisma.destination.findMany({
      where: { id: { in: destinationIds } },
      include: {
        _count: { select: { tierTwoVotes: true } },
        tierTwoVotes: { include: { participant: { select: { username: true } } } },
      },
    }),
    prisma.tierTwoVote.findMany({ select: { participantId: true }, distinct: ['participantId'] }),
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
