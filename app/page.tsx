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

const ANALYSIS_TYPES = [
  { id: 'goals', label: '⚽ Várható gólok' },
  { id: 'corners', label: '🚩 Várható szögletek' },
  { id: 'shots', label: '🎯 Várható lövések' },
]

export default function Home() {
  const [analysisType, setAnalysisType] = useState<string | null>(null)
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

  const pct = (val: any) => `${val}%`
  const colorClass = (val: number) => val >= 50 ? 'text-green-400' : val >= 35 ? 'text-yellow-400' : 'text-red-400'

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center mb-8">⚽ Betting Stats</h1>

      {/* Elemzés típus választó */}
      {!analysisType && (
        <div>
          <h2 className="text-lg text-gray-400 mb-4 text-center">Mit szeretnél elemezni?</h2>
          <div className="flex flex-col gap-3">
            {ANALYSIS_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => setAnalysisType(type.id)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors"
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Liga választó */}
      {analysisType && !selectedLeague && (
        <div>
          <button onClick={() => setAnalysisType(null)} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
            ← Vissza
          </button>
          <h2 className="text-lg text-gray-400 mb-4 text-center">Válassz ligát:</h2>
          <div className="flex flex-col gap-3">
            {LEAGUES.map(league => (
              <button
                key={league.season_id}
                onClick={() => handleLeagueSelect(league)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors"
              >
                {league.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Csapat választó */}
      {selectedLeague && teams.length > 0 && !stats && (
        <div>
          <button onClick={() => { setSelectedLeague(null); setTeams([]) }} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
            ← Vissza
          </button>
          <h2 className="text-lg text-gray-400 mb-4 text-center">{selectedLeague.name}</h2>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-400 text-sm mb-2">🏠 Hazai csapat:</p>
              <select
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                onChange={e => setHomeTeam(teams.find((t: any) => t.id === parseInt(e.target.value)))}
                defaultValue=""
              >
                <option value="" disabled>Válassz...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2">✈️ Vendég csapat:</p>
              <select
                className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600"
                onChange={e => setAwayTeam(teams.find((t: any) => t.id === parseInt(e.target.value)))}
                defaultValue=""
              >
                <option value="" disabled>Válassz...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>
          </div>
          {homeTeam && awayTeam && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl text-lg transition-colors"
            >
              {loading ? '⏳ Elemzés folyamatban...' : '🔍 Elemzés'}
            </button>
          )}
        </div>
      )}

      {/* Eredmények */}
      {stats && (
        <div>
          <button onClick={() => setStats(null)} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1">
            ← Vissza
          </button>

          {/* Csapatok */}
          <div className="flex items-center justify-between mb-6 bg-gray-800 rounded-xl p-4">
            <div className="text-center flex-1">
              <img src={stats.home.team?.image} className="w-12 h-12 mx-auto mb-1" />
              <p className="font-bold text-green-400 text-sm">{stats.home.team?.name}</p>
            </div>
            <div className="text-gray-400 font-bold text-lg">VS</div>
            <div className="text-center flex-1">
              <img src={stats.away.team?.image} className="w-12 h-12 mx-auto mb-1" />
              <p className="font-bold text-blue-400 text-sm">{stats.away.team?.name}</p>
            </div>
          </div>

          {/* Gól elemzés */}
          {analysisType === 'goals' && (
            <div className="space-y-4">
              {/* 1X2 */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">MECCS KIMENETEL</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className={`text-2xl font-bold ${colorClass(parseFloat(stats.probabilities.goals.hazaiP))}`}>
                      {pct(stats.probabilities.goals.hazaiP)}
                    </p>
                    <p className="text-gray-400 text-xs">Hazai</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${colorClass(parseFloat(stats.probabilities.goals.dontetlen))}`}>
                      {pct(stats.probabilities.goals.dontetlen)}
                    </p>
                    <p className="text-gray-400 text-xs">Döntetlen</p>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${colorClass(parseFloat(stats.probabilities.goals.vendegP))}`}>
                      {pct(stats.probabilities.goals.vendegP)}
                    </p>
                    <p className="text-gray-400 text-xs">Vendég</p>
                  </div>
                </div>
              </div>

              {/* Várható gólok + BTTS */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">VÁRHATÓ GÓLOK</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.probabilities.goals.hazaiGol}</p>
                    <p className="text-gray-400 text-xs">Hazai</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.probabilities.goals.osszGol}</p>
                    <p className="text-gray-400 text-xs">Össz</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.probabilities.goals.vendegGol}</p>
                    <p className="text-gray-400 text-xs">Vendég</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <p className={`text-xl font-bold ${colorClass(parseFloat(stats.probabilities.goals.btts))}`}>
                      {pct(stats.probabilities.goals.btts)}
                    </p>
                    <p className="text-gray-400 text-xs">Mindkét csapat szerez gólt</p>
                  </div>
                  <div>
                    <p className={`text-xl font-bold ${colorClass(100 - parseFloat(stats.probabilities.goals.btts))}`}>
                      {(100 - parseFloat(stats.probabilities.goals.btts)).toFixed(1)}%
                    </p>
                    <p className="text-gray-400 text-xs">Nem szerez mindkettő</p>
                  </div>
                </div>
              </div>

              {/* Over/Under */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.goals.overUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pontos eredmények */}
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">LEGVALÓSZÍNŰBB EREDMÉNYEK</h3>
                <div className="space-y-2">
                  {stats.probabilities.goals.eredmenyek.map((e: any) => (
                    <div key={`${e.hazai}-${e.vendeg}`} className="flex justify-between items-center">
                      <span className="text-white font-bold">{e.hazai} - {e.vendeg}</span>
                      <div className="flex-1 mx-3 bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${Math.min(e.prob * 5, 100)}%` }}
                        />
                      </div>
                      <span className="text-green-400 font-bold text-sm">{e.prob}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

         {/* Szöglet elemzés */}
          {analysisType === 'corners' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">VÁRHATÓ SZÖGLETEK</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">{stats.probabilities.corners.hazaiXC}</p>
                    <p className="text-gray-400 text-xs">Hazai</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.probabilities.corners.osszXC}</p>
                    <p className="text-gray-400 text-xs">Össz</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{stats.probabilities.corners.vendegXC}</p>
                    <p className="text-gray-400 text-xs">Vendég</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">ÖSSZ OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.corners.overUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">🏠 {stats.home.team?.name} OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.corners.homeOverUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">✈️ {stats.away.team?.name} OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.corners.awayOverUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

{/* Lövés elemzés */}
          {analysisType === 'shots' && (
            <div className="space-y-4">
              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">VÁRHATÓ LÖVÉSEK</h3>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-400">{stats.probabilities.shots.hazaiXShot}</p>
                    <p className="text-gray-400 text-xs">Hazai</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{stats.probabilities.shots.osszXShot}</p>
                    <p className="text-gray-400 text-xs">Össz</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-400">{stats.probabilities.shots.vendegXShot}</p>
                    <p className="text-gray-400 text-xs">Vendég</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">ÖSSZ OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.shots.overUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">🏠 {stats.home.team?.name} OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.shots.homeOverUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-gray-400 text-sm mb-3 text-center">✈️ {stats.away.team?.name} OVER / UNDER</h3>
                <div className="space-y-2">
                  {stats.probabilities.shots.awayOverUnder.map((ou: any) => (
                    <div key={ou.label} className="grid grid-cols-3 gap-2 text-center text-sm">
                      <p className={`font-bold ${colorClass(ou.over * 100)}`}>{(ou.over * 100).toFixed(1)}%</p>
                      <p className="text-gray-400">Over {ou.label}</p>
                      <p className={`font-bold ${colorClass(ou.under * 100)}`}>{(ou.under * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}</div>
      )}
    </main>
  )
}