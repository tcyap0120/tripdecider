'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TravelFooter from '@/components/TravelFooter'

interface DestResult {
  id: string
  name: string
  description: string
  accommodationPrice: number
  otherPrice: number
  photoUrl: string
  link?: string
  tags: string[]
  days: number
  nights: number
  voteCount: number
  hasVoted: boolean
  media: { id: string; photoUrl: string; caption: string }[]
}

interface Settings {
  resultsPublic: boolean
  votingOpen: boolean
}

interface Voter {
  id: string
  name: string
  isMe: boolean
  destinationIds: string[]
}

type View = 'destination' | 'person'

const MEDALS = ['🥇', '🥈', '🥉']
const COLORS = [
  'from-amber-400 to-orange-500',
  'from-sky-400 to-cyan-500',
  'from-teal-400 to-emerald-500',
  'from-violet-400 to-purple-500',
  'from-rose-400 to-pink-500',
]

const photoOf = (d: DestResult, size: string) =>
  d.photoUrl || d.media?.[0]?.photoUrl || `https://picsum.photos/seed/${d.id}/${size}`

const perPax = (d: DestResult, pax: number) =>
  ((d.accommodationPrice + d.otherPrice) / pax).toLocaleString(undefined, { maximumFractionDigits: 0 })

const duration = (d: DestResult) => `${d.days > 0 ? `${d.days}D` : ''}${d.nights > 0 ? `${d.nights}N` : ''}`

function Avatar({ name, isMe, size = 'sm' }: { name: string; isMe: boolean; size?: 'sm' | 'md' }) {
  return (
    <span className={`flex-shrink-0 rounded-full flex items-center justify-center font-bold ${
      size === 'md' ? 'w-9 h-9 text-sm' : 'w-5 h-5 text-[10px]'
    } ${isMe ? 'bg-gradient-to-br from-sky-400 to-teal-400 text-white' : 'bg-slate-200 text-slate-600'}`}>
      {name.charAt(0).toUpperCase()}
    </span>
  )
}

