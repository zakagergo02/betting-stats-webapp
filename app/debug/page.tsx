'use client'
import { useState } from 'react'

// ============================================================
// KONSTANSOK – ugyanazok mint az éles oldalon
// ============================================================

const LEAGUES = [
  { name: 'Premier League', season_id: 15050 },
  { name: 'La Liga', season_id: 14956 },
  { name: 'Bundesliga', season_id: 14968 },
  { name: 'Serie A', season_id: 15068 },
  { name: 'Ligue 1', season_id: 14932 },
  { name: 'Champions League', season_id: 14924 },
]

// ============================================================
// UGYANAZOK A SZÁMÍTÁSI FÜGGVÉNYEK MINT A BACKENDBEN
// ============================================================

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let result = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) result *= lambda / i
  return result
}

function calculateSteps(home: any, away: any) {
  const { l5Stats: h } = home
  const { l5Stats: a } = away
  const hs  = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hXgAll    = hs.xg_for_avg_home          ?? h?.avgXg            ?? 0
  const hAvgGAll  = hs.seasonScoredAVG_home      ?? h?.avgGoals         ?? 0
  const hXgaAll   = hs.xg_against_avg_home       ?? h?.avgXgAgainst     ?? 0
  const hAvgGaAll = hs.seasonConcededAVG_home    ?? h?.avgGoalsAgainst  ?? 0
  const aXgAll    = as_.xg_for_avg_away          ?? a?.avgXg            ?? 0
  const aAvgGAll  = as_.seasonScoredAVG_away     ?? a?.avgGoals         ?? 0
  const aXgaAll   = as_.xg_against_avg_away      ?? a?.avgXgAgainst     ?? 0
  const aAvgGaAll = as_.seasonConcededAVG_away   ?? a?.avgGoalsAgainst  ?? 0

  const hCorn   = hs.cornersAVG_home         || 5
  const hCornAg = hs.cornersAgainstAVG_home  || 3
  const aCorn   = as_.cornersAVG_away        || 5
  const aCornAg = as_.cornersAgainstAVG_away || 3

  const hVarhG  = ((h?.avgXg           * 0.3 + hXgAll  * 0.7) * 0.7) + ((h?.avgGoals        * 0.3 + hAvgGAll  * 0.7) * 0.3)
  const hVarhGa = ((h?.avgXgAgainst    * 0.3 + hXgaAll * 0.7) * 0.7) + ((h?.avgGoalsAgainst * 0.3 + hAvgGaAll * 0.7) * 0.3)
  const aVarhG  = ((a?.avgXg           * 0.3 + aXgAll  * 0.7) * 0.7) + ((a?.avgGoals        * 0.3 + aAvgGAll  * 0.7) * 0.3)
  const aVarhGa = ((a?.avgXgAgainst    * 0.3 + aXgaAll * 0.7) * 0.7) + ((a?.avgGoalsAgainst * 0.3 + aAvgGaAll * 0.7) * 0.3)

  const hHybrid    = hVarhG  + (hCorn   * 0.02)
  const hDefHybrid = hVarhGa + (hCornAg * 0.02)
  const aHybrid    = aVarhG  + (aCorn   * 0.02)
  const aDefHybrid = aVarhGa + (aCornAg * 0.02)

  const hazaiGol  = (hHybrid + aDefHybrid) / 2
  const vendegGol = (aHybrid + hDefHybrid) / 2

  return {
    inputs: {
      hazai: {
        l5_avgXg: h?.avgXg, l5_avgGoals: h?.avgGoals,
        l5_avgXgAgainst: h?.avgXgAgainst, l5_avgGoalsAgainst: h?.avgGoalsAgainst,
        szXgFor: hXgAll, szAvgG: hAvgGAll, szXgAgainst: hXgaAll, szAvgGa: hAvgGaAll,
        corn: hCorn, cornAg: hCornAg,
      },
      vendeg: {
        l5_avgXg: a?.avgXg, l5_avgGoals: a?.avgGoals,
        l5_avgXgAgainst: a?.avgXgAgainst, l5_avgGoalsAgainst: a?.avgGoalsAgainst,
        szXgFor: aXgAll, szAvgG: aAvgGAll, szXgAgainst: aXgaAll, szAvgGa: aAvgGaAll,
        corn: aCorn, cornAg: aCornAg,
      }
    },
    hybrid: { hVarhG, hVarhGa, aVarhG, aVarhGa, hHybrid, hDefHybrid, aHybrid, aDefHybrid },
    result: { hazaiGol, vendegGol }
  }
}

