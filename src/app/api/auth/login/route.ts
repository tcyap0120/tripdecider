import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'
import { ensureTrips, listParticipantTrips } from '@/lib/trip'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const participant = await prisma.participant.findUnique({ where: { username } })
    if (!participant) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, participant.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await ensureTrips()
    const trips = await listParticipantTrips(participant.id)

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.userId = participant.id
    session.username = participant.username
    session.displayName = participant.displayName || participant.username
    session.isAdmin = false
    session.isLoggedIn = true
    session.tripId = trips[0]?.id
    await session.save()

    return NextResponse.json({
      ok: true,
      username: participant.username,
      displayName: participant.displayName || participant.username,
      tripCount: trips.length,
    })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