export default function ResultsPage() {
  const router = useRouter()
  const [destinations, setDestinations] = useState<DestResult[]>([])
  const [voters, setVoters] = useState<Voter[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [user, setUser] = useState<{ isLoggedIn: boolean; username?: string; displayName?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [view, setView] = useState<View>('destination')

  const load = useCallback(async () => {
    const [meRes, destRes, settingsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/destinations'),
      fetch('/api/settings'),
    ])
    const me = await meRes.json()
    if (!me.isLoggedIn) { router.replace('/login'); return }
    if (!me.trip) { router.replace('/trips'); return }
    setUser(me)

    const s = await settingsRes.json()
    setSettings(s)

    if (destRes.ok) {
      const dests = await destRes.json()
      setDestinations([...dests].sort((a: DestResult, b: DestResult) => b.voteCount - a.voteCount))
    }
    if (s.resultsPublic) {
      const votersRes = await fetch('/api/results/voters')
      if (votersRes.ok) setVoters(await votersRes.json())
    }
    setLoading(false)
    setTimeout(() => setRevealed(true), 300)
  }, [router])

  useEffect(() => { load() }, [load])

  async function refresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const totalVotes = destinations.reduce((s, d) => s + d.voteCount, 0)
  const winner = destinations[0]
  const leaders = winner && winner.voteCount > 0 ? destinations.filter((d) => d.voteCount === winner.voteCount) : []
  // Standard competition ranking: equal vote counts share a rank (1, 2, 2, 4...)
  const rankOf = (d: DestResult) => destinations.findIndex((x) => x.voteCount === d.voteCount)
  const votersFor = (destId: string) => voters.filter((v) => v.destinationIds.includes(destId))
  const destById = new Map(destinations.map((d) => [d.id, d]))
  const votedCount = voters.filter((v) => v.destinationIds.length > 0).length
  // Show yourself first in the "by person" list
  const people = [...voters.filter((v) => v.isMe), ...voters.filter((v) => !v.isMe)]

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
      <div className="glass-card p-8 sm:p-14 text-center max-w-md w-full animate-slide-up">
        <div className="text-6xl mb-5 animate-float">🙈</div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mb-3">Results Not Yet Revealed</h1>
        <p className="text-slate-500 mb-6">The admin hasn&apos;t published the results yet. Check back soon!</p>
        <Link href="/vote" className="btn-primary inline-flex justify-center py-3 px-6">← Back to Voting</Link>
      </div>
    </div>
  )

  return (
    <div className="travel-bg min-h-screen pb-24 overflow-x-hidden">
      <div className="floating-orb w-64 h-64 bg-amber-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-orange-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-xl border-b border-white/15 shadow-lg">
        <div className="max-w-3xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <Link href="/vote" className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-all">
            <span>←</span><span>Trip</span>
          </Link>
          <h1 className="font-display font-extrabold text-white text-base flex items-center gap-1.5">
            <span>🏆</span> Results
          </h1>
          <button onClick={handleLogout} className="flex items-center gap-1.5 bg-white/10 hover:bg-red-400/30 border border-white/20 hover:border-red-300/40 text-white/80 hover:text-red-100 font-medium text-xs px-3 py-1.5 rounded-full transition-all">
            <span>🚪</span><span className="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-3 sm:px-5 py-6 sm:py-10 relative z-10">
        {/* Title */}
        <div className={`text-center mb-6 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <h2 className="text-2xl sm:text-4xl font-display font-bold text-white mb-1.5">The results are out! 🎉</h2>
          <p className="text-cyan-100 text-sm sm:text-base">
            {totalVotes} vote{totalVotes !== 1 ? 's' : ''} · {destinations.length} destination{destinations.length !== 1 ? 's' : ''}
            {voters.length > 0 && <> · {votedCount}/{voters.length} voted</>}
          </p>
          <p className="text-cyan-200/80 text-xs sm:text-sm mt-1">Hi, {user?.displayName || user?.username}! 👋</p>
        </div>

        {destinations.length === 0 ? (
          <div className="glass-card p-10 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-slate-600">No destinations to show.</p>
          </div>
        ) : (
          <>
            {/* WINNER HERO */}
            {leaders.length > 0 && (
              <div
                className={`mb-6 rounded-3xl overflow-hidden shadow-2xl bg-slate-900 transition-all duration-1000 ${revealed ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
                style={{ transitionDelay: '200ms' }}
              >
                <div className="relative h-52 sm:h-72">
                  {leaders.length === 1 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoOf(winner, '800/500')} alt={winner.name} className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${winner.id}/800/500` }} />
                  ) : (
                    <div className="grid grid-cols-2 h-full gap-0.5">
                      {leaders.slice(0, 2).map((d) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={d.id} src={photoOf(d, '400/500')} alt={d.name} className="w-full h-full object-cover" />
                      ))}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 font-bold text-xs sm:text-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <span className="text-base sm:text-lg leading-none">{leaders.length === 1 ? '🥇' : '🤝'}</span>
                    {leaders.length === 1 ? 'WINNER' : 'TIED FOR 1ST'}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <h3 className="text-xl sm:text-4xl font-display font-bold text-white leading-tight">
                      {leaders.map((d) => d.name).join(' & ')}
                      {leaders.length === 1 && duration(winner) && (
                        <span className="ml-2 align-middle text-xs sm:text-sm bg-white/25 text-white font-bold px-2 py-0.5 rounded-full">{duration(winner)}</span>
                      )}
                    </h3>
                    <p className="mt-1 text-sm sm:text-lg">
                      <span className="text-amber-300 font-bold">
                        {winner.voteCount} vote{winner.voteCount !== 1 ? 's' : ''}{leaders.length > 1 ? ' each' : ''} · {Math.round((winner.voteCount / totalVotes) * 100)}%
                      </span>
                      {leaders.length === 1 && (
                        <span className="text-white/80 text-xs sm:text-sm block sm:inline sm:ml-2">MYR {perPax(winner, 8)}/pax (8 pax)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* View switcher */}
            {voters.length > 0 && (
              <div className="flex p-1 mb-4 bg-white/15 backdrop-blur rounded-2xl border border-white/20">
                {([['destination', '📊 By destination'], ['person', '👥 Who voted what']] as [View, string][]).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => setView(key)}
                    className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      view === key ? 'bg-white text-sky-700 shadow' : 'text-white/85 hover:bg-white/10'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {view === 'destination' || voters.length === 0 ? (
              <div className="space-y-3">
                {destinations.map((dest, idx) => {
                  const rank = rankOf(dest)
                  const pct = totalVotes > 0 ? (dest.voteCount / totalVotes) * 100 : 0
                  const destVoters = votersFor(dest.id)
                  return (
                    <div
                      key={dest.id}
                      className={`bg-white/95 backdrop-blur rounded-2xl shadow-lg p-3 sm:p-4 transition-all duration-700 ${revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
                      style={{ transitionDelay: `${300 + Math.min(idx, 8) * 100}ms` }}
                    >
                      <div className="flex gap-3">
                        {/* Photo with rank */}
                        <div className="relative w-16 h-16 sm:w-24 sm:h-24 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoOf(dest, '200/200')} alt={dest.name} className="w-full h-full object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/200/200` }} />
                          <span className="absolute top-1 left-1 min-w-6 h-6 px-1 rounded-full bg-white/90 shadow flex items-center justify-center text-xs font-bold text-slate-700">
                            {dest.voteCount > 0 && rank < 3 ? MEDALS[rank] : `#${rank + 1}`}
                          </span>
                        </div>

                        {/* Name + count */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-display font-bold text-slate-800 text-sm sm:text-lg leading-snug line-clamp-2">{dest.name}</h3>
                            <div className="flex-shrink-0 text-right leading-none">
                              <div className="font-display font-extrabold text-slate-800 text-xl sm:text-2xl">{dest.voteCount}</div>
                              <div className="text-[10px] text-slate-400 uppercase font-semibold mt-0.5">vote{dest.voteCount !== 1 ? 's' : ''}</div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {duration(dest) && (
                              <span className="text-[11px] bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full">{duration(dest)}</span>
                            )}
                            {dest.hasVoted && (
                              <span className="text-[11px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">✅ Your vote</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Vote bar */}
                      <div className="flex items-center gap-2 mt-3">
                        <div className="flex-1 h-2 sm:h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${COLORS[Math.min(rank, COLORS.length - 1)]} transition-all duration-1000`}
                            style={{ width: revealed ? `${pct}%` : '0%', transitionDelay: `${500 + Math.min(idx, 8) * 100}ms` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-9 text-right">{Math.round(pct)}%</span>
                      </div>

                      {/* Who voted for it */}
                      {voters.length > 0 && (
                        <div className="mt-3">
                          {destVoters.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {destVoters.map((v) => (
                                <span key={v.id} className={`inline-flex items-center gap-1 rounded-full pl-0.5 pr-2 py-0.5 text-[11px] font-semibold border ${
                                  v.isMe ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                                }`}>
                                  <Avatar name={v.name} isMe={v.isMe} />
                                  {v.isMe ? 'You' : v.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">No votes</p>
                          )}
                        </div>
                      )}

                      {/* Cost per pax */}
                      {dest.accommodationPrice + dest.otherPrice > 0 && (
                        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-100">
                          {[6, 8, 10].map((pax) => (
                            <div key={pax} className="bg-sky-50 rounded-lg px-1.5 py-1 text-center">
                              <div className="text-[10px] text-slate-400">{pax} pax</div>
                              <div className="text-xs font-bold text-sky-700 truncate">MYR {perPax(dest, pax)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {people.map((p, idx) => (
                  <div
                    key={p.id}
                    className={`rounded-2xl shadow-lg p-3 sm:p-4 animate-pop-in ${p.isMe ? 'bg-white ring-2 ring-sky-300' : 'bg-white/95'}`}
                    style={{ animationDelay: `${Math.min(idx, 12) * 0.04}s` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar name={p.name} isMe={p.isMe} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-slate-800 text-sm sm:text-base truncate">
                          {p.name} {p.isMe && <span className="text-[11px] font-bold text-sky-500">(You)</span>}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {p.destinationIds.length > 0 ? `${p.destinationIds.length} vote${p.destinationIds.length !== 1 ? 's' : ''}` : "Didn't vote"}
                        </p>
                      </div>
                    </div>
                    {p.destinationIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {p.destinationIds.map((id) => {
                          const d = destById.get(id)
                          if (!d) return null
                          const isLeader = leaders.some((l) => l.id === id)
                          return (
                            <span key={id} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border max-w-full ${
                              isLeader ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'
                            }`}>
                              {isLeader && <span>🏆</span>}
                              <span className="truncate">{d.name}</span>
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
              {settings?.votingOpen && (
                <Link href="/vote" className="btn-primary justify-center py-3 px-6 text-base">
                  🗳️ Back to Voting
                </Link>
              )}
              <button
                onClick={refresh}
                disabled={refreshing}
                className="bg-white/20 backdrop-blur text-white font-semibold py-3 px-6 rounded-xl border border-white/30 hover:bg-white/30 transition-all disabled:opacity-60"
              >
                {refreshing ? 'Refreshing...' : '🔄 Refresh Results'}
              </button>
            </div>
          </>
        )}
      </main>
      <TravelFooter />
    </div>
  )
}
