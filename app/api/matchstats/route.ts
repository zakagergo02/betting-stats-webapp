import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { calculateL5Stats } from '@/lib/calculateStats'
import { calculateGoalProbabilities, calculateCornerProbabilities, calculateShotProbabilities } from '@/lib/calculateProbabilities'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const homeTeamId = searchParams.get('home_team_id')
  const awayTeamId = searchParams.get('away_team_id')
  const seasonId = searchParams.get('season_id')

  if (!homeTeamId || !awayTeamId || !seasonId) {
    return NextResponse.json({ error: 'home_team_id, away_team_id és season_id szükséges' }, { status: 400 })
  }

  try {
    // Meccsek lekérése Supabase-ből
    const { data: matchesData } = await supabase
      .from('matches')
      .select('stats')
      .eq('season_id', parseInt(seasonId))

    const matches = (matchesData || []).map((m: any) => m.stats)

    // Csapatok lekérése Supabase-ből
    const { data: homeTeamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', parseInt(homeTeamId))
      .eq('season_id', parseInt(seasonId))
      .single()

    const { data: awayTeamData } = await supabase
      .from('teams')
      .select('*')
      .eq('id', parseInt(awayTeamId))
      .eq('season_id', parseInt(seasonId))
      .single()

    if (!homeTeamData || !awayTeamData) {
      return NextResponse.json({ error: 'Csapat nem található' }, { status: 404 })
    }

    const homeL5 = calculateL5Stats(matches, parseInt(homeTeamId), true)
    const awayL5 = calculateL5Stats(matches, parseInt(awayTeamId), false)

    const homeData = { team: homeTeamData, l5Stats: homeL5 }
    const awayData = { team: awayTeamData, l5Stats: awayL5 }

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