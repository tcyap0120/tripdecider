import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip, listParticipantTrips } from '@/lib/trip'

// Trips the logged-in participant has been ticked for
export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ trips: [], currentTripId: null })

  const trips = await listParticipantTrips(ctx.participantId)
  const withCounts = await prisma.trip.findMany({
    where: { id: { in: trips.map((t) => t.id) } },
    select: {
      id: true,
      _count: { select: { destinations: true, participants: true } },
      destinations: { select: { photoUrl: true }, where: { photoUrl: { not: '' } }, take: 1, orderBy: { order: 'asc' } },
    },
  })
  const byId = new Map(withCounts.map((t) => [t.id, t]))

  // Per-trip results visibility, and whether this participant has seen the "results are ready" popup
  const tripIds = trips.map((t) => t.id)
  const [resultRows, memberships] = await Promise.all([
    prisma.settings.findMany({ where: { key: { in: tripIds.map((id) => `${id}:resultsPublic`) } } }),
    prisma.tripParticipant.findMany({
      where: { participantId: ctx.participantId, tripId: { in: tripIds } },
      select: { tripId: true, resultsSeenAt: true },
    }),
  ])
  const resultsPublic = new Set(resultRows.filter((r) => r.value === 'true').map((r) => r.key.split(':')[0]))
  const resultsSeen = new Set(memberships.filter((m) => m.resultsSeenAt).map((m) => m.tripId))

  return NextResponse.json({
    currentTripId: ctx.trip.id,
    trips: trips.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
      destinationCount: byId.get(t.id)?._count.destinations ?? 0,
      participantCount: byId.get(t.id)?._count.participants ?? 0,
      coverPhoto: byId.get(t.id)?.destinations[0]?.photoUrl ?? null,
      resultsPublic: resultsPublic.has(t.id),
      resultsSeen: resultsSeen.has(t.id),
    })),
  })
}

// Switch the participant's selected trip
export async function POST(req: NextRequest) {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await req.json()
  if (!tripId) return NextResponse.json({ error: 'tripId required' }, { status: 400 })

  const membership = await prisma.tripParticipant.findUnique({
    where: { tripId_participantId: { tripId, participantId: ctx.participantId } },
  })
  if (!membership) return NextResponse.json({ error: 'You are not part of this trip' }, { status: 403 })

  ctx.session.tripId = tripId
  await ctx.session.save()
  return NextResponse.json({ ok: true })
}
