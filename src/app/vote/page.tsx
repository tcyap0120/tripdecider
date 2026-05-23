'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

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
  voteCount: number
  hasVoted: boolean
  media: MediaItem[]
}

interface UserInfo {
  isLoggedIn: boolean
  userId?: string
  username?: string
  voteCount?: number
  votesUsed?: number
  remainingVotes?: number
}

interface AppSettings {
  resultsPublic: boolean
  votingOpen: boolean
}

interface Message {
  id: string
  username: string
  content: string
  destinationId?: string | null
  createdAt: string
  participantId: string
}

export default function VotePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [appSettings, setAppSettings] = useState<AppSettings>({ resultsPublic: false, votingOpen: true })
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [celebration, setCelebration] = useState<string | null>(null)

  // Discussion state
  const [messages, setMessages] = useState<Message[]>([])
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const lastMsgCount = useRef(0)

  const loadData = useCallback(async () => {
    const [meRes, destRes, settingsRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/destinations'),
      fetch('/api/settings'),
    ])
    const meData = await meRes.json()
    if (!meData.isLoggedIn) { router.replace('/login'); return }
    setUser(meData)
    if (destRes.ok) setDestinations(await destRes.json())
    if (settingsRes.ok) setAppSettings(await settingsRes.json())
    setLoading(false)
  }, [router])

  const loadMessages = useCallback(async () => {
    const res = await fetch('/api/messages')
    if (!res.ok) return
    const data: Message[] = await res.json()
    setMessages(data)
    if (data.length > lastMsgCount.current) {
      if (!chatOpen) setUnread((u) => u + (data.length - lastMsgCount.current))
      lastMsgCount.current = data.length
    }
  }, [chatOpen])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    if (!loading) {
      loadMessages()
      const interval = setInterval(loadMessages, 5000)
      return () => clearInterval(interval)
    }
  }, [loading, loadMessages])

  useEffect(() => {
    if (chatOpen) {
      setUnread(0)
      lastMsgCount.current = messages.length
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [chatOpen, messages.length])

  async function handleVote(destId: string, hasVoted: boolean) {
    if (voting) return
    setVoting(destId)
    const res = await fetch('/api/votes', {
      method: hasVoted ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: destId }),
    })
    if (res.ok) {
      const data = await res.json()
      setUser((u) => u ? { ...u, remainingVotes: data.remainingVotes, votesUsed: (u.voteCount ?? 0) - data.remainingVotes } : u)
      setDestinations((prev) =>
        prev.map((d) => d.id === destId ? { ...d, hasVoted: !hasVoted, voteCount: d.voteCount + (hasVoted ? -1 : 1) } : d)
      )
      if (!hasVoted) { setCelebration(destId); setTimeout(() => setCelebration(null), 900) }
    }
    setVoting(null)
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!chatMsg.trim() || sending) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: chatMsg.trim() }),
    })
    if (res.ok) {
      setChatMsg('')
      await loadMessages()
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
    setSending(false)
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const totalVotes = destinations.reduce((s, d) => s + d.voteCount, 0)
  const sortedByVotes = [...destinations].sort((a, b) => b.voteCount - a.voteCount)
  const topDest = sortedByVotes[0]
  const showResults = appSettings.resultsPublic
  const votingOpen = appSettings.votingOpen

  function formatTime(ts: string) {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="travel-bg flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <div className="text-6xl animate-float mb-4">✈️</div>
          <p className="text-xl font-display animate-pulse-slow">Loading destinations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="travel-bg min-h-screen pb-24">
      {/* Background orbs */}
      <div className="floating-orb w-64 h-64 bg-cyan-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-teal-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '4s' }} />

      {/* ── HEADER ── */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl sm:text-2xl flex-shrink-0">✈️</span>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white text-base sm:text-lg leading-none truncate">TripDecider</h1>
              <p className="text-cyan-200 text-xs truncate">Hi, {user?.username}! 👋</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {showResults && (
              <a href="/results" className="bg-amber-400 text-amber-900 font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl flex items-center gap-1 hover:bg-amber-500 transition-colors">
                <span>🏆</span><span className="hidden sm:inline">Results</span>
              </a>
            )}
            {votingOpen && (
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs sm:text-sm font-bold flex-shrink-0 ${
                (user?.remainingVotes ?? 0) > 0 ? 'bg-amber-400 text-amber-900' : 'bg-slate-400/80 text-white'
              }`}>
                <span>🗳️</span>
                <span className="whitespace-nowrap">{user?.remainingVotes ?? 0} left</span>
              </div>
            )}
            <button onClick={handleLogout} className="btn-ghost text-xs py-1 px-2 sm:text-sm sm:px-3">
              Out
            </button>
          </div>
        </div>

        {/* Vote progress */}
        <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-2">
          <div className="text-xs text-cyan-200 mb-1">
            Votes: {user?.votesUsed ?? 0} / {user?.voteCount ?? 0}
          </div>
          <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${((user?.votesUsed ?? 0) / (user?.voteCount ?? 1)) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5 sm:py-8 relative z-10">
        {/* Hero */}
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white mb-1 sm:mb-2">
            Where shall we go? 🌍
          </h2>
          <p className="text-cyan-100 text-sm sm:text-base">
            {destinations.length} destination{destinations.length !== 1 ? 's' : ''} · {showResults ? `${totalVotes} votes cast` : 'Vote counting in progress...'}
          </p>
          {showResults && topDest && totalVotes > 0 && (
            <div className="inline-flex items-center gap-2 mt-2 sm:mt-3 bg-white/15 backdrop-blur px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-white text-xs sm:text-sm">
              <span>🏆</span>
              <span>Leading: <strong>{topDest.name}</strong> — {topDest.voteCount} vote{topDest.voteCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        {/* Voting closed banner */}
        {!votingOpen && (
          <div className="glass-card px-4 py-3 text-center mb-5 flex items-center justify-center gap-2 text-slate-700 font-semibold text-sm sm:text-base">
            <span>🔒</span> Voting is now closed.{' '}
            {showResults ? <a href="/results" className="text-sky-600 hover:underline ml-1">View results →</a> : ' Results coming soon!'}
          </div>
        )}

        {/* Results public banner */}
        {showResults && (
          <div className="bg-amber-400/20 backdrop-blur border border-amber-300/40 rounded-2xl px-4 py-3 text-center mb-5 flex items-center justify-center gap-2 text-white font-semibold text-sm sm:text-base">
            <span>🏆</span> Results are now live!{' '}
            <a href="/results" className="underline hover:text-amber-200 ml-1">See full results →</a>
          </div>
        )}

        {destinations.length === 0 ? (
          <div className="glass-card p-10 sm:p-16 text-center">
            <div className="text-5xl sm:text-6xl mb-4">🗺️</div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-slate-700 mb-2">No destinations yet</h3>
            <p className="text-slate-500 text-sm sm:text-base">The admin hasn&apos;t added any destinations. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {destinations.map((dest, idx) => (
              <div
                key={dest.id}
                className={`destination-card animate-fade-in ${celebration === dest.id ? 'confetti-burst' : ''}`}
                style={{ animationDelay: `${idx * 0.08}s` }}
              >
                {/* Photo */}
                <div className="relative h-44 sm:h-52 overflow-hidden">
                  <img
                    src={dest.photoUrl}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/600/400` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute top-3 right-3">
                    <div className={`vote-badge text-xs ${dest.hasVoted ? 'voted-badge' : ''}`}>
                      <span>{dest.hasVoted ? '✅' : '🗳️'}</span>
                      {showResults && <span>{dest.voteCount}</span>}
                    </div>
                  </div>
                  {showResults && idx < 3 && totalVotes > 0 && (
                    <div className="absolute top-3 left-3">
                      <div className="bg-amber-400 text-amber-900 font-bold text-xs px-2 py-0.5 rounded-full">
                        {['🥇', '🥈', '🥉'][idx]}
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                    <h3 className="text-white font-display font-bold text-lg sm:text-xl leading-tight">{dest.name}</h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  {/* Per-pax price breakdown */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Est. Cost Per Pax</span>
                      {dest.link && (
                        <a href={dest.link} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-sky-500 hover:text-sky-700">🔗 Info</a>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[6, 8, 10].map((pax) => {
                        const total = dest.accommodationPrice + dest.otherPrice
                        const perPax = total / pax
                        return (
                          <div key={pax} className="bg-gradient-to-br from-sky-50 to-cyan-50 border border-sky-100 rounded-xl p-2 text-center">
                            <div className="text-xs text-slate-500 font-medium">{pax} pax</div>
                            <div className="text-sm font-display font-bold text-sky-700 leading-tight">
                              {dest.currency} {perPax.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 text-center leading-tight">
                      🏨 {dest.currency} {dest.accommodationPrice.toLocaleString()} + ✈️ {dest.currency} {dest.otherPrice.toLocaleString()}
                    </p>
                  </div>

                  {dest.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                      {dest.tags.map((tag) => <span key={tag} className="tag-pill">{tag}</span>)}
                    </div>
                  )}

                  <p className="text-slate-600 text-sm leading-relaxed mb-3">{dest.description}</p>

                  {(dest.details || dest.media.length > 0) && (
                    <div className="mb-3">
                      <button
                        onClick={() => setExpandedId(expandedId === dest.id ? null : dest.id)}
                        className="text-sky-500 text-xs font-medium hover:text-sky-700 transition-colors flex items-center gap-1"
                      >
                        {expandedId === dest.id ? '▲ Less' : `▼ More info${dest.media.length > 0 ? ` · 📸 ${dest.media.length}` : ''}`}
                      </button>
                      {expandedId === dest.id && (
                        <div className="mt-2 animate-fade-in space-y-3">
                          {dest.details && (
                            <div className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">
                              {dest.details}
                            </div>
                          )}
                          {dest.media.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 mb-2">📸 Gallery</p>
                              <div className="grid grid-cols-2 gap-2">
                                {dest.media.map((item) => (
                                  <div key={item.id} className="rounded-xl overflow-hidden border border-slate-100">
                                    <img src={item.photoUrl} alt={item.caption || dest.name}
                                      className="w-full h-24 object-cover"
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                                    {item.caption && (
                                      <p className="text-xs text-slate-500 px-2 py-1 truncate">{item.caption}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vote button — large touch target */}
                  {votingOpen ? (
                    <button
                      onClick={() => handleVote(dest.id, dest.hasVoted)}
                      disabled={voting !== null || (!dest.hasVoted && (user?.remainingVotes ?? 0) <= 0)}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
                        dest.hasVoted
                          ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-600 border-2 border-emerald-200 hover:border-red-200 hover:text-red-500 hover:from-red-50 hover:to-pink-50'
                          : (user?.remainingVotes ?? 0) <= 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white hover:from-sky-600 hover:to-cyan-600 shadow-md hover:shadow-sky-200'
                      }`}
                    >
                      {voting === dest.id ? (
                        <><span className="animate-spin inline-block">⏳</span> Processing...</>
                      ) : dest.hasVoted ? (
                        <><span>✅</span> Voted! Tap to remove</>
                      ) : (user?.remainingVotes ?? 0) <= 0 ? (
                        <><span>🔒</span> No votes remaining</>
                      ) : (
                        <><span>🗳️</span> Vote for this</>
                      )}
                    </button>
                  ) : (
                    <div className="w-full py-3 rounded-xl font-semibold text-sm bg-slate-100 text-slate-400 flex items-center justify-center gap-2">
                      {dest.hasVoted ? <><span>✅</span> You voted for this</> : <><span>🔒</span> Voting closed</>}
                    </div>
                  )}
                </div>

                {/* Vote bar — only when results are public */}
                {showResults && totalVotes > 0 && (
                  <div className="px-4 pb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                      <span>{dest.voteCount} vote{dest.voteCount !== 1 ? 's' : ''} · {Math.round((dest.voteCount / totalVotes) * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full transition-all duration-700"
                        style={{ width: `${(dest.voteCount / totalVotes) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── FLOATING CHAT BUTTON ── */}
      <button
        onClick={() => { setChatOpen(true); setUnread(0) }}
        className="fixed bottom-5 right-4 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl bg-gradient-to-br from-orange-400 to-coral transition-all hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', display: chatOpen ? 'none' : 'flex' }}
        aria-label="Open discussion"
      >
        💬
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* ── CHAT PANEL ── */}
      {chatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col sm:inset-auto sm:bottom-4 sm:right-4 sm:w-96 sm:h-[560px] sm:rounded-2xl overflow-hidden shadow-2xl border border-white/20">
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h3 className="font-display font-bold text-base leading-none">Group Discussion</h3>
                <p className="text-cyan-200 text-xs">{messages.length} message{messages.length !== 1 ? 's' : ''} · live</p>
              </div>
            </div>
            <button onClick={() => setChatOpen(false)} className="text-white/80 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/20 transition-colors">×</button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-10">
                <div className="text-4xl mb-3">💬</div>
                <p className="font-medium text-slate-500">No messages yet</p>
                <p className="text-sm mt-1">Start the discussion! Share your thoughts about the destinations.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.username === user?.username
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                          {msg.username[0].toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{msg.username}</span>
                      </div>
                    )}
                    <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                      isMe
                        ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-tr-md'
                        : 'bg-white text-slate-800 rounded-tl-md border border-slate-100'
                    }`}>
                      {msg.content}
                    </div>
                    <span className="text-xs text-slate-400 mt-1 px-1">{formatTime(msg.createdAt)}</span>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSendMessage} className="flex gap-2 p-3 bg-white border-t border-slate-200 flex-shrink-0">
            <input
              className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-sky-300 focus:bg-white transition-all"
              placeholder="Share your thoughts... 💭"
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              maxLength={500}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!chatMsg.trim() || sending}
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all active:scale-95 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #0ea5e9, #0891b2)' }}
            >
              {sending ? (
                <span className="text-white text-sm animate-spin">⏳</span>
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Footer */}
      <footer className="text-center py-4 text-cyan-200/60 text-xs relative z-10 mt-4">
        ✈️ TripDecider — Happy travels!
      </footer>
    </div>
  )
}
