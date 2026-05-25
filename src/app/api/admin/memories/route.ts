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
  const memories = await prisma.memory.findMany({ orderBy: { createdAt: 'asc' } })
  return NextResponse.json(memories)
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { photoUrl, caption } = await req.json()
  if (!photoUrl) return NextResponse.json({ error: 'Photo is required' }, { status: 400 })
  const memory = await prisma.memory.create({ data: { photoUrl, caption: caption || '' } })
  return NextResponse.json(memory)
}
