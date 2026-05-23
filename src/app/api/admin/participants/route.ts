import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const participants = await prisma.participant.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      _count: { select: { votes: true } },
      votes: { select: { destinationId: true } },
    },
  })

  return NextResponse.json(
    participants.map((p) => ({
      id: p.id,
      username: p.username,
      voteCount: p.voteCount,
      votesUsed: p._count.votes,
      remainingVotes: p.voteCount - p._count.votes,
      createdAt: p.createdAt,
      votedFor: p.votes.map((v) => v.destinationId),
    }))
  )
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { username, password, voteCount } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const existing = await prisma.participant.findUnique({ where: { username } })
  if (existing) {
    return NextResponse.json({ error: 'Username already taken' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const participant = await prisma.participant.create({
    data: {
      username,
      passwordHash,
      voteCount: voteCount ?? 1,
    },
  })

  return NextResponse.json({ id: participant.id, username: participant.username, voteCount: participant.voteCount }, { status: 201 })
}
