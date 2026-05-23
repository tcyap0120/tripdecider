'use client'
import { useEffect, useState } from 'react'

interface Destination {
  id: string
  name: string
  description: string
  price: number
  currency: string
  photoUrl: string
  link?: string
  details: string
  tags: string[]
  voteCount: number
}

const CURRENCIES = ['MYR', 'USD', 'EUR', 'SGD', 'THB', 'JPY', 'AUD', 'GBP']

const empty = () => ({
  name: '', description: '', price: '', currency: 'MYR',
  photoUrl: '', link: '', details: '', tags: '',
})

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Destination | null>(null)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/admin/destinations')
    setDestinations(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openAdd() {
    setEditing(null)
    setForm(empty())
    setError('')
    setShowForm(true)
  }

  function openEdit(dest: Destination) {
    setEditing(dest)
    setForm({
      name: dest.name,
      description: dest.description,
      price: String(dest.price),
      currency: dest.currency,
      photoUrl: dest.photoUrl,
      link: dest.link || '',
      details: dest.details,
      tags: dest.tags.join(', '),
    })
    setError('')
    setShowForm(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    const body = {
      ...form,
      price: parseFloat(form.price),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
    }

    const url = editing ? `/api/admin/destinations/${editing.id}` : '/api/admin/destinations'
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

  async function handleDelete(id: string) {
    if (!confirm('Delete this destination? All votes for it will also be removed.')) return
    setDeleting(id)
    await fetch(`/api/admin/destinations/${id}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">🗺️</div>
        <p className="animate-pulse">Loading...</p>
      </div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">🗺️ Destinations</h2>
          <p className="text-slate-500 text-sm mt-0.5">{destinations.length} destination{destinations.length !== 1 ? 's' : ''} added</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <span>+</span> Add Destination
        </button>
      </div>

      {destinations.length === 0 && !showForm ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
          <div className="text-6xl mb-4">✈️</div>
          <h3 className="text-xl font-display font-bold text-slate-700 mb-2">No destinations yet</h3>
          <p className="text-slate-500 mb-5">Add your first destination to get the voting started!</p>
          <button onClick={openAdd} className="btn-primary">+ Add First Destination</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest) => (
            <div key={dest.id} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-44">
                <img
                  src={dest.photoUrl}
                  alt={dest.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/400/300` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <h3 className="text-white font-display font-bold text-lg leading-tight">{dest.name}</h3>
                  <div className="vote-badge text-xs">
                    <span>🗳️</span> {dest.voteCount}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sky-600 font-bold text-lg">{dest.currency} {dest.price.toLocaleString()}</span>
                  {dest.tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {dest.tags.slice(0, 2).map((t) => (
                        <span key={t} className="tag-pill text-xs">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{dest.description}</p>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(dest)} className="flex-1 btn-primary py-2 text-sm justify-center">
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(dest.id)}
                    disabled={deleting === dest.id}
                    className="flex-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-semibold py-2 text-sm rounded-xl transition-colors"
                  >
                    {deleting === dest.id ? '...' : '🗑️ Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-display font-bold text-slate-800">
                {editing ? '✏️ Edit Destination' : '➕ Add Destination'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Destination Name *</label>
                  <input className="input-field" placeholder="e.g. Bali, Indonesia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price *</label>
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="e.g. 2500" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Currency</label>
                  <select className="input-field" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo URL *</label>
                  <input className="input-field" placeholder="https://example.com/photo.jpg" value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} required />
                  <p className="text-xs text-slate-400 mt-1">Paste any image URL from Google Images, Unsplash, etc.</p>
                </div>

                {form.photoUrl && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo Preview</label>
                    <img src={form.photoUrl} alt="preview" className="h-40 w-full object-cover rounded-xl border border-slate-200" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Description *</label>
                  <textarea className="input-field" rows={2} placeholder="A beautiful tropical paradise..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Details</label>
                  <textarea className="input-field" rows={4} placeholder="Detailed information about this destination, what's included, itinerary, etc." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link (optional)</label>
                  <input className="input-field" placeholder="https://booking.com/..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags (comma separated)</label>
                  <input className="input-field" placeholder="Beach, Adventure, Family-friendly" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
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
                  {saving ? <><span className="animate-spin">⏳</span> Saving...</> : editing ? '✅ Save Changes' : '➕ Add Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
