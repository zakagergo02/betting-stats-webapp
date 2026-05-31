'use client'
import { useState } from 'react'

// ============================================================
// KONSTANSOK
// ============================================================

const LEAGUES = [
  { name: 'Premier League', season_id: 15050 },
  { name: 'La Liga', season_id: 14956 },
  { name: 'Bundesliga', season_id: 14968 },
  { name: 'Serie A', season_id: 15068 },
  { name: 'Ligue 1', season_id: 14932 },
  { name: 'Champions League', season_id: 14924 },
]

const TABS = [
  { id: 'goals',   label: '⚽ Gólok' },
  { id: 'corners', label: '🚩 Szögletek' },
  { id: 'shots',   label: '🎯 Lövések' },
]

// ============================================================
// SZÁMÍTÁSI LÉPÉSEK – ugyanaz mint a backendben
// ============================================================

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let result = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) result *= lambda / i
  return result
}

function calcGoalSteps(home: any, away: any) {
  const { l5Stats: h } = home
  const { l5Stats: a } = away
  const hs  = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hXgAll    = hs.xg_for_avg_home         ?? h?.avgXg            ?? 0
  const hAvgGAll  = hs.seasonScoredAVG_home     ?? h?.avgGoals         ?? 0
  const hXgaAll   = hs.xg_against_avg_home      ?? h?.avgXgAgainst     ?? 0
  const hAvgGaAll = hs.seasonConcededAVG_home   ?? h?.avgGoalsAgainst  ?? 0
  const aXgAll    = as_.xg_for_avg_away         ?? a?.avgXg            ?? 0
  const aAvgGAll  = as_.seasonScoredAVG_away    ?? a?.avgGoals         ?? 0
  const aXgaAll   = as_.xg_against_avg_away     ?? a?.avgXgAgainst     ?? 0
  const aAvgGaAll = as_.seasonConcededAVG_away  ?? a?.avgGoalsAgainst  ?? 0

  const hCorn   = hs.cornersAVG_home         || 5
  const hCornAg = hs.cornersAgainstAVG_home  || 3
  const aCorn   = as_.cornersAVG_away        || 5
  const aCornAg = as_.cornersAgainstAVG_away || 3

  const hVarhG  = ((h?.avgXg * 0.3 + hXgAll * 0.7) * 0.7) + ((h?.avgGoals * 0.3 + hAvgGAll * 0.7) * 0.3)
  const hVarhGa = ((h?.avgXgAgainst * 0.3 + hXgaAll * 0.7) * 0.7) + ((h?.avgGoalsAgainst * 0.3 + hAvgGaAll * 0.7) * 0.3)
  const aVarhG  = ((a?.avgXg * 0.3 + aXgAll * 0.7) * 0.7) + ((a?.avgGoals * 0.3 + aAvgGAll * 0.7) * 0.3)
  const aVarhGa = ((a?.avgXgAgainst * 0.3 + aXgaAll * 0.7) * 0.7) + ((a?.avgGoalsAgainst * 0.3 + aAvgGaAll * 0.7) * 0.3)

  const hHybrid    = hVarhG  + (hCorn   * 0.02)
  const hDefHybrid = hVarhGa + (hCornAg * 0.02)
  const aHybrid    = aVarhG  + (aCorn   * 0.02)
  const aDefHybrid = aVarhGa + (aCornAg * 0.02)

  const hazaiGol  = (hHybrid + aDefHybrid) / 2
  const vendegGol = (aHybrid + hDefHybrid) / 2

  return {
    inputs: {
      hazai: { hXgAll, hAvgGAll, hXgaAll, hAvgGaAll, hCorn, hCornAg,
        l5_avgXg: h?.avgXg, l5_avgGoals: h?.avgGoals, l5_avgXgAgainst: h?.avgXgAgainst, l5_avgGoalsAgainst: h?.avgGoalsAgainst },
      vendeg: { aXgAll, aAvgGAll, aXgaAll, aAvgGaAll, aCorn, aCornAg,
        l5_avgXg: a?.avgXg, l5_avgGoals: a?.avgGoals, l5_avgXgAgainst: a?.avgXgAgainst, l5_avgGoalsAgainst: a?.avgGoalsAgainst },
    },
    hybrid: { hVarhG, hVarhGa, aVarhG, aVarhGa, hHybrid, hDefHybrid, aHybrid, aDefHybrid },
    result: { hazaiGol, vendegGol }
  }
}

