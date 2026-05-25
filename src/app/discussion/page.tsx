'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Message {
  id: string
  username: string
  content: string
  destinationId?: string | null
  createdAt: string
  participantId: string
}

interface UserInfo {
  isLoggedIn: boolean
  userId?: string
  username?: string
  displayName?: string
}

interface Destination {
  id: string
  name: string
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMe && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-1 shadow">
          {msg.username[0].toUpperCase()}
        </div>
      )}
      <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
        {!isMe && <span className="text-white/70 text-xs font-medium px-1">{msg.username}</span>}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words ${
          isMe
            ? 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white rounded-br-sm'
            : 'bg-white/90 backdrop-blur text-slate-800 rounded-bl-sm'
        }`}>
          {msg.content}
        </div>
        <span className="text-white/40 text-xs px-1">{formatTime(msg.createdAt)}</span>
      </div>
    </div>
  )
}

export default function DiscussionPage() {
  const router = useRouter()
  const [user, setUser] = useState<UserInfo | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<string>('general')
  const endRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const isAtBottomRef = useRef(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const [meRes, msgRes, destRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/messages'),
      fetch('/api/destinations'),
    ])
    const me = await meRes.json()
    if (!me.isLoggedIn) { router.replace('/login'); return }
    setUser(me)
    if (msgRes.ok) setMessages(await msgRes.json())
    if (destRes.ok) {
      const dests = await destRes.json()
      setDestinations(dests.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })))
    }
    setLoading(false)
  }, [router])

  const loadMessages = useCallback(async () => {
    const res = await fetch('/api/messages')
    if (res.ok) setMessages(await res.json())
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [loadMessages])

  useEffect(() => {
    if (isAtBottomRef.current) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, activeTab])

  function handleScroll() {
    const el = scrollRef.current
    if (!el) return
    isAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  }

  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || sending) return
    setSending(true)
    setError('')
    const destinationId = activeTab === 'general' ? null : activeTab
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, destinationId }),
    })
    if (res.ok) {
      setInput('')
      isAtBottomRef.current = true
      await loadMessages()
    } else {
      const d = await res.json()
      setError(d.error || 'Failed to send')
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  if (loading) return (
    <div className="travel-bg flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="text-6xl animate-float mb-4">💬</div>
        <p className="text-xl font-display animate-pulse-slow">Loading discussion...</p>
      </div>
    </div>
  )

  const generalMessages = messages.filter((m) => !m.destinationId)
  const destMessages = (destId: string) => messages.filter((m) => m.destinationId === destId)
  const activeMessages = activeTab === 'general' ? generalMessages : destMessages(activeTab)
  const activeDestName = destinations.find((d) => d.id === activeTab)?.name

  const tabs = [
    { id: 'general', label: '💬 General', count: generalMessages.length },
    ...destinations.map((d) => ({ id: d.id, label: `🏝️ ${d.name}`, count: destMessages(d.id).length })),
  ]

  return (
    <div className="travel-bg flex flex-col" style={{ height: '100dvh', minHeight: '0' }}>
      <div className="floating-orb w-64 h-64 bg-cyan-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-teal-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">💬</span>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-white text-base leading-none">Discussion</h1>
              <p className="text-cyan-200 text-xs">Hi, {user?.displayName || user?.username}! 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/vote" className="btn-ghost text-xs py-1 px-2 sm:px-3 flex items-center gap-1"><span>🗳️</span><span className="hidden sm:inline">Vote</span></Link>
            <Link href="/dates" className="btn-ghost text-xs py-1 px-2 sm:px-3 flex items-center gap-1"><span>📅</span><span className="hidden sm:inline">Dates</span></Link>
            <Link href="/memories" className="btn-ghost text-xs py-1 px-2 sm:px-3 flex items-center gap-1"><span>📸</span><span className="hidden sm:inline">Memories</span></Link>
            <button onClick={handleLogout} className="btn-ghost text-xs py-1 px-2 sm:px-3">Out</button>
          </div>
        </div>

        {/* Destination tabs */}
        <div className="max-w-2xl mx-auto px-4 pb-0 flex gap-1 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); isAtBottomRef.current = true }}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white border-b-2 border-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/30' : 'bg-white/10'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 flex flex-col max-w-2xl w-full mx-auto px-4 pt-3 pb-2 relative z-10 min-h-0 overflow-hidden">
        {activeDestName && (
          <div className="mb-3 text-center">
            <span className="text-white/60 text-xs bg-white/10 px-3 py-1 rounded-full">
              Comments about {activeDestName}
            </span>
          </div>
        )}

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto space-y-3 pb-2"
          style={{ minHeight: 0 }}
        >
          {activeMessages.length === 0 ? (
            <div className="glass-card p-10 text-center mt-4">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-display font-bold text-slate-700 text-lg mb-1">No messages yet</p>
              <p className="text-slate-500 text-sm">
                {activeTab === 'general' ? 'Be the first to say something!' : `Be the first to comment on ${activeDestName}!`}
              </p>
            </div>
          ) : (
            activeMessages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} isMe={msg.username === (user?.displayName || user?.username)} />
            ))
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 pt-3">
          {error && <div className="text-red-300 text-xs mb-2 px-1">❌ {error}</div>}
          <form onSubmit={handleSend} className="flex gap-2 items-end bg-white/15 backdrop-blur border border-white/25 rounded-2xl p-2">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
              onKeyDown={handleKeyDown}
              placeholder={activeTab === 'general' ? 'General chat… (Enter to send)' : `Comment on ${activeDestName}…`}
              maxLength={500}
              className="flex-1 bg-transparent text-white placeholder-white/50 resize-none outline-none text-sm leading-relaxed px-2 py-1.5 min-h-[36px]"
              style={{ height: '36px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex-shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-cyan-500 flex items-center justify-center text-white shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending ? <span className="animate-spin text-xs">⏳</span> : <span className="text-base">➤</span>}
            </button>
          </form>
          <p className="text-white/30 text-xs text-right mt-1 pr-1">{input.length}/500 · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
