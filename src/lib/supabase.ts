// lib/supabase.ts
// Two Supabase clients:
//   1. supabase — for use in browser (client components)
//   2. supabaseAdmin — for use in API routes (server side, bypasses RLS)

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client — respects Row Level Security
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server/admin client — bypasses RLS (use only in API routes)
export const supabaseAdmin =
  typeof window === "undefined"
    ? createClient(
        supabaseUrl,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )
    : null;
