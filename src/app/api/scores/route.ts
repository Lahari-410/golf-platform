// API route: GET/POST /api/scores
// GET  — returns current user's scores
// POST — adds a new score (max 5, deletes oldest if needed)

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(5)

    if (error) throw error
    return NextResponse.json({ scores: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id')
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { score, played_at } = await req.json()

    if (!score || score < 1 || score > 45) {
      return NextResponse.json({ error: 'Score must be between 1 and 45' }, { status: 400 })
    }

    // Get existing scores
    const { data: existing } = await supabaseAdmin
      .from('scores')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })

    // If 5 scores already exist, delete the oldest
    if (existing && existing.length >= 5) {
      const oldest = existing[existing.length - 1]
      await supabaseAdmin.from('scores').delete().eq('id', oldest.id)
    }

    // Insert new score
    const { data, error } = await supabaseAdmin
      .from('scores')
      .insert({ user_id: userId, score, played_at })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ score: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
