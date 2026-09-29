'use client'
import { useEffect, useRef, useState } from 'react'

interface Trip {
  id: string
  name: string
  description: string
  status: 'active' | 'past'
  createdAt: string
  participantIds: string[]
  destinationCount: number
  dateOptionCount: number
}

interface ParticipantOption {
  id: string
  username: string
  displayName: string
}

type Modal =
  | { kind: 'create' }
  | { kind: 'edit'; trip: Trip }
  | { kind: 'participants'; trip: Trip }
  | null

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [participants, setParticipants] = useState<ParticipantOption[]>([])
  const [currentTripId, setCurrentTripId] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<Modal>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [ticked, setTicked] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const mouseDownTarget = useRef<EventTarget | null>(null)

  async function load() {
    const res = await fetch('/api/admin/trips')
    if (res.ok) {
      const d = await res.json()
      setTrips(d.trips)
      setParticipants(d.participants)
      setCurrentTripId(d.currentTripId)
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openCreate() {
    setName('')
    setDescription('')
    setTicked(new Set(participants.map((p) => p.id)))
    setError('')
    setModal({ kind: 'create' })
  }

  function openEdit(trip: Trip) {
    setName(trip.name)
    setDescription(trip.description)
    setError('')
    setModal({ kind: 'edit', trip })
  }

  function openParticipants(trip: Trip) {
    setTicked(new Set(trip.participantIds))
    setError('')
    setModal({ kind: 'participants', trip })
  }

  function toggleTick(id: string) {
    setTicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!modal) return
    setSaving(true)
    setError('')

    let res: Response
    if (modal.kind === 'create') {
      res = await fetch('/api/admin/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, participantIds: [...ticked] }),
      })
    } else if (modal.kind === 'edit') {
      res = await fetch(`/api/admin/trips/${modal.trip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      })
    } else {
      res = await fetch(`/api/admin/trips/${modal.trip.id}/participants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantIds: [...ticked] }),
      })
    }

    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setError(d.error || 'Failed to save')
      setSaving(false)
      return
    }

    setSaving(false)
    setModal(null)
    // A new trip becomes the managed trip, so reload to refresh the header switcher too
    if (modal.kind === 'create') window.location.href = '/admin/destinations'
    else await load()
  }

  async function setStatus(trip: Trip, status: 'active' | 'past') {
    setBusy(trip.id)
    await fetch(`/api/admin/trips/${trip.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
    setBusy(null)
  }

  async function manage(trip: Trip) {
    setBusy(trip.id)
    await fetch('/api/admin/trips/current', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId: trip.id }),
    })
    window.location.href = '/admin'
  }

  async function handleDelete(trip: Trip) {
    if (!confirm(`Delete "${trip.name}"?\n\nThis permanently removes its ${trip.destinationCount} destinations, all votes, date options and chat. This cannot be undone.

Shared memories are kept.`)) return
    setBusy(trip.id)
    const res = await fetch(`/api/admin/trips/${trip.id}`, { method: 'DELETE' })
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      alert(d.error || 'Failed to delete')
    }
    if (trip.id === currentTripId) window.location.reload()
    else await load()
    setBusy(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">🧳</div>
        <p className="animate-pulse">Loading...</p>
      </div>
    </div>
  )

  const activeTrips = trips.filter((t) => t.status !== 'past')
  const pastTrips = trips.filter((t) => t.status === 'past')
  const nameOf = (id: string) => {
    const p = participants.find((x) => x.id === id)
    return p ? p.displayName || p.username : ''
  }

  function TripRow({ trip }: { trip: Trip }) {
    const isPast = trip.status === 'past'
    const isCurrent = trip.id === currentTripId
    const members = trip.participantIds.map(nameOf).filter(Boolean)
    return (
      <div className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${isCurrent ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 ${isPast ? 'bg-slate-100' : 'bg-gradient-to-br from-sky-100 to-teal-100'}`}>
            {isPast ? '📜' : '✈️'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-display font-bold text-slate-800 text-lg leading-tight">{trip.name}</h3>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isPast ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                {isPast ? 'Past trip' : 'Active'}
              </span>
              {isCurrent && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Managing now</span>
              )}
            </div>
            {trip.description && <p className="text-slate-500 text-sm mt-1">{trip.description}</p>}
            <p className="text-slate-400 text-xs mt-2">
              🗺️ {trip.destinationCount} destinations · 📅 {trip.dateOptionCount} dates · created {new Date(trip.createdAt).toLocaleDateString()}
            </p>
            <button
              onClick={() => openParticipants(trip)}
              className="mt-3 flex flex-wrap items-center gap-1.5 text-left group"
              title="Choose who can view and vote"
            >
              <span className="text-xs font-semibold text-slate-600 mr-1">👥 {members.length} participant{members.length !== 1 ? 's' : ''}:</span>
              {members.length === 0 && <span className="text-xs text-amber-600">nobody yet — tick participants</span>}
              {members.slice(0, 8).map((m) => (
                <span key={m} className="text-xs bg-sky-50 text-sky-700 border border-sky-100 px-2 py-0.5 rounded-full">{m}</span>
              ))}
              {members.length > 8 && <span className="text-xs text-slate-400">+{members.length - 8} more</span>}
              <span className="text-xs text-sky-500 group-hover:underline ml-1">Edit</span>
            </button>
          </div>
          <div className="flex sm:flex-col gap-2 flex-wrap sm:items-end flex-shrink-0">
            {!isCurrent && (
              <button onClick={() => manage(trip)} disabled={busy === trip.id} className="btn-primary text-xs py-1.5 px-3">
                Manage →
              </button>
            )}
            <div className="flex gap-1">
              <button onClick={() => openEdit(trip)} className="text-sky-500 hover:text-sky-700 font-medium text-xs px-2.5 py-1.5 rounded-lg hover:bg-sky-50 transition-colors">
                ✏️ Rename
              </button>
              <button
                onClick={() => setStatus(trip, isPast ? 'active' : 'past')}
                disabled={busy === trip.id}
                className="text-slate-500 hover:text-slate-700 font-medium text-xs px-2.5 py-1.5 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                {isPast ? '🔓 Reopen' : '📜 Mark as past'}
              </button>
              <button
                onClick={() => handleDelete(trip)}
                disabled={busy === trip.id || trips.length <= 1}
                className="text-red-500 hover:text-red-700 font-medium text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-30"
              >
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">🧳 Trips</h2>
          <p className="text-slate-500 text-sm mt-0.5">Each trip has its own destinations, voting, dates and chat. Memories are shared across all trips.</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex-shrink-0">
          <span>+</span> New Trip
        </button>
      </div>

      <div className="space-y-8">
        {activeTrips.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Active</h3>
            <div className="space-y-3">{activeTrips.map((t) => <TripRow key={t.id} trip={t} />)}</div>
          </section>
        )}
        {pastTrips.length > 0 && (
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Past trips</h3>
            <p className="text-slate-400 text-xs -mt-2 mb-3">Participants can still view past trips, but voting is closed.</p>
            <div className="space-y-3">{pastTrips.map((t) => <TripRow key={t.id} trip={t} />)}</div>
          </section>
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onMouseDown={(e) => { mouseDownTarget.current = e.target }}
          onClick={(e) => { if (e.target === e.currentTarget && mouseDownTarget.current === e.currentTarget) setModal(null) }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl font-display font-bold text-slate-800">
                {modal.kind === 'create' ? '✈️ New Trip' : modal.kind === 'edit' ? '✏️ Rename Trip' : `👥 ${modal.trip.name}`}
              </h3>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {modal.kind !== 'participants' && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trip name *</label>
                    <input className="input-field" placeholder="e.g. Year-end Trip 2026" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                    <input className="input-field" placeholder="Optional — shown to participants" value={description} onChange={(e) => setDescription(e.target.value)} />
                  </div>
                </>
              )}

              {modal.kind !== 'edit' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-slate-700">
                      Who&apos;s on this trip? <span className="text-slate-400 font-normal">({ticked.size}/{participants.length})</span>
                    </label>
                    <div className="flex gap-2 text-xs">
                      <button type="button" onClick={() => setTicked(new Set(participants.map((p) => p.id)))} className="text-sky-500 hover:underline">All</button>
                      <button type="button" onClick={() => setTicked(new Set())} className="text-slate-400 hover:underline">None</button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mb-2">Only ticked participants can see this trip and vote.</p>
                  {participants.length === 0 ? (
                    <p className="text-sm text-slate-500 bg-slate-50 rounded-xl p-3">No participants yet — add them on the Participants tab.</p>
                  ) : (
                    <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 max-h-72 overflow-y-auto">
                      {participants.map((p) => (
                        <label key={p.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={ticked.has(p.id)}
                            onChange={() => toggleTick(p.id)}
                            className="w-4 h-4 accent-sky-500"
                          />
                          <span className="text-sm font-medium text-slate-700">{p.displayName || p.username}</span>
                          {p.displayName && <span className="text-xs text-slate-400">@{p.username}</span>}
                        </label>
                      ))}
                    </div>
                  )}
                  {modal.kind === 'participants' && (
                    <p className="text-xs text-slate-400 mt-2">Unticking someone hides the trip from them. Votes they already cast stay in the tally.</p>
                  )}
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                  <span>❌</span> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center py-2.5">
                  {saving ? <><span className="animate-spin">⏳</span> Saving...</> : modal.kind === 'create' ? '✈️ Create Trip' : '✅ Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
