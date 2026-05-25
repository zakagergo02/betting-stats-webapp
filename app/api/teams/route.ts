import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const seasonId = searchParams.get('season_id')

  if (!seasonId) {
    return NextResponse.json({ error: 'season_id szükséges' }, { status: 400 })
  }

  try {
    const { data: teams, error } = await supabase
      .from('teams')
      .select('id, name, image, season_id')
      .eq('season_id', parseInt(seasonId))
      .order('name')

    if (error) throw error

    return NextResponse.json({ data: teams })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Hiba történt' }, { status: 500 })
  }
}