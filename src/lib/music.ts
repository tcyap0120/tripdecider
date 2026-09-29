'use client'

// One shared <audio> for the whole session. It lives outside React so it keeps
// playing across client-side page changes. Plays once — never loops.

type Listener = (state: MusicState) => void
export type MusicState = 'idle' | 'playing' | 'paused' | 'blocked'

let audio: HTMLAudioElement | null = null
let state: MusicState = 'idle'
const listeners = new Set<Listener>()

function setState(next: MusicState) {
  state = next
  listeners.forEach((l) => l(state))
}

export function subscribeMusic(listener: Listener) {
  listeners.add(listener)
  listener(state)
  return () => { listeners.delete(listener) }
}

/** Call right after a successful login (still inside the click, so browsers allow sound). */
export function startLoginMusic() {
  if (typeof window === 'undefined') return
  stopMusic()
  audio = new Audio(`/api/music?t=${Date.now()}`)
  audio.loop = false
  audio.volume = 0.6
  audio.addEventListener('ended', () => setState('idle'))
  audio.addEventListener('error', () => setState('idle')) // no music uploaded — stay silent
  audio.play()
    .then(() => setState('playing'))
    // Some phones block sound until the user taps again; offer a play button instead
    .catch(() => setState(audio?.error ? 'idle' : 'blocked'))
}

export function toggleMusic() {
  if (!audio) return
  if (audio.paused) audio.play().then(() => setState('playing')).catch(() => {})
  else { audio.pause(); setState('paused') }
}

export function stopMusic() {
  if (audio) { audio.pause(); audio.src = '' }
  audio = null
  setState('idle')
}
