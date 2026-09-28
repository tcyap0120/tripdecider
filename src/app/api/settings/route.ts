import { NextResponse } from 'next/server'
import { getParticipantTrip, getTripSettings, toPublicSettings } from '@/lib/trip'

export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const s = await getTripSettings(ctx.trip.id)
  return NextResponse.json(toPublicSettings(s, ctx.trip.status))
}
