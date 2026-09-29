import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name, description, status } = await req.json()

  const data: { name?: string; description?: string; status?: string } = {}
  if (typeof name === 'string' && name.trim()) data.name = name.trim()
  if (typeof description === 'string') data.description = description.trim()
  if (status === 'active' || status === 'past') data.status = status

  const trip = await prisma.trip.update({ where: { id }, data })
  return NextResponse.json(trip)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  if ((await prisma.trip.count()) <= 1) {
    return NextResponse.json({ error: 'You need at least one trip' }, { status: 400 })
  }

  // Destinations, votes, dates and chat for this trip cascade-delete.
  // Memories are shared across trips, so detach them first to keep them.
  await prisma.$transaction([
    prisma.memory.updateMany({ where: { tripId: id }, data: { tripId: null } }),
    prisma.settings.deleteMany({ where: { key: { startsWith: `${id}:` } } }),
    prisma.trip.delete({ where: { id } }),
  ])

  if (ctx.session.adminTripId === id) {
    ctx.session.adminTripId = undefined
    await ctx.session.save()
  }
  return NextResponse.json({ ok: true })
}
