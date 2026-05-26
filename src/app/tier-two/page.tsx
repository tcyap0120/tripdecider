'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TravelFooter from '@/components/TravelFooter'

interface MediaItem {
  id: string
  photoUrl: string
  caption: string
}

interface Destination {
  id: string
  name: string
  description: string
  accommodationPrice: number
  otherPrice: number
  currency: string
  photoUrl: string
  link?: string
  details: string
  tags: string[]
  days: number
  nights: number
  voteCount: number
  media: MediaItem[]
}

interface TierTwoData {
  tierTwoOpen: boolean
  tierTwoResultsPublic: boolean
  destinations: Destination[]
  myVote: string | null
}

export default function TierTwoPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ isLoggedIn: boolean; username?: string; displayName?: string } | null>(null)
  const [data, setData] = useState<TierTwoData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    const [meRes, tierRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/tier-two-votes'),
    ])
    const me = await meRes.json()
    if (!me.isLoggedIn) { router.replace('/login'); return }
    setUser(me)
    if (tierRes.ok) {
      const d: TierTwoData = await tierRes.json()
      setData(d)
      if (d.myVote) setSelected(d.myVote)
    }
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function handleSubmit() {
    if (!selected || submitting || data?.myVote) return
    setSubmitting(true)
    const res = await fetch('/api/tier-two-votes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: selected }),
    })
    if (res.ok) {
      setJustSubmitted(true)
      await load()
      setTimeout(() => setJustSubmitted(false), 4000)
    }
    setSubmitting(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
        <div className="text-white text-center">
          <div className="text-6xl mb-4 animate-float">⚔️</div>
          <p className="text-xl font-display animate-pulse-slow">Loading tiebreaker...</p>
        </div>
      </div>
    )
  }

  if (!data?.tierTwoOpen) {
    return (
      <div className="travel-bg min-h-screen flex items-center justify-center p-4">
        <div className="glass-card p-10 sm:p-14 text-center max-w-md w-full animate-slide-up">
          <div className="text-6xl mb-5 animate-float">🔒</div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-800 mb-3">Round 2 Not Active</h1>
          <p className="text-slate-500 mb-6">Level 2 voting hasn&apos;t started yet. Check back soon!</p>
          <a href="/vote" className="btn-primary inline-flex justify-center py-3 px-6">← Back to Voting</a>
        </div>
      </div>
    )
  }

  const hasVoted = !!data.myVote
  const destinations = data.destinations
  const totalT2Votes = destinations.reduce((s, d) => s + d.voteCount, 0)

  return (
    <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(160deg, #0f0c29 0%, #302b63 40%, #6d28d9 75%, #7c3aed 100%)' }}>
      {/* Ambient orbs */}
      <div className="fixed -top-24 -left-24 w-72 h-72 rounded-full pointer-events-none blur-3xl opacity-25"
        style={{ background: 'radial-gradient(circle, #a855f7, transparent)' }} />
      <div className="fixed -bottom-24 -right-24 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #ef4444, transparent)', animationDelay: '4s' }} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none blur-3xl opacity-10"
        style={{ background: 'radial-gradient(circle, #f97316, transparent)', animationDelay: '2s' }} />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 shadow-lg"
        style={{ background: 'linear-gradient(90deg, rgba(15,12,41,0.7), rgba(48,43,99,0.7))' }}>
        <div className="max-w-5xl mx-auto px-3 sm:px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-lg border border-white/20 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.4), rgba(239,68,68,0.4))' }}>⚔️</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-extrabold text-white text-base leading-none">Round 2</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white animate-pulse-slow"
                  style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)' }}>TIEBREAKER</span>
              </div>
              <p className="text-white/50 text-xs mt-0.5 truncate">Hi, {user?.displayName || user?.username}! 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <a href="/vote"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium text-xs px-3 py-1.5 rounded-full transition-all">
              <span>🗳️</span><span className="hidden sm:inline">Round 1</span>
            </a>
            {hasVoted && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-400 text-emerald-900">
                <span>✅</span><span className="hidden sm:inline">Voted</span>
              </div>
            )}
            <button onClick={handleLogout}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-red-400/30 border border-white/20 text-white/80 hover:text-red-100 font-medium text-xs px-3 py-1.5 rounded-full transition-all">
              <span>🚪</span><span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-8 sm:py-12 relative z-10">
        {/* ── HERO ── */}
        <div className="text-center mb-10 sm:mb-14 animate-fade-in">
          <div className="text-6xl sm:text-8xl mb-4 animate-float">⚔️</div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3 leading-tight">
            It&apos;s a <span style={{ background: 'linear-gradient(90deg, #fb923c, #f43f5e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Tie!</span>
          </h2>
          <p className="text-purple-200 text-sm sm:text-base max-w-sm sm:max-w-md mx-auto leading-relaxed">
            Two destinations are neck-and-neck from Round 1. Time for the final showdown — pick your champion! 🔥
          </p>

          {hasVoted ? (
            <div className="mt-5 inline-flex items-center gap-2.5 bg-emerald-500/20 border border-emerald-400/40 px-5 py-2.5 rounded-2xl text-emerald-300 font-semibold text-sm">
              <span className="text-lg">✅</span>
              <span>Your vote is locked in — no take-backs!</span>
            </div>
          ) : (
            <div className="mt-5 inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 px-4 py-2 rounded-2xl text-orange-300 text-sm font-medium">
              <span>🎯</span>
              <span>Select one destination and lock it in — this is final!</span>
            </div>
          )}

          {data.tierTwoResultsPublic && totalT2Votes > 0 && (
            <p className="text-purple-400 text-xs mt-3">
              {totalT2Votes} round 2 vote{totalT2Votes !== 1 ? 's' : ''} cast
            </p>
          )}
        </div>

        {/* ── VERSUS LAYOUT ── */}
        {destinations.length === 2 && (() => {
          const renderCard = (dest: Destination, idx: number) => {
            const isSelected = selected === dest.id
            const isVotedFor = data.myVote === dest.id
            const isOtherSelected = selected !== null && selected !== dest.id && !hasVoted
            const accentGrad = idx === 0
              ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
              : 'linear-gradient(135deg, #dc2626, #ea580c)'

            return (
              <div
                className={`destination-card animate-fade-in transition-all duration-300 flex flex-col h-full ${
                  hasVoted && !isVotedFor ? 'opacity-55 saturate-50' : ''
                }`}
                style={{
                  animationDelay: `${idx * 0.12}s`,
                  ...(isSelected && !hasVoted ? { outline: '4px solid #a855f7', boxShadow: '0 0 36px rgba(168,85,247,0.45)' } : {}),
                }}
              >
                {/* Photo */}
                <div className="relative h-52 sm:h-60 overflow-hidden rounded-t-2xl">
                  <img
                    src={dest.photoUrl || dest.media?.[0]?.photoUrl || `https://picsum.photos/seed/${dest.id}/600/400`}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/600/400` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                  {/* Finalist label */}
                  <div className="absolute top-3 left-3">
                    <div className="text-white text-xs font-bold px-2.5 py-1 rounded-full border border-white/30 backdrop-blur"
                      style={{ background: idx === 0 ? 'linear-gradient(90deg, rgba(168,85,247,0.75), rgba(99,102,241,0.75))' : 'linear-gradient(90deg, rgba(220,38,38,0.75), rgba(249,115,22,0.75))' }}>
                      {idx === 0 ? '🟣 Finalist A' : '🔴 Finalist B'}
                    </div>
                  </div>

                  {/* Voted / selected / vote-count badge */}
                  <div className="absolute top-3 right-3">
                    {isVotedFor ? (
                      <div className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">✅ Your pick</div>
                    ) : (isSelected && !hasVoted) ? (
                      <div className="bg-white text-violet-700 text-xs font-bold px-2.5 py-1 rounded-full">🟣 Selected</div>
                    ) : (data.tierTwoResultsPublic && totalT2Votes > 0) ? (
                      <div className="bg-black/50 backdrop-blur text-white text-xs font-bold px-2.5 py-1 rounded-full">🗳️ {dest.voteCount}</div>
                    ) : null}
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="text-white font-display font-bold text-lg sm:text-xl leading-snug drop-shadow">{dest.name}</h3>
                    {(dest.days > 0 || dest.nights > 0) && (
                      <span className="inline-block mt-1 text-xs bg-white/25 backdrop-blur text-white font-bold px-2.5 py-0.5 rounded-full">
                        {dest.days > 0 ? `${dest.days}D` : ''}{dest.nights > 0 ? `${dest.nights}N` : ''}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  {/* Price */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Cost Per Pax</span>
                      {dest.link && (
                        <a
                          href={dest.link.startsWith('http') ? dest.link : `https://${dest.link}`}
                          target="_blank" rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs font-semibold bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200 px-2.5 py-1 rounded-full transition-colors"
                        >
                          🔗 Info
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[6, 8, 10].map((pax) => (
                        <div key={pax} className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl p-2 text-center">
                          <div className="text-xs text-slate-500 font-medium">{pax} pax</div>
                          <div className="text-sm font-display font-bold text-violet-700 leading-tight">
                            MYR {((dest.accommodationPrice + dest.otherPrice) / pax).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 text-center">
                      🏨 MYR {dest.accommodationPrice.toLocaleString()} + 🌴 MYR {dest.otherPrice.toLocaleString()}
                    </p>
                  </div>

                  {dest.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-3">
                      {dest.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
                    </div>
                  )}

                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{dest.description}</p>

                  {/* Expandable details */}
                  <div className="mb-3">
                    <button
                      onClick={() => setExpandedIds(prev => {
                        const next = new Set(prev)
                        next.has(dest.id) ? next.delete(dest.id) : next.add(dest.id)
                        return next
                      })}
                      className="text-violet-500 text-xs font-medium hover:text-violet-700 transition-colors flex items-center gap-1"
                    >
                      {expandedIds.has(dest.id) ? '▲ Less' : <>▼ More info{dest.media.length > 0 ? ` · 📸 ${dest.media.length}` : ''}</>}
                    </button>
                    {expandedIds.has(dest.id) && (
                      <div className="mt-2 animate-fade-in space-y-3">
                        {dest.link && (
                          <a
                            href={dest.link.startsWith('http') ? dest.link : `https://${dest.link}`}
                            target="_blank" rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-600 border border-violet-200 rounded-xl text-sm font-semibold transition-colors"
                          >
                            🔗 Open Info Page
                          </a>
                        )}
                        {dest.details && (
                          <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">{dest.details}</div>
                        )}
                        {dest.media.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 mb-2">📸 Gallery</p>
                            <div className="grid grid-cols-2 gap-2">
                              {dest.media.map((item) => (
                                <div key={item.id} className="rounded-xl overflow-hidden border border-slate-100">
                                  <img src={item.photoUrl} alt={item.caption || dest.name}
                                    className="w-full h-24 object-cover" loading="lazy"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                  {item.caption && <p className="text-xs text-slate-500 px-2 py-1 truncate">{item.caption}</p>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Vote button */}
                  <div className="mt-auto pt-1">
                  {hasVoted ? (
                    <div className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${
                      isVotedFor
                        ? 'bg-emerald-50 text-emerald-600 border-2 border-emerald-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isVotedFor ? <><span>✅</span> Your final pick — locked in!</> : <><span>—</span> Not chosen</>}
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelected(isSelected ? null : dest.id)}
                      disabled={submitting}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 shadow-md hover:opacity-90 ${
                        isOtherSelected && !isSelected ? 'bg-slate-100 text-slate-400 shadow-none' : 'text-white'
                      }`}
                      style={isOtherSelected && !isSelected ? {} : {
                        background: isSelected ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : accentGrad,
                        boxShadow: isSelected ? '0 8px 24px rgba(124,58,237,0.4)' : undefined,
                      }}
                    >
                      {isSelected ? <><span>🟣</span> Selected — tap to deselect</> : <><span>👉</span> Pick this one!</>}
                    </button>
                  )}

                  {/* R2 vote bar */}
                  {data.tierTwoResultsPublic && totalT2Votes > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>{dest.voteCount} vote{dest.voteCount !== 1 ? 's' : ''}</span>
                        <span className="font-bold">{Math.round((dest.voteCount / totalT2Votes) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${(dest.voteCount / totalT2Votes) * 100}%`,
                            background: idx === 0 ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'linear-gradient(90deg, #dc2626, #f97316)',
                          }}
                        />
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_64px_1fr] items-stretch">
              {/* Card A */}
              <div className="md:pr-3 flex flex-col">{renderCard(destinations[0], 0)}</div>

              {/* VS badge — always between cards in DOM order */}
              <div className="flex items-center justify-center py-6 md:py-0 md:pt-[88px]">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-display font-black text-white text-lg shadow-2xl border-2 border-white/20 animate-pulse-slow"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)' }}
                >
                  VS
                </div>
              </div>

              {/* Card B */}
              <div className="md:pl-3 flex flex-col">{renderCard(destinations[1], 1)}</div>
            </div>
          )
        })()}

        {/* ── SUBMIT SECTION ── */}
        {!hasVoted && (
          <div className="mt-10 max-w-sm mx-auto animate-slide-up">
            <button
              onClick={handleSubmit}
              disabled={!selected || submitting}
              className="w-full py-4 rounded-2xl font-display font-bold text-base text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xl"
              style={
                selected
                  ? { background: 'linear-gradient(135deg, #7c3aed, #dc2626)', boxShadow: '0 12px 32px rgba(124,58,237,0.5)' }
                  : { backgroundColor: '#64748b' }
              }
            >
              {submitting
                ? '⏳ Locking in your vote...'
                : selected
                ? '🔥 Lock in my final vote!'
                : '👆 Select a destination first'}
            </button>
            <p className="text-center text-purple-400/70 text-xs mt-3">
              This is your <strong className="text-purple-300">final vote</strong> — no edits allowed. Choose wisely! 🎯
            </p>
          </div>
        )}

        {/* ── SUCCESS ── */}
        {justSubmitted && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="inline-flex items-center gap-3 bg-emerald-500/20 border border-emerald-400/40 px-6 py-4 rounded-2xl text-emerald-300">
              <span className="text-3xl">🎉</span>
              <div className="text-left">
                <p className="font-display font-bold text-base">Vote locked in!</p>
                <p className="text-xs opacity-80 mt-0.5">Thanks for making the final call. The group will know soon!</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <TravelFooter />
    </div>
  )
}
