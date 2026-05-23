import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)

  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const destinations = await prisma.destination.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { votes: true } } },
  })

  let votedIds: string[] = []
  if (!session.isAdmin && session.userId) {
    const votes = await prisma.vote.findMany({
      where: { participantId: session.userId },
      select: { destinationId: true },
    })
    votedIds = votes.map((v) => v.destinationId)
  }

  return NextResponse.json(
    destinations.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      price: d.price,
      currency: d.currency,
      photoUrl: d.photoUrl,
      link: d.link,
      details: d.details,
      tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
      voteCount: d._count.votes,
      hasVoted: votedIds.includes(d.id),
    }))
  )
}
