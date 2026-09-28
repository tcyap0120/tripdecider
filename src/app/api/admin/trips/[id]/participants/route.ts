import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

// Set which participants are ticked for a trip. Only ticked participants can view and vote.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: tripId } = await params
  const { participantIds } = await req.json()
  if (!Array.isArray(participantIds)) {
    return NextResponse.json({ error: 'participantIds must be an array' }, { status: 400 })
  }

  const [existing, selected] = await Promise.all([
    prisma.tripParticipant.findMany({ where: { tripId }, select: { participantId: true } }),
    prisma.participant.findMany({ where: { id: { in: participantIds } }, select: { id: true, voteCount: true } }),
  ])
  const existingIds = new Set(existing.map((e) => e.participantId))
  const selectedIds = new Set(selected.map((p) => p.id))

  await prisma.$transaction([
    prisma.tripParticipant.deleteMany({
      where: { tripId, participantId: { notIn: [...selectedIds] } },
    }),
    prisma.tripParticipant.createMany({
      data: selected
        .filter((p) => !existingIds.has(p.id))
        .map((p) => ({ tripId, participantId: p.id, voteCount: p.voteCount })),
    }),
  ])

  return NextResponse.json({ ok: true, participantIds: [...selectedIds] })
}
