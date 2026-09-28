import { NextRequest, NextResponse } from 'next/server'
import { getAdminTrip, getTripSettings, setTripSetting } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getTripSettings(ctx.trip.id)

  return NextResponse.json({
    resultsPublic: settings['resultsPublic'] === 'true',
    votingOpen: settings['votingOpen'] !== 'false',
    announcement: settings['announcement'] || '',
    dateVotingOpen: settings['dateVotingOpen'] === 'true',
    tierTwoOpen: settings['tierTwoOpen'] === 'true',
  })
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'boolean' && typeof value !== 'string') continue
    await setTripSetting(ctx.trip.id, key, String(value))
  }

  return NextResponse.json({ ok: true })
}
