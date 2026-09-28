import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAdminTrip, getParticipantTrip } from '@/lib/trip'

export async function GET() {
  // Used by participant pages and the admin discussion page
  const participantCtx = await getParticipantTrip()
  const ctx = participantCtx ?? (await getAdminTrip())
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const destinations = await prisma.destination.findMany({
    where: { tripId: ctx.trip.id },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { votes: true } }, media: { orderBy: { createdAt: 'asc' } } },
  })

  let votedIds: string[] = []
  if (participantCtx) {
    const votes = await prisma.vote.findMany({
      where: { participantId: participantCtx.participantId, destination: { tripId: ctx.trip.id } },
      select: { destinationId: true },
    })
    votedIds = votes.map((v) => v.destinationId)
  }

  return NextResponse.json(
    destinations.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      accommodationPrice: d.accommodationPrice,
      otherPrice: d.otherPrice,
      currency: d.currency,
      photoUrl: d.photoUrl,
      link: d.link,
      details: d.details,
      tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
      days: d.days,
      nights: d.nights,
      voteCount: d._count.votes,
      hasVoted: votedIds.includes(d.id),
      media: d.media.map((m) => ({ id: m.id, photoUrl: m.photoUrl, caption: m.caption })),
    }))
  )
}
