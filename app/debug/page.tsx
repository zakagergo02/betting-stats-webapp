'use client'
import { useState } from 'react'

export default function Debug() {
  const [homeId, setHomeId] = useState('59')
  const [awayId, setAwayId] = useState('151')
  const [seasonId, setSeasonId] = useState('15050')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleFetch = async () => {
    setLoading(true)
    const res = await fetch(`/api/matchstats?home_team_id=${homeId}&away_team_id=${awayId}&season_id=${seasonId}`)
    const json = await res.json()
    setData(json)
    setLoading(false)
  }

  const Row = ({ label, home, away }: { label: string, home: any, away: any }) => (
    <tr className="border-b border-gray-700">
      <td className="py-2 text-gray-400 text-sm">{label}</td>
      <td className="py-2 text-green-400 text-sm text-right">{typeof home === 'number' ? home.toFixed(3) : home ?? '-'}</td>
      <td className="py-2 text-blue-400 text-sm text-right">{typeof away === 'number' ? away.toFixed(3) : away ?? '-'}</td>
    </tr>
  )

  return (
    <main className="min-h-screen bg-gray-900 text-white p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug — Számítási adatok</h1>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <div>
          <p className="text-gray-400 text-xs mb-1">Hazai ID</p>
          <input className="w-full bg-gray-800 text-white p-2 rounded" value={homeId} onChange={e => setHomeId(e.target.value)} />
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">Vendég ID</p>
          <input className="w-full bg-gray-800 text-white p-2 rounded" value={awayId} onChange={e => setAwayId(e.target.value)} />
        </div>
        <div>
          <p className="text-gray-400 text-xs mb-1">Season ID</p>
          <input className="w-full bg-gray-800 text-white p-2 rounded" value={seasonId} onChange={e => setSeasonId(e.target.value)} />
        </div>
      </div>

      <button onClick={handleFetch} disabled={loading} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl mb-6">
        {loading ? '⏳ Betöltés...' : '🔍 Lekérés'}
      </button>

      {data && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-bold mb-3">
              🏠 <span className="text-green-400">{data.home.team?.name}</span> vs ✈️ <span className="text-blue-400">{data.away.team?.name}</span>
            </h2>

            <h3 className="text-gray-400 text-sm mb-2">L5 STATISZTIKÁK (utolsó 5 hazai/vendég meccs)</h3>
            <table className="w-full mb-4">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left text-gray-500 text-xs py-1">Stat</th>
                  <th className="text-right text-green-500 text-xs py-1">Hazai</th>
                  <th className="text-right text-blue-500 text-xs py-1">Vendég</th>
                </tr>
              </thead>
              <tbody>
                <Row label="Átlag gól" home={data.home.l5Stats?.avgGoals} away={data.away.l5Stats?.avgGoals} />
                <Row label="Átlag kapott gól" home={data.home.l5Stats?.avgGoalsAgainst} away={data.away.l5Stats?.avgGoalsAgainst} />
                <Row label="Átlag xG" home={data.home.l5Stats?.avgXg} away={data.away.l5Stats?.avgXg} />
                <Row label="Átlag xGA" home={data.home.l5Stats?.avgXgAgainst} away={data.away.l5Stats?.avgXgAgainst} />
                <Row label="Átlag sarokrúgás" home={data.home.l5Stats?.avgCorners} away={data.away.l5Stats?.avgCorners} />
                <Row label="Átlag kapott sarok" home={data.home.l5Stats?.avgCornersAgainst} away={data.away.l5Stats?.avgCornersAgainst} />
                <Row label="Átlag lövés" home={data.home.l5Stats?.avgShots} away={data.away.l5Stats?.avgShots} />
                <Row label="Átlag kapott lövés" home={data.home.l5Stats?.avgShotsAgainst} away={data.away.l5Stats?.avgShotsAgainst} />
                <Row label="Átlag veszélyes támadás" home={data.home.l5Stats?.avgDangAttacks} away={data.away.l5Stats?.avgDangAttacks} />
                <Row label="Átlag labdabirtoklás %" home={data.home.l5Stats?.avgPossession} away={data.away.l5Stats?.avgPossession} />
              </tbody>
            </table>

            <h3 className="text-gray-400 text-sm mb-2">SZEZON STATISZTIKÁK (All)</h3>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-600">
                  <th className="text-left text-gray-500 text-xs py-1">Stat</th>
                  <th className="text-right text-green-500 text-xs py-1">Hazai</th>
                  <th className="text-right text-blue-500 text-xs py-1">Vendég</th>
                </tr>
              </thead>
              <tbody>
                <Row label="xG for avg (home/away)" home={data.home.team?.stats?.xg_for_avg_home} away={data.away.team?.stats?.xg_for_avg_away} />
                <Row label="xG against avg (home/away)" home={data.home.team?.stats?.xg_against_avg_home} away={data.away.team?.stats?.xg_against_avg_away} />
                <Row label="Gól átlag (home/away)" home={data.home.team?.stats?.seasonScoredAVG_home} away={data.away.team?.stats?.seasonScoredAVG_away} />
                <Row label="Kapott gól átlag (home/away)" home={data.home.team?.stats?.seasonConcededAVG_home} away={data.away.team?.stats?.seasonConcededAVG_away} />
                <Row label="Sarokrúgás átlag (home/away)" home={data.home.team?.stats?.cornersAVG_home} away={data.away.team?.stats?.cornersAVG_away} />
                <Row label="Kapott sarok átlag (home/away)" home={data.home.team?.stats?.cornersAgainstAVG_home} away={data.away.team?.stats?.cornersAgainstAVG_away} />
                <Row label="Lövés átlag (home/away)" home={data.home.team?.stats?.shotsAVG_home} away={data.away.team?.stats?.shotsAVG_away} />
                <Row label="Labdabirtoklás % (home/away)" home={data.home.team?.stats?.possessionAVG_home} away={data.away.team?.stats?.possessionAVG_away} />
                <Row label="Veszélyes támadás átlag" home={data.home.team?.stats?.dangerous_attacks_avg_home} away={data.away.team?.stats?.dangerous_attacks_avg_away} />
              </tbody>
            </table>
          </div>

          <div className="bg-gray-800 rounded-xl p-4">
            <h3 className="text-gray-400 text-sm mb-2">KISZÁMOLT VALÓSZÍNŰSÉGEK</h3>
            <table className="w-full">
              <tbody>
                <Row label="Várható hazai gól" home={parseFloat(data.probabilities.goals.hazaiGol)} away={parseFloat(data.probabilities.goals.vendegGol)} />
                <Row label="Várható össz szöglet" home={parseFloat(data.probabilities.corners.hazaiXC)} away={parseFloat(data.probabilities.corners.vendegXC)} />
                <Row label="Várható össz lövés" home={parseFloat(data.probabilities.shots.hazaiXShot)} away={parseFloat(data.probabilities.shots.vendegXShot)} />
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  )
}