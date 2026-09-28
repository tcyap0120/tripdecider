import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip } from '@/lib/trip'

export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const memories = await prisma.memory.findMany({ where: { tripId: ctx.trip.id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(memories)
}
