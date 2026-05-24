import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null
  return session
}

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const destinations = await prisma.destination.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { votes: true } }, media: { orderBy: { createdAt: 'asc' } } },
  })

  return NextResponse.json(
    destinations.map((d) => ({
      ...d,
      tags: d.tags ? d.tags.split(',').filter(Boolean) : [],
      voteCount: d._count.votes,
    }))
  )
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, description, accommodationPrice, otherPrice, currency, photoUrl, link, details, tags, days, nights } = body

  if (!name) {
    return NextResponse.json({ error: 'Destination name is required' }, { status: 400 })
  }

  const destination = await prisma.destination.create({
    data: {
      name,
      description: description || '',
      accommodationPrice: parseFloat(accommodationPrice) || 0,
      otherPrice: parseFloat(otherPrice) || 0,
      currency: currency || 'MYR',
      photoUrl: photoUrl || '',
      link: link || null,
      details: details || '',
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      days: parseInt(days) || 0,
      nights: parseInt(nights) || 0,
    },
  })

  return NextResponse.json(destination, { status: 201 })
}
