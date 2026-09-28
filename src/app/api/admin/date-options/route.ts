import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [dateOptions, participants] = await Promise.all([
    prisma.dateOption.findMany({
      where: { tripId: ctx.trip.id },
      orderBy: [{ order: 'asc' }, { date: 'asc' }],
      include: {
        votes: {
          include: { participant: { select: { id: true, username: true, displayName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.participant.findMany({
      where: { trips: { some: { tripId: ctx.trip.id } } },
      select: { id: true, username: true, displayName: true },
    }),
  ])

  return NextResponse.json({ dateOptions, participants })
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, label } = await req.json()
  if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

  const count = await prisma.dateOption.count({ where: { tripId: ctx.trip.id } })
  const dateOption = await prisma.dateOption.create({
    data: { tripId: ctx.trip.id, date, label: label || '', order: count },
  })

  return NextResponse.json(dateOption)
}
