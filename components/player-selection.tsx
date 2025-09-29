"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface PlayerSelectionProps {
  players: Array<{
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
  }>
  onPlayerSelected: (player: any) => void
  onCreateNew: () => void
}


export default function PlayerSelection({ players, onPlayerSelected, onCreateNew }: PlayerSelectionProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)

  return (
    <div className="min-h-screen game-container flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Select Character</h1>
          <p className="text-gray-300 text-lg">Choose a saved character or create a new one</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {players.map((player) => (
            <Card 
              key={player.name}
              className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
                selectedPlayer === player.name 
                  ? 'ring-2 ring-blue-500 bg-blue-900/20' 
                  : 'bg-gray-800/50 hover:bg-gray-700/50'
              }`}
              onClick={() => setSelectedPlayer(player.name)}
            >
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-white text-3xl mb-2 font-bold">{player.name}</CardTitle>
                <CardDescription className="text-blue-400 text-xl font-semibold">
                  lvl {player.stats.level}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400 font-medium">XP:</span>
                    <span className="text-white font-bold">{player.stats.experience}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400 font-medium">HP:</span>
                    <span className="text-white font-bold">{player.stats.health}/{player.stats.maxHealth}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400 font-medium">Attack:</span>
                    <span className="text-white font-bold">{player.stats.attack}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400 font-medium">Defense:</span>
                    <span className="text-white font-bold">{player.stats.defense}</span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-gray-400 font-medium">Speed:</span>
                    <span className="text-white font-bold">{player.stats.speed}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => selectedPlayer && onPlayerSelected(players.find(p => p.name === selectedPlayer))}
            disabled={!selectedPlayer}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            Play with {selectedPlayer || 'Character'}
          </Button>
          <Button
            onClick={onCreateNew}
            variant="outline"
            className="border-gray-400 text-gray-300 hover:bg-gray-700 px-8 py-3 text-lg"
          >
            Create New Character
          </Button>
        </div>
      </div>
    </div>
  )
}
