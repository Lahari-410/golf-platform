// API route: GET /api/charities
// Returns all active charities

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const admin = supabaseAdmin
    // @ts-ignore
const { data, error } = await admin
      .from('charities')
      .select('*')
      .eq('is_active', true)
      .order('is_featured', { ascending: false })

    if (error) throw error
    return NextResponse.json({ charities: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
const admin = supabaseAdmin
// @ts-ignore
const { data, error } = await admin
      .from('charities')
      .insert(body)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ charity: data }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
