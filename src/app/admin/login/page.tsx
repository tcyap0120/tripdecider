'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/admin/me').then((r) => r.json()).then((d) => {
      if (d.isLoggedIn) router.replace('/admin')
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Invalid credentials'); return }
    router.push('/admin')
  }

  return (
    <div className="travel-bg flex items-center justify-center min-h-screen p-4">
      <div className="floating-orb w-72 h-72 bg-purple-300 top-0 right-0 fixed" />
      <div className="floating-orb w-64 h-64 bg-blue-300 bottom-0 left-0 fixed" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-block text-6xl mb-3">🔐</div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Admin Panel</h1>
          <p className="text-cyan-200">TripDecider Management</p>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-xl font-display font-bold text-slate-800 mb-5">Administrator Login</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                className="input-field"
                placeholder="Admin username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                <span>❌</span> {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading ? <><span className="animate-spin">⏳</span> Signing in...</> : <><span>🔑</span> Sign In</>}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            <a href="/login" className="text-sm text-slate-400 hover:text-sky-600 transition-colors">
              ← Back to participant login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
