import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip, getTripSettings, toPublicSettings } from '@/lib/trip'

export async function POST(req: NextRequest) {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = toPublicSettings(await getTripSettings(ctx.trip.id), ctx.trip.status)
  if (!settings.votingOpen) {
    return NextResponse.json({ error: 'Voting is closed' }, { status: 403 })
  }

  const { destinationId } = await req.json()
  if (!destinationId) return NextResponse.json({ error: 'destinationId required' }, { status: 400 })

  const destination = await prisma.destination.findUnique({ where: { id: destinationId } })
  if (!destination || destination.tripId !== ctx.trip.id) {
    return NextResponse.json({ error: 'Destination not found' }, { status: 404 })
  }

  const tripVotes = { participantId: ctx.participantId, destination: { tripId: ctx.trip.id } }
  const used = await prisma.vote.count({ where: tripVotes })
  if (used >= ctx.voteCount) {
    return NextResponse.json({ error: 'No votes remaining' }, { status: 400 })
  }

  const existing = await prisma.vote.findUnique({
    where: { participantId_destinationId: { participantId: ctx.participantId, destinationId } },
  })
  if (existing) return NextResponse.json({ error: 'Already voted for this destination' }, { status: 409 })

  await prisma.vote.create({ data: { participantId: ctx.participantId, destinationId } })

  const updatedCount = await prisma.vote.count({ where: tripVotes })

  return NextResponse.json({
    ok: true,
    remainingVotes: ctx.voteCount - updatedCount,
  })
}

export async function DELETE(req: NextRequest) {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = toPublicSettings(await getTripSettings(ctx.trip.id), ctx.trip.status)
  if (!settings.votingOpen) {
    return NextResponse.json({ error: 'Voting is closed' }, { status: 403 })
  }

  const { destinationId } = await req.json()
  if (!destinationId) return NextResponse.json({ error: 'destinationId required' }, { status: 400 })

  const tripVotes = { participantId: ctx.participantId, destination: { tripId: ctx.trip.id } }
  await prisma.vote.deleteMany({ where: { ...tripVotes, destinationId } })

  const used = await prisma.vote.count({ where: tripVotes })

  return NextResponse.json({
    ok: true,
    remainingVotes: ctx.voteCount - used,
  })
}
