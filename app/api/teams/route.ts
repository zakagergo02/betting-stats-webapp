import { NextResponse } from 'next/server'

const API_KEY = process.env.FOOTYSTATS_API_KEY

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seasonId = searchParams.get('season_id')

  if (!seasonId) {
    return NextResponse.json({ error: 'season_id szükséges' }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://api.football-data-api.com/league-teams?key=${API_KEY}&season_id=${seasonId}`
    )
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 })
  }
}