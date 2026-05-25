function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let result = Math.exp(-lambda)
  for (let i = 1; i <= k; i++) result *= lambda / i
  return result
}

function poissonCDF(k: number, lambda: number): number {
  if (k < 0) return 0
  let sum = 0
  for (let i = 0; i <= k; i++) sum += poissonPMF(i, lambda)
  return sum
}

export function calculateGoalProbabilities(home: any, away: any) {
  const { l5Stats: h } = home
  const { l5Stats: a } = away
  const hs = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hXgAll = hs.xg_for_avg_home || h.avgXg
  const hAvgGAll = hs.seasonScoredAVG_home || h.avgGoals
  const hXgaAll = hs.xg_against_avg_home || h.avgXgAgainst
  const hAvgGaAll = hs.seasonConcededAVG_home || h.avgGoalsAgainst

  const aXgAll = as_.xg_for_avg_away || a.avgXg
  const aAvgGAll = as_.seasonScoredAVG_away || a.avgGoals
  const aXgaAll = as_.xg_against_avg_away || a.avgXgAgainst
  const aAvgGaAll = as_.seasonConcededAVG_away || a.avgGoalsAgainst

  const hVarhG = ((h.avgXg * 0.3 + hXgAll * 0.7) * 0.7) + ((h.avgGoals * 0.3 + hAvgGAll * 0.7) * 0.3)
  const hVarhGa = ((h.avgXgAgainst * 0.3 + hXgaAll * 0.7) * 0.7) + ((h.avgGoalsAgainst * 0.3 + hAvgGaAll * 0.7) * 0.3)
  const aVarhG = ((a.avgXg * 0.3 + aXgAll * 0.7) * 0.7) + ((a.avgGoals * 0.3 + aAvgGAll * 0.7) * 0.3)
  const aVarhGa = ((a.avgXgAgainst * 0.3 + aXgaAll * 0.7) * 0.7) + ((a.avgGoalsAgainst * 0.3 + aAvgGaAll * 0.7) * 0.3)

  const hCorn = hs.cornersAVG_home || 5
const hCornAg = hs.cornersAgainstAVG_home || 3
const aCorn = as_.cornersAVG_away || 5
const aCornAg = as_.cornersAgainstAVG_away || 3

const hHybridTamadas = hVarhG + (hCorn * 0.02)
const hHybridVedekezes = hVarhGa + (hCornAg * 0.02)
const aHybridTamadas = aVarhG + (aCorn * 0.02)
const aHybridVedekezes = aVarhGa + (aCornAg * 0.02)

  const hazaiGol = (hHybridTamadas + aHybridVedekezes) / 2
  const vendegGol = (aHybridTamadas + hHybridVedekezes) / 2
  const osszGol = hazaiGol + vendegGol

  let hazaiP = 0, dontetlen = 0, vendegP = 0
  for (let i = 0; i <= 12; i++) {
    hazaiP += poissonPMF(i, hazaiGol) * poissonCDF(i - 1, vendegGol)
    dontetlen += poissonPMF(i, hazaiGol) * poissonPMF(i, vendegGol)
    vendegP += poissonPMF(i, vendegGol) * poissonCDF(i - 1, hazaiGol)
  }

  const overUnder = []
  for (let threshold = 0.5; threshold <= 5.5; threshold += 1) {
    const floor = Math.floor(threshold)
    overUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, osszGol)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, osszGol).toFixed(4))
    })
  }

  const hazai0 = poissonPMF(0, hazaiGol)
  const vendeg0 = poissonPMF(0, vendegGol)
  const btts = (1 - hazai0) * (1 - vendeg0)

  const eredmenyek = []
  for (let hi = 0; hi <= 5; hi++) {
    for (let ai = 0; ai <= 5; ai++) {
      eredmenyek.push({
        hazai: hi, vendeg: ai,
        prob: parseFloat((poissonPMF(hi, hazaiGol) * poissonPMF(ai, vendegGol) * 100).toFixed(2))
      })
    }
  }
  eredmenyek.sort((a, b) => b.prob - a.prob)

  return {
    hazaiGol: hazaiGol.toFixed(2),
    vendegGol: vendegGol.toFixed(2),
    osszGol: osszGol.toFixed(2),
    hazaiP: (hazaiP * 100).toFixed(1),
    dontetlen: (dontetlen * 100).toFixed(1),
    vendegP: (vendegP * 100).toFixed(1),
    btts: (btts * 100).toFixed(1),
    hazai0gol: (hazai0 * 100).toFixed(1),
    vendeg0gol: (vendeg0 * 100).toFixed(1),
    overUnder,
    eredmenyek: eredmenyek.slice(0, 12)
  }
}

