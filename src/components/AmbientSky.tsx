'use client'
import { usePathname } from 'next/navigation'

// Soft background motion for participant pages: drifting clouds, an occasional
// plane and a few twinkles. Sits behind content and never takes clicks.
const CLOUDS = [
  { top: '12%', size: 'text-5xl', duration: 95, delay: -30, opacity: 0.22 },
  { top: '38%', size: 'text-7xl', duration: 140, delay: -90, opacity: 0.14 },
  { top: '70%', size: 'text-6xl', duration: 115, delay: -55, opacity: 0.18 },
]

const SPARKLES = [
  { top: '8%', left: '14%', delay: 0 },
  { top: '22%', left: '82%', delay: 1.2 },
  { top: '55%', left: '6%', delay: 2.1 },
  { top: '64%', left: '92%', delay: 0.6 },
  { top: '86%', left: '40%', delay: 1.7 },
]

export default function AmbientSky() {
  const pathname = usePathname()
  if (pathname.startsWith('/admin')) return null

  return (
    <div className="ambient-sky fixed inset-0 z-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {CLOUDS.map((c, i) => (
        <span
          key={i}
          className={`sky-cloud ${c.size}`}
          style={{ top: c.top, opacity: c.opacity, animationDuration: `${c.duration}s`, animationDelay: `${c.delay}s`, filter: 'blur(1px)' }}
        >
          ☁️
        </span>
      ))}
      <span className="sky-plane text-2xl" style={{ top: '20%' }}>✈️</span>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="absolute text-white text-xs animate-twinkle"
          style={{ top: s.top, left: s.left, animationDelay: `${s.delay}s` }}
        >
          ✦
        </span>
      ))}
    </div>
  )
}
