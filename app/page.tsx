"use client"

import { useState } from "react"
import CharacterCreation from "@/components/character-creation"
import GameWorld from "@/components/game-world"

export interface Character {
  name: string
  avatar: string
  x: number
  y: number
}

export default function RPGGame() {
  const [character, setCharacter] = useState<Character | null>(null)
  const [gameStarted, setGameStarted] = useState(false)

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
  }

  return (
    <div className="min-h-screen game-container flex items-center justify-center p-4">
      {!gameStarted ? (
        <CharacterCreation onCharacterCreated={handleCharacterCreated} />
      ) : (
        <GameWorld character={character!} onCharacterUpdate={setCharacter} onBackToCreation={handleBackToCreation} />
      )}
    </div>
  )
}
