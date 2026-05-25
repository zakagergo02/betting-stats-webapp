export function calculateL5Stats(matches: any[], teamId: number, isHome: boolean) {
  const teamMatches = matches
    .filter(match => {
      if (isHome) return match.homeID === teamId && match.status === 'complete'
      return match.awayID === teamId && match.status === 'complete'
    })
    .sort((a, b) => b.date_unix - a.date_unix)
    .slice(0, 5)

  if (teamMatches.length === 0) return null

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length

  const goals = teamMatches.map(m => isHome ? m.homeGoalCount : m.awayGoalCount)
  const goalsAgainst = teamMatches.map(m => isHome ? m.awayGoalCount : m.homeGoalCount)
  const xg = teamMatches.map(m => isHome ? (m.team_a_xg || 0) : (m.team_b_xg || 0))
  const xgAgainst = teamMatches.map(m => isHome ? (m.team_b_xg || 0) : (m.team_a_xg || 0))

  return {
    matchesCount: teamMatches.length,
    avgGoals: avg(goals),
    avgGoalsAgainst: avg(goalsAgainst),
    avgXg: avg(xg),
    avgXgAgainst: avg(xgAgainst),
  }
}