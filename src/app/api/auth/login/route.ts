import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

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

    const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
    session.userId = participant.id
    session.username = participant.username
    session.isAdmin = false
    session.isLoggedIn = true
    await session.save()

    return NextResponse.json({ ok: true, username: participant.username })
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
