import { NextResponse } from 'next/server'
import { calculateL5Stats } from '@/lib/calculateStats'
import { calculateGoalProbabilities, calculateCornerProbabilities, calculateShotProbabilities } from '@/lib/calculateProbabilities'

const API_KEY = process.env.FOOTYSTATS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const homeTeamId = searchParams.get('home_team_id')
  const awayTeamId = searchParams.get('away_team_id')
  const seasonId = searchParams.get('season_id')

  if (!homeTeamId || !awayTeamId || !seasonId) {
    return NextResponse.json({ error: 'home_team_id, away_team_id és season_id szükséges' }, { status: 400 })
  }

  try {
    const [matchesRes, teamsRes] = await Promise.all([
      fetch(`https://api.football-data-api.com/league-matches?key=${API_KEY}&season_id=${seasonId}&max_per_page=500`),
      fetch(`https://api.football-data-api.com/league-teams?key=${API_KEY}&season_id=${seasonId}&include=stats`)
    ])

    const matchesData = await matchesRes.json()
    const teamsData = await teamsRes.json()

    const matches = matchesData.data || []
    const teams = teamsData.data || []

    const homeTeam = teams.find((t: any) => t.id === parseInt(homeTeamId))
    const awayTeam = teams.find((t: any) => t.id === parseInt(awayTeamId))

    const homeL5 = calculateL5Stats(matches, parseInt(homeTeamId), true)
    const awayL5 = calculateL5Stats(matches, parseInt(awayTeamId), false)

    const homeData = { team: homeTeam, l5Stats: homeL5 }
    const awayData = { team: awayTeam, l5Stats: awayL5 }

    const goalProbs = calculateGoalProbabilities(homeData, awayData)
    const cornerProbs = calculateCornerProbabilities(homeData, awayData)
    const shotProbs = calculateShotProbabilities(homeData, awayData)

    return NextResponse.json({
      success: true,
      home: homeData,
      away: awayData,
      probabilities: {
        goals: goalProbs,
        corners: cornerProbs,
        shots: shotProbs
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 })
  }
}