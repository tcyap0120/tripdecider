import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [trips, participants] = await Promise.all([
    prisma.trip.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        participants: { select: { participantId: true } },
        _count: { select: { destinations: true, dateOptions: true } },
      },
    }),
    prisma.participant.findMany({
      orderBy: { createdAt: 'asc' },
      select: { id: true, username: true, displayName: true },
    }),
  ])

  return NextResponse.json({
    currentTripId: ctx.trip.id,
    participants,
    trips: trips.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
      participantIds: t.participants.map((p) => p.participantId),
      destinationCount: t._count.destinations,
      dateOptionCount: t._count.dateOptions,
    })),
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name, description, participantIds } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Trip name is required' }, { status: 400 })

  const ids: string[] = Array.isArray(participantIds) ? participantIds : []
  const selected = await prisma.participant.findMany({
    where: { id: { in: ids } },
    select: { id: true, voteCount: true },
  })

  const trip = await prisma.trip.create({
    data: {
      name: name.trim(),
      description: description?.trim() || '',
      status: 'active',
      participants: { create: selected.map((p) => ({ participantId: p.id, voteCount: p.voteCount })) },
    },
  })

  // Start managing the new trip straight away
  ctx.session.adminTripId = trip.id
  await ctx.session.save()

  return NextResponse.json(trip, { status: 201 })
}
