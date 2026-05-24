'use client'
import { useEffect, useState, useRef, useCallback } from 'react'

interface Message {
  id: string
  username: string
  content: string
  destinationId?: string | null
  createdAt: string
  participantId: string
}

interface Destination {
  id: string
  name: string
}

export default function DiscussionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const [msgRes, destRes] = await Promise.all([
      fetch('/api/messages'),
      fetch('/api/admin/destinations'),
    ])
    if (msgRes.ok) setMessages(await msgRes.json())
    if (destRes.ok) {
      const dests = await destRes.json()
      setDestinations(dests.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name })))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function handleDelete(id: string) {
    if (!confirm('Delete this message?')) return
    setDeleting(id)
    await fetch('/api/messages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    await load()
    setDeleting(null)
  }

  function formatTime(ts: string) {
    return new Date(ts).toLocaleString()
  }

  function destName(id?: string | null) {
    if (!id) return null
    return destinations.find((d) => d.id === id)?.name ?? 'Unknown destination'
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">💬</div>
        <p className="animate-pulse">Loading discussion...</p>
      </div>
    </div>
  )

  const filteredMessages = activeTab === 'all'
    ? messages
    : activeTab === 'general'
    ? messages.filter((m) => !m.destinationId)
    : messages.filter((m) => m.destinationId === activeTab)

  const tabs = [
    { id: 'all', label: 'All', count: messages.length },
    { id: 'general', label: '💬 General', count: messages.filter((m) => !m.destinationId).length },
    ...destinations.map((d) => ({
      id: d.id,
      label: `🏝️ ${d.name}`,
      count: messages.filter((m) => m.destinationId === d.id).length,
    })),
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">💬 Discussion</h2>
          <p className="text-slate-500 text-sm mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''} · auto-refreshes every 5s</p>
        </div>
        <button onClick={load} className="btn-primary py-2 px-4 text-sm">
          🔄 Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-sky-600 text-white shadow'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20' : 'bg-slate-100'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {filteredMessages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-display font-bold text-slate-700 mb-2">No messages</h3>
          <p className="text-slate-500">No messages in this category yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
            {filteredMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group p-2 rounded-xl hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {msg.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{msg.username}</span>
                    <span className="text-slate-400 text-xs">{formatTime(msg.createdAt)}</span>
                    {msg.destinationId && (
                      <span className="text-xs bg-sky-100 text-sky-600 font-medium px-2 py-0.5 rounded-full">
                        🏝️ {destName(msg.destinationId)}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700 text-sm mt-0.5 break-words">{msg.content}</p>
                </div>
                <button
                  onClick={() => handleDelete(msg.id)}
                  disabled={deleting === msg.id}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-xs font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-all flex-shrink-0"
                >
                  {deleting === msg.id ? '...' : '🗑️'}
                </button>
              </div>
            ))}
            <div ref={endRef} />
          </div>
        </div>
      )}
    </div>
  )
}
