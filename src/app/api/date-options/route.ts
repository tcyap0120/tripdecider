import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [dateOptions, myVotes] = await Promise.all([
    prisma.dateOption.findMany({
      orderBy: [{ order: 'asc' }, { date: 'asc' }],
      include: { _count: { select: { votes: true } } },
    }),
    session.userId
      ? prisma.dateVote.findMany({ where: { participantId: session.userId }, select: { dateOptionId: true } })
      : [],
  ])

  const votedIds = new Set(myVotes.map((v) => v.dateOptionId))

  return NextResponse.json(
    dateOptions.map((d) => ({
      id: d.id,
      date: d.date,
      label: d.label,
      voteCount: d._count.votes,
      hasVoted: votedIds.has(d.id),
    }))
  )
}
