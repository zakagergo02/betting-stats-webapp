export function calculateL5Stats(matches: any[], teamId: number, isHome: boolean) {
  const teamMatches = matches
    .filter(match => {
      if (isHome) return match.homeID === teamId && match.status === 'complete'
      return match.awayID === teamId && match.status === 'complete'
    })
    .sort((a, b) => b.date_unix - a.date_unix)
    .slice(0, 5)

  if (teamMatches.length === 0) return null

  const count = teamMatches.length
  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const goals = teamMatches.map(m => isHome ? m.homeGoalCount : m.awayGoalCount)
  const goalsAgainst = teamMatches.map(m => isHome ? m.awayGoalCount : m.homeGoalCount)
  const xg = teamMatches.map(m => isHome ? (m.team_a_xg || 0) : (m.team_b_xg || 0))
  const xgAgainst = teamMatches.map(m => isHome ? (m.team_b_xg || 0) : (m.team_a_xg || 0))
  const corners = teamMatches.map(m => isHome ? (m.team_a_corners || 0) : (m.team_b_corners || 0))
  const cornersAgainst = teamMatches.map(m => isHome ? (m.team_b_corners || 0) : (m.team_a_corners || 0))
  const shots = teamMatches.map(m => isHome ? (m.team_a_shots || 0) : (m.team_b_shots || 0))
  const shotsAgainst = teamMatches.map(m => isHome ? (m.team_b_shots || 0) : (m.team_a_shots || 0))
  const dangAttacks = teamMatches.map(m => isHome ? (m.team_a_dangerous_attacks || 0) : (m.team_b_dangerous_attacks || 0))
  const dangAttacksAgainst = teamMatches.map(m => isHome ? (m.team_b_dangerous_attacks || 0) : (m.team_a_dangerous_attacks || 0))
  const possession = teamMatches.map(m => isHome ? (m.team_a_possession || 0) : (m.team_b_possession || 0))
  const crosses = teamMatches.map(m => isHome ? (m.team_a_crosses || 0) : (m.team_b_crosses || 0))
  const crossesAgainst = teamMatches.map(m => isHome ? (m.team_b_crosses || 0) : (m.team_a_crosses || 0))
  const att3rd = teamMatches.map(m => isHome ? (m.team_a_att_3rd || 0) : (m.team_b_att_3rd || 0))

  return {
    matchesCount: count,
    avgGoals: avg(goals),
    avgGoalsAgainst: avg(goalsAgainst),
    avgXg: avg(xg),
    avgXgAgainst: avg(xgAgainst),
    avgCorners: avg(corners),
    avgCornersAgainst: avg(cornersAgainst),
    avgShots: avg(shots),
    avgShotsAgainst: avg(shotsAgainst),
    avgDangAttacks: avg(dangAttacks),
    avgDangAttacksAgainst: avg(dangAttacksAgainst),
    avgPossession: avg(possession),
    avgCrosses: avg(crosses),
    avgCrossesAgainst: avg(crossesAgainst),
    avgAtt3rd: avg(att3rd),
  }
}