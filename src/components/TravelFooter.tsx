'use client'
import { useState, useEffect } from 'react'

// Alternates Chinese / English. Chinese quotes carry their own 「」 marks.
const QUOTES: { text: string; emoji: string; lang: 'zh' | 'en' }[] = [
  { lang: 'zh', emoji: '🦴', text: '「年轻的时候不出去玩，难道等腰椎间盘突出才开始环游世界？」' },
  { lang: 'en', emoji: '👴', text: "Go now before we get old. By then it won't be the money we're short of, it'll be the energy." },
  { lang: 'zh', emoji: '😩', text: '「人生已经够苦了，连旅行都不去，你到底想怎样？」' },
  { lang: 'en', emoji: '🎂', text: "Think about it: we're all 30 now. How many more trips can this group actually take together?" },
  { lang: 'zh', emoji: '⏳', text: '「我们总说‘以后再去’，但人生最容易消失的，就是这个‘以后’。」' },
  { lang: 'en', emoji: '🫂', text: "What makes a trip precious isn't where we went. It's that back then, we were all still together." },
  { lang: 'zh', emoji: '🏡', text: '「以后大家可能都有家庭、有工作、有自己的生活，能像现在这样一起出发的机会，只会越来越少。」' },
  { lang: 'en', emoji: '⚖️', text: "Life is funny: young, you're short on money; old, you're short on time. Right now we've got a bit of both." },
  { lang: 'zh', emoji: '🔢', text: '「我们总以为以后还有很多次，但其实，从某一次旅行开始，我们就已经在倒数了。」' },
  { lang: 'en', emoji: '💸', text: "Don't worry about spending money. Everything goes back to zero in the end anyway." },
  { lang: 'zh', emoji: '🎉', text: '「人生苦短，及时行乐。至于钱的问题，回来再烦。」' },
  { lang: 'en', emoji: '🙃', text: "Sure, you can skip it. Stability matters most, after all: stably going to work, stably going home, stably regretting it." },
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
    }, 6000)
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
        <p className={`text-white/70 text-sm leading-relaxed ${quote.lang === 'en' ? 'italic' : 'tracking-wide'}`}>
          {quote.lang === 'en' ? <>&ldquo;{quote.text}&rdquo;</> : quote.text}
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
