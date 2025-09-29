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
    
    const sessionId = getSessionId()
    console.log('🆔 Session ID:', sessionId)
    
    // Intentar insertar directamente (upsert)
    const { data, error } = await supabase
      .from('players')
      .upsert({
        name: playerData.name,
        avatar: playerData.avatar,
        stats: playerData.stats,
        session_id: sessionId,
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
    const sessionId = getSessionId()
    console.log('💾 Loading player progress from Supabase for:', playerName, 'session:', sessionId)
    
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('name', playerName)
      .eq('session_id', sessionId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log('ℹ️ No saved progress found for player:', playerName, 'in this session')
        return null
      }
      console.error('❌ Error loading player progress:', error)
      return null
    }
    
    if (!player) {
      console.log('ℹ️ No player data found for this session')
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

// Función para obtener o crear un ID de sesión único
function getSessionId(): string {
  let sessionId = localStorage.getItem('rpg-game-session-id')
  if (!sessionId) {
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('rpg-game-session-id', sessionId)
    console.log('🆔 New session created:', sessionId)
  } else {
    console.log('🆔 Existing session:', sessionId)
  }
  return sessionId
}

// Función para listar personajes guardados del usuario actual
export async function listSavedPlayers(): Promise<PlayerSaveData[]> {
  try {
    const sessionId = getSessionId()
    console.log('💾 Listing saved players from Supabase for session:', sessionId)
    
    const { data: players, error } = await supabase
      .from('players')
      .select('*')
      .eq('session_id', sessionId)
      .order('last_saved', { ascending: false })
    
    if (error) {
      console.error('❌ Error listing players:', error)
      return []
    }
    
    if (!players || players.length === 0) {
      console.log('ℹ️ No saved players found for this session')
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