// ============================================================
// UI SEGÉD KOMPONENSEK
// ============================================================

function FormulaBox({ formula, result, note }: { formula: string; result?: string; note?: string }) {
  return (
    <div className="bg-gray-950 border border-gray-700 rounded-lg p-3 font-mono text-sm">
      <div className="text-yellow-300 whitespace-pre">{formula}</div>
      {result && <div className="text-green-400 mt-1">= <span className="font-bold">{result}</span></div>}
      {note && <div className="text-gray-500 text-xs mt-1 font-sans">{note}</div>}
    </div>
  )
}

function StatRow({ label, hVal, aVal }: { label: string; hVal: any; aVal: any }) {
  const fmt = (v: any) => v == null ? <span className="text-gray-600">—</span> : typeof v === 'number' ? v.toFixed(3) : v
  return (
    <tr className="border-b border-gray-800">
      <td className="py-2 pr-4 text-gray-400 text-xs">{label}</td>
      <td className="py-2 text-green-400 text-xs text-right font-mono">{fmt(hVal)}</td>
      <td className="py-2 text-blue-400  text-xs text-right font-mono">{fmt(aVal)}</td>
    </tr>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-white text-sm tracking-wide uppercase">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-gray-400 hover:text-white mb-4 flex items-center gap-1 text-sm">
      ← Vissza
    </button>
  )
}

// ============================================================
// FŐ OLDAL
// ============================================================

type Step = 'league' | 'teams' | 'result'

