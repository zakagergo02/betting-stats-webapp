'use client'
import { useState } from 'react'

const LEAGUES = [
  { name: 'Premier League', season_id: 15050 },
  { name: 'La Liga', season_id: 14956 },
  { name: 'Bundesliga', season_id: 14968 },
  { name: 'Serie A', season_id: 15068 },
  { name: 'Ligue 1', season_id: 14932 },
  { name: 'Champions League', season_id: 14924 },
]

export default function Home() {
  const [selectedLeague, setSelectedLeague] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [homeTeam, setHomeTeam] = useState<any>(null)
  const [awayTeam, setAwayTeam] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleLeagueSelect = async (league: any) => {
    setSelectedLeague(league)
    setTeams([])
    setHomeTeam(null)
    setAwayTeam(null)
    setStats(null)
    const res = await fetch(`/api/teams?season_id=${league.season_id}`)
    const data = await res.json()
    const sorted = (data.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name))
    setTeams(sorted)
  }

  const handleAnalyze = async () => {
    if (!homeTeam || !awayTeam || !selectedLeague) return
    setLoading(true)
    setStats(null)
    const res = await fetch(`/api/matchstats?home_team_id=${homeTeam.id}&away_team_id=${awayTeam.id}&season_id=${selectedLeague.season_id}`)
    const data = await res.json()
    setStats(data)
    setLoading(false)
  }

  const StatRow = ({ label, home, away }: { label: string, home: number, away: number }) => (
    <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-700">
      <div className="text-right text-white font-semibold">{home?.toFixed(2) ?? '-'}</div>
      <div className="text-center text-gray-400 text-sm">{label}</div>
      <div className="text-left text-white font-semibold">{away?.toFixed(2) ?? '-'}</div>
    </div>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-8">⚽ Betting Stats</h1>

      {/* Liga választó */}
      <div className="max-w-3xl mx-auto mb-6">
        <h2 className="text-lg text-gray-400 mb-3">Válassz ligát:</h2>
        <div className="flex flex-wrap gap-2">
          {LEAGUES.map(league => (
            <button
              key={league.season_id}
              onClick={() => handleLeagueSelect(league)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                selectedLeague?.season_id === league.season_id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {league.name}
            </button>
          ))}
        </div>
      </div>

      {/* Csapat választó */}
      {teams.length > 0 && (
        <div className="max-w-3xl mx-auto mb-6 grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-lg text-gray-400 mb-2">🏠 Hazai csapat:</h2>
            <select
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
              onChange={e => setHomeTeam(teams.find(t => t.id === parseInt(e.target.value)))}
              defaultValue=""
            >
              <option value="" disabled>Válassz csapatot...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
          <div>
            <h2 className="text-lg text-gray-400 mb-2">✈️ Vendég csapat:</h2>
            <select
              className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
              onChange={e => setAwayTeam(teams.find(t => t.id === parseInt(e.target.value)))}
              defaultValue=""
            >
              <option value="" disabled>Válassz csapatot...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Elemzés gomb */}
      {homeTeam && awayTeam && (
        <div className="max-w-3xl mx-auto mb-6 text-center">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold px-8 py-3 rounded-lg text-lg transition-colors"
          >
            {loading ? '⏳ Elemzés...' : '🔍 Elemzés'}
          </button>
        </div>
      )}

      {/* Statisztikák */}
      {stats && (
        <div className="max-w-3xl mx-auto bg-gray-800 rounded-xl p-6">
          <div className="grid grid-cols-3 mb-4">
            <div className="text-center">
              <img src={stats.home.team?.image} className="w-12 h-12 mx-auto mb-1" />
              <p className="font-bold text-green-400">{stats.home.team?.name}</p>
              <p className="text-xs text-gray-400">Hazai</p>
            </div>
            <div className="text-center text-gray-400 text-sm self-center">VS</div>
            <div className="text-center">
              <img src={stats.away.team?.image} className="w-12 h-12 mx-auto mb-1" />
              <p className="font-bold text-blue-400">{stats.away.team?.name}</p>
              <p className="text-xs text-gray-400">Vendég</p>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mb-4">Utolsó 5 meccs átlagai</p>

          <StatRow label="xG" home={stats.home.l5Stats?.avgXg} away={stats.away.l5Stats?.avgXg} />
          <StatRow label="Gól" home={stats.home.l5Stats?.avgGoals} away={stats.away.l5Stats?.avgGoals} />
          <StatRow label="Kapott gól" home={stats.home.l5Stats?.avgGoalsAgainst} away={stats.away.l5Stats?.avgGoalsAgainst} />
          <StatRow label="xGA" home={stats.home.l5Stats?.avgXgAgainst} away={stats.away.l5Stats?.avgXgAgainst} />
          <StatRow label="Sarokrúgás" home={stats.home.l5Stats?.avgCorners} away={stats.away.l5Stats?.avgCorners} />
          <StatRow label="Kapott sarok" home={stats.home.l5Stats?.avgCornersAgainst} away={stats.away.l5Stats?.avgCornersAgainst} />
          <StatRow label="Lövés" home={stats.home.l5Stats?.avgShots} away={stats.away.l5Stats?.avgShots} />
          <StatRow label="Kapott lövés" home={stats.home.l5Stats?.avgShotsAgainst} away={stats.away.l5Stats?.avgShotsAgainst} />
          <StatRow label="Veszélyes támadás" home={stats.home.l5Stats?.avgDangAttacks} away={stats.away.l5Stats?.avgDangAttacks} />
          <StatRow label="Labdabirtoklás %" home={stats.home.l5Stats?.avgPossession} away={stats.away.l5Stats?.avgPossession} />
        </div>
      )}
    </main>
  )
}