export function calculateCornerProbabilities(home: any, away: any) {
  const hs = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hCornAll = hs.cornersAVG_home || 5
  const hCornAgAll = hs.cornersAgainstAVG_home || 3
  const hShotsAll = hs.shotsAVG_home || 12
  const hDangAll = hs.dangerous_attacks_avg_home || 50

  const aCornAll = as_.cornersAVG_away || 5
  const aCornAgAll = as_.cornersAgainstAVG_away || 3
  const aShotsAll = as_.shotsAVG_away || 12
  const aDangAll = as_.dangerous_attacks_avg_away || 50

  const hazaiXC = 0.6 * (
    ((hCornAll * 0.15 + hShotsAll * 0.12 + hDangAll * 0.02) +
     (aCornAgAll * 0.15 + as_.shotsAVG_home || aShotsAll * 0.12 + as_.dangerous_attacks_avg_home || aDangAll * 0.02)) / 2
  ) + 0.4 * ((hCornAll + aCornAgAll) / 2)

  const vendegXC = 0.6 * (
    ((aCornAll * 0.15 + aShotsAll * 0.12 + aDangAll * 0.02) +
     (hCornAgAll * 0.15 + hShotsAll * 0.12 + hDangAll * 0.02)) / 2
  ) + 0.4 * ((aCornAll + hCornAgAll) / 2)

  const osszXC = hazaiXC + vendegXC

  const overUnder = []
  for (let threshold = 4.5; threshold <= 12.5; threshold += 1) {
    const floor = Math.floor(threshold)
    overUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, osszXC)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, osszXC).toFixed(4))
    })
  }

  const homeOverUnder = []
  for (let threshold = 2.5; threshold <= 9.5; threshold += 1) {
    const floor = Math.floor(threshold)
    homeOverUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, hazaiXC)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, hazaiXC).toFixed(4))
    })
  }

  const awayOverUnder = []
  for (let threshold = 2.5; threshold <= 9.5; threshold += 1) {
    const floor = Math.floor(threshold)
    awayOverUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, vendegXC)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, vendegXC).toFixed(4))
    })
  }

  return {
    hazaiXC: hazaiXC.toFixed(2),
    vendegXC: vendegXC.toFixed(2),
    osszXC: osszXC.toFixed(2),
    overUnder,
    homeOverUnder,
    awayOverUnder
  }
}

export function calculateShotProbabilities(home: any, away: any) {
  const hs = home.team.stats || {}
  const as_ = away.team.stats || {}

  const hShotsAll = hs.shotsAVG_home || 12
  const hShotsAgAll = as_.shotsAVG_away || 12
  const hPossAll = hs.possessionAVG_home || 50
  const hAtt3rdAll = 29

  const aShotsAll = as_.shotsAVG_away || 12
  const aShotsAgAll = hs.shotsAVG_home || 12
  const aPossAll = as_.possessionAVG_away || 50
  const aAtt3rdAll = 28

  const alfa = 1

  const hazaiXShot = (((hShotsAll + aShotsAgAll) / 2) * 0.6) +
    (((hShotsAll + aShotsAgAll) / 2) * (hPossAll / 50) * (aAtt3rdAll / 28) * 0.4) * alfa

  const vendegXShot = (((aShotsAll + hShotsAgAll) / 2) * 0.6) +
    (((aShotsAll + hShotsAgAll) / 2) * (aPossAll / 50) * (hAtt3rdAll / 28) * 0.4) * alfa

  const osszXShot = hazaiXShot + vendegXShot

  const overUnder = []
  for (let threshold = 17.5; threshold <= 30.5; threshold += 1) {
    const floor = Math.floor(threshold)
    overUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, osszXShot)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, osszXShot).toFixed(4))
    })
  }

  const homeOverUnder = []
  for (let threshold = 6.5; threshold <= 19.5; threshold += 1) {
    const floor = Math.floor(threshold)
    homeOverUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, hazaiXShot)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, hazaiXShot).toFixed(4))
    })
  }

  const awayOverUnder = []
  for (let threshold = 6.5; threshold <= 19.5; threshold += 1) {
    const floor = Math.floor(threshold)
    awayOverUnder.push({
      label: threshold.toFixed(1),
      over: parseFloat((1 - poissonCDF(floor, vendegXShot)).toFixed(4)),
      under: parseFloat(poissonCDF(floor, vendegXShot).toFixed(4))
    })
  }

  return {
    hazaiXShot: hazaiXShot.toFixed(2),
    vendegXShot: vendegXShot.toFixed(2),
    osszXShot: osszXShot.toFixed(2),
    overUnder,
    homeOverUnder,
    awayOverUnder
  }
}