import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { username, password, displayName, voteCount } = await req.json()

  const data: { username?: string; displayName?: string; passwordHash?: string; voteCount?: number } = {}
  if (username) data.username = username
  if (displayName !== undefined) data.displayName = displayName
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  if (voteCount !== undefined) data.voteCount = parseInt(voteCount)

  const participant = await prisma.participant.update({ where: { id }, data })
  // Vote allowance is per trip: apply it to the trip being managed
  if (data.voteCount !== undefined) {
    await prisma.tripParticipant.updateMany({ where: { tripId: ctx.trip.id, participantId: id }, data: { voteCount: data.voteCount } })
  }
  return NextResponse.json({ id: participant.id, username: participant.username, displayName: participant.displayName, voteCount: participant.voteCount })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminTrip())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.participant.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
