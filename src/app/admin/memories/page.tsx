'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

interface Memory {
  id: string
  photoUrl: string
  caption: string
  createdAt: string
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1200
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height / width) * MAX); width = MAX }
          else { width = Math.round((width / height) * MAX); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target!.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AdminMemoriesPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Upload state
  const [queue, setQueue] = useState<{ dataUrl: string; caption: string }[]>([])
  const [processing, setProcessing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pasteMsg, setPasteMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  async function load() {
    const res = await fetch('/api/admin/memories')
    if (res.ok) setMemories(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleFiles(files: FileList | File[]) {
    setProcessing(true)
    const arr = Array.from(files)
    const results: { dataUrl: string; caption: string }[] = []
    for (const f of arr) {
      if (!f.type.startsWith('image/')) continue
      const dataUrl = await compressImage(f)
      results.push({ dataUrl, caption: '' })
    }
    setQueue((q) => [...q, ...results])
    setProcessing(false)
  }

  async function pasteFromClipboard() {
    try {
      const items = await navigator.clipboard.read()
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'))
        if (imageType) {
          const blob = await item.getType(imageType)
          const file = new File([blob], 'paste.png', { type: imageType })
          await handleFiles([file])
          setPasteMsg('✅ Image pasted!')
          setTimeout(() => setPasteMsg(''), 2500)
          return
        }
      }
      setPasteMsg('❌ No image in clipboard')
      setTimeout(() => setPasteMsg(''), 2500)
    } catch {
      setPasteMsg('❌ Clipboard access denied')
      setTimeout(() => setPasteMsg(''), 2500)
    }
  }

  const handleFormPaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault()
        const file = item.getAsFile()
        if (file) { await handleFiles([file]); setPasteMsg('✅ Image pasted!'); setTimeout(() => setPasteMsg(''), 2500) }
        return
      }
    }
  }, [])

  function updateCaption(idx: number, caption: string) {
    setQueue((q) => q.map((item, i) => i === idx ? { ...item, caption } : item))
  }

  function removeFromQueue(idx: number) {
    setQueue((q) => q.filter((_, i) => i !== idx))
  }

  async function handleUpload() {
    if (queue.length === 0) return
    setUploading(true)
    for (const item of queue) {
      await fetch('/api/admin/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrl: item.dataUrl, caption: item.caption }),
      })
    }
    setQueue([])
    await load()
    setUploading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this photo from memories?')) return
    setDeleting(id)
    await fetch(`/api/admin/memories/${id}`, { method: 'DELETE' })
    setMemories((m) => m.filter((x) => x.id !== id))
    setDeleting(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <div className="text-center">
        <div className="text-4xl mb-3 animate-float">📸</div>
        <p className="animate-pulse">Loading memories...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6" onPaste={handleFormPaste}>
      {/* Upload section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-display font-bold text-slate-800 mb-1">📸 Upload Memories</h2>
        <p className="text-slate-500 text-sm mb-4">Add photos to the Memories gallery. You can add captions before saving.</p>

        {pasteMsg && (
          <div className={`mb-3 flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${pasteMsg.startsWith('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {pasteMsg}
          </div>
        )}

        {/* Upload buttons */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={processing}
            className="flex-1 border-2 border-dashed border-violet-200 hover:border-violet-400 bg-violet-50 hover:bg-violet-100 text-violet-600 font-semibold py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            {processing ? <><span className="animate-spin">⏳</span> Processing…</> : <><span className="text-lg">📁</span> Select Photos</>}
          </button>
          <button
            type="button"
            onClick={pasteFromClipboard}
            className="border-2 border-dashed border-emerald-200 hover:border-emerald-400 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 font-semibold py-4 px-5 rounded-xl text-sm transition-all flex items-center gap-2"
          >
            <span>📋</span> Paste
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
        </div>
        <p className="text-xs text-slate-400 mb-4">Ctrl+V anywhere on this page to paste an image from clipboard</p>

        {/* Queue */}
        {queue.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
              {queue.map((item, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                  <img src={item.dataUrl} alt="" className="w-full h-28 object-cover" />
                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-red-600 text-white text-xs flex items-center justify-center transition-colors"
                  >×</button>
                  <div className="p-1.5">
                    <input
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 outline-none focus:border-sky-400 bg-white"
                      placeholder="Caption (optional)"
                      value={item.caption}
                      onChange={(e) => updateCaption(idx, e.target.value)}
                      maxLength={100}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-primary w-full justify-center py-3"
            >
              {uploading
                ? <><span className="animate-spin">⏳</span> Saving {queue.length} photo{queue.length !== 1 ? 's' : ''}…</>
                : <><span>💾</span> Save {queue.length} Photo{queue.length !== 1 ? 's' : ''} to Gallery</>}
            </button>
          </>
        )}
      </div>

      {/* Existing gallery */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-display font-bold text-slate-800">🖼️ Gallery ({memories.length})</h2>
          <a href="/memories" target="_blank" className="text-xs text-sky-500 hover:text-sky-700 font-medium">Preview page →</a>
        </div>

        {memories.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-3">🫙</div>
            <p>No memories uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {memories.map((mem) => (
              <div key={mem.id} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <img
                  src={mem.photoUrl}
                  alt={mem.caption || 'Memory'}
                  className="w-full h-32 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                <button
                  onClick={() => handleDelete(mem.id)}
                  disabled={deleting === mem.id}
                  className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white text-sm flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                >
                  {deleting === mem.id ? '…' : '🗑️'}
                </button>
                {mem.caption && (
                  <div className="px-2 py-1.5 text-xs text-slate-500 truncate">{mem.caption}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
