import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getParticipantTrip, getTripSettings } from '@/lib/trip'

export async function GET() {
  const ctx = await getParticipantTrip()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch settings first — never touches TierTwoVote table
  const s = await getTripSettings(ctx.trip.id)

  const tierTwoOpen = s['tierTwoOpen'] === 'true'
  const destinationIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)
  const tierTwoResultsPublic = s['tierTwoResultsPublic'] === 'true'

  if (!tierTwoOpen || destinationIds.length < 2) {
    return NextResponse.json({ tierTwoOpen: false, tierTwoResultsPublic, destinations: [], myVote: null })
  }

  const tripDestinations = { id: { in: destinationIds }, tripId: ctx.trip.id }

  // These queries touch TierTwoVote — gracefully fall back if table not yet migrated
  let destinations: Awaited<ReturnType<typeof prisma.destination.findMany<{ include: { _count: { select: { tierTwoVotes: true } }; media: true } }>>> = []
  let myVoteRecord: { destinationId: string } | null = null

  try {
    ;[destinations, myVoteRecord] = await Promise.all([
      prisma.destination.findMany({
        where: tripDestinations,
        include: { _count: { select: { tierTwoVotes: true } }, media: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.tierTwoVote.findFirst({ where: { participantId: ctx.participantId, destination: { tripId: ctx.trip.id } } }),
    ])
  } catch {
    // TierTwoVote table not yet migrated in production — return destinations with 0 counts
    const dests = await prisma.destination.findMany({
      where: tripDestinations,
      include: { media: { orderBy: { createdAt: 'asc' } } },
    })
    return NextResponse.json({
      tierTwoOpen,
      tierTwoResultsPublic,
      destinations: dests.map((d) => ({
        id: d.id, name: d.name, description: d.description,
        accommodationPrice: d.accommodationPrice, otherPrice: d.otherPrice,
        currency: d.currency, photoUrl: d.photoUrl, link: d.link,
        details: d.details, tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
        days: d.days, nights: d.nights, voteCount: 0,
        media: d.media.map((m) => ({ id: m.id, photoUrl: m.photoUrl, caption: m.caption })),
      })),
      myVote: null,
    })
  }

  return NextResponse.json({
    tierTwoOpen,
    tierTwoResultsPublic,
    destinations: destinations.map((d) => ({
      id: d.id, name: d.name, description: d.description,
      accommodationPrice: d.accommodationPrice, otherPrice: d.otherPrice,
      currency: d.currency, photoUrl: d.photoUrl, link: d.link,
      details: d.details, tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
      days: d.days, nights: d.nights, voteCount: d._count.tierTwoVotes,
      media: d.media.map((m) => ({ id: m.id, photoUrl: m.photoUrl, caption: m.caption })),
    })),
    myVote: myVoteRecord?.destinationId || null,
  })
}

export async function POST(req: NextRequest) {
  const ctx = await getParticipantTrip()
  if (!ctx) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const s = await getTripSettings(ctx.trip.id)

  if (s['tierTwoOpen'] !== 'true' || ctx.trip.status === 'past') {
    return NextResponse.json({ error: 'Level 2 voting is not open' }, { status: 403 })
  }

  const validIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)
  const { destinationId } = await req.json()

  if (!destinationId || !validIds.includes(destinationId)) {
    return NextResponse.json({ error: 'Invalid destination' }, { status: 400 })
  }

  try {
    const existing = await prisma.tierTwoVote.findFirst({
      where: { participantId: ctx.participantId, destination: { tripId: ctx.trip.id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already voted in Level 2' }, { status: 409 })
    }

    await prisma.tierTwoVote.create({
      data: { participantId: ctx.participantId, destinationId },
    })
  } catch {
    return NextResponse.json({ error: 'Vote table not ready — run prisma db push on production' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
