import { NextResponse } from 'next/server'
import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

export async function GET() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.settings.findMany()
  const settings: Record<string, string> = {}
  for (const row of rows) settings[row.key] = row.value

  return NextResponse.json({
    resultsPublic: settings['resultsPublic'] === 'true',
    votingOpen: settings['votingOpen'] !== 'false',
  })
}
