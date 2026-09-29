'use client'
import { useEffect, useState } from 'react'
import { MusicState, stopMusic, subscribeMusic, toggleMusic } from '@/lib/music'

// Small floating control, visible only while login music is loaded
export default function MusicToggle() {
  const [state, setState] = useState<MusicState>('idle')

  useEffect(() => subscribeMusic(setState), [])

  if (state === 'idle') return null

  const playing = state === 'playing'
  return (
    <div className="fixed bottom-4 left-4 z-[55] flex items-center gap-1 rounded-full bg-white/90 backdrop-blur shadow-lg border border-white/60 pl-1 pr-1 py-1 animate-fade-in">
      <button
        onClick={toggleMusic}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          playing ? 'bg-sky-500 text-white' : 'bg-amber-400 text-amber-950'
        }`}
        aria-label={playing ? 'Pause music' : 'Play music'}
      >
        <span className={playing ? 'animate-bounce-soft inline-block' : ''}>🎵</span>
        {state === 'blocked' ? 'Tap to play music' : playing ? 'Pause' : 'Play'}
      </button>
      <button
        onClick={stopMusic}
        className="w-7 h-7 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-sm"
        aria-label="Stop music"
        title="Stop music"
      >
        ✕
      </button>
    </div>
  )
}
