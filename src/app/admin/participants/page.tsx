'use client'
import { useEffect, useState } from 'react'

interface Participant {
  id: string
  username: string
  voteCount: number
  votesUsed: number
  remainingVotes: number
  createdAt: string
}

const emptyForm = () => ({ username: '', password: '', voteCount: '1' })

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Participant | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/admin/participants')
    setParticipants(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setError('')
    setShowForm(true)
  }

  function openEdit(p: Participant) {
    setEditing(p)
    setForm({ username: p.username, password: '', voteCount: String(p.voteCount) })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    if (!editing && !form.password) {
      setError('Password is required for new participants')
      setSaving(false)
      return
    }

    const body: Record<string, string | number> = { username: form.username, voteCount: parseInt(form.voteCount) }
    if (form.password) body.password = form.password

    const url = editing ? `/api/admin/participants/${editing.id}` : '/api/admin/participants'
    const method = editing ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Failed to save')
      setSaving(false)
      return
    }

    await load()
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id: string, username: string) {
    if (!confirm(`Delete participant "${username}"? Their votes will also be removed.`)) return
    setDeleting(id)
    await fetch(`/api/admin/participants/${id}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">👥</div>
        <p className="animate-pulse">Loading...</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">👥 Participants</h2>
          <p className="text-slate-500 text-sm mt-0.5">{participants.length} participant{participants.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <span>+</span> Add Participant
        </button>
      </div>

      {participants.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">👤</div>
          <h3 className="text-xl font-display font-bold text-slate-700 mb-2">No participants yet</h3>
          <p className="text-slate-500 mb-5">Add participants so they can log in and vote for destinations.</p>
          <button onClick={openAdd} className="btn-primary">+ Add First Participant</button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr className="text-left text-slate-600">
                  <th className="px-5 py-3 font-semibold">Participant</th>
                  <th className="px-5 py-3 font-semibold text-center">Votes Allocated</th>
                  <th className="px-5 py-3 font-semibold text-center">Used</th>
                  <th className="px-5 py-3 font-semibold text-center">Remaining</th>
                  <th className="px-5 py-3 font-semibold text-center">Status</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {p.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{p.username}</div>
                          <div className="text-slate-400 text-xs">ID: {p.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="font-bold text-slate-700 text-base">{p.voteCount}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-bold ${p.votesUsed > 0 ? 'text-sky-600' : 'text-slate-300'}`}>
                        {p.votesUsed}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className={`font-bold ${p.remainingVotes > 0 ? 'text-amber-500' : 'text-slate-300'}`}>
                        {p.remainingVotes}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      {p.remainingVotes === 0 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          ✅ Voted
                        </span>
                      ) : p.votesUsed > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
                          🗳️ Partial
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-medium px-2.5 py-1 rounded-full">
                          ⏳ Pending
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-sky-500 hover:text-sky-700 font-medium text-xs px-2.5 py-1.5 rounded-lg hover:bg-sky-50 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.username)}
                          disabled={deleting === p.id}
                          className="text-red-500 hover:text-red-700 font-medium text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          {deleting === p.id ? '...' : '🗑️ Del'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick credential cards for sharing */}
      {participants.length > 0 && (
        <div className="mt-6 bg-gradient-to-r from-sky-50 to-cyan-50 border border-sky-200 rounded-2xl p-5">
          <h3 className="font-display font-bold text-slate-700 mb-1 flex items-center gap-2">
            <span>📋</span> Share Login Credentials
          </h3>
          <p className="text-slate-500 text-sm mb-3">Share these credentials with participants. They can log in at <strong>your-app-url/login</strong></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {participants.map((p) => (
              <div key={p.id} className="bg-white rounded-xl p-3 border border-sky-100 text-sm">
                <div className="font-semibold text-slate-800">👤 {p.username}</div>
                <div className="text-slate-400 text-xs">Password set by admin · {p.voteCount} vote{p.voteCount !== 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-display font-bold text-slate-800">
                {editing ? '✏️ Edit Participant' : '➕ Add Participant'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username *</label>
                <input className="input-field" placeholder="e.g. alice" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password {editing ? '(leave blank to keep unchanged)' : '*'}
                </label>
                <input
                  className="input-field"
                  type="password"
                  placeholder={editing ? 'New password (optional)' : 'Set a password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editing}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Votes Allocated</label>
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  max="100"
                  value={form.voteCount}
                  onChange={(e) => setForm({ ...form, voteCount: e.target.value })}
                  required
                />
                <p className="text-xs text-slate-400 mt-1">How many destinations this participant can vote for</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                  <span>❌</span> {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 btn-primary justify-center py-2.5">
                  {saving ? <><span className="animate-spin">⏳</span> Saving...</> : editing ? '✅ Save' : '➕ Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
