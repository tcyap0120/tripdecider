import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip } from '@/lib/trip'

export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [dateOptions, myVotes] = await Promise.all([
    prisma.dateOption.findMany({
      where: { tripId: ctx.trip.id },
      orderBy: [{ order: 'asc' }, { date: 'asc' }],
      include: { _count: { select: { votes: true } } },
    }),
    prisma.dateVote.findMany({
      where: { participantId: ctx.participantId, dateOption: { tripId: ctx.trip.id } },
      select: { dateOptionId: true },
    }),
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
