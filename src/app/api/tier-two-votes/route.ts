import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || session.isAdmin || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch settings first — never touches TierTwoVote table
  const settingsRows = await prisma.settings.findMany()
  const s: Record<string, string> = {}
  for (const r of settingsRows) s[r.key] = r.value

  const tierTwoOpen = s['tierTwoOpen'] === 'true'
  const destinationIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)
  const tierTwoResultsPublic = s['tierTwoResultsPublic'] === 'true'

  if (!tierTwoOpen || destinationIds.length < 2) {
    return NextResponse.json({ tierTwoOpen: false, tierTwoResultsPublic, destinations: [], myVote: null })
  }

  // These queries touch TierTwoVote — gracefully fall back if table not yet migrated
  let destinations: Awaited<ReturnType<typeof prisma.destination.findMany<{ include: { _count: { select: { tierTwoVotes: true } }; media: true } }>>> = []
  let myVoteRecord: { destinationId: string } | null = null

  try {
    ;[destinations, myVoteRecord] = await Promise.all([
      prisma.destination.findMany({
        where: { id: { in: destinationIds } },
        include: { _count: { select: { tierTwoVotes: true } }, media: { orderBy: { createdAt: 'asc' } } },
      }),
      prisma.tierTwoVote.findFirst({ where: { participantId: session.userId } }),
    ])
  } catch {
    // TierTwoVote table not yet migrated in production — return destinations with 0 counts
    const dests = await prisma.destination.findMany({
      where: { id: { in: destinationIds } },
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
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || session.isAdmin || !session.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const settingsRows = await prisma.settings.findMany()
  const s: Record<string, string> = {}
  for (const r of settingsRows) s[r.key] = r.value

  if (s['tierTwoOpen'] !== 'true') {
    return NextResponse.json({ error: 'Level 2 voting is not open' }, { status: 403 })
  }

  const validIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)
  const { destinationId } = await req.json()

  if (!destinationId || !validIds.includes(destinationId)) {
    return NextResponse.json({ error: 'Invalid destination' }, { status: 400 })
  }

  try {
    const existing = await prisma.tierTwoVote.findFirst({
      where: { participantId: session.userId },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already voted in Level 2' }, { status: 409 })
    }

    await prisma.tierTwoVote.create({
      data: { participantId: session.userId, destinationId },
    })
  } catch {
    return NextResponse.json({ error: 'Vote table not ready — run prisma db push on production' }, { status: 503 })
  }

  return NextResponse.json({ ok: true })
}
