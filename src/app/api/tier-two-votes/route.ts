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

  const [settingsRows, myVoteRecord] = await Promise.all([
    prisma.settings.findMany(),
    prisma.tierTwoVote.findFirst({ where: { participantId: session.userId } }),
  ])

  const s: Record<string, string> = {}
  for (const r of settingsRows) s[r.key] = r.value

  const tierTwoOpen = s['tierTwoOpen'] === 'true'
  const destinationIds = (s['tierTwoDestinationIds'] || '').split(',').filter(Boolean)
  const tierTwoResultsPublic = s['tierTwoResultsPublic'] === 'true'

  if (!tierTwoOpen || destinationIds.length < 2) {
    return NextResponse.json({ tierTwoOpen: false, tierTwoResultsPublic, destinations: [], myVote: null })
  }

  const destinations = await prisma.destination.findMany({
    where: { id: { in: destinationIds } },
    include: { _count: { select: { tierTwoVotes: true } }, media: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json({
    tierTwoOpen,
    tierTwoResultsPublic,
    destinations: destinations.map((d) => ({
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
      voteCount: d._count.tierTwoVotes,
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

  const existing = await prisma.tierTwoVote.findFirst({
    where: { participantId: session.userId },
  })
  if (existing) {
    return NextResponse.json({ error: 'Already voted in Level 2' }, { status: 409 })
  }

  await prisma.tierTwoVote.create({
    data: { participantId: session.userId, destinationId },
  })

  return NextResponse.json({ ok: true })
}
