'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TravelFooter from '@/components/TravelFooter'

interface Trip {
  id: string
  name: string
  description: string
  status: 'active' | 'past'
  createdAt: string
  destinationCount: number
  participantCount: number
  coverPhoto: string | null
}

export default function TripsPage() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [currentTripId, setCurrentTripId] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)
  const [opening, setOpening] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([fetch('/api/auth/me'), fetch('/api/trips')]).then(async ([meRes, tripsRes]) => {
      const me = await meRes.json()
      if (!me.isLoggedIn) { router.replace('/login'); return }
      setDisplayName(me.displayName || me.username)
      const data = await tripsRes.json()
      setTrips(data.trips ?? [])
      setCurrentTripId(data.currentTripId)
      setLoading(false)
    })
  }, [router])

  async function openTrip(tripId: string) {
    setOpening(tripId)
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId }),
    })
    if (res.ok) router.push('/vote')
    else setOpening(null)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="travel-bg flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <div className="text-6xl animate-float mb-4">🧳</div>
          <p className="text-xl font-display animate-pulse-slow">Loading your trips...</p>
        </div>
      </div>
    )
  }

  const activeTrips = trips.filter((t) => t.status !== 'past')
  const pastTrips = trips.filter((t) => t.status === 'past')

  function TripCard({ trip }: { trip: Trip }) {
    const isPast = trip.status === 'past'
    return (
      <button
        onClick={() => openTrip(trip.id)}
        disabled={opening !== null}
        className={`group text-left w-full overflow-hidden rounded-2xl bg-white shadow-lg transition-all hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.99] ${
          trip.id === currentTripId ? 'ring-4 ring-amber-300' : ''
        }`}
      >
        <div className="relative h-32 sm:h-36 bg-gradient-to-br from-sky-400 to-teal-400 overflow-hidden">
          {trip.coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={trip.coverPhoto} alt="" className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isPast ? 'grayscale-[40%]' : ''}`} />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">{isPast ? '📜' : '✈️'}</div>
          )}
          <span className={`absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full shadow ${
            isPast ? 'bg-slate-800/70 text-white' : 'bg-emerald-400 text-emerald-950'
          }`}>
            {isPast ? '📜 Past trip' : '🟢 Voting'}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-display font-bold text-slate-800 text-lg leading-tight">{trip.name}</h3>
          {trip.description && <p className="text-slate-500 text-sm mt-1 line-clamp-2">{trip.description}</p>}
          <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
            <span>🗺️ {trip.destinationCount} destination{trip.destinationCount !== 1 ? 's' : ''} · 👥 {trip.participantCount}</span>
            <span className="font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform">
              {opening === trip.id ? 'Opening...' : isPast ? 'View →' : 'Open →'}
            </span>
          </div>
        </div>
      </button>
    )
  }

  return (
    <div className="travel-bg min-h-screen pb-24">
      <div className="floating-orb w-64 h-64 bg-cyan-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-teal-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '4s' }} />

      <header className="sticky top-0 z-40 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-xl border-b border-white/15 shadow-lg">
        <div className="max-w-4xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-lg shadow-inner border border-white/20 flex-shrink-0">🏝️</div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-white text-base leading-none tracking-tight">Trip<span className="text-cyan-300">Decider</span></h1>
              <p className="text-white/55 text-xs truncate mt-0.5">Hi, {displayName}! 👋</p>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-red-400/30 border border-white/20 hover:border-red-300/40 text-white/80 hover:text-red-100 font-medium text-xs px-3 py-1.5 rounded-full transition-all">
            <span>🚪</span><span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-3 sm:px-4 py-6 sm:py-10 relative z-10">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-1">Your Trips 🧳</h2>
          <p className="text-cyan-100 text-sm sm:text-base">Pick a trip to vote, see results, and chat</p>
        </div>

        {trips.length === 0 ? (
          <div className="glass-card p-10 sm:p-16 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🧭</div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-slate-700 mb-2">No trips yet</h3>
            <p className="text-slate-500 text-sm sm:text-base">You haven&apos;t been added to a trip. Ask your trip organiser to add you.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeTrips.length > 0 && (
              <section>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3">Upcoming</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeTrips.map((t) => <TripCard key={t.id} trip={t} />)}
                </div>
              </section>
            )}
            {pastTrips.length > 0 && (
              <section>
                <h3 className="text-white/80 text-xs font-bold uppercase tracking-widest mb-3">Past trips</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pastTrips.map((t) => <TripCard key={t.id} trip={t} />)}
                </div>
              </section>
            )}
          </div>
        )}
      </main>

      <TravelFooter />
    </div>
  )
}
