// API route: GET /api/draws — returns published draws
// API route: POST /api/draws — admin creates/publishes a draw

import { NextRequest, NextResponse } from 'next/server'
import { generateRandomDraw, generateAlgorithmicDraw, calculatePrizePools } from '@/lib/drawEngine'
import { Score } from '@/types'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET() {
  try {
    const admin = supabaseAdmin
const { data, error } = await admin
      .from('draws')
      .select('*')
      .eq('status', 'published')
      .order('draw_date', { ascending: false })

    if (error) throw error
    return NextResponse.json({ draws: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { draw_type, simulate_only } = await req.json()

    // Generate winning numbers
    let winningNumbers: number[]
    if (draw_type === 'algorithmic') {
      const { data: allScores } = await supabaseAdmin!.from('scores').select('*')
      winningNumbers = generateAlgorithmicDraw((allScores || []) as Score[])
    } else {
      winningNumbers = generateRandomDraw()
    }

    // If simulate only, just return the numbers without saving
    if (simulate_only) {
      return NextResponse.json({ winning_numbers: winningNumbers, simulated: true })
    }

    // Calculate prize pool
    const { data: activeUsers } = await supabaseAdmin
      .from('profiles')
      .select('subscription_plan')
      .eq('subscription_status', 'active')

    const monthly = (activeUsers || []).filter(u => u.subscription_plan === 'monthly').length
    const yearly = (activeUsers || []).filter(u => u.subscription_plan === 'yearly').length
    const totalPool = (monthly * 10 * 0.5) + (yearly * (100 / 12) * 0.5)
    const pools = calculatePrizePools(totalPool)

    // Create draw
    const { data: draw, error } = await supabaseAdmin
      .from('draws')
      .insert({
        draw_date: new Date().toISOString().split('T')[0],
        status: 'published',
        draw_type,
        winning_numbers: winningNumbers,
        jackpot_amount: pools.jackpot,
        four_match_amount: pools.fourMatch,
        three_match_amount: pools.threeMatch,
        total_pool: totalPool,
      })
      .select()
      .single()

    if (error) throw error

    // Match all subscribers' scores
    const { data: allScores } = await supabaseAdmin
      .from('scores')
      .select('user_id, score')

    const userScoreMap: Record<string, number[]> = {}
    ;(allScores || []).forEach((s: any) => {
      if (!userScoreMap[s.user_id]) userScoreMap[s.user_id] = []
      userScoreMap[s.user_id].push(s.score)
    })

    for (const [userId, userScores] of Object.entries(userScoreMap)) {
      const matches = userScores.filter(s => winningNumbers.includes(s)).length
      if (matches >= 3) {
        const matchType = matches === 5 ? '5-match' : matches === 4 ? '4-match' : '3-match'
        const prize = matches === 5 ? pools.jackpot : matches === 4 ? pools.fourMatch : pools.threeMatch
        await supabaseAdmin!.from('winners').insert({
          draw_id: draw.id,
          user_id: userId,
          match_type: matchType,
          prize_amount: prize,
        })
      }
    }

    return NextResponse.json({ draw, winning_numbers: winningNumbers }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
