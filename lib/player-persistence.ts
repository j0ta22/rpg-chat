import { supabase, PlayerData } from './supabase'
import { getCurrentUser } from './auth'

export interface PlayerStats {
  level: number
  experience: number
  health: number
  maxHealth: number
  attack: number
  defense: number
  speed: number
}

export interface PlayerSaveData {
  name: string
  avatar: string
  stats: PlayerStats
}

// Función para guardar el progreso del jugador
export async function savePlayerProgress(playerData: PlayerSaveData): Promise<boolean> {
  try {
    console.log('💾 Saving player progress to Supabase:', playerData)
    console.log('📊 Stats being saved:', playerData.stats)
    
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('❌ No user logged in, cannot save player progress')
      return false
    }
    console.log('👤 User ID:', userId)
    
    // Intentar insertar directamente (upsert)
    const { data, error } = await supabase
      .from('players')
      .upsert({
        name: playerData.name,
        avatar: playerData.avatar,
        stats: playerData.stats,
        user_id: userId,
        last_saved: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'name'
      })
    
    if (error) {
      console.error('❌ Error saving player progress:', error)
      console.error('❌ Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return false
    }
    
    console.log('✅ Player saved successfully:', data)
    return true
  } catch (error) {
    console.error('❌ Error saving player progress:', error)
    return false
  }
}

// Función para cargar el progreso del jugador
export async function loadPlayerProgress(playerName: string): Promise<PlayerSaveData | null> {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('❌ No user logged in, cannot load player progress')
      return null
    }
    console.log('💾 Loading player progress from Supabase for:', playerName, 'user:', userId)
    
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('name', playerName)
      .eq('user_id', userId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No saved progress found for player:', playerName, 'for this user')
        return null
      }
      console.error('❌ Error loading player progress:', error)
      return null
    }
    
    if (!player) {
      console.log('ℹ️ No player data found for this user')
      return null
    }
    
    const playerData: PlayerSaveData = {
      name: player.name,
      avatar: player.avatar,
      stats: player.stats as PlayerStats
    }
    
    console.log('✅ Player progress loaded successfully:', playerData)
    return playerData
  } catch (error) {
    console.error('❌ Error loading player progress:', error)
    return null
  }
}

// Función para obtener el ID del usuario actual
function getCurrentUserId(): string | null {
  const user = getCurrentUser()
  if (!user) {
    console.log('❌ No user logged in')
    return null
  }
  console.log('👤 Current user:', user.username)
  return user.id
}

// Función para listar personajes guardados del usuario actual
export async function listSavedPlayers(): Promise<PlayerSaveData[]> {
  try {
    const userId = getCurrentUserId()
    if (!userId) {
      console.log('❌ No user logged in, cannot list players')
      return []
    }
    console.log('💾 Listing saved players from Supabase for user:', userId)
    
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .order('last_saved', { ascending: false })
    
    if (error) {
      console.error('❌ Error listing players:', error)
      return []
    }
    
    if (!players || players.length === 0) {
      console.log('ℹ️ No saved players found for this user')
      return []
    }
    
    const playerData: PlayerSaveData[] = players.map(player => ({
      name: player.name,
      avatar: player.avatar,
      stats: player.stats as PlayerStats
    }))
    
    console.log('✅ Players loaded successfully:', playerData.length, 'players')
    return playerData
  } catch (error) {
    console.error('❌ Error listing players:', error)
    return []
  }
}

