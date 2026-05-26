'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Destination {
  id: string
  name: string
  photoUrl: string
  voteCount: number
  price: number
  currency: string
  media: { id: string; photoUrl: string }[]
  voters: string[]
}

interface Participant {
  id: string
  username: string
  voteCount: number
  votesUsed: number
  remainingVotes: number
}

interface AppSettings {
  resultsPublic: boolean
  votingOpen: boolean
  announcement: string
  tierTwoOpen: boolean
}

interface TierTwoStats {
  tierTwoOpen: boolean
  totalParticipants: number
  votedCount: number
  destinations: { id: string; name: string; photoUrl: string; voteCount: number; voters: string[] }[]
}

export default function AdminDashboard() {
  const [destinations, setDestinations] = useState<Destination[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [settings, setSettings] = useState<AppSettings>({ resultsPublic: false, votingOpen: true, announcement: '', tierTwoOpen: false })
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)
  const [announcementDraft, setAnnouncementDraft] = useState('')
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)
  const [announcementSaved, setAnnouncementSaved] = useState(false)
  const [tierTwoStats, setTierTwoStats] = useState<TierTwoStats | null>(null)
  const [enablingTierTwo, setEnablingTierTwo] = useState(false)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((r) => r.json())
      .then(({ destinations: dests, participants: parts, settings: s, tierTwo: t2 }) => {
        if (!dests) return // auth error or malformed response
        setDestinations(dests)
        setParticipants(parts ?? [])
        setSettings(s ?? { resultsPublic: false, votingOpen: true, announcement: '', tierTwoOpen: false })
        setAnnouncementDraft(s?.announcement ?? '')
        setTierTwoStats(t2 ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function toggleSetting(key: 'resultsPublic' | 'votingOpen') {
    setToggling(key)
    const newVal = !settings[key]
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: newVal }),
    })
    if (res.ok) setSettings((s) => ({ ...s, [key]: newVal }))
    setToggling(null)
  }

  async function saveAnnouncement(text: string) {
    setSavingAnnouncement(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ announcement: text }),
    })
    setSettings((s) => ({ ...s, announcement: text }))
    setSavingAnnouncement(false)
    setAnnouncementSaved(true)
    setTimeout(() => setAnnouncementSaved(false), 2000)
  }

  async function reloadTierTwoStats() {
    const res = await fetch('/api/admin/dashboard')
    if (res.ok) {
      const { tierTwo: t2, settings: s } = await res.json()
      setTierTwoStats(t2)
      setSettings((prev) => ({ ...prev, tierTwoOpen: s.tierTwoOpen }))
    }
  }

  async function enableTierTwo() {
    const sorted = [...destinations].sort((a, b) => b.voteCount - a.voteCount)
    const topCount = sorted[0]?.voteCount || 0
    const tied = topCount > 0 ? sorted.filter((d) => d.voteCount === topCount).slice(0, 2) : []
    if (tied.length < 2) return
    setEnablingTierTwo(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierTwoOpen: true, tierTwoDestinationIds: tied.map((d) => d.id).join(',') }),
    })
    setSettings((s) => ({ ...s, tierTwoOpen: true }))
    await reloadTierTwoStats()
    setEnablingTierTwo(false)
  }

  async function disableTierTwo() {
    setEnablingTierTwo(true)
    await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tierTwoOpen: false }),
    })
    setSettings((s) => ({ ...s, tierTwoOpen: false }))
    await reloadTierTwoStats()
    setEnablingTierTwo(false)
  }

  const totalVotes = destinations.reduce((s, d) => s + d.voteCount, 0)
  const totalVoteCapacity = participants.reduce((s, p) => s + p.voteCount, 0)
  const totalVotesUsed = participants.reduce((s, p) => s + p.votesUsed, 0)
  const participantsVoted = participants.filter((p) => p.voteCount > 0 && p.votesUsed >= p.voteCount).length
  const sortedDestinations = [...destinations].sort((a, b) => b.voteCount - a.voteCount)
  const winner = sortedDestinations[0]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center text-slate-500">
        <div className="text-4xl mb-3 animate-float">📊</div>
        <p className="animate-pulse">Loading dashboard...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* ── CONTROL PANEL ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <h2 className="text-lg font-display font-bold text-slate-800 mb-4">⚙️ Control Panel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Voting Open toggle */}
          <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border-2 transition-colors ${
            settings.votingOpen ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <span>{settings.votingOpen ? '🗳️' : '🔒'}</span>
                Voting
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {settings.votingOpen ? 'Participants can vote' : 'Voting is closed'}
              </p>
            </div>
            <button
              onClick={() => toggleSetting('votingOpen')}
              disabled={toggling === 'votingOpen'}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.votingOpen ? 'bg-emerald-500' : 'bg-slate-300'
              } ${toggling === 'votingOpen' ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${settings.votingOpen ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Results Public toggle */}
          <div className={`flex items-start justify-between gap-4 p-4 rounded-xl border-2 transition-colors ${
            settings.resultsPublic ? 'bg-sky-50 border-sky-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div>
              <div className="font-semibold text-slate-800 flex items-center gap-2">
                <span>{settings.resultsPublic ? '👁️' : '🙈'}</span>
                Results Visibility
              </div>
              <p className="text-sm text-slate-500 mt-0.5">
                {settings.resultsPublic ? 'Participants can see vote counts & results' : 'Results hidden from participants'}
              </p>
            </div>
            <button
              onClick={() => toggleSetting('resultsPublic')}
              disabled={toggling === 'resultsPublic'}
              className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.resultsPublic ? 'bg-sky-500' : 'bg-slate-300'
              } ${toggling === 'resultsPublic' ? 'opacity-50' : ''}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-200 ${settings.resultsPublic ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {settings.resultsPublic && (
          <div className="mt-3 flex items-center gap-2 bg-sky-50 border border-sky-200 rounded-xl px-4 py-2.5 text-sm text-sky-700">
            <span>ℹ️</span>
            <span>Participants can now see live vote counts and the results page at <strong>/results</strong></span>
          </div>
        )}
      </div>

      {/* ── LEVEL 2 TIEBREAKER ── */}
      {(() => {
        const topCount = sortedDestinations[0]?.voteCount || 0
        const tiedAtTop = topCount > 0 ? sortedDestinations.filter((d) => d.voteCount === topCount) : []
        const hasTie = tiedAtTop.length >= 2
        const t2Destinations = tierTwoStats?.destinations || []
        const t2TotalVotes = t2Destinations.reduce((s, d) => s + d.voteCount, 0)

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
                  <span>⚔️</span> Level 2 Tiebreaker
                </h2>
                <p className="text-slate-500 text-xs mt-0.5">Activate when two destinations have the same top vote count</p>
              </div>
              {settings.tierTwoOpen && (
                <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 inline-block animate-pulse" />
                  Live
                </span>
              )}
            </div>

            <div className="p-5 space-y-4">
              {/* Tie detection status */}
              {!settings.tierTwoOpen ? (
                hasTie ? (
                  <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
                    <span className="text-xl flex-shrink-0">🔥</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-orange-800 text-sm">Tie detected!</p>
                      <p className="text-orange-600 text-xs mt-0.5">
                        {tiedAtTop.slice(0, 2).map((d) => d.name).join(' & ')} are tied at {topCount} vote{topCount !== 1 ? 's' : ''} each.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <span className="text-xl flex-shrink-0">✅</span>
                    <div>
                      <p className="font-semibold text-slate-700 text-sm">No tie detected</p>
                      <p className="text-slate-500 text-xs mt-0.5">
                        {sortedDestinations[0] ? `"${sortedDestinations[0].name}" is leading with ${sortedDestinations[0].voteCount} vote${sortedDestinations[0].voteCount !== 1 ? 's' : ''}.` : 'No votes yet.'}
                      </p>
                    </div>
                  </div>
                )
              ) : (
                /* Active state — show finalists + progress */
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                    <span>📊</span>
                    <span>Round 2 progress: <strong className={tierTwoStats?.votedCount === tierTwoStats?.totalParticipants ? 'text-emerald-600' : 'text-violet-600'}>{tierTwoStats?.votedCount ?? 0}/{tierTwoStats?.totalParticipants ?? 0}</strong> participants voted</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: tierTwoStats?.totalParticipants
                          ? `${((tierTwoStats.votedCount / tierTwoStats.totalParticipants) * 100)}%`
                          : '0%',
                        background: 'linear-gradient(90deg, #7c3aed, #dc2626)',
                      }}
                    />
                  </div>

                  {/* Finalist vote bars */}
                  {t2Destinations.map((dest, idx) => (
                    <div key={dest.id} className="relative flex items-center gap-3 group">
                      <div className="w-8 text-center text-sm flex-shrink-0 font-bold"
                        style={{ color: idx === 0 ? '#7c3aed' : '#dc2626' }}>
                        {idx === 0 ? '🟣' : '🔴'}
                      </div>
                      <img
                        src={dest.photoUrl || `https://picsum.photos/seed/${dest.id}/80/80`}
                        alt={dest.name}
                        className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                        onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/80/80` }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-slate-800 text-sm truncate">{dest.name}</span>
                          <span className="text-sm font-bold ml-2 flex-shrink-0" style={{ color: idx === 0 ? '#7c3aed' : '#dc2626' }}>
                            {dest.voteCount} vote{dest.voteCount !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: t2TotalVotes > 0 ? `${(dest.voteCount / t2TotalVotes) * 100}%` : '0%',
                              background: idx === 0 ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'linear-gradient(90deg, #dc2626, #f97316)',
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-slate-400 w-9 text-right flex-shrink-0">
                        {t2TotalVotes > 0 ? `${Math.round((dest.voteCount / t2TotalVotes) * 100)}%` : '0%'}
                      </div>

                      {/* Voter tooltip */}
                      {dest.voters.length > 0 && (
                        <div className="absolute left-8 top-full mt-1.5 z-20 hidden group-hover:block pointer-events-none">
                          <div className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl min-w-[140px] max-w-[240px]">
                            <p className="font-semibold text-white/60 mb-1.5 uppercase tracking-wide text-[10px]">Voted by</p>
                            <div className="flex flex-wrap gap-1">
                              {dest.voters.map((name) => (
                                <span key={name} className="bg-white/15 px-2 py-0.5 rounded-full whitespace-nowrap">{name}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Action button */}
              <div className="pt-1">
                {settings.tierTwoOpen ? (
                  <button
                    onClick={disableTierTwo}
                    disabled={enablingTierTwo}
                    className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                  >
                    {enablingTierTwo ? '⏳ Closing...' : '🔒 Close Level 2 Voting'}
                  </button>
                ) : hasTie ? (
                  <button
                    onClick={enableTierTwo}
                    disabled={enablingTierTwo}
                    className="flex items-center gap-2 text-white font-bold text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)' }}
                  >
                    {enablingTierTwo ? '⏳ Activating...' : '⚔️ Activate Level 2 Voting'}
                  </button>
                ) : (
                  <p className="text-slate-400 text-xs italic">Level 2 becomes available when two destinations are tied at the top.</p>
                )}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── ANNOUNCEMENT ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-800">📢 Announcement Box</h2>
            <p className="text-slate-500 text-xs mt-0.5">Shown at the top of the voting page. Leave empty to hide.</p>
          </div>
          {settings.announcement && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
              Live
            </span>
          )}
        </div>
        <textarea
          className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
          rows={3}
          placeholder="e.g. 🎉 Voting closes this Sunday! Make sure you've cast all your votes."
          value={announcementDraft}
          onChange={(e) => setAnnouncementDraft(e.target.value)}
          maxLength={300}
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-slate-400">{announcementDraft.length}/300</span>
          <div className="flex gap-2">
            {announcementDraft && (
              <button
                onClick={() => { setAnnouncementDraft(''); saveAnnouncement('') }}
                className="text-xs text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                🗑️ Clear
              </button>
            )}
            <button
              onClick={() => saveAnnouncement(announcementDraft)}
              disabled={savingAnnouncement || announcementDraft === settings.announcement}
              className="btn-primary text-xs px-4 py-1.5 disabled:opacity-40"
            >
              {announcementSaved ? '✅ Saved!' : savingAnnouncement ? '⏳ Saving…' : '💾 Publish'}
            </button>
          </div>
        </div>
        {announcementDraft && (
          <div className="mt-3 border border-amber-200 bg-amber-50 rounded-xl px-4 py-3 text-sm text-amber-800">
            <p className="text-xs font-semibold text-amber-600 mb-1">Preview (as seen by participants):</p>
            <p className="leading-relaxed">{announcementDraft}</p>
          </div>
        )}
      </div>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Destinations', value: destinations.length, icon: '🗺️', color: 'from-sky-500 to-cyan-500' },
          { label: 'Participants', value: participants.length, icon: '👥', color: 'from-violet-500 to-purple-500' },
          { label: 'Voted', value: `${participantsVoted}/${participants.length}`, icon: '🗳️', color: 'from-orange-500 to-amber-500' },
          { label: 'Vote Capacity', value: totalVoteCapacity, icon: '📊', color: 'from-teal-500 to-emerald-500' },
        ].map((stat) => (
          <div key={stat.label} className={`bg-gradient-to-br ${stat.color} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{stat.icon}</div>
            <div className="text-3xl font-display font-bold">{stat.value}</div>
            <div className="text-white/80 text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── WINNER HIGHLIGHT ── */}
      {winner && totalVotes > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl sm:text-5xl">🏆</div>
            <div className="flex-1 min-w-0">
              <div className="text-amber-600 text-xs sm:text-sm font-semibold uppercase tracking-wide mb-1">Current Leader</div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-800 truncate">{winner.name}</h2>
              <div className="text-slate-600 text-sm">
                <strong>{winner.voteCount}</strong> vote{winner.voteCount !== 1 ? 's' : ''} · {Math.round((winner.voteCount / totalVotes) * 100)}% of total
              </div>
            </div>
            {winner.photoUrl && (
              <img src={winner.photoUrl} alt={winner.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover shadow-md hidden sm:block" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            )}
          </div>
        </div>
      )}

      {/* ── VOTE RESULTS CHART ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-display font-bold text-slate-800">🗳️ Vote Results</h2>
          <Link href="/admin/destinations" className="text-sky-500 text-sm hover:text-sky-700">Manage →</Link>
        </div>

        {sortedDestinations.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-2">🗺️</div>
            <p>No destinations added yet.</p>
            <Link href="/admin/destinations" className="text-sky-500 text-sm hover:underline mt-1 inline-block">Add destinations →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedDestinations.map((dest, idx) => (
              <div key={dest.id} className="relative flex items-center gap-3 sm:gap-4 group">
                <div className="w-8 text-center font-bold text-slate-400 text-sm flex-shrink-0">
                  {idx === 0 && totalVotes > 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                </div>
                <img
                  src={dest.photoUrl || dest.media?.[0]?.photoUrl || `https://picsum.photos/seed/${dest.id}/80/80`}
                  alt={dest.name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${dest.id}/80/80` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-800 text-sm truncate">{dest.name}</span>
                    <span className="text-sm font-bold text-sky-600 ml-2 flex-shrink-0">
                      {dest.voteCount} vote{dest.voteCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        idx === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-400' :
                        idx === 1 ? 'bg-gradient-to-r from-sky-400 to-cyan-400' :
                        idx === 2 ? 'bg-gradient-to-r from-teal-400 to-emerald-400' :
                        'bg-gradient-to-r from-slate-300 to-slate-200'
                      }`}
                      style={{ width: totalVotes > 0 ? `${(dest.voteCount / totalVotes) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-400 w-9 text-right flex-shrink-0">
                  {totalVotes > 0 ? `${Math.round((dest.voteCount / totalVotes) * 100)}%` : '0%'}
                </div>

                {/* Voter tooltip */}
                {dest.voters.length > 0 && (
                  <div className="absolute left-8 top-full mt-1.5 z-20 hidden group-hover:block pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl min-w-[140px] max-w-[240px]">
                      <p className="font-semibold text-white/60 mb-1.5 uppercase tracking-wide text-[10px]">Voted by</p>
                      <div className="flex flex-wrap gap-1">
                        {dest.voters.map((name) => (
                          <span key={name} className="bg-white/15 px-2 py-0.5 rounded-full whitespace-nowrap">{name}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PARTICIPANT SUMMARY ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-display font-bold text-slate-800">👥 Participant Activity</h2>
          <Link href="/admin/participants" className="text-sky-500 text-sm hover:text-sky-700">Manage →</Link>
        </div>

        {participants.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <div className="text-4xl mb-2">👤</div>
            <p>No participants yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-5 sm:mx-0">
            <table className="w-full text-sm min-w-[460px]">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-3 font-semibold pl-5 sm:pl-0">Participant</th>
                  <th className="pb-3 font-semibold text-center">Allocated</th>
                  <th className="pb-3 font-semibold text-center">Used</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {participants.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 font-medium text-slate-800 pl-5 sm:pl-0">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold">
                          {p.username[0].toUpperCase()}
                        </div>
                        {p.username}
                      </div>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-600">{p.voteCount}</td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${p.votesUsed > 0 ? 'text-sky-600' : 'text-slate-400'}`}>{p.votesUsed}</span>
                    </td>
                    <td className="py-3 text-center">
                      {p.remainingVotes === 0 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-0.5 rounded-full">✅ Done</span>
                      ) : p.votesUsed > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">🗳️ {p.remainingVotes} left</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-medium px-2 py-0.5 rounded-full">⏳ Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
