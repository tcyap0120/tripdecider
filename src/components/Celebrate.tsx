'use client'
import { useEffect, useMemo, useState } from 'react'

const PIECES = ['🎉', '🎊', '✨', '🌴', '💖', '⭐']

/** Short one-off confetti rain. Remount (change `key`) to play again. */
export function ConfettiRain({ count = 22 }: { count?: number }) {
  const [done, setDone] = useState(false)
  const pieces = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      emoji: PIECES[i % PIECES.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.6,
      dx: (Math.random() - 0.5) * 120,
      rot: (Math.random() - 0.5) * 720,
      size: 14 + Math.random() * 12,
    })),
    [count]
  )

  useEffect(() => {
    const t = setTimeout(() => setDone(true), 3400)
    return () => clearTimeout(t)
  }, [])

  if (done) return null
  return (
    <div className="fixed inset-0 z-[70] pointer-events-none overflow-hidden" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            fontSize: p.size,
            animationDelay: `${p.delay}s`,
            ['--dx' as string]: `${p.dx}px`,
            ['--rot' as string]: `${p.rot}deg`,
          }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  )
}

/** A few hearts/sparkles floating up from a point (e.g. a button). Parent must be `relative`. */
export function SparkleBurst() {
  const bits = useMemo(
    () => ['💖', '✨', '💫', '✨', '💖'].map((e, i) => ({ e, dx: (i - 2) * 18 + (Math.random() - 0.5) * 10, delay: i * 0.05 })),
    []
  )
  return (
    <span className="absolute inset-x-0 top-0 flex justify-center pointer-events-none" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute text-base animate-float-up"
          style={{ animationDelay: `${b.delay}s`, ['--dx' as string]: `${b.dx}px` }}
        >
          {b.e}
        </span>
      ))}
    </span>
  )
}
