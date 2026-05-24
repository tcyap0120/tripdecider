'use client'
import { useState, useEffect } from 'react'

const QUOTES = [
  { text: "You only live once... and you're spending it NOT at a resort? Bold choice. 🤔", emoji: "😬" },
  { text: "Life is short. Your to-do list is long. Ignore both and just go. 🏃", emoji: "💨" },
  { text: "Yes you'll spend money. Yes it'll hurt. Yes the memories will be priceless. The math checks out. 🧮", emoji: "💸" },
  { text: "U won't 发达 if u skip this trip. That's literally science. 🧪", emoji: "📊" },
  { text: "Your future self is begging you. Your future wallet is crying. Listen to your future self. 🙏", emoji: "😭" },
  { text: "Regret is free. This trip is not. But regret is way more expensive long-term. Trust. 💀", emoji: "🤑" },
  { text: "Studies show that people who go on trips are 100% more fun at parties. (TC Yap, 2026) 📚", emoji: "🎉" },
]

export default function TravelFooter() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx((i) => (i + 1) % QUOTES.length)
        setVisible(true)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const quote = QUOTES[idx]

  return (
    <footer className="relative z-10 mt-8 pb-6 px-4 text-center select-none">
      {/* Quote */}
      <div
        className="max-w-lg mx-auto mb-4 transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        <div className="text-3xl mb-2">{quote.emoji}</div>
        <p className="text-white/70 text-sm italic leading-relaxed">
          &ldquo;{quote.text}&rdquo;
        </p>
        <div className="flex items-center justify-center gap-2 mt-3">
          {QUOTES.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setVisible(true) }}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white/80 scale-125' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center justify-center gap-3 mb-3">
        <div className="h-px w-16 bg-white/20" />
        <span className="text-white/30 text-xs">✦</span>
        <div className="h-px w-16 bg-white/20" />
      </div>

      {/* Creator credit */}
      <p className="text-white/40 text-xs">
        Cooked up by <span className="text-white/60 font-semibold">TC Yap</span> who clearly has nothing better to do 🥲
        <br />
        <span className="text-white/25">TripDecider © 2026 · Made with questionable life choices</span>
      </p>
    </footer>
  )
}
