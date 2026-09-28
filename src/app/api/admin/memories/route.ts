import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const memories = await prisma.memory.findMany({ where: { tripId: ctx.trip.id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json(memories)
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { photoUrl, caption } = await req.json()
  if (!photoUrl) return NextResponse.json({ error: 'Photo is required' }, { status: 400 })
  const memory = await prisma.memory.create({ data: { tripId: ctx.trip.id, photoUrl, caption: caption || '' } })
  return NextResponse.json(memory)
}
