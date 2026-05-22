import { NextResponse } from 'next/server'
import { calculateL5Stats } from '@/lib/calculateStats'

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
    // Lekérjük az összes meccset a szezonban
    const matchesRes = await fetch(
      `https://api.football-data-api.com/league-matches?key=${API_KEY}&season_id=${seasonId}`
    )
    const matchesData = await matchesRes.json()
    const matches = matchesData.data || []

    // Lekérjük a csapat statisztikákat
    const teamsRes = await fetch(
      `https://api.football-data-api.com/league-teams?key=${API_KEY}&season_id=${seasonId}`
    )
    const teamsData = await teamsRes.json()
    const teams = teamsData.data || []

    const homeTeam = teams.find((t: any) => t.id === parseInt(homeTeamId))
    const awayTeam = teams.find((t: any) => t.id === parseInt(awayTeamId))

    // Számoljuk ki az L5 statokat
    const homeL5 = calculateL5Stats(matches, parseInt(homeTeamId), true)
    const awayL5 = calculateL5Stats(matches, parseInt(awayTeamId), false)

    return NextResponse.json({
      success: true,
      home: {
        team: homeTeam,
        l5Stats: homeL5,
      },
      away: {
        team: awayTeam,
        l5Stats: awayL5,
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 })
  }
}