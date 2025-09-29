import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔧 Supabase Config:', { 
  url: supabaseUrl ? 'Set' : 'Missing', 
  key: supabaseAnonKey ? 'Set' : 'Missing' 
})

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface PlayerData {
  id: string
  name: string
  avatar: string
  stats: {
    level: number
    experience: number
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }
  last_saved: string
  created_at: string
  updated_at: string
}
