import { getIronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { sessionOptions, SessionData } from '@/lib/session'

// Trip-scoped settings live in the Settings table as `${tripId}:${key}`.
const TRIP_SETTING_KEYS = [
  'resultsPublic', 'votingOpen', 'announcement', 'dateVotingOpen',
  'tierTwoEnabled', 'tierTwoOpen', 'tierTwoDestinationIds', 'tierTwoResultsPublic',
  'confirmedDateStart', 'confirmedDateEnd', 'confirmedDateNote',
]

export const LEGACY_TRIP_ID = 'legacy-trip'

let ensured = false

/**
 * One-time migration: before trips existed, everything was global. Wrap all
 * existing data into a "Past Trip" so it is preserved, with every existing
 * participant ticked. Safe to call on every request.
 */
export async function ensureTrips() {
  if (ensured) return
  if ((await prisma.trip.count()) > 0) { ensured = true; return }

  try {
    await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.create({
        data: { id: LEGACY_TRIP_ID, name: 'Past Trip', status: 'past' },
      })
      await tx.destination.updateMany({ where: { tripId: null }, data: { tripId: trip.id } })
      await tx.dateOption.updateMany({ where: { tripId: null }, data: { tripId: trip.id } })
      await tx.message.updateMany({ where: { tripId: null }, data: { tripId: trip.id } })

      const participants = await tx.participant.findMany({ select: { id: true, voteCount: true } })
      if (participants.length) {
        await tx.tripParticipant.createMany({
          data: participants.map((p) => ({ tripId: trip.id, participantId: p.id, voteCount: p.voteCount })),
        })
      }

      const oldSettings = await tx.settings.findMany({ where: { key: { in: TRIP_SETTING_KEYS } } })
      for (const row of oldSettings) {
        await tx.settings.create({ data: { key: `${trip.id}:${row.key}`, value: row.value } })
      }
    })
  } catch (e) {
    // Another request won the race and created the legacy trip — that's fine.
    if ((await prisma.trip.count()) === 0) throw e
  }
  ensured = true
}

export async function getTripSettings(tripId: string) {
  const rows = await prisma.settings.findMany({ where: { key: { startsWith: `${tripId}:` } } })
  const s: Record<string, string> = {}
  for (const r of rows) s[r.key.slice(tripId.length + 1)] = r.value
  return s
}

export async function setTripSetting(tripId: string, key: string, value: string) {
  const k = `${tripId}:${key}`
  await prisma.settings.upsert({ where: { key: k }, create: { key: k, value }, update: { value } })
}

/** Public-facing settings shape. Past trips are always closed for voting. */
export function toPublicSettings(s: Record<string, string>, status: string) {
  const past = status === 'past'
  return {
    resultsPublic: s['resultsPublic'] === 'true',
    votingOpen: !past && s['votingOpen'] !== 'false',
    announcement: s['announcement'] || '',
    dateVotingOpen: !past && s['dateVotingOpen'] === 'true',
    tierTwoOpen: tierTwoState(s).open,
    tierTwoResultsPublic: s['tierTwoResultsPublic'] === 'true',
    ...confirmedDate(s),
  }
}

/**
 * Level 2 tiebreaker has a master switch (tierTwoEnabled, off by default).
 * Round 2 is only live when the switch is on AND the admin has activated it.
 * Trips from before the switch existed count as enabled if Round 2 was already open.
 */
export function tierTwoState(s: Record<string, string>) {
  const enabled = s['tierTwoEnabled'] !== undefined ? s['tierTwoEnabled'] === 'true' : s['tierTwoOpen'] === 'true'
  return { enabled, open: enabled && s['tierTwoOpen'] === 'true' }
}

/** Trip date set directly by the admin (no voting needed). Dates are YYYY-MM-DD. */
export function confirmedDate(s: Record<string, string>) {
  return {
    confirmedDateStart: s['confirmedDateStart'] || '',
    confirmedDateEnd: s['confirmedDateEnd'] || '',
    confirmedDateNote: s['confirmedDateNote'] || '',
  }
}

/** Trips a participant is ticked for, newest first, active before past. */
export async function listParticipantTrips(participantId: string) {
  const trips = await prisma.trip.findMany({
    where: { participants: { some: { participantId } } },
    orderBy: { createdAt: 'desc' },
  })
  return [...trips.filter((t) => t.status !== 'past'), ...trips.filter((t) => t.status === 'past')]
}

/**
 * Resolve the logged-in participant and their selected trip. Only trips the
 * participant is ticked for are accessible. Returns null if not a participant
 * or they have no trips.
 */
export async function getParticipantTrip() {
  await ensureTrips()
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || session.isAdmin || !session.userId) return null

  let membership = session.tripId
    ? await prisma.tripParticipant.findUnique({
        where: { tripId_participantId: { tripId: session.tripId, participantId: session.userId } },
        include: { trip: true },
      })
    : null

  if (!membership) {
    const trips = await listParticipantTrips(session.userId)
    if (!trips.length) return null
    membership = await prisma.tripParticipant.findUnique({
      where: { tripId_participantId: { tripId: trips[0].id, participantId: session.userId } },
      include: { trip: true },
    })
    if (!membership) return null
  }

  return {
    session,
    participantId: session.userId,
    trip: membership.trip,
    voteCount: membership.voteCount,
    welcomeSeen: membership.welcomeSeenAt !== null,
  }
}

/**
 * Memories are one shared album across all trips. Detach any memory that was
 * tied to a trip (from before this change) so deleting a trip never removes it.
 */
let memoriesDetached = false
export async function detachMemoriesFromTrips() {
  if (memoriesDetached) return
  await prisma.memory.updateMany({ where: { tripId: { not: null } }, data: { tripId: null } })
  memoriesDetached = true
}

/** Any logged-in participant or admin, regardless of trip. */
export async function getViewer() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn) return null
  if (session.isAdmin) return { session, participantId: null }
  if (!session.userId) return null
  return { session, participantId: session.userId }
}

/** Resolve the admin session and the trip they are managing. */
export async function getAdminTrip() {
  await ensureTrips()
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions)
  if (!session.isLoggedIn || !session.isAdmin) return null

  let trip = session.adminTripId ? await prisma.trip.findUnique({ where: { id: session.adminTripId } }) : null
  if (!trip) {
    trip =
      (await prisma.trip.findFirst({ where: { status: 'active' }, orderBy: { createdAt: 'desc' } })) ??
      (await prisma.trip.findFirst({ orderBy: { createdAt: 'desc' } }))
  }
  if (!trip) return null
  return { session, trip }
}
