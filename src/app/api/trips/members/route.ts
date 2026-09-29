import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip } from '@/lib/trip'

// Who's on the participant's current trip. Names only — no voting status.
export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const members = await prisma.tripParticipant.findMany({
    where: { tripId: ctx.trip.id },
    orderBy: { participant: { createdAt: 'asc' } },
    select: { participant: { select: { id: true, username: true, displayName: true } } },
  })

  return NextResponse.json(
    members.map(({ participant: p }) => ({
      id: p.id,
      name: p.displayName || p.username,
      isMe: p.id === ctx.participantId,
    }))
  )
}
