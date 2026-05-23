'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (pathname === '/admin/login') { setChecking(false); return }
    fetch('/api/admin/me').then((r) => r.json()).then((d) => {
      if (!d.isLoggedIn) router.replace('/admin/login')
      else setChecking(false)
    })
  }, [router, pathname])

  if (pathname === '/admin/login') return <>{children}</>
  if (checking) return (
    <div className="travel-bg flex items-center justify-center min-h-screen">
      <div className="text-white text-center">
        <div className="text-5xl animate-float mb-3">🔐</div>
        <p className="animate-pulse-slow">Checking access...</p>
      </div>
    </div>
  )

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/destinations', label: 'Destinations', icon: '🗺️' },
    { href: '/admin/participants', label: 'Participants', icon: '👥' },
    { href: '/admin/discussion', label: 'Discussion', icon: '💬' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="bg-gradient-to-r from-sky-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈️</span>
            <div>
              <h1 className="font-display font-bold text-lg leading-none">TripDecider</h1>
              <p className="text-sky-200 text-xs">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/vote" target="_blank" className="btn-ghost text-sm py-1.5 px-3">
              👁️ Preview
            </Link>
            <button onClick={handleLogout} className="btn-ghost text-sm py-1.5 px-3">
              Logout
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 pb-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
                pathname === item.href
                  ? 'bg-slate-50 text-slate-800'
                  : 'text-sky-100 hover:bg-white/20'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
