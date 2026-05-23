import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.isLoggedIn || !session.userId || session.isAdmin) {
    return NextResponse.json({ isLoggedIn: false })
  }

  const participant = await prisma.participant.findUnique({
    where: { id: session.userId },
    include: { _count: { select: { votes: true } } },
  })

  if (!participant) {
    return NextResponse.json({ isLoggedIn: false })
  }

  return NextResponse.json({
    isLoggedIn: true,
    userId: session.userId,
    username: session.username,
    voteCount: participant.voteCount,
    votesUsed: participant._count.votes,
    remainingVotes: participant.voteCount - participant._count.votes,
  })
}
