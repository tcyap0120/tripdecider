import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip } from '@/lib/trip'

// Mark the first-visit welcome popup as seen for the participant's current trip
export async function POST() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.tripParticipant.update({
    where: { tripId_participantId: { tripId: ctx.trip.id, participantId: ctx.participantId } },
    data: { welcomeSeenAt: new Date() },
  })
  return NextResponse.json({ ok: true })
}
