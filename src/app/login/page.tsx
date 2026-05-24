'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then((r) => r.json()).then((d) => {
      if (d.isLoggedIn) router.replace('/vote')
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'Login failed'); return }
    router.push('/vote')
  }

  return (
    <div className="travel-bg min-h-screen flex flex-col">
      <div className="floating-orb w-96 h-96 bg-cyan-300 -top-20 -left-20 fixed pointer-events-none" />
      <div className="floating-orb w-80 h-80 bg-emerald-300 -bottom-20 -right-20 fixed pointer-events-none" style={{ animationDelay: '3s' }} />

      {/* Header — same style as vote/discussion */}
      <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20 flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl flex-shrink-0">🏝️</span>
            <div>
              <h1 className="font-display font-bold text-white text-base leading-none">TripDecider</h1>
              <p className="text-cyan-200 text-xs">Vote for your dream destination!</p>
            </div>
          </div>
          <a href="/admin/login" className="btn-ghost text-xs py-1 px-3">🔐 Admin</a>
        </div>
      </header>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md animate-slide-up">
          <div className="text-center mb-6">
            <div className="inline-block text-6xl mb-3 animate-float">🏝️</div>
            <h2 className="text-3xl font-display font-bold text-white mb-1">Welcome!</h2>
            <div className="flex justify-center gap-2 mt-2 text-xl">
              <span>🌴</span><span>🏖️</span><span>🗺️</span><span>🌏</span><span>🎒</span>
            </div>
          </div>

          <div className="glass-card p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <input
                  className="input-field"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  className="input-field"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-3 text-sm flex items-center gap-2">
                  <span>❌</span> {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 text-base"
              >
                {loading ? (
                  <><span className="animate-spin">⏳</span> Logging in...</>
                ) : (
                  <><span>🚀</span> Let&apos;s Go!</>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-cyan-200 text-sm mt-4">
            Contact your trip organiser if you need login details
          </p>
        </div>
      </div>
    </div>
  )
}
