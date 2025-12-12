import { createClient } from '@supabase/supabase-js'

// Supabase configuration - use environment variables in production
// For local development, create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables not set. Please create a .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export interface LeaderboardEntry {
  id: number
  initials: string
  email?: string  // Optional - not returned by getLeaderboard() for privacy
  score: number
  created_at: string
}

export async function submitScore(initials: string, email: string, score: number): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('leaderboard')
      .insert([
        {
          initials: initials.toUpperCase(),
          email: email,
          score: score
        }
      ])

    if (error) {
      return false
    }

    return true
  } catch (error) {
    return false
  }
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('id, initials, score, created_at')
      .order('score', { ascending: false })
      .limit(limit)

    if (error) {
      return []
    }

    return data || []
  } catch (error) {
    return []
  }
}