'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface TripSummary {
  id: string
  name: string
  status: 'active' | 'past'
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)
  const [trips, setTrips] = useState<TripSummary[]>([])
  const [currentTripId, setCurrentTripId] = useState('')

  useEffect(() => {
    if (pathname === '/admin/login') { setChecking(false); return }
    fetch('/api/admin/me').then((r) => r.json()).then((d) => {
      if (!d.isLoggedIn) router.replace('/admin/login')
      else setChecking(false)
    })
  }, [router, pathname])

  // Refetch on navigation so the switcher reflects trips created/renamed on the Trips page
  useEffect(() => {
    if (pathname === '/admin/login' || checking) return
    fetch('/api/admin/trips').then((r) => r.ok ? r.json() : null).then((d) => {
      if (!d) return
      setTrips(d.trips)
      setCurrentTripId(d.currentTripId)
    })
  }, [pathname, checking])

  async function switchTrip(tripId: string) {
    setCurrentTripId(tripId)
    await fetch('/api/admin/trips/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId }),
    })
    // Every admin page loads data for the current trip, so reload to refetch
    window.location.reload()
  }

  if (pathname === '/admin/login') return <>{children}</>
  if (checking) return (
    <div className="travel-bg flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="text-5xl animate-float mb-3">🔐</div>
        <p className="animate-pulse-slow">Checking access...</p>
      </div>
    </div>
  )

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin/trips', label: 'Trips', icon: '🧳' },
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/destinations', label: 'Destinations', icon: '🗺️' },
    { href: '/admin/participants', label: 'Participants', icon: '👥' },
    { href: '/admin/dates', label: 'Dates', icon: '📅' },
    { href: '/admin/memories', label: 'Memories', icon: '📸' },
    { href: '/admin/discussion', label: 'Discussion', icon: '💬' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-gradient-to-r from-indigo-700 via-sky-600 to-teal-500 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 pt-3 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl shadow-inner border border-white/30">
              🏝️
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl leading-tight tracking-tight">
                Trip<span className="text-cyan-300">Decider</span>
              </h1>
              <p className="text-white/60 text-xs font-medium tracking-widest uppercase">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {trips.length > 0 && (
              <label className="flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-xl pl-2.5 pr-1 py-1 min-w-0">
                <span className="text-xs text-white/60 hidden sm:inline whitespace-nowrap">Managing</span>
                <select
                  value={currentTripId}
                  onChange={(e) => switchTrip(e.target.value)}
                  className="bg-transparent text-sm font-semibold text-white outline-none cursor-pointer max-w-[9rem] sm:max-w-[16rem] truncate"
                >
                  {trips.map((t) => (
                    <option key={t.id} value={t.id} className="text-slate-800">
                      {t.status === 'past' ? '📜 ' : '🟢 '}{t.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-xl transition-all">
              Logout
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 mt-3 overflow-x-auto no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-shrink-0 flex items-center gap-1 px-2.5 sm:px-4 py-2.5 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap ${
                pathname === item.href
                  ? 'bg-slate-50 text-indigo-700 shadow-sm'
                  : 'text-white/80 hover:bg-white/15 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
