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
        error: 'Tavern alias already taken'
      }
    }
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('❌ Error checking existing user:', checkError)
      return {
        success: false,
        error: 'Error checking tavern records'
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
        error: 'Error registering at tavern'
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
      error: 'Internal server error'
    }
  }
}

// Función para iniciar sesión
export async function loginUser(username: string, password: string): Promise<AuthResult> {
  try {
    console.log('🔐 Logging in user:', username)
    
    // Primero buscar el usuario por username
    console.log('🔍 Searching for username:', username)
    const { data: users, error: searchError } = await supabase
      .from('users')
      .select('id, username, password_hash, created_at')
      .eq('username', username)
    
    console.log('🔍 Supabase query result:', { users, searchError })
    
    if (searchError) {
      console.error('❌ Error searching user:', searchError)
      return {
        success: false,
        error: 'Error entering tavern'
      }
    }
    
    console.log('🔍 Users found:', users?.length || 0)
    
    if (!users || users.length === 0) {
      console.log('❌ No users found with username:', username)
      return {
        success: false,
        error: 'Invalid tavern alias or password'
      }
    }
    
    const user = users[0]
    console.log('👤 User found:', { id: user.id, username: user.username })
    console.log('🔐 Password check - stored:', user.password_hash, 'provided:', password)
    
    // Verificar la contraseña (en producción, deberías verificar el hash)
    if (user.password_hash !== password) {
      console.log('❌ Password mismatch')
      return {
        success: false,
        error: 'Invalid tavern alias or password'
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
      error: 'Internal server error'
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
