'use client'

interface Props {
  name: string
  tripName: string
  voteCount: number
  onClose: () => void
}

// Shown the first time a participant opens a trip while voting is open
export default function WelcomePopup({ name, tripName, voteCount, onClose }: Props) {
  const votes = `${voteCount} vote${voteCount !== 1 ? 's' : ''}`

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="relative w-full max-w-sm animate-pop-in">
        {/* Floating decorations */}
        <span className="absolute -top-5 -left-3 text-3xl animate-bounce-soft select-none" aria-hidden>🌴</span>
        <span className="absolute -top-4 -right-2 text-2xl animate-wiggle select-none" aria-hidden>✈️</span>
        <span className="absolute -bottom-4 -left-2 text-2xl animate-wiggle select-none" style={{ animationDelay: '0.4s' }} aria-hidden>🎒</span>
        <span className="absolute -bottom-5 -right-3 text-3xl animate-bounce-soft select-none" style={{ animationDelay: '0.8s' }} aria-hidden>🏖️</span>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-br from-sky-400 via-cyan-400 to-teal-400 px-6 pt-7 pb-10 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-30" aria-hidden
              style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 2px, transparent 3px), radial-gradient(circle at 75% 20%, #fff 2px, transparent 3px), radial-gradient(circle at 60% 75%, #fff 1.5px, transparent 2.5px), radial-gradient(circle at 30% 80%, #fff 1.5px, transparent 2.5px)' }} />
            <div className="relative text-6xl animate-bounce-soft select-none" aria-hidden>🐣</div>
            <h2 id="welcome-title" className="relative mt-2 font-display font-extrabold text-white text-2xl leading-tight drop-shadow-sm">
              Hello, {name}! 👋
            </h2>
            <p className="relative text-white/90 text-sm mt-1">
              Welcome aboard <strong>{tripName}</strong> 🎉
            </p>
          </div>

          {/* Steps */}
          <div className="relative -mt-6 px-5 pb-6 space-y-3">
            <div className="flex items-start gap-3 bg-sky-50 border border-sky-100 rounded-2xl p-3.5 shadow-sm">
              <span className="text-2xl flex-shrink-0" aria-hidden>🗺️</span>
              <div>
                <p className="font-display font-bold text-slate-800 text-sm">Help us pick where to go!</p>
                <p className="text-slate-500 text-xs mt-0.5">Browse the destinations and vote for the ones you love.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-3.5 shadow-sm">
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 text-white flex flex-col items-center justify-center shadow">
                <span className="text-xl font-display font-extrabold leading-none">{voteCount}</span>
                <span className="text-[9px] font-bold uppercase">vote{voteCount !== 1 ? 's' : ''}</span>
              </div>
              <div>
                <p className="font-display font-bold text-slate-800 text-sm">You have {votes} 🗳️</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Use <strong>all {voteCount}</strong> on different destinations, then tap <strong>Submit</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-violet-50 border border-violet-100 rounded-2xl p-3.5 shadow-sm">
              <span className="text-2xl flex-shrink-0" aria-hidden>📸</span>
              <div>
                <p className="font-display font-bold text-slate-800 text-sm">Peek before you pick</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Tap{' '}
                  <span className="inline-flex items-center rounded-full bg-white border border-sky-200 text-sky-600 font-semibold px-2 py-0.5 text-[11px]">
                    ▼ More info
                  </span>{' '}
                  on any card to see photos and details of each destination.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              autoFocus
              className="w-full mt-1 py-3 rounded-2xl font-display font-bold text-white text-base shadow-lg bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 active:scale-[0.98] transition-all"
            >
              Let&apos;s go! 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
