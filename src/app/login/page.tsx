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
    <div className="travel-bg flex items-center justify-center min-h-screen p-4">
      {/* Floating orbs */}
      <div className="floating-orb w-96 h-96 bg-cyan-300 top-[-10%] left-[-10%]" style={{ position: 'fixed' }} />
      <div className="floating-orb w-80 h-80 bg-emerald-300 bottom-[-10%] right-[-10%]" style={{ position: 'fixed', animationDelay: '3s' }} />

      <div className="w-full max-w-md relative z-10 animate-slide-up">
        {/* Logo section */}
        <div className="text-center mb-8">
          <div className="inline-block text-7xl mb-4 animate-float">🏝️</div>
          <h1 className="text-4xl font-display font-bold text-white mb-2">TripDecider</h1>
          <p className="text-cyan-100 text-lg">Vote for your dream destination!</p>
          <div className="flex justify-center gap-2 mt-3 text-2xl">
            <span>🌴</span><span>🏖️</span><span>🗺️</span><span>🌏</span><span>🎒</span>
          </div>
        </div>

        {/* Login card */}
        <div className="glass-card p-8">
          <h2 className="text-2xl font-display font-bold text-slate-800 mb-6">Welcome back!</h2>

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

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <a href="/admin/login" className="text-sm text-slate-400 hover:text-sky-600 transition-colors">
              🔐 Admin Login
            </a>
          </div>
        </div>

        <p className="text-center text-cyan-200 text-sm mt-4">
          Contact your trip organiser if you need login details
        </p>
      </div>
    </div>
  )
}
