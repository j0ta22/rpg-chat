import { supabase } from './supabase'

export interface User {
  id: string
  username: string
  created_at: string
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

// Función para registrar un nuevo usuario
export async function registerUser(username: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 Registering user:', username)
    
    // Verificar si el usuario ya existe
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()
    
    if (existingUser) {
      return {
        success: false,
        error: 'El usuario ya existe'
      }
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError)
      return {
        success: false,
        error: 'Error verificando usuario existente'
      }
    }
    
    // Crear nuevo usuario
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: username,
        password_hash: password, // En producción, deberías hashear la contraseña
        created_at: new Date().toISOString()
      })
      .select('id, username, created_at')
      .single()
    
    if (createError) {
      console.error('❌ Error creating user:', createError)
      return {
        success: false,
        error: 'Error creando usuario'
      }
    }
    
    console.log('✅ User registered successfully:', newUser)
    return {
      success: true,
      user: newUser
    }
  } catch (error) {
    console.error('❌ Error registering user:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

// Función para iniciar sesión
export async function loginUser(username: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 Logging in user:', username)
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password_hash, created_at')
      .eq('username', username)
      .eq('password_hash', password) // En producción, deberías verificar el hash
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Usuario o contraseña incorrectos'
        }
      }
      console.error('❌ Error logging in:', error)
      return {
        success: false,
        error: 'Error iniciando sesión'
      }
    }
    
    if (!user) {
      return {
        success: false,
        error: 'Usuario o contraseña incorrectos'
      }
    }
    
    console.log('✅ User logged in successfully:', user)
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        created_at: user.created_at
      }
    }
  } catch (error) {
    console.error('❌ Error logging in:', error)
    return {
      success: false,
      error: 'Error interno del servidor'
    }
  }
}

// Función para obtener el usuario actual desde localStorage
export function getCurrentUser(): User | null {
  try {
    const userStr = localStorage.getItem('rpg-game-user')
    if (userStr) {
      return JSON.parse(userStr)
    }
    return null
  } catch (error) {
    console.error('❌ Error getting current user:', error)
    return null
  }
}

// Función para guardar el usuario en localStorage
export function setCurrentUser(user: User): void {
  localStorage.setItem('rpg-game-user', JSON.stringify(user))
}

// Función para cerrar sesión
export function logoutUser(): void {
  localStorage.removeItem('rpg-game-user')
  localStorage.removeItem('rpg-game-session-id')
}
