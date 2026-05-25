'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TravelFooter from '@/components/TravelFooter'

interface DateOption {
  id: string
  date: string
  label: string
  voteCount: number
  hasVoted: boolean
}

interface UserInfo {
  isLoggedIn: boolean
  username?: string
  displayName?: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return {
    weekday: d.toLocaleDateString('en-MY', { weekday: 'long' }),
    day: d.toLocaleDateString('en-MY', { day: 'numeric' }),
    month: d.toLocaleDateString('en-MY', { month: 'short' }),
    year: d.toLocaleDateString('en-MY', { year: 'numeric' }),
    full: d.toLocaleDateString('en-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  }
}

export default function DatesPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [dateVotingOpen, setDateVotingOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [meRes, settingsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/settings'),
    ])
    const me = await meRes.json()
    if (!me.isLoggedIn) { router.replace('/login'); return }
    setUser(me)

    const s = await settingsRes.json()
    setDateVotingOpen(s.dateVotingOpen)

    if (s.dateVotingOpen) {
      const datesRes = await fetch('/api/date-options')
      if (datesRes.ok) setDateOptions(await datesRes.json())
    }
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function handleToggle(id: string, hasVoted: boolean) {
    if (toggling) return
    setToggling(id)
    const res = await fetch('/api/date-votes', {
      method: hasVoted ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateOptionId: id }),
    })
    if (res.ok) {
      setDateOptions((prev) =>
        prev.map((d) => d.id === id ? { ...d, hasVoted: !hasVoted, voteCount: d.voteCount + (hasVoted ? -1 : 1) } : d)
      )
    }
    setToggling(null)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const myCount = dateOptions.filter((d) => d.hasVoted).length

  if (loading) return (
    <div className="travel-bg flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="text-6xl animate-float mb-4">📅</div>
        <p className="text-xl font-display animate-pulse-slow">Loading dates...</p>
      </div>
    </div>
  )

  return (
    <div className="travel-bg min-h-screen pb-10">
      <div className="floating-orb w-64 h-64 bg-violet-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-indigo-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-xl border-b border-white/15 shadow-lg">
        <div className="max-w-2xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-lg shadow-inner border border-white/20 flex-shrink-0">📅</div>
            <div className="min-w-0">
              <h1 className="font-display font-extrabold text-white text-base leading-none tracking-tight">Date <span className="text-cyan-300">Voting</span></h1>
              <p className="text-white/55 text-xs truncate mt-0.5">Hi, {user?.displayName || user?.username}! 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link href="/vote" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-all">
              <span>🗳️</span><span className="hidden sm:inline">Vote</span>
            </Link>
            <Link href="/memories" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-all">
              <span>📸</span><span className="hidden sm:inline">Memories</span>
            </Link>
            <Link href="/discussion" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-all">
              <span>💬</span><span className="hidden sm:inline">Discussion</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-red-400/30 border border-white/20 hover:border-red-300/40 text-white/80 hover:text-red-100 font-medium text-xs px-3 py-1.5 rounded-full transition-all">
              <span>🚪</span><span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 relative z-10">
        {!dateVotingOpen ? (
          /* Coming soon */
          <div className="flex flex-col items-center justify-center py-16">
            <div className="glass-card p-10 sm:p-14 text-center max-w-md w-full animate-slide-up">
              <div className="text-6xl mb-5 animate-float">🗓️</div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mb-3">Coming Soon</h2>
              <p className="text-slate-500 mb-2">The date voting round hasn&apos;t started yet.</p>
              <p className="text-slate-400 text-sm">Check back soon — the organiser will open this once the destinations are decided!</p>
              <Link href="/vote" className="btn-primary inline-flex justify-center py-3 px-6 mt-6">← Back to Voting</Link>
            </div>
          </div>
        ) : (
          <>
            {/* Title */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3 animate-float">🗓️</div>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-white mb-1">When can you go?</h2>
              <p className="text-cyan-100 text-sm sm:text-base">
                Mark all dates you&apos;re available — pick as many as you like
              </p>
              {myCount > 0 && (
                <div className="inline-flex items-center gap-2 mt-3 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-white text-sm">
                  <span>✅</span>
                  <span>You&apos;re available on <strong>{myCount}</strong> date{myCount !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {dateOptions.length === 0 ? (
              <div className="glass-card p-10 text-center">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-slate-600">No date options added yet. Check back soon!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dateOptions.map((opt) => {
                  const fmt = formatDate(opt.date)
                  return (
                    <div
                      key={opt.id}
                      className={`rounded-2xl overflow-hidden shadow-md transition-all duration-200 ${
                        opt.hasVoted ? 'ring-2 ring-emerald-400' : ''
                      }`}
                    >
                      <div className="bg-white/95 backdrop-blur flex items-center gap-4 px-4 py-3.5">
                        {/* Date block */}
                        <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-md ${
                          opt.hasVoted ? 'bg-gradient-to-br from-emerald-400 to-teal-500' : 'bg-gradient-to-br from-sky-400 to-cyan-500'
                        }`}>
                          <span className="text-xs leading-none opacity-80">{fmt.month}</span>
                          <span className="text-2xl leading-none">{fmt.day}</span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-800 text-sm">{fmt.weekday}, {fmt.day} {fmt.month} {fmt.year}</p>
                          {opt.label && <p className="text-slate-500 text-xs mt-0.5">{opt.label}</p>}
                          <p className="text-xs mt-1 font-medium">
                            <span className={opt.voteCount > 0 ? 'text-sky-600' : 'text-slate-400'}>
                              {opt.voteCount} {opt.voteCount === 1 ? 'person' : 'people'} available
                            </span>
                          </p>
                        </div>

                        {/* Toggle */}
                        <button
                          onClick={() => handleToggle(opt.id, opt.hasVoted)}
                          disabled={toggling === opt.id}
                          className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all active:scale-95 ${
                            opt.hasVoted
                              ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                              : 'bg-sky-50 text-sky-600 border-2 border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          {toggling === opt.id ? '⏳' : opt.hasVoted ? <><span>✅</span><span className="hidden sm:inline">Available</span></> : <><span>+</span><span className="hidden sm:inline">I&apos;m in</span></>}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
      <TravelFooter />
    </div>
  )
}
