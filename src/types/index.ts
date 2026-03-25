// All TypeScript types matching our Supabase tables

export interface Profile {
  id: string
  email: string
  full_name: string
  role: 'subscriber' | 'admin'
  subscription_status: 'active' | 'inactive' | 'cancelled'
  subscription_plan: 'monthly' | 'yearly' | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  charity_id: string | null
  charity_percentage: number
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  score: number        // 1-45 Stableford
  played_at: string    // date string
  created_at: string
}

export interface Charity {
  id: string
  name: string
  description: string
  image_url: string | null
  website: string | null
  is_featured: boolean
  is_active: boolean
  total_received: number
  created_at: string
}

export interface Draw {
  id: string
  draw_date: string
  status: 'pending' | 'simulated' | 'published'
  draw_type: 'random' | 'algorithmic'
  winning_numbers: number[]
  jackpot_amount: number
  four_match_amount: number
  three_match_amount: number
  jackpot_rolled_over: boolean
  total_pool: number
  created_at: string
}

export interface Winner {
  id: string
  draw_id: string
  user_id: string
  match_type: '5-match' | '4-match' | '3-match'
  prize_amount: number
  proof_url: string | null
  verification_status: 'pending' | 'approved' | 'rejected'
  payment_status: 'pending' | 'paid'
  created_at: string
}

export interface CharityContribution {
  id: string
  user_id: string
  charity_id: string
  amount: number
  contribution_date: string
  created_at: string
}
