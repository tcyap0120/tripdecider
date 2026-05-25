'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Memory {
  id: string
  photoUrl: string
  caption: string
  createdAt: string
}

interface UserInfo {
  isLoggedIn: boolean
  username?: string
  displayName?: string
}

const QUOTES = [
  { text: "How many of these did you actually show up for? 👀", emoji: "🤔" },
  { text: "How many more memories could we have made? Still counting… 🌴", emoji: "😌" },
  { text: "Every trip you skipped is a memory that never existed. Just saying. 👻", emoji: "💀" },
  { text: "These were the days. Will you be in the next album? 📸", emoji: "🙏" },
  { text: "You can't filter out regret. But you can book the next trip. 🎒", emoji: "😅" },
  { text: "The group chat misses you. The photos miss you more. 💬", emoji: "🥲" },
  { text: "Future you is already jealous of past them. Don't let it happen again. ⏳", emoji: "😤" },
]

export default function MemoriesPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<Memory | null>(null)
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)

  const load = useCallback(async () => {
    const [meRes, memRes] = await Promise.all([fetch('/api/auth/me'), fetch('/api/memories')])
    const me = await meRes.json()
    if (!me.isLoggedIn) { router.replace('/login'); return }
    setUser(me)
    if (memRes.ok) setMemories(await memRes.json())
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteVisible(false)
      setTimeout(() => { setQuoteIdx((i) => (i + 1) % QUOTES.length); setQuoteVisible(true) }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Close lightbox on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightbox(null)
      if (e.key === 'ArrowRight' && lightbox) {
        const idx = memories.findIndex((m) => m.id === lightbox.id)
        if (idx < memories.length - 1) setLightbox(memories[idx + 1])
      }
      if (e.key === 'ArrowLeft' && lightbox) {
        const idx = memories.findIndex((m) => m.id === lightbox.id)
        if (idx > 0) setLightbox(memories[idx - 1])
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox, memories])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const quote = QUOTES[quoteIdx]
  const lightboxIdx = lightbox ? memories.findIndex((m) => m.id === lightbox.id) : -1

  if (loading) return (
    <div className="travel-bg flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="text-6xl animate-float mb-4">📸</div>
        <p className="text-xl font-display animate-pulse-slow">Loading memories...</p>
      </div>
    </div>
  )

  return (
    <div className="travel-bg min-h-screen pb-12">
      <div className="floating-orb w-64 h-64 bg-pink-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-rose-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">📸</span>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white text-base leading-none">Memories</h1>
              <p className="text-cyan-200 text-xs truncate">Hi, {user?.displayName || user?.username}! 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Link href="/vote" className="btn-ghost text-xs py-1 px-2 sm:px-3 flex items-center gap-1"><span>🗳️</span><span className="hidden sm:inline">Vote</span></Link>
            <Link href="/dates" className="btn-ghost text-xs py-1 px-2 sm:px-3 flex items-center gap-1"><span>📅</span><span className="hidden sm:inline">Dates</span></Link>
            <Link href="/discussion" className="btn-ghost text-xs py-1 px-2 sm:px-3 flex items-center gap-1"><span>💬</span><span className="hidden sm:inline">Chat</span></Link>
            <button onClick={handleLogout} className="btn-ghost text-xs py-1 px-2 sm:px-3">Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="text-5xl sm:text-6xl mb-3 animate-float">📸</div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-2">Our Memories</h2>
          <p className="text-cyan-100 text-sm sm:text-base">
            {memories.length} {memories.length === 1 ? 'photo' : 'photos'} · tap any to view
          </p>
        </div>

        {memories.length === 0 ? (
          <div className="glass-card p-14 text-center max-w-md mx-auto">
            <div className="text-6xl mb-4">🫙</div>
            <h3 className="text-xl font-display font-bold text-slate-700 mb-2">Nothing here yet</h3>
            <p className="text-slate-500 text-sm">The organiser hasn&apos;t uploaded any memories yet. Check back after the trip!</p>
          </div>
        ) : (
          /* Masonry grid */
          <div className="columns-2 sm:columns-3 gap-3 space-y-3">
            {memories.map((mem, idx) => (
              <div
                key={mem.id}
                className="break-inside-avoid cursor-pointer group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${idx * 0.05}s` }}
                onClick={() => setLightbox(mem)}
              >
                <img
                  src={mem.photoUrl}
                  alt={mem.caption || 'Memory'}
                  loading="lazy"
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-end">
                  {mem.caption && (
                    <p className="w-full px-3 py-2 text-white text-xs font-medium translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/60 to-transparent">
                      {mem.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Funny quotes section */}
        {memories.length > 0 && (
          <div className="mt-14 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="h-px flex-1 bg-white/20 max-w-[80px]" />
              <span className="text-white/40 text-xs tracking-widest uppercase">Reflect on this</span>
              <div className="h-px flex-1 bg-white/20 max-w-[80px]" />
            </div>

            <div className="max-w-lg mx-auto" style={{ opacity: quoteVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
              <div className="text-4xl mb-3">{quote.emoji}</div>
              <p className="text-white/80 text-base sm:text-lg italic leading-relaxed font-medium">
                &ldquo;{quote.text}&rdquo;
              </p>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-5">
              {QUOTES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setQuoteIdx(i); setQuoteVisible(true) }}
                  className={`rounded-full transition-all duration-300 ${i === quoteIdx ? 'w-4 h-2 bg-white/80' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>

            <p className="text-white/25 text-xs mt-8">
              Compiled with love (and guilt) by TC Yap 🥲
            </p>
          </div>
        )}
      </main>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl leading-none z-10 w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
            onClick={() => setLightbox(null)}
          >×</button>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(memories[lightboxIdx - 1]) }}
            >‹</button>
          )}

          {/* Next */}
          {lightboxIdx < memories.length - 1 && (
            <button
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightbox(memories[lightboxIdx + 1]) }}
            >›</button>
          )}

          <img
            src={lightbox.photoUrl}
            alt={lightbox.caption || 'Memory'}
            className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {lightbox.caption && (
            <p className="text-white/80 text-sm mt-4 text-center max-w-md px-4" onClick={(e) => e.stopPropagation()}>
              {lightbox.caption}
            </p>
          )}

          <p className="text-white/30 text-xs mt-2">{lightboxIdx + 1} / {memories.length}</p>
        </div>
      )}
    </div>
  )
}
