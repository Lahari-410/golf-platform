// API route: POST /api/admin
// Admin actions: verify winner, mark paid, toggle charity

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const { action, id, data } = await req.json()

    switch (action) {
      case 'verify_winner':
       await supabaseAdmin
          .from('winners')
          .update({ verification_status: data.status })
          .eq('id', id)
        break

      case 'mark_paid':
        await supabaseAdmin
          .from('winners')
          .update({ payment_status: 'paid' })
          .eq('id', id)
        break

      case 'toggle_charity':
        await supabaseAdmin
          .from('charities')
          .update({ is_active: data.is_active })
          .eq('id', id)
        break

      case 'feature_charity':
        await supabaseAdmin
          .from('charities')
          .update({ is_featured: data.is_featured })
          .eq('id', id)
        break

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
