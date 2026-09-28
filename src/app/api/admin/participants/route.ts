import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { getAdminTrip } from '@/lib/trip'

// All participant accounts, with their membership in the trip being managed
export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const tripId = ctx.trip.id

  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      trips: { where: { tripId }, select: { voteCount: true } },
      votes: { where: { destination: { tripId } }, select: { destinationId: true } },
    },
  })

  return NextResponse.json(
    participants.map((p) => {
      const membership = p.trips[0]
      const voteCount = membership?.voteCount ?? p.voteCount
      return {
        id: p.id,
        username: p.username,
        displayName: p.displayName || '',
        inTrip: !!membership,
        voteCount,
        votesUsed: p.votes.length,
        remainingVotes: voteCount - p.votes.length,
        createdAt: p.createdAt,
        votedFor: p.votes.map((v) => v.destinationId),
      }
    })
  )
}

export async function POST(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, password, displayName, voteCount } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const existing = await prisma.participant.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const votes = voteCount ?? 1
  // New participants are ticked into the trip currently being managed
  const participant = await prisma.participant.create({
    data: {
      username,
      displayName: displayName || '',
      passwordHash,
      voteCount: votes,
      trips: { create: { tripId: ctx.trip.id, voteCount: votes } },
    },
  })

  return NextResponse.json({ id: participant.id, username: participant.username, displayName: participant.displayName, voteCount: participant.voteCount }, { status: 201 })
}
