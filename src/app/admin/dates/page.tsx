'use client'
import { useState, useEffect, useRef } from 'react'

interface Voter {
  id: string
  username: string
  displayName: string
}

interface DateOption {
  id: string
  date: string
  label: string
  votes: { participant: Voter }[]
  _count: { votes: number }
}

interface Participant {
  id: string
  username: string
  displayName: string
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminDatesPage() {
  const [dateOptions, setDateOptions] = useState<DateOption[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [dateVotingOpen, setDateVotingOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [newDate, setNewDate] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState('')
  const mouseDownTarget = useRef<EventTarget | null>(null)

  async function load() {
    const [optRes, settingsRes] = await Promise.all([
      fetch('/api/admin/date-options'),
      fetch('/api/admin/settings'),
    ])
    const { dateOptions: opts, participants: parts } = await optRes.json()
    const s = await settingsRes.json()
    setDateOptions(opts)
    setParticipants(parts)
    setDateVotingOpen(s.dateVotingOpen)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function toggleDateVoting() {
    setToggling(true)
    const newVal = !dateVotingOpen
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dateVotingOpen: newVal }),
    })
    setDateVotingOpen(newVal)
    setToggling(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newDate) { setAddError('Please select a date'); return }
    setAdding(true)
    setAddError('')
    const res = await fetch('/api/admin/date-options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: newDate, label: newLabel }),
    })
    if (res.ok) {
      setNewDate('')
      setNewLabel('')
      await load()
    } else {
      const d = await res.json()
      setAddError(d.error || 'Failed to add')
    }
    setAdding(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Remove this date option? All votes for it will be deleted.')) return
    setDeleting(id)
    await fetch(`/api/admin/date-options/${id}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">📅</div>
        <p className="animate-pulse">Loading...</p>
      </div>
    </div>
  )

  const totalParticipants = participants.length

  return (
    <div className="space-y-6">
      {/* Toggle */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-display font-bold text-slate-800 mb-4">⚙️ Date Voting Control</h2>
        <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border-2 transition-colors ${
          dateVotingOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
        }`}>
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-2">
              <span>{dateVotingOpen ? '📅' : '🔒'}</span>
              Date Voting
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              {dateVotingOpen
                ? 'Participants can see and vote on dates'
                : 'Date section shows "Coming Soon" to participants'}
            </p>
          </div>
          <button
            onClick={toggleDateVoting}
            disabled={toggling}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              dateVotingOpen ? 'bg-emerald-500' : 'bg-slate-300'
            } ${toggling ? 'opacity-50' : ''}`}
          >
            <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${dateVotingOpen ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Add date */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-display font-bold text-slate-800 mb-4">➕ Add Date Option</h2>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Date *</label>
            <input
              type="date"
              className="input-field text-sm"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Label (optional)</label>
            <input
              className="input-field text-sm"
              placeholder="e.g. Long weekend, Public holiday"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={60}
            />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={adding} className="btn-primary whitespace-nowrap">
              {adding ? '⏳ Adding…' : '+ Add Date'}
            </button>
          </div>
        </form>
        {addError && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><span>❌</span> {addError}</p>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-display font-bold text-slate-800">📊 Availability Results</h2>
          <span className="text-xs text-slate-400">{totalParticipants} participant{totalParticipants !== 1 ? 's' : ''} total</span>
        </div>

        {dateOptions.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-3">📭</div>
            <p>No date options yet. Add some above!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {dateOptions.map((opt) => {
              const pct = totalParticipants > 0 ? Math.round((opt._count.votes / totalParticipants) * 100) : 0
              const voters = opt.votes.map((v) => v.participant)
              const notVoted = participants.filter((p) => !voters.find((v) => v.id === p.id))
              return (
                <div key={opt.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-50">
                    {/* Date block */}
                    <div className="flex-shrink-0 text-center w-12">
                      <div className="text-lg font-display font-bold text-slate-800 leading-none">
                        {new Date(opt.date + 'T00:00:00').getDate()}
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {new Date(opt.date + 'T00:00:00').toLocaleDateString('en-MY', { month: 'short' })}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{formatDate(opt.date)}</span>
                        {opt.label && <span className="text-xs text-slate-400">{opt.label}</span>}
                      </div>
                      {/* Progress bar */}
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-sky-600 flex-shrink-0">
                          {opt._count.votes}/{totalParticipants}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(opt.id)}
                      disabled={deleting === opt.id}
                      className="flex-shrink-0 text-red-400 hover:text-red-600 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      {deleting === opt.id ? '...' : '🗑️'}
                    </button>
                  </div>

                  {/* Voter breakdown */}
                  <div className="px-4 py-2.5 flex flex-wrap gap-1.5">
                    {voters.map((v) => (
                      <span key={v.id} className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                        ✅ {v.displayName || v.username}
                      </span>
                    ))}
                    {notVoted.map((v) => (
                      <span key={v.id} className="inline-flex items-center gap-1 bg-slate-50 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-200">
                        — {v.displayName || v.username}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
