export function calculateL5Stats(matches: any[], teamId: number, isHome: boolean) {
  // Szűrjük ki a csapat hazai vagy vendég meccseit
  const teamMatches = matches
    .filter(match => {
      if (isHome) return match.homeID === teamId && match.status === 'complete'
      return match.awayID === teamId && match.status === 'complete'
    })
    .sort((a, b) => b.date_unix - a.date_unix) // Legújabb először
    .slice(0, 5) // Utolsó 5

  if (teamMatches.length === 0) return null

  const count = teamMatches.length

  // Gólok
  const goals = teamMatches.map(m => isHome ? m.homeGoalCount : m.awayGoalCount)
  const goalsAgainst = teamMatches.map(m => isHome ? m.awayGoalCount : m.homeGoalCount)

  // xG
  const xg = teamMatches.map(m => isHome ? (m.team_a_xg || 0) : (m.team_b_xg || 0))
  const xgAgainst = teamMatches.map(m => isHome ? (m.team_b_xg || 0) : (m.team_a_xg || 0))

  // Cornerek
  const corners = teamMatches.map(m => isHome ? (m.team_a_corners || 0) : (m.team_b_corners || 0))
  const cornersAgainst = teamMatches.map(m => isHome ? (m.team_b_corners || 0) : (m.team_a_corners || 0))

  // Shots
  const shots = teamMatches.map(m => isHome ? (m.team_a_shots || 0) : (m.team_b_shots || 0))
  const shotsAgainst = teamMatches.map(m => isHome ? (m.team_b_shots || 0) : (m.team_a_shots || 0))

  // Dangerous attacks
  const dangAttacks = teamMatches.map(m => isHome ? (m.team_a_dangerous_attacks || 0) : (m.team_b_dangerous_attacks || 0))
  const dangAttacksAgainst = teamMatches.map(m => isHome ? (m.team_b_dangerous_attacks || 0) : (m.team_a_dangerous_attacks || 0))

  // Possession
  const possession = teamMatches.map(m => isHome ? (m.team_a_possession || 0) : (m.team_b_possession || 0))

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

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
  }
}