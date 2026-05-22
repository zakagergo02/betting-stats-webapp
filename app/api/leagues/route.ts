import { NextResponse } from 'next/server'

const API_KEY = process.env.FOOTYSTATS_API_KEY

export async function GET() {
  try {
    const response = await fetch(
      `https://api.football-data-api.com/league-list?key=${API_KEY}`
    )
    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 })
  }
}