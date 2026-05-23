'use client'
import { useEffect, useState, useRef } from 'react'

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
  photoUrl: string
  link?: string
  details: string
  tags: string[]
  voteCount: number
  media: MediaItem[]
}

const empty = () => ({ name: '', description: '', accommodationPrice: '', otherPrice: '', photoUrl: '', link: '', details: '', tags: '' })

async function compressImage(file: File, maxWidth = 1400, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (e) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let w = img.naturalWidth, h = img.naturalHeight
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      img.src = e.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Destination | null>(null)
  const [form, setForm] = useState(empty())
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [uploadingMain, setUploadingMain] = useState(false)

  // Gallery modal state
  const [galleryDest, setGalleryDest] = useState<Destination | null>(null)
  const [galleryCaption, setGalleryCaption] = useState('')
  const [galleryPhotoUrl, setGalleryPhotoUrl] = useState('')
  const [addingMedia, setAddingMedia] = useState(false)
  const [deletingMedia, setDeletingMedia] = useState<string | null>(null)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const mainFileRef = useRef<HTMLInputElement>(null)
  const galleryFileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch('/api/admin/destinations')
    setDestinations(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleMainFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingMain(true)
    const compressed = await compressImage(file)
    setForm((f) => ({ ...f, photoUrl: compressed }))
    setUploadingMain(false)
  }

  async function handleGalleryFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingGallery(true)
    const compressed = await compressImage(file)
    setGalleryPhotoUrl(compressed)
    setUploadingGallery(false)
  }

  function openAdd() {
    setEditing(null); setForm(empty()); setError(''); setShowForm(true)
  }

  function openEdit(dest: Destination) {
    setEditing(dest)
    setForm({ name: dest.name, description: dest.description, accommodationPrice: String(dest.accommodationPrice), otherPrice: String(dest.otherPrice), photoUrl: dest.photoUrl, link: dest.link || '', details: dest.details, tags: dest.tags.join(', ') })
    setError(''); setShowForm(true)
  }

  function openGallery(dest: Destination) {
    setGalleryDest(dest); setGalleryPhotoUrl(''); setGalleryCaption('')
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    const body = { ...form, accommodationPrice: parseFloat(form.accommodationPrice) || 0, otherPrice: parseFloat(form.otherPrice) || 0, currency: 'MYR', tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean) }
    const url = editing ? `/api/admin/destinations/${editing.id}` : '/api/admin/destinations'
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return }
    await load(); setShowForm(false); setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this destination? All votes will also be removed.')) return
    setDeleting(id); await fetch(`/api/admin/destinations/${id}`, { method: 'DELETE' }); await load(); setDeleting(null)
  }

  async function handleAddMedia(e: React.FormEvent) {
    e.preventDefault()
    if (!galleryDest || !galleryPhotoUrl) return
    setAddingMedia(true)
    const res = await fetch('/api/admin/media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinationId: galleryDest.id, photoUrl: galleryPhotoUrl, caption: galleryCaption }),
    })
    if (res.ok) {
      await load()
      setGalleryPhotoUrl(''); setGalleryCaption('')
      if (galleryFileRef.current) galleryFileRef.current.value = ''
      // Refresh galleryDest from updated destinations
      const res2 = await fetch('/api/admin/destinations')
      const dests = await res2.json()
      const updated = dests.find((d: Destination) => d.id === galleryDest.id)
      if (updated) setGalleryDest(updated)
    }
    setAddingMedia(false)
  }

  async function handleDeleteMedia(mediaId: string) {
    if (!confirm('Delete this photo?')) return
    setDeletingMedia(mediaId)
    await fetch(`/api/admin/media/${mediaId}`, { method: 'DELETE' })
    const res = await fetch('/api/admin/destinations')
    const dests = await res.json()
    setDestinations(dests)
    if (galleryDest) {
      const updated = dests.find((d: Destination) => d.id === galleryDest.id)
      if (updated) setGalleryDest(updated)
    }
    setDeletingMedia(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center"><div className="text-4xl mb-3 animate-float">🗺️</div><p className="animate-pulse">Loading...</p></div>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-800">🗺️ Destinations</h2>
          <p className="text-slate-500 text-sm mt-0.5">{destinations.length} destination{destinations.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><span>+</span> Add Destination</button>
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
                <img src={dest.photoUrl} alt={dest.name} className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/400/300` }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                  <h3 className="text-white font-display font-bold text-lg leading-tight">{dest.name}</h3>
                  <div className="vote-badge text-xs"><span>🗳️</span> {dest.voteCount}</div>
                </div>
                {dest.media.length > 0 && (
                  <div className="absolute top-3 left-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    📸 +{dest.media.length}
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sky-600 font-bold text-sm">MYR {(dest.accommodationPrice + dest.otherPrice).toLocaleString()} total</span>
                  {dest.tags.length > 0 && (
                    <div className="flex gap-1">{dest.tags.slice(0, 2).map((t) => <span key={t} className="tag-pill">{t}</span>)}</div>
                  )}
                </div>
                <p className="text-slate-500 text-sm line-clamp-2 mb-4">{dest.description}</p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => openEdit(dest)} className="btn-primary py-2 text-sm justify-center col-span-1">✏️</button>
                  <button onClick={() => openGallery(dest)} className="bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 font-semibold py-2 text-sm rounded-xl transition-colors col-span-1">📸</button>
                  <button onClick={() => handleDelete(dest.id)} disabled={deleting === dest.id}
                    className="bg-red-50 text-red-500 border border-red-200 hover:bg-red-100 font-semibold py-2 text-sm rounded-xl transition-colors col-span-1">
                    {deleting === dest.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ADD/EDIT MODAL ── */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h3 className="text-xl font-display font-bold text-slate-800">{editing ? '✏️ Edit Destination' : '➕ Add Destination'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Destination Name *</label>
                  <input className="input-field" placeholder="e.g. Bali, Indonesia" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Accommodation Price</label>
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="e.g. 3000 (hotel/resort total)" value={form.accommodationPrice} onChange={(e) => setForm({ ...form, accommodationPrice: e.target.value })} />
                  <p className="text-xs text-slate-400 mt-1">Total accommodation cost for the group</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Other Price</label>
                  <input className="input-field" type="number" min="0" step="0.01" placeholder="e.g. 1500 (flights, activities...)" value={form.otherPrice} onChange={(e) => setForm({ ...form, otherPrice: e.target.value })} />
                  <p className="text-xs text-slate-400 mt-1">Flights, transport, activities, meals, etc.</p>
                </div>
                {(form.accommodationPrice || form.otherPrice) && (
                  <div className="md:col-span-2 bg-sky-50 border border-sky-100 rounded-xl p-3 text-sm">
                    <p className="font-semibold text-sky-700 mb-1">Est. Cost Per Pax</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[6, 8, 10].map((pax) => {
                        const total = (parseFloat(form.accommodationPrice) || 0) + (parseFloat(form.otherPrice) || 0)
                        return (
                          <div key={pax} className="bg-white rounded-lg p-2 border border-sky-100">
                            <div className="text-xs text-slate-500">{pax} pax</div>
                            <div className="font-bold text-sky-700 text-sm">MYR {(total / pax).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Main Photo */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Main Photo *</label>
                  <div className="flex gap-2 mb-2">
                    <input className="input-field"
                      placeholder={form.photoUrl.startsWith('data:') ? '📷 File uploaded' : 'Paste image URL or upload →'}
                      value={form.photoUrl.startsWith('data:') ? '' : form.photoUrl}
                      onChange={(e) => setForm({ ...form, photoUrl: e.target.value })}
                    />
                    <button type="button" onClick={() => mainFileRef.current?.click()}
                      disabled={uploadingMain}
                      className="flex-shrink-0 bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 font-semibold px-3 py-2 rounded-xl text-sm transition-colors whitespace-nowrap">
                      {uploadingMain ? '⏳' : '📁 Upload'}
                    </button>
                    <input ref={mainFileRef} type="file" accept="image/*" className="hidden" onChange={handleMainFileUpload} />
                  </div>
                  <p className="text-xs text-slate-400">Paste a URL or upload from your device (auto-compressed)</p>
                  {form.photoUrl && (
                    <img src={form.photoUrl} alt="preview" className="h-36 w-full object-cover rounded-xl border border-slate-200 mt-2"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Short Description *</label>
                  <textarea className="input-field" rows={2} placeholder="A beautiful tropical paradise..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Details</label>
                  <textarea className="input-field" rows={4} placeholder="Itinerary, inclusions, accommodation details..." value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Booking Link (optional)</label>
                  <input className="input-field" placeholder="https://booking.com/..." value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tags (comma separated)</label>
                  <input className="input-field" placeholder="Beach, Adventure, Family-friendly" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex gap-2"><span>❌</span>{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving || uploadingMain} className="flex-1 btn-primary justify-center py-2.5">
                  {saving ? <><span className="animate-spin">⏳</span> Saving...</> : editing ? '✅ Save Changes' : '➕ Add Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GALLERY MODAL ── */}
      {galleryDest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setGalleryDest(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-display font-bold text-slate-800">📸 Gallery & Info</h3>
                <p className="text-slate-500 text-sm">{galleryDest.name}</p>
              </div>
              <button onClick={() => setGalleryDest(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Existing gallery */}
              {galleryDest.media.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Gallery Photos ({galleryDest.media.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {galleryDest.media.map((item) => (
                      <div key={item.id} className="relative group rounded-xl overflow-hidden border border-slate-100">
                        <img src={item.photoUrl} alt={item.caption || 'Gallery'} className="w-full h-28 object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/200/200' }} />
                        {item.caption && (
                          <div className="bg-black/60 text-white text-xs px-2 py-1 absolute bottom-0 left-0 right-0 truncate">{item.caption}</div>
                        )}
                        <button onClick={() => handleDeleteMedia(item.id)} disabled={deletingMedia === item.id}
                          className="absolute top-1.5 right-1.5 w-7 h-7 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold">
                          {deletingMedia === item.id ? '...' : '×'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add new photo */}
              <form onSubmit={handleAddMedia} className="border-2 border-dashed border-slate-200 rounded-xl p-4 space-y-3">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <span>➕</span> Add Photo
                </h4>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Photo</label>
                  <div className="flex gap-2">
                    <input className="input-field text-sm"
                      placeholder={galleryPhotoUrl.startsWith('data:') ? '📷 File ready to upload' : 'Paste image URL or upload below'}
                      value={galleryPhotoUrl.startsWith('data:') ? '' : galleryPhotoUrl}
                      onChange={(e) => setGalleryPhotoUrl(e.target.value)}
                      readOnly={galleryPhotoUrl.startsWith('data:')}
                    />
                    <button type="button" onClick={() => galleryFileRef.current?.click()} disabled={uploadingGallery}
                      className="flex-shrink-0 bg-violet-50 text-violet-600 border border-violet-200 hover:bg-violet-100 font-semibold px-3 py-2 rounded-xl text-sm transition-colors">
                      {uploadingGallery ? '⏳' : '📁'}
                    </button>
                    <input ref={galleryFileRef} type="file" accept="image/*" className="hidden" onChange={handleGalleryFileUpload} />
                  </div>
                  {galleryPhotoUrl && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={galleryPhotoUrl} alt="preview" className="h-20 w-32 object-cover rounded-lg border border-slate-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      <button type="button" onClick={() => { setGalleryPhotoUrl(''); if (galleryFileRef.current) galleryFileRef.current.value = '' }}
                        className="text-xs text-red-500 hover:text-red-700">Clear</button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Caption (optional)</label>
                  <input className="input-field text-sm" placeholder="e.g. Hotel lobby, Beach view..." value={galleryCaption} onChange={(e) => setGalleryCaption(e.target.value)} />
                </div>

                <button type="submit" disabled={!galleryPhotoUrl || addingMedia || uploadingGallery}
                  className="btn-primary py-2 text-sm w-full justify-center">
                  {addingMedia ? <><span className="animate-spin">⏳</span> Adding...</> : '➕ Add to Gallery'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
