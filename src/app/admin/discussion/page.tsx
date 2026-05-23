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

export default function DiscussionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch('/api/messages')
    if (res.ok) {
      setMessages(await res.json())
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

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">💬</div>
        <p className="animate-pulse">Loading discussion...</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">💬 Discussion</h2>
          <p className="text-slate-500 text-sm mt-0.5">{messages.length} message{messages.length !== 1 ? 's' : ''} · auto-refreshes every 5s</p>
        </div>
        <button onClick={load} className="btn-primary py-2 px-4 text-sm">
          🔄 Refresh
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-display font-bold text-slate-700 mb-2">No messages yet</h3>
          <p className="text-slate-500">Participants haven&apos;t started discussing yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="max-h-[600px] overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group p-2 rounded-xl hover:bg-slate-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {msg.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{msg.username}</span>
                    <span className="text-slate-400 text-xs">{formatTime(msg.createdAt)}</span>
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
