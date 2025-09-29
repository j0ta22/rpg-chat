"use client"

import { useState, useEffect } from "react"
import CharacterCreation from "@/components/character-creation"
import GameWorld from "@/components/game-world"
import PlayerSelection from "@/components/player-selection"
import Login from "@/components/login"
import { loadPlayerProgress, listSavedPlayers } from "@/lib/player-persistence"
import { registerUser, loginUser, getCurrentUser, setCurrentUser, logoutUser, type User } from "@/lib/auth"

export interface Character {
  name: string
  avatar: string
  x: number
  y: number
  stats?: {
    level: number
    experience: number
    health: number
    maxHealth: number
    attack: number
    defense: number
    speed: number
  }
}

export default function RPGGame() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [gameStarted, setGameStarted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [savedPlayers, setSavedPlayers] = useState<any[]>([])
  const [showPlayerSelection, setShowPlayerSelection] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(false)

  // Verificar si hay un usuario logueado al iniciar
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = getCurrentUser()
        if (currentUser) {
          setUser(currentUser)
          // Cargar personajes del usuario
          const players = await listSavedPlayers()
          setSavedPlayers(players)
          
          if (players.length > 0) {
            setShowPlayerSelection(true)
          }
        } else {
          setShowLogin(true)
        }
      } catch (error) {
        console.error('❌ Error checking auth:', error)
        setShowLogin(true)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleCharacterCreated = (newCharacter: Omit<Character, "x" | "y">) => {
    const characterWithPosition = {
      ...newCharacter,
      x: 100, // Safe starting position - left side of tavern
      y: 150,
    }
    setCharacter(characterWithPosition)
    setGameStarted(true)
    
    // Guardar el personaje inmediatamente después de crearlo
    console.log('💾 Character created, will be saved when game starts')
  }

  const handleBackToCreation = () => {
    setCharacter(null)
    setGameStarted(false)
    setShowPlayerSelection(false)
  }

  const handleBackToSelection = () => {
    setCharacter(null)
    setGameStarted(false)
    setShowPlayerSelection(true)
  }

  const handlePlayerSelected = (selectedPlayer: any) => {
    console.log('🎮 Player selected:', selectedPlayer)
    setCharacter({
      name: selectedPlayer.name,
      avatar: selectedPlayer.avatar,
      x: 100,
      y: 150,
      stats: selectedPlayer.stats
    })
    setGameStarted(true)
    setShowPlayerSelection(false)
  }

  const handleCreateNewCharacter = () => {
    setShowPlayerSelection(false)
  }

  const handleLogin = async (username: string, password: string) => {
    setIsAuthLoading(true)
    setAuthError(null)
    
    try {
      const result = await loginUser(username, password)
      if (result.success && result.user) {
        setUser(result.user)
        setCurrentUser(result.user) // Guardar en localStorage
        console.log('💾 User saved to localStorage:', result.user)
        setShowLogin(false)
        
        // Cargar personajes del usuario
        const players = await listSavedPlayers()
        setSavedPlayers(players)
        
        if (players.length > 0) {
          setShowPlayerSelection(true)
        }
      } else {
        setAuthError(result.error || 'Error entering tavern')
      }
    } catch (error) {
      setAuthError('Internal server error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleRegister = async (username: string, password: string) => {
    setIsAuthLoading(true)
    setAuthError(null)
    
    try {
      const result = await registerUser(username, password)
      if (result.success && result.user) {
        setUser(result.user)
        setCurrentUser(result.user) // Guardar en localStorage
        console.log('💾 User saved to localStorage:', result.user)
        setShowLogin(false)
        setShowPlayerSelection(false) // Ir directo a crear personaje
      } else {
        setAuthError(result.error || 'Error registering at tavern')
      }
    } catch (error) {
      setAuthError('Internal server error')
    } finally {
      setIsAuthLoading(false)
    }
  }

  const handleLogout = () => {
    logoutUser()
    setUser(null)
    setCharacter(null)
    setGameStarted(false)
    setShowPlayerSelection(false)
    setSavedPlayers([])
    setShowLogin(true)
  }


  return (
    <div className="min-h-screen game-container flex items-center justify-center p-4">
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando...</p>
        </div>
      ) : showLogin ? (
        <Login 
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={isAuthLoading}
          error={authError}
        />
      ) : showPlayerSelection ? (
        <PlayerSelection 
          players={savedPlayers} 
          onPlayerSelected={handlePlayerSelected}
          onCreateNew={handleCreateNewCharacter}
        />
      ) : !gameStarted ? (
        <CharacterCreation onCharacterCreated={handleCharacterCreated} />
      ) : (
        <GameWorld 
          character={character!} 
          onCharacterUpdate={setCharacter} 
          onBackToCreation={handleBackToCreation}
          onBackToSelection={handleBackToSelection}
          onLogout={handleLogout}
          user={user}
        />
      )}
    </div>
  )
}
