import { NextRequest, NextResponse } from 'next/server'
import { confirmedDate, getAdminTrip, getTripSettings, setTripSetting, tierTwoState } from '@/lib/trip'

export async function GET() {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getTripSettings(ctx.trip.id)

  return NextResponse.json({
    resultsPublic: settings['resultsPublic'] === 'true',
    votingOpen: settings['votingOpen'] !== 'false',
    announcement: settings['announcement'] || '',
    dateVotingOpen: settings['dateVotingOpen'] === 'true',
    tierTwoEnabled: tierTwoState(settings).enabled,
    tierTwoOpen: tierTwoState(settings).open,
    ...confirmedDate(settings),
  })
}

export async function PUT(req: NextRequest) {
  const ctx = await getAdminTrip()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Round 2 can only be activated while the tiebreaker switch is on
  if (body.tierTwoOpen === true && body.tierTwoEnabled !== true) {
    const current = await getTripSettings(ctx.trip.id)
    if (!tierTwoState(current).enabled) {
      return NextResponse.json({ error: 'Switch on the Level 2 tiebreaker first' }, { status: 400 })
    }
  }
  // Switching it off also closes Round 2
  if (body.tierTwoEnabled === false) body.tierTwoOpen = false

  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== 'boolean' && typeof value !== 'string') continue
    await setTripSetting(ctx.trip.id, key, String(value))
  }

  return NextResponse.json({ ok: true })
}
