import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const API_KEY = process.env.FOOTYSTATS_API_KEY
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LEAGUES = [
  { name: 'Premier League', season_id: 15050 },
  { name: 'La Liga', season_id: 14956 },
  { name: 'Bundesliga', season_id: 14968 },
  { name: 'Serie A', season_id: 15068 },
  { name: 'Ligue 1', season_id: 14932 },
  { name: 'Champions League', season_id: 14924 },
]

export async function GET() {
  try {
    const results = []

    for (const league of LEAGUES) {
      // Csapatok lekérése
      const teamsRes = await fetch(
        `https://api.football-data-api.com/league-teams?key=${API_KEY}&season_id=${league.season_id}&include=stats`
      )
      const teamsData = await teamsRes.json()
      const teams = teamsData.data || []

      // Csapatok mentése Supabase-be
      for (const team of teams) {
        await supabase.from('teams').upsert({
          id: team.id,
          name: team.cleanName || team.name,
          country: team.country,
          image: team.image,
          league_id: team.competition_id,
          season_id: league.season_id,
          stats: team.stats,
        }, { onConflict: 'id,season_id' })
      }

      // Meccsek lekérése
      const matchesRes = await fetch(
        `https://api.football-data-api.com/league-matches?key=${API_KEY}&season_id=${league.season_id}&max_per_page=500`
      )
      const matchesData = await matchesRes.json()
      const matches = matchesData.data || []

      // Meccsek mentése Supabase-be
      for (const match of matches) {
        await supabase.from('matches').upsert({
          id: match.id,
          home_team_id: match.homeID,
          away_team_id: match.awayID,
          league_id: match.competition_id,
          season_id: league.season_id,
          status: match.status,
          game_week: match.game_week,
          stats: match,
        }, { onConflict: 'id,season_id' })
      }

      results.push({ league: league.name, teams: teams.length, matches: matches.length })
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 })
  }
}