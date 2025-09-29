"use client"

import { useState, useEffect } from "react"
import CharacterCreation from "@/components/character-creation"
import GameWorld from "@/components/game-world"
import PlayerSelection from "@/components/player-selection"
import { loadPlayerProgress, listSavedPlayers } from "@/lib/player-persistence"

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

  // Cargar progreso guardado al iniciar
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        // Listar todos los personajes guardados
        const players = await listSavedPlayers()
        setSavedPlayers(players)
        
        if (players.length > 0) {
          // Mostrar pantalla de selección de personajes
          setShowPlayerSelection(true)
        } else {
          console.log('ℹ️ No saved progress found')
        }
      } catch (error) {
        console.error('❌ Error loading saved progress:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadSavedProgress()
  }, [])

  const handleCharacterCreated = (newCharacter: Omit<Character, "x" | "y">) => {
    setCharacter({
      ...newCharacter,
      x: 100, // Safe starting position - left side of tavern
      y: 150,
    })
    setGameStarted(true)
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


  return (
    <div className="min-h-screen game-container flex items-center justify-center p-4">
      {isLoading ? (
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando progreso guardado...</p>
        </div>
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
        />
      )}
    </div>
  )
}
