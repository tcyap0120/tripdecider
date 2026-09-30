import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip } from '@/lib/trip'

// Mark the "results are ready" popup as seen for a trip (defaults to the current trip)
export async function POST(req: NextRequest) {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const tripId: string = body?.tripId || ctx.trip.id

  await prisma.tripParticipant.updateMany({
    where: { tripId, participantId: ctx.participantId, resultsSeenAt: null },
    data: { resultsSeenAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