function calcCornerSteps(home: any, away: any) {
  const hs  = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hCornAll    = hs.cornersAVG_home             || 5
  const hCornAgAll  = hs.cornersAgainstAVG_home       || 3
  const hShotsAll   = hs.shotsAVG_home               || 12
  const hDangAll    = hs.dangerous_attacks_avg_home   || 50
  const aCornAll    = as_.cornersAVG_away             || 5
  const aCornAgAll  = as_.cornersAgainstAVG_away      || 3
  const aShotsAll   = as_.shotsAVG_away               || 12
  const aDangAll    = as_.dangerous_attacks_avg_away  || 50

  // Hazai xC: sarok, lövés, veszélyes támadás kombinációja
  const hAttackScore  = hCornAll * 0.15 + hShotsAll * 0.12 + hDangAll * 0.02
  const aDefScore     = aCornAgAll * 0.15 + aShotsAll * 0.12 + aDangAll * 0.02
  const hSimple       = (hCornAll + aCornAgAll) / 2

  const hazaiXC = 0.6 * ((hAttackScore + aDefScore) / 2) + 0.4 * hSimple

  // Vendég xC
  const aAttackScore  = aCornAll * 0.15 + aShotsAll * 0.12 + aDangAll * 0.02
  const hDefScore     = hCornAgAll * 0.15 + hShotsAll * 0.12 + hDangAll * 0.02
  const aSimple       = (aCornAll + hCornAgAll) / 2

  const vendegXC = 0.6 * ((aAttackScore + hDefScore) / 2) + 0.4 * aSimple

  const osszXC = hazaiXC + vendegXC

  return {
    inputs: {
      hazai: { hCornAll, hCornAgAll, hShotsAll, hDangAll },
      vendeg: { aCornAll, aCornAgAll, aShotsAll, aDangAll },
    },
    intermediate: {
      hAttackScore, aDefScore, hSimple,
      aAttackScore, hDefScore, aSimple,
    },
    result: { hazaiXC, vendegXC, osszXC }
  }
}

