import { supabase, PlayerData } from './supabase'

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
    
    // Intentar insertar directamente (upsert)
    const { data, error } = await supabase
      .from('players')
      .upsert({
        name: playerData.name,
        avatar: playerData.avatar,
        stats: playerData.stats,
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
    console.log('💾 Loading player progress from Supabase for:', playerName)
    
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('name', playerName)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No saved progress found for player:', playerName)
        return null
      }
      console.error('❌ Error loading player progress:', error)
      return null
    }
    
    if (!player) {
      console.log('ℹ️ No player data found')
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

// Función para listar todos los personajes guardados
export async function listSavedPlayers(): Promise<PlayerSaveData[]> {
  try {
    console.log('💾 Listing saved players from Supabase')
    
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .order('last_saved', { ascending: false })
    
    if (error) {
      console.error('❌ Error listing players:', error)
      return []
    }
    
    if (!players || players.length === 0) {
      console.log('ℹ️ No saved players found')
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

