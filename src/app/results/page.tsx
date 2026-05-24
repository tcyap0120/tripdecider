'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface DestResult {
  id: string
  name: string
  description: string
  accommodationPrice: number
  otherPrice: number
  photoUrl: string
  link?: string
  tags: string[]
  voteCount: number
  hasVoted: boolean
  media: { id: string; photoUrl: string; caption: string }[]
}

interface Settings {
  resultsPublic: boolean
  votingOpen: boolean
}

const MEDALS = ['🥇', '🥈', '🥉']
const COLORS = [
  'from-amber-400 to-orange-500',
  'from-sky-400 to-cyan-500',
  'from-teal-400 to-emerald-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
]

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<DestResult[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [user, setUser] = useState<{ isLoggedIn: boolean; username?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealed, setRevealed] = useState(false)

  const load = useCallback(async () => {
    const [meRes, destRes, settingsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/destinations'),
      fetch('/api/settings'),
    ])
    const me = await meRes.json()
    if (!me.isLoggedIn) { router.replace('/login'); return }
    setUser(me)

    const s = await settingsRes.json()
    setSettings(s)

    if (destRes.ok) {
      const dests = await destRes.json()
      setDestinations([...dests].sort((a: DestResult, b: DestResult) => b.voteCount - a.voteCount))
    }
    setLoading(false)
    setTimeout(() => setRevealed(true), 300)
  }, [router])

  useEffect(() => { load() }, [load])

  const totalVotes = destinations.reduce((s, d) => s + d.voteCount, 0)
  const winner = destinations[0]

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return (
    <div className="travel-bg flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="text-6xl animate-float mb-4">🏆</div>
        <p className="text-xl font-display animate-pulse-slow">Counting votes...</p>
      </div>
    </div>
  )

  if (!settings?.resultsPublic) return (
    <div className="travel-bg flex items-center justify-center min-h-screen p-4">
      <div className="glass-card p-10 sm:p-14 text-center max-w-md w-full animate-slide-up">
        <div className="text-6xl mb-5 animate-float">🙈</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mb-3">Results Not Yet Revealed</h1>
        <p className="text-slate-500 mb-6">The admin hasn&apos;t published the results yet. Check back soon!</p>
        <Link href="/vote" className="btn-primary inline-flex justify-center py-3 px-6">← Back to Voting</Link>
      </div>
    </div>
  )

  return (
    <div className="travel-bg min-h-screen pb-10">
      <div className="floating-orb w-64 h-64 bg-amber-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-orange-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏆</span>
            <h1 className="font-display font-bold text-white text-lg">Results</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/vote" className="btn-ghost text-xs py-1 px-3">← Vote</Link>
            <button onClick={handleLogout} className="btn-ghost text-xs py-1 px-3">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Title */}
        <div className={`text-center mb-8 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-5xl sm:text-6xl mb-3 animate-float">🏆</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-2">
            Final Results!
          </h1>
          <p className="text-cyan-100 text-base sm:text-lg">
            {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} cast · {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
          </p>
          <p className="text-cyan-200 text-sm mt-1">Hi, {(user as {displayName?: string; username?: string})?.displayName || user?.username}! 👋</p>
        </div>

        {destinations.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-slate-600">No destinations to show.</p>
          </div>
        ) : (
          <>
            {/* WINNER HERO */}
            {winner && totalVotes > 0 && (
              <div
                className={`mb-8 rounded-3xl overflow-hidden shadow-2xl transition-all duration-1000 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ transitionDelay: '200ms' }}
              >
                <div className="relative h-56 sm:h-72">
                  <img
                    src={winner.photoUrl || winner.media?.[0]?.photoUrl || `https://picsum.photos/seed/${winner.id}/800/500`}
                    alt={winner.name}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${winner.id}/800/500` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <div className="bg-amber-400 text-amber-900 font-bold text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                      <span className="text-xl">🥇</span> WINNER
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
                    <h2 className="text-2xl sm:text-4xl font-display font-bold text-white leading-tight">{winner.name}</h2>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-amber-300 font-bold text-base sm:text-xl">
                        {winner.voteCount} vote{winner.voteCount !== 1 ? 's' : ''} ({Math.round((winner.voteCount / totalVotes) * 100)}%)
                      </span>
                      <span className="text-white/80 text-sm">·</span>
                      <span className="text-white/80 text-sm">MYR {((winner.accommodationPrice + winner.otherPrice) / 8).toLocaleString(undefined, { maximumFractionDigits: 0 })}/pax (8)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* All results */}
            <div className="space-y-4">
              <h3 className="text-white font-display font-bold text-xl mb-4">📊 All Destinations</h3>
              {destinations.map((dest, idx) => (
                <div
                  key={dest.id}
                  className={`bg-white/95 backdrop-blur rounded-2xl overflow-hidden shadow-lg transition-all duration-700 ${revealed ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                  style={{ transitionDelay: `${300 + idx * 120}ms` }}
                >
                  <div className="flex items-stretch">
                    {/* Rank */}
                    <div className={`flex-shrink-0 w-14 sm:w-16 bg-gradient-to-b ${COLORS[idx] || COLORS[COLORS.length - 1]} flex flex-col items-center justify-center gap-1`}>
                      <span className="text-xl sm:text-2xl">{MEDALS[idx] || `#${idx + 1}`}</span>
                      <span className="text-white font-bold text-xs">#{idx + 1}</span>
                    </div>

                    {/* Photo */}
                    <div className="w-20 sm:w-28 flex-shrink-0 overflow-hidden">
                      <img
                        src={dest.photoUrl || dest.media?.[0]?.photoUrl || `https://picsum.photos/seed/${dest.id}/200/200`}
                        alt={dest.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/200/200` }}
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 sm:p-4 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-display font-bold text-slate-800 text-base sm:text-lg leading-tight truncate">{dest.name}</h3>
                        {dest.hasVoted && (
                          <span className="flex-shrink-0 text-xs bg-emerald-100 text-emerald-600 font-medium px-2 py-0.5 rounded-full">✅ Your vote</span>
                        )}
                      </div>
                      <div className="flex gap-1.5 mb-2 flex-wrap">
                        {[6, 8, 10].map((pax) => (
                          <div key={pax} className="bg-sky-50 border border-sky-100 rounded-lg px-2 py-0.5 text-center">
                            <div className="text-xs text-slate-400">{pax} pax</div>
                            <div className="text-xs font-bold text-sky-700">MYR {((dest.accommodationPrice + dest.otherPrice) / pax).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          </div>
                        ))}
                      </div>

                      {/* Vote bar */}
                      <div className="mb-1">
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                          <span>{dest.voteCount} vote{dest.voteCount !== 1 ? 's' : ''}</span>
                          <span className="font-bold">{totalVotes > 0 ? `${Math.round((dest.voteCount / totalVotes) * 100)}%` : '0%'}</span>
                        </div>
                        <div className="h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${COLORS[idx] || COLORS[COLORS.length - 1]} transition-all duration-1000`}
                            style={{
                              width: totalVotes > 0 ? `${(dest.voteCount / totalVotes) * 100}%` : '0%',
                              transitionDelay: `${500 + idx * 120}ms`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Tags */}
                      {dest.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {dest.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="tag-pill text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
              {settings?.votingOpen && (
                <Link href="/vote" className="btn-primary py-3 px-6 text-base">
                  🗳️ Back to Voting
                </Link>
              )}
              <button
                onClick={load}
                className="bg-white/20 backdrop-blur text-white font-semibold py-3 px-6 rounded-xl border border-white/30 hover:bg-white/30 transition-all"
              >
                🔄 Refresh Results
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
