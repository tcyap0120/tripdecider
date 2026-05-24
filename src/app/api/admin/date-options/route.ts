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

  const [dateOptions, participants] = await Promise.all([
    prisma.dateOption.findMany({
      orderBy: [{ order: 'asc' }, { date: 'asc' }],
      include: {
        votes: {
          include: { participant: { select: { id: true, username: true, displayName: true } } },
          orderBy: { createdAt: 'asc' },
        },
        _count: { select: { votes: true } },
      },
    }),
    prisma.participant.findMany({ select: { id: true, username: true, displayName: true } }),
  ])

  return NextResponse.json({ dateOptions, participants })
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, label } = await req.json()
  if (!date) return NextResponse.json({ error: 'Date is required' }, { status: 400 })

  const count = await prisma.dateOption.count()
  const dateOption = await prisma.dateOption.create({
    data: { date, label: label || '', order: count },
  })

  return NextResponse.json(dateOption)
}
