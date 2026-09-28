import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip, getTripSettings, toPublicSettings } from '@/lib/trip'

// Returns the participant context if date voting is open and the option belongs to their trip
async function authorize(dateOptionId: string | undefined) {
  const ctx = await getParticipantTrip()
  if (!ctx) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  if (!dateOptionId) return { error: NextResponse.json({ error: 'Missing dateOptionId' }, { status: 400 }) }

  const settings = toPublicSettings(await getTripSettings(ctx.trip.id), ctx.trip.status)
  if (!settings.dateVotingOpen) return { error: NextResponse.json({ error: 'Date voting is closed' }, { status: 403 }) }

  const option = await prisma.dateOption.findUnique({ where: { id: dateOptionId } })
  if (!option || option.tripId !== ctx.trip.id) {
    return { error: NextResponse.json({ error: 'Date option not found' }, { status: 404 }) }
  }
  return { ctx }
}

export async function POST(req: NextRequest) {
  const { dateOptionId } = await req.json()
  const { ctx, error } = await authorize(dateOptionId)
  if (error) return error

  await prisma.dateVote.upsert({
    where: { participantId_dateOptionId: { participantId: ctx.participantId, dateOptionId } },
    create: { participantId: ctx.participantId, dateOptionId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { dateOptionId } = await req.json()
  const { ctx, error } = await authorize(dateOptionId)
  if (error) return error

  await prisma.dateVote.deleteMany({
    where: { participantId: ctx.participantId, dateOptionId },
  })

  return NextResponse.json({ ok: true })
}