export default function DebugPage() {
  const [step, setStep]               = useState<Step>('league')
  const [selectedLeague, setSelectedLeague] = useState<any>(null)
  const [teams, setTeams]             = useState<any[]>([])
  const [homeTeam, setHomeTeam]       = useState<any>(null)
  const [awayTeam, setAwayTeam]       = useState<any>(null)
  const [data, setData]               = useState<any>(null)
  const [steps, setSteps]             = useState<any>(null)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)

  // Liga kiválasztása → csapatok betöltése
  const handleLeagueSelect = async (league: any) => {
    setSelectedLeague(league)
    setTeams([])
    setHomeTeam(null)
    setAwayTeam(null)
    setError(null)
    setLoading(true)
    try {
      const res  = await fetch(`/api/teams?season_id=${league.season_id}`)
      const json = await res.json()
      const sorted = (json.data || []).sort((a: any, b: any) => a.name.localeCompare(b.name))
      setTeams(sorted)
      setStep('teams')
    } catch {
      setError('Nem sikerült betölteni a csapatokat.')
    }
    setLoading(false)
  }

  // Elemzés indítása
  const handleAnalyze = async () => {
    if (!homeTeam || !awayTeam || !selectedLeague) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/matchstats?home_team_id=${homeTeam.id}&away_team_id=${awayTeam.id}&season_id=${selectedLeague.season_id}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setSteps(calculateSteps(json.home, json.away))
      setStep('result')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  const n = (v: any, d = 3) => v == null ? '—' : Number(v).toFixed(d)

  // ── LIGA VÁLASZTÓ ──────────────────────────────────────────
  if (step === 'league') return (
    <main className="min-h-screen bg-gray-900 text-white p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">🔬 Számítási Debug</h1>
        <p className="text-gray-400 text-sm mt-1">Pontosan láthatod miből és hogyan számol a rendszer</p>
      </div>
      <h2 className="text-gray-400 text-sm mb-3">1. Válassz ligát:</h2>
      <div className="flex flex-col gap-3">
        {LEAGUES.map(league => (
          <button
            key={league.season_id}
            onClick={() => handleLeagueSelect(league)}
            disabled={loading}
            className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white font-semibold py-4 px-6 rounded-xl text-lg transition-colors text-left"
          >
            {league.name}
          </button>
        ))}
      </div>
      {loading && <p className="text-gray-400 text-sm mt-4 text-center">⏳ Csapatok betöltése...</p>}
      {error   && <p className="text-red-400 text-sm mt-4">❌ {error}</p>}
    </main>
  )

  // ── CSAPAT VÁLASZTÓ ────────────────────────────────────────
  if (step === 'teams') return (
    <main className="min-h-screen bg-gray-900 text-white p-4 max-w-2xl mx-auto">
      <BackButton onClick={() => { setStep('league'); setSelectedLeague(null); setTeams([]) }} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">🔬 Számítási Debug</h1>
        <p className="text-gray-400 text-sm mt-1">{selectedLeague?.name}</p>
      </div>
      <h2 className="text-gray-400 text-sm mb-3">2. Válassz csapatokat:</h2>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-400 text-sm mb-2">🏠 Hazai csapat:</p>
          <select
            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-green-500"
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
            className="w-full bg-gray-800 text-white p-3 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500"
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
          className="w-full bg-green-600 hover:bg-green-500 disabled:bg-gray-700 text-white font-bold py-4 rounded-xl text-lg transition-colors"
        >
          {loading ? '⏳ Számítás folyamatban...' : '🔬 Számítás mutatása'}
        </button>
      )}
      {error && <p className="text-red-400 text-sm mt-3">❌ {error}</p>}
    </main>
  )

  // ── EREDMÉNY OLDAL ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 max-w-3xl mx-auto">
      <BackButton onClick={() => { setStep('teams'); setData(null); setSteps(null) }} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">🔬 Számítási Debug</h1>
        <p className="text-gray-400 text-sm mt-1">{selectedLeague?.name}</p>
      </div>

      {data && steps && (
        <div className="space-y-4">

          {/* CSAPAT FEJLÉC */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center justify-center gap-4 text-lg font-bold">
            <span className="text-green-400">🏠 {data.home.team?.name}</span>
            <span className="text-gray-500">vs</span>
            <span className="text-blue-400">✈️ {data.away.team?.name}</span>
          </div>

          {/* 1. LÉPÉS: NYERS ADATOK */}
          <Section title="1. lépés — Nyers bemeneti adatok" icon="📥">
            <p className="text-gray-400 text-xs mb-3">
              Az adatbázisból kinyert értékek.{' '}
              <span className="text-yellow-400 font-bold">L5</span> = utolsó 5 hazai/vendég meccs átlaga ·{' '}
              <span className="text-gray-300 font-bold">Szezon</span> = teljes idényi átlag
            </p>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left text-gray-500 text-xs py-1 pr-4">Adat</th>
                  <th className="text-right text-green-500 text-xs py-1">Hazai</th>
                  <th className="text-right text-blue-500  text-xs py-1">Vendég</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan={3} className="py-1 text-yellow-400 text-xs font-bold pt-3">L5 — Utolsó 5 meccs</td></tr>
                <StatRow label="L5 átlag xG (támadás)"      hVal={steps.inputs.hazai.l5_avgXg}           aVal={steps.inputs.vendeg.l5_avgXg} />
                <StatRow label="L5 átlag gól (támadás)"     hVal={steps.inputs.hazai.l5_avgGoals}        aVal={steps.inputs.vendeg.l5_avgGoals} />
                <StatRow label="L5 átlag xGA (védekezés)"   hVal={steps.inputs.hazai.l5_avgXgAgainst}    aVal={steps.inputs.vendeg.l5_avgXgAgainst} />
                <StatRow label="L5 átlag kapott gól"        hVal={steps.inputs.hazai.l5_avgGoalsAgainst} aVal={steps.inputs.vendeg.l5_avgGoalsAgainst} />
                <tr><td colSpan={3} className="py-1 text-gray-400 text-xs font-bold pt-3">Szezon — Teljes idény</td></tr>
                <StatRow label="Szezon xG for avg"          hVal={steps.inputs.hazai.szXgFor}     aVal={steps.inputs.vendeg.szXgFor} />
                <StatRow label="Szezon gól avg"             hVal={steps.inputs.hazai.szAvgG}      aVal={steps.inputs.vendeg.szAvgG} />
                <StatRow label="Szezon xG against avg"      hVal={steps.inputs.hazai.szXgAgainst} aVal={steps.inputs.vendeg.szXgAgainst} />
                <StatRow label="Szezon kapott gól avg"      hVal={steps.inputs.hazai.szAvgGa}     aVal={steps.inputs.vendeg.szAvgGa} />
                <tr><td colSpan={3} className="py-1 text-gray-400 text-xs font-bold pt-3">Sarokrúgás</td></tr>
                <StatRow label="Sarok átlag"                hVal={steps.inputs.hazai.corn}   aVal={steps.inputs.vendeg.corn} />
                <StatRow label="Kapott sarok átlag"         hVal={steps.inputs.hazai.cornAg} aVal={steps.inputs.vendeg.cornAg} />
              </tbody>
            </table>
          </Section>

          {/* 2. LÉPÉS: HYBRID */}
          <Section title="2. lépés — Hybrid érték számítás" icon="⚗️">
            <p className="text-gray-400 text-xs mb-3">
              Az L5 és a szezon adatokat súlyozzuk össze. Az xG megbízhatóbb mint a gól, ezért nagyobb súlyt kap.
            </p>
            <div className="space-y-3">
              <div>
                <p className="text-green-400 text-xs mb-1 font-bold">Hazai támadóerő</p>
                <FormulaBox
                  formula={`(L5_xG × 0.3 + Sz_xG × 0.7) × 0.7\n+ (L5_gól × 0.3 + Sz_gól × 0.7) × 0.3`}
                  result={n(steps.hybrid.hVarhG)}
                  note="xG súlya: 70% | Gól súlya: 30% | L5 súlya: 30% | Szezon súlya: 70%"
                />
              </div>
              <div>
                <p className="text-green-400 text-xs mb-1 font-bold">Hazai védekezés (kapott gól alapján)</p>
                <FormulaBox
                  formula={`(L5_xGA × 0.3 + Sz_xGA × 0.7) × 0.7\n+ (L5_kap × 0.3 + Sz_kap × 0.7) × 0.3`}
                  result={n(steps.hybrid.hVarhGa)}
                />
              </div>
              <div>
                <p className="text-blue-400 text-xs mb-1 font-bold">Vendég támadóerő</p>
                <FormulaBox
                  formula={`(L5_xG × 0.3 + Sz_xG × 0.7) × 0.7\n+ (L5_gól × 0.3 + Sz_gól × 0.7) × 0.3`}
                  result={n(steps.hybrid.aVarhG)}
                />
              </div>
              <div>
                <p className="text-blue-400 text-xs mb-1 font-bold">Vendég védekezés</p>
                <FormulaBox
                  formula={`(L5_xGA × 0.3 + Sz_xGA × 0.7) × 0.7\n+ (L5_kap × 0.3 + Sz_kap × 0.7) × 0.3`}
                  result={n(steps.hybrid.aVarhGa)}
                />
              </div>
            </div>
          </Section>

          {/* 3. LÉPÉS: SAROK KORREKCIÓ */}
          <Section title="3. lépés — Sarokrúgás korrekció" icon="🚩">
            <p className="text-gray-400 text-xs mb-3">
              Minden sarokrúgás +0.02 várható gólt ad hozzá. Ez a nyomást és területszerzést tükrözi.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Hazai korrigált támadás', formula: `${n(steps.hybrid.hVarhG)} + (${steps.inputs.hazai.corn} × 0.02)`, result: n(steps.hybrid.hHybrid), color: 'text-green-400' },
                { label: 'Hazai korrigált védekezés', formula: `${n(steps.hybrid.hVarhGa)} + (${steps.inputs.hazai.cornAg} × 0.02)`, result: n(steps.hybrid.hDefHybrid), color: 'text-green-400' },
                { label: 'Vendég korrigált támadás', formula: `${n(steps.hybrid.aVarhG)} + (${steps.inputs.vendeg.corn} × 0.02)`, result: n(steps.hybrid.aHybrid), color: 'text-blue-400' },
                { label: 'Vendég korrigált védekezés', formula: `${n(steps.hybrid.aVarhGa)} + (${steps.inputs.vendeg.cornAg} × 0.02)`, result: n(steps.hybrid.aDefHybrid), color: 'text-blue-400' },
              ].map(({ label, formula, result, color }) => (
                <div key={label}>
                  <p className={`${color} text-xs mb-1 font-bold`}>{label}</p>
                  <FormulaBox formula={formula} result={result} />
                </div>
              ))}
            </div>
          </Section>

          {/* 4. LÉPÉS: LAMBDA */}
          <Section title="4. lépés — Várható gólok (lambda)" icon="⚽">
            <p className="text-gray-400 text-xs mb-3">
              A végső lambda értékek a Poisson-eloszláshoz. Átlagoljuk a saját támadóerőt és az ellenfél védekezési gyengeségét.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-green-400 text-xs mb-1 font-bold">Hazai várható gól (λ)</p>
                <FormulaBox
                  formula={`(hazai_tám + vendég_véd) / 2\n(${n(steps.hybrid.hHybrid)} + ${n(steps.hybrid.aDefHybrid)}) / 2`}
                  result={n(steps.result.hazaiGol)}
                  note="Hazai támadóerő + Vendég védekezési gyengeség átlaga"
                />
              </div>
              <div>
                <p className="text-blue-400 text-xs mb-1 font-bold">Vendég várható gól (λ)</p>
                <FormulaBox
                  formula={`(vendég_tám + hazai_véd) / 2\n(${n(steps.hybrid.aHybrid)} + ${n(steps.hybrid.hDefHybrid)}) / 2`}
                  result={n(steps.result.vendegGol)}
                  note="Vendég támadóerő + Hazai védekezési gyengeség átlaga"
                />
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-600 flex gap-6 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400">{n(steps.result.hazaiGol, 2)}</div>
                <div className="text-gray-400 text-xs mt-1">hazai λ</div>
              </div>
              <div className="text-gray-600 self-center text-2xl">:</div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-400">{n(steps.result.vendegGol, 2)}</div>
                <div className="text-gray-400 text-xs mt-1">vendég λ</div>
              </div>
            </div>
          </Section>

          {/* 5. LÉPÉS: VÉGEREDMÉNY */}
          <Section title="5. lépés — Poisson végeredmény" icon="📊">
            <p className="text-gray-400 text-xs mb-3">
              A Poisson-eloszlás kiszámolja minden lehetséges eredmény valószínűségét a lambda értékekből (0–12 gólig összegez).
            </p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: '🏠 Hazai győzelem', val: data.probabilities?.goals?.hazaiP, color: 'text-green-400' },
                { label: '🤝 Döntetlen',      val: data.probabilities?.goals?.dontetlen, color: 'text-yellow-400' },
                { label: '✈️ Vendég győzelem', val: data.probabilities?.goals?.vendegP, color: 'text-blue-400' },
              ].map(({ label, val, color }) => (
                <div key={label} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
                  <div className={`text-2xl font-bold ${color}`}>{val}%</div>
                  <div className="text-gray-400 text-xs mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'Várható hazai gól',          val: data.probabilities?.goals?.hazaiGol },
                { label: 'Várható vendég gól',         val: data.probabilities?.goals?.vendegGol },
                { label: 'Várható össz gól',           val: data.probabilities?.goals?.osszGol },
                { label: 'BTTS (mindkettő szerez)',    val: `${data.probabilities?.goals?.btts}%` },
              ].map(({ label, val }) => (
                <div key={label} className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <div className="text-gray-400 text-xs">{label}</div>
                  <div className="text-white font-bold font-mono mt-1">{val}</div>
                </div>
              ))}
            </div>

            <p className="text-gray-400 text-xs mb-2 font-bold">Legvalószínűbb eredmények:</p>
            <div className="grid grid-cols-4 gap-2">
              {data.probabilities?.goals?.eredmenyek?.slice(0, 8).map((e: any) => (
                <div key={`${e.hazai}-${e.vendeg}`} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
                  <div className="text-white font-bold font-mono">{e.hazai} – {e.vendeg}</div>
                  <div className="text-yellow-400 text-sm mt-1">{e.prob}%</div>
                </div>
              ))}
            </div>
          </Section>

        </div>
      )}
    </main>
  )
}
