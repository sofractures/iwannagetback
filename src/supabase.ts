import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fmvglofbpsodvpqpolqk.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdmdsb2ZicHNvZHZwcXBvbHFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MjAyMTMsImV4cCI6MjA3NDE5NjIxM30.4Ss88X9TWp9GdllKXwaSFr-N1EZKvtBUQRxGRnGX5AU'

export const supabase = createClient(supabaseUrl, supabaseKey)

export interface LeaderboardEntry {
  id: number
  initials: string
  email: string
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
      console.error('Error submitting score:', error)
      return false
    }

    console.log('Score submitted successfully!')
    return true
  } catch (error) {
    console.error('Error submitting score:', error)
    return false
  }
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching leaderboard:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }
}