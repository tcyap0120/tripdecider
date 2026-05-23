import { NextRequest, NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

async function requireAdmin() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null
  return session
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { username, password, voteCount } = await req.json()

  const data: { username?: string; passwordHash?: string; voteCount?: number } = {}
  if (username) data.username = username
  if (password) data.passwordHash = await bcrypt.hash(password, 10)
  if (voteCount !== undefined) data.voteCount = parseInt(voteCount)

  const participant = await prisma.participant.update({ where: { id }, data })
  return NextResponse.json({ id: participant.id, username: participant.username, voteCount: participant.voteCount })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.participant.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
