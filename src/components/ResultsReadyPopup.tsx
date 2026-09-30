'use client'

interface Props {
  name: string
  tripName: string
  onView: () => void
  onClose: () => void
}

// Shown once per trip, the first time a participant visits after the organiser reveals the results
export default function ResultsReadyPopup({ name, tripName, onView, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-ready-title"
    >
      <div className="relative w-full max-w-sm animate-pop-in">
        <span className="absolute -top-5 -left-3 text-3xl animate-bounce-soft select-none" aria-hidden>🎉</span>
        <span className="absolute -top-4 -right-2 text-2xl animate-wiggle select-none" aria-hidden>✨</span>
        <span className="absolute -bottom-4 -left-2 text-2xl animate-wiggle select-none" style={{ animationDelay: '0.4s' }} aria-hidden>🎊</span>
        <span className="absolute -bottom-5 -right-3 text-3xl animate-bounce-soft select-none" style={{ animationDelay: '0.8s' }} aria-hidden>🌴</span>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="relative bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 px-6 pt-7 pb-8 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-30" aria-hidden
              style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 2px, transparent 3px), radial-gradient(circle at 75% 20%, #fff 2px, transparent 3px), radial-gradient(circle at 60% 75%, #fff 1.5px, transparent 2.5px), radial-gradient(circle at 30% 80%, #fff 1.5px, transparent 2.5px)' }} />
            <div className="relative text-6xl animate-bounce-soft select-none" aria-hidden>🏆</div>
            <h2 id="results-ready-title" className="relative mt-2 font-display font-extrabold text-white text-2xl leading-tight drop-shadow-sm">
              The results are out!
            </h2>
            <p className="relative text-white/90 text-sm mt-1">
              Hi {name}, the votes for <strong>{tripName}</strong> are in 🎉
            </p>
          </div>

          <div className="px-5 py-5 space-y-3">
            <p className="text-slate-600 text-sm text-center">
              The organiser has revealed the results. Come see where we&apos;re going!
            </p>
            <button
              onClick={onView}
              autoFocus
              className="w-full py-3 rounded-2xl font-display font-bold text-white text-base shadow-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-[0.98] transition-all"
            >
              See the results 🏆
            </button>
            <button
              onClick={onClose}
              className="w-full py-2 rounded-2xl font-semibold text-slate-500 text-sm hover:bg-slate-100 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