function calcShotSteps(home: any, away: any) {
  const hs  = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hShotsAll   = hs.shotsAVG_home    || 12
  const hShotsAgAll = as_.shotsAVG_away   || 12
  const hPossAll    = hs.possessionAVG_home || 50
  const aShotsAll   = as_.shotsAVG_away   || 12
  const aShotsAgAll = hs.shotsAVG_home    || 12
  const aPossAll    = as_.possessionAVG_away || 50

  const hBase    = (hShotsAll + hShotsAgAll) / 2
  const hAdjust  = hBase * (hPossAll / 50) * (28 / 28)
  const hazaiXShot = hBase * 0.6 + hAdjust * 0.4

  const aBase    = (aShotsAll + aShotsAgAll) / 2
  const aAdjust  = aBase * (aPossAll / 50) * (28 / 28)
  const vendegXShot = aBase * 0.6 + aAdjust * 0.4

  const osszXShot = hazaiXShot + vendegXShot

  return {
    inputs: {
      hazai: { hShotsAll, hShotsAgAll, hPossAll },
      vendeg: { aShotsAll, aShotsAgAll, aPossAll },
    },
    intermediate: { hBase, hAdjust, aBase, aAdjust },
    result: { hazaiXShot, vendegXShot, osszXShot }
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

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-gray-700">
        <th className="text-left text-gray-500 text-xs py-1 pr-4">Adat</th>
        <th className="text-right text-green-500 text-xs py-1">Hazai</th>
        <th className="text-right text-blue-500 text-xs py-1">Vendég</th>
      </tr>
    </thead>
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
// DEBUG SZEKCIÓK
// ============================================================

function GoalDebug({ data, steps }: { data: any; steps: any }) {
  const n = (v: any, d = 3) => v == null ? '—' : Number(v).toFixed(d)
  return (
    <div className="space-y-4">
      <Section title="1. lépés — Nyers bemeneti adatok" icon="📥">
        <p className="text-gray-400 text-xs mb-3">
          <span className="text-yellow-400 font-bold">L5</span> = utolsó 5 hazai/vendég meccs ·{' '}
          <span className="text-gray-300 font-bold">Szezon</span> = teljes idényi átlag
        </p>
        <table className="w-full">
          <TableHeader />
          <tbody>
            <tr><td colSpan={3} className="py-1 text-yellow-400 text-xs font-bold pt-3">L5 — Utolsó 5 meccs</td></tr>
            <StatRow label="L5 átlag xG (támadás)"     hVal={steps.inputs.hazai.l5_avgXg}           aVal={steps.inputs.vendeg.l5_avgXg} />
            <StatRow label="L5 átlag gól"              hVal={steps.inputs.hazai.l5_avgGoals}         aVal={steps.inputs.vendeg.l5_avgGoals} />
            <StatRow label="L5 átlag xGA (védekezés)"  hVal={steps.inputs.hazai.l5_avgXgAgainst}     aVal={steps.inputs.vendeg.l5_avgXgAgainst} />
            <StatRow label="L5 átlag kapott gól"       hVal={steps.inputs.hazai.l5_avgGoalsAgainst}  aVal={steps.inputs.vendeg.l5_avgGoalsAgainst} />
            <tr><td colSpan={3} className="py-1 text-gray-400 text-xs font-bold pt-3">Szezon — Teljes idény</td></tr>
            <StatRow label="Szezon xG for avg"         hVal={steps.inputs.hazai.hXgAll}    aVal={steps.inputs.vendeg.aXgAll} />
            <StatRow label="Szezon gól avg"            hVal={steps.inputs.hazai.hAvgGAll}  aVal={steps.inputs.vendeg.aAvgGAll} />
            <StatRow label="Szezon xG against avg"     hVal={steps.inputs.hazai.hXgaAll}   aVal={steps.inputs.vendeg.aXgaAll} />
            <StatRow label="Szezon kapott gól avg"     hVal={steps.inputs.hazai.hAvgGaAll} aVal={steps.inputs.vendeg.aAvgGaAll} />
            <tr><td colSpan={3} className="py-1 text-gray-400 text-xs font-bold pt-3">Sarokrúgás</td></tr>
            <StatRow label="Sarok átlag"               hVal={steps.inputs.hazai.hCorn}   aVal={steps.inputs.vendeg.aCorn} />
            <StatRow label="Kapott sarok átlag"        hVal={steps.inputs.hazai.hCornAg} aVal={steps.inputs.vendeg.aCornAg} />
          </tbody>
        </table>
      </Section>

      <Section title="2. lépés — Hybrid súlyozás" icon="⚗️">
        <p className="text-gray-400 text-xs mb-3">xG súlya 70%, gól súlya 30% · L5 súlya 30%, szezon súlya 70%</p>
        <div className="space-y-3">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai támadóerő</p>
            <FormulaBox formula={`(L5_xG × 0.3 + Sz_xG × 0.7) × 0.7\n+ (L5_gól × 0.3 + Sz_gól × 0.7) × 0.3`} result={n(steps.hybrid.hVarhG)} />
          </div>
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai védekezés</p>
            <FormulaBox formula={`(L5_xGA × 0.3 + Sz_xGA × 0.7) × 0.7\n+ (L5_kap × 0.3 + Sz_kap × 0.7) × 0.3`} result={n(steps.hybrid.hVarhGa)} />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég támadóerő</p>
            <FormulaBox formula={`(L5_xG × 0.3 + Sz_xG × 0.7) × 0.7\n+ (L5_gól × 0.3 + Sz_gól × 0.7) × 0.3`} result={n(steps.hybrid.aVarhG)} />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég védekezés</p>
            <FormulaBox formula={`(L5_xGA × 0.3 + Sz_xGA × 0.7) × 0.7\n+ (L5_kap × 0.3 + Sz_kap × 0.7) × 0.3`} result={n(steps.hybrid.aVarhGa)} />
          </div>
        </div>
      </Section>

      <Section title="3. lépés — Sarokrúgás korrekció (+0.02/sarok)" icon="🚩">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Hazai korrigált támadás',   formula: `${n(steps.hybrid.hVarhG)} + (${steps.inputs.hazai.hCorn} × 0.02)`,   result: n(steps.hybrid.hHybrid),    color: 'text-green-400' },
            { label: 'Hazai korrigált védekezés', formula: `${n(steps.hybrid.hVarhGa)} + (${steps.inputs.hazai.hCornAg} × 0.02)`, result: n(steps.hybrid.hDefHybrid), color: 'text-green-400' },
            { label: 'Vendég korrigált támadás',  formula: `${n(steps.hybrid.aVarhG)} + (${steps.inputs.vendeg.aCorn} × 0.02)`,   result: n(steps.hybrid.aHybrid),    color: 'text-blue-400' },
            { label: 'Vendég korrigált védekezés',formula: `${n(steps.hybrid.aVarhGa)} + (${steps.inputs.vendeg.aCornAg} × 0.02)`,result: n(steps.hybrid.aDefHybrid), color: 'text-blue-400' },
          ].map(({ label, formula, result, color }) => (
            <div key={label}>
              <p className={`${color} text-xs mb-1 font-bold`}>{label}</p>
              <FormulaBox formula={formula} result={result} />
            </div>
          ))}
        </div>
      </Section>

      <Section title="4. lépés — Várható gólok (lambda)" icon="⚽">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai λ</p>
            <FormulaBox
              formula={`(hazai_tám + vendég_véd) / 2\n(${n(steps.hybrid.hHybrid)} + ${n(steps.hybrid.aDefHybrid)}) / 2`}
              result={n(steps.result.hazaiGol)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég λ</p>
            <FormulaBox
              formula={`(vendég_tám + hazai_véd) / 2\n(${n(steps.hybrid.aHybrid)} + ${n(steps.hybrid.hDefHybrid)}) / 2`}
              result={n(steps.result.vendegGol)}
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

      <Section title="5. lépés — Poisson végeredmény" icon="📊">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: '🏠 Hazai győzelem', val: data.probabilities?.goals?.hazaiP,   color: 'text-green-400' },
            { label: '🤝 Döntetlen',      val: data.probabilities?.goals?.dontetlen, color: 'text-yellow-400' },
            { label: '✈️ Vendég győzelem', val: data.probabilities?.goals?.vendegP,  color: 'text-blue-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
              <div className={`text-2xl font-bold ${color}`}>{val}%</div>
              <div className="text-gray-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { label: 'Várható hazai gól',       val: data.probabilities?.goals?.hazaiGol },
            { label: 'Várható vendég gól',      val: data.probabilities?.goals?.vendegGol },
            { label: 'Várható össz gól',        val: data.probabilities?.goals?.osszGol },
            { label: 'BTTS',                    val: `${data.probabilities?.goals?.btts}%` },
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
  )
}

function CornerDebug({ data, steps }: { data: any; steps: any }) {
  const n = (v: any, d = 3) => v == null ? '—' : Number(v).toFixed(d)
  return (
    <div className="space-y-4">
      <Section title="1. lépés — Nyers bemeneti adatok" icon="📥">
        <table className="w-full">
          <TableHeader />
          <tbody>
            <StatRow label="Sarokrúgás átlag"          hVal={steps.inputs.hazai.hCornAll}   aVal={steps.inputs.vendeg.aCornAll} />
            <StatRow label="Kapott sarok átlag"        hVal={steps.inputs.hazai.hCornAgAll} aVal={steps.inputs.vendeg.aCornAgAll} />
            <StatRow label="Lövés átlag"               hVal={steps.inputs.hazai.hShotsAll}  aVal={steps.inputs.vendeg.aShotsAll} />
            <StatRow label="Veszélyes támadás átlag"   hVal={steps.inputs.hazai.hDangAll}   aVal={steps.inputs.vendeg.aDangAll} />
          </tbody>
        </table>
      </Section>

      <Section title="2. lépés — Támadási és védekezési pontszám" icon="⚗️">
        <p className="text-gray-400 text-xs mb-3">
          Sarok (×0.15) + Lövés (×0.12) + Veszélyes támadás (×0.02) kombinációja
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai támadási pontszám</p>
            <FormulaBox
              formula={`sarok × 0.15 + lövés × 0.12 + vesz_tám × 0.02\n${steps.inputs.hazai.hCornAll} × 0.15 + ${steps.inputs.hazai.hShotsAll} × 0.12 + ${steps.inputs.hazai.hDangAll} × 0.02`}
              result={n(steps.intermediate.hAttackScore)}
            />
          </div>
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Vendég védekezési gyengeség (kapott sarok alapján)</p>
            <FormulaBox
              formula={`kap_sarok × 0.15 + lövés × 0.12 + vesz_tám × 0.02\n${steps.inputs.vendeg.aCornAgAll} × 0.15 + ${steps.inputs.vendeg.aShotsAll} × 0.12 + ${steps.inputs.vendeg.aDangAll} × 0.02`}
              result={n(steps.intermediate.aDefScore)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég támadási pontszám</p>
            <FormulaBox
              formula={`sarok × 0.15 + lövés × 0.12 + vesz_tám × 0.02\n${steps.inputs.vendeg.aCornAll} × 0.15 + ${steps.inputs.vendeg.aShotsAll} × 0.12 + ${steps.inputs.vendeg.aDangAll} × 0.02`}
              result={n(steps.intermediate.aAttackScore)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Hazai védekezési gyengeség</p>
            <FormulaBox
              formula={`kap_sarok × 0.15 + lövés × 0.12 + vesz_tám × 0.02\n${steps.inputs.hazai.hCornAgAll} × 0.15 + ${steps.inputs.hazai.hShotsAll} × 0.12 + ${steps.inputs.hazai.hDangAll} × 0.02`}
              result={n(steps.intermediate.hDefScore)}
            />
          </div>
        </div>
      </Section>

      <Section title="3. lépés — Várható szögletek (xC)" icon="🚩">
        <p className="text-gray-400 text-xs mb-3">
          60% súlyozással a komplex pontszám, 40% súlyozással az egyszerű átlag
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai xC</p>
            <FormulaBox
              formula={`0.6 × ((hAtk + aVéd) / 2) + 0.4 × hSimple\n0.6 × ((${n(steps.intermediate.hAttackScore)} + ${n(steps.intermediate.aDefScore)}) / 2)\n+ 0.4 × ${n(steps.intermediate.hSimple)}`}
              result={n(steps.result.hazaiXC)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég xC</p>
            <FormulaBox
              formula={`0.6 × ((aAtk + hVéd) / 2) + 0.4 × aSimple\n0.6 × ((${n(steps.intermediate.aAttackScore)} + ${n(steps.intermediate.hDefScore)}) / 2)\n+ 0.4 × ${n(steps.intermediate.aSimple)}`}
              result={n(steps.result.vendegXC)}
            />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-600 flex gap-6 justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400">{n(steps.result.hazaiXC, 2)}</div>
            <div className="text-gray-400 text-xs mt-1">hazai xC</div>
          </div>
          <div className="text-gray-600 self-center text-2xl">+</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">{n(steps.result.vendegXC, 2)}</div>
            <div className="text-gray-400 text-xs mt-1">vendég xC</div>
          </div>
          <div className="text-gray-600 self-center text-2xl">=</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{n(steps.result.osszXC, 2)}</div>
            <div className="text-gray-400 text-xs mt-1">össz xC</div>
          </div>
        </div>
      </Section>

      <Section title="4. lépés — Poisson végeredmény" icon="📊">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hazai xC',  val: data.probabilities?.corners?.hazaiXC,  color: 'text-green-400' },
            { label: 'Össz xC',   val: data.probabilities?.corners?.osszXC,   color: 'text-white' },
            { label: 'Vendég xC', val: data.probabilities?.corners?.vendegXC, color: 'text-blue-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
              <div className={`text-2xl font-bold ${color}`}>{val}</div>
              <div className="text-gray-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

function ShotDebug({ data, steps }: { data: any; steps: any }) {
  const n = (v: any, d = 3) => v == null ? '—' : Number(v).toFixed(d)
  return (
    <div className="space-y-4">
      <Section title="1. lépés — Nyers bemeneti adatok" icon="📥">
        <table className="w-full">
          <TableHeader />
          <tbody>
            <StatRow label="Lövés átlag"              hVal={steps.inputs.hazai.hShotsAll}   aVal={steps.inputs.vendeg.aShotsAll} />
            <StatRow label="Kapott lövés átlag"       hVal={steps.inputs.hazai.hShotsAgAll} aVal={steps.inputs.vendeg.aShotsAgAll} />
            <StatRow label="Labdabirtoklás %"         hVal={steps.inputs.hazai.hPossAll}    aVal={steps.inputs.vendeg.aPossAll} />
          </tbody>
        </table>
      </Section>

      <Section title="2. lépés — Alap lövésszám számítás" icon="⚗️">
        <p className="text-gray-400 text-xs mb-3">
          Átlagoljuk a saját lövéseket és az ellenfél által kapott lövéseket
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai alap lövésszám</p>
            <FormulaBox
              formula={`(saját_lövés + ellenfél_kapott_lövés) / 2\n(${steps.inputs.hazai.hShotsAll} + ${steps.inputs.hazai.hShotsAgAll}) / 2`}
              result={n(steps.intermediate.hBase)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég alap lövésszám</p>
            <FormulaBox
              formula={`(saját_lövés + ellenfél_kapott_lövés) / 2\n(${steps.inputs.vendeg.aShotsAll} + ${steps.inputs.vendeg.aShotsAgAll}) / 2`}
              result={n(steps.intermediate.aBase)}
            />
          </div>
        </div>
      </Section>

      <Section title="3. lépés — Labdabirtoklás korrekció" icon="⚙️">
        <p className="text-gray-400 text-xs mb-3">
          Az alap lövésszámot módosítja a labdabirtoklás aránya (50% = semleges)
        </p>
        <div className="space-y-3">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai korrigált lövésszám</p>
            <FormulaBox
              formula={`alap × (birtoklás / 50)\n${n(steps.intermediate.hBase)} × (${steps.inputs.hazai.hPossAll} / 50)`}
              result={n(steps.intermediate.hAdjust)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég korrigált lövésszám</p>
            <FormulaBox
              formula={`alap × (birtoklás / 50)\n${n(steps.intermediate.aBase)} × (${steps.inputs.vendeg.aPossAll} / 50)`}
              result={n(steps.intermediate.aAdjust)}
            />
          </div>
        </div>
      </Section>

      <Section title="4. lépés — Várható lövések (xShot)" icon="🎯">
        <p className="text-gray-400 text-xs mb-3">
          60% alap + 40% korrigált érték kombinációja
        </p>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <p className="text-green-400 text-xs mb-1 font-bold">Hazai xShot</p>
            <FormulaBox
              formula={`alap × 0.6 + korrigált × 0.4\n${n(steps.intermediate.hBase)} × 0.6 + ${n(steps.intermediate.hAdjust)} × 0.4`}
              result={n(steps.result.hazaiXShot)}
            />
          </div>
          <div>
            <p className="text-blue-400 text-xs mb-1 font-bold">Vendég xShot</p>
            <FormulaBox
              formula={`alap × 0.6 + korrigált × 0.4\n${n(steps.intermediate.aBase)} × 0.6 + ${n(steps.intermediate.aAdjust)} × 0.4`}
              result={n(steps.result.vendegXShot)}
            />
          </div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-600 flex gap-6 justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-400">{n(steps.result.hazaiXShot, 2)}</div>
            <div className="text-gray-400 text-xs mt-1">hazai xShot</div>
          </div>
          <div className="text-gray-600 self-center text-2xl">+</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-400">{n(steps.result.vendegXShot, 2)}</div>
            <div className="text-gray-400 text-xs mt-1">vendég xShot</div>
          </div>
          <div className="text-gray-600 self-center text-2xl">=</div>
          <div className="text-center">
            <div className="text-4xl font-bold text-white">{n(steps.result.osszXShot, 2)}</div>
            <div className="text-gray-400 text-xs mt-1">össz xShot</div>
          </div>
        </div>
      </Section>

      <Section title="5. lépés — Poisson végeredmény" icon="📊">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Hazai xShot',  val: data.probabilities?.shots?.hazaiXShot,  color: 'text-green-400' },
            { label: 'Össz xShot',   val: data.probabilities?.shots?.osszXShot,   color: 'text-white' },
            { label: 'Vendég xShot', val: data.probabilities?.shots?.vendegXShot, color: 'text-blue-400' },
          ].map(({ label, val, color }) => (
            <div key={label} className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
              <div className={`text-2xl font-bold ${color}`}>{val}</div>
              <div className="text-gray-400 text-xs mt-1">{label}</div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ============================================================
// FŐ OLDAL
// ============================================================

type Step = 'league' | 'teams' | 'result'

export default function DebugPage() {
  const [step, setStep]                   = useState<Step>('league')
  const [selectedLeague, setSelectedLeague] = useState<any>(null)
  const [teams, setTeams]                 = useState<any[]>([])
  const [homeTeam, setHomeTeam]           = useState<any>(null)
  const [awayTeam, setAwayTeam]           = useState<any>(null)
  const [data, setData]                   = useState<any>(null)
  const [goalSteps, setGoalSteps]         = useState<any>(null)
  const [cornerSteps, setCornerSteps]     = useState<any>(null)
  const [shotSteps, setShotSteps]         = useState<any>(null)
  const [activeTab, setActiveTab]         = useState('goals')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)

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

  const handleAnalyze = async () => {
    if (!homeTeam || !awayTeam || !selectedLeague) return
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(`/api/matchstats?home_team_id=${homeTeam.id}&away_team_id=${awayTeam.id}&season_id=${selectedLeague.season_id}`)
      const json = await res.json()
      if (json.error) throw new Error(json.error)
      setData(json)
      setGoalSteps(calcGoalSteps(json.home, json.away))
      setCornerSteps(calcCornerSteps(json.home, json.away))
      setShotSteps(calcShotSteps(json.home, json.away))
      setActiveTab('goals')
      setStep('result')
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

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
      <BackButton onClick={() => { setStep('teams'); setData(null) }} />
      <div className="mb-4">
        <h1 className="text-2xl font-bold">🔬 Számítási Debug</h1>
        <p className="text-gray-400 text-sm mt-1">{selectedLeague?.name}</p>
      </div>

      {/* CSAPAT FEJLÉC */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 flex items-center justify-center gap-4 text-lg font-bold mb-4">
        <span className="text-green-400">🏠 {data?.home?.team?.name}</span>
        <span className="text-gray-500">vs</span>
        <span className="text-blue-400">✈️ {data?.away?.team?.name}</span>
      </div>

      {/* FÜLEK */}
      <div className="flex gap-2 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
              activeTab === tab.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TARTALOM */}
      {data && (
        <>
          {activeTab === 'goals'   && goalSteps   && <GoalDebug   data={data} steps={goalSteps} />}
          {activeTab === 'corners' && cornerSteps && <CornerDebug data={data} steps={cornerSteps} />}
          {activeTab === 'shots'   && shotSteps   && <ShotDebug   data={data} steps={shotSteps} />}
        </>
      )}
    </main>
  )
}
