import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

// Switch which trip the admin panel is managing
export async function POST(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { tripId } = await req.json()
  const trip = tripId ? await prisma.trip.findUnique({ where: { id: tripId } }) : null
  if (!trip) return NextResponse.json({ error: 'Trip not found' }, { status: 404 })

  ctx.session.adminTripId = trip.id
  await ctx.session.save()
  return NextResponse.json({ ok: true })
}
