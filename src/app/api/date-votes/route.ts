import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function getParticipant() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.userId || session.isAdmin) return null
  return session
}

export async function POST(req: NextRequest) {
  const session = await getParticipant()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dateOptionId } = await req.json()
  if (!dateOptionId) return NextResponse.json({ error: 'Missing dateOptionId' }, { status: 400 })

  await prisma.dateVote.upsert({
    where: { participantId_dateOptionId: { participantId: session.userId!, dateOptionId } },
    create: { participantId: session.userId!, dateOptionId },
    update: {},
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getParticipant()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dateOptionId } = await req.json()
  if (!dateOptionId) return NextResponse.json({ error: 'Missing dateOptionId' }, { status: 400 })

  await prisma.dateVote.deleteMany({
    where: { participantId: session.userId!, dateOptionId },
  })

  return NextResponse.json({ ok: true })
}
