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

  const rows = await prisma.settings.findMany()
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value

  return NextResponse.json({
    resultsPublic: settings['resultsPublic'] === 'true',
    votingOpen: settings['votingOpen'] !== 'false',
    announcement: settings['announcement'] || '',
    dateVotingOpen: settings['dateVotingOpen'] === 'true',
  })
}

export async function PUT(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'boolean' && typeof value !== 'string') continue
    await prisma.settings.upsert({
      where: { key },
      create: { key, value: String(value) },
      update: { value: String(value) },
    })
  }

  return NextResponse.json({ ok: true })
}
