"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Character {
  name: string
  avatar: string
}

interface CharacterCreationProps {
  onCharacterCreated: (character: Character) => void
}

// Definición de los 32 avatares disponibles
const avatars = [
  { id: "character_1", name: "Hero 1", description: "Brave warrior", sprite: "/sprite_split/character_1/character_1_frame32x32.png" },
  { id: "character_2", name: "Hero 2", description: "Mystic mage", sprite: "/sprite_split/character_2/character_2_frame32x32.png" },
  { id: "character_3", name: "Hero 3", description: "Swift archer", sprite: "/sprite_split/character_3/character_3_frame32x32.png" },
  { id: "character_4", name: "Hero 4", description: "Dark knight", sprite: "/sprite_split/character_4/character_4_frame32x32.png" },
  { id: "character_5", name: "Hero 5", description: "Noble paladin", sprite: "/sprite_split/character_5/character_5_frame32x32.png" },
  { id: "character_6", name: "Hero 6", description: "Purple mage", sprite: "/sprite_split/character_6/character_6_frame32x32.png" },
  { id: "character_7", name: "Hero 7", description: "Red warrior", sprite: "/sprite_split/character_7/character_7_frame32x32.png" },
  { id: "character_8", name: "Hero 8", description: "Orange monk", sprite: "/sprite_split/character_8/character_8_frame32x32.png" },
  { id: "character_9", name: "Hero 9", description: "Cyan fighter", sprite: "/sprite_split/character_9/character_9_frame32x32.png" },
  { id: "character_10", name: "Hero 10", description: "Green ranger", sprite: "/sprite_split/character_10/character_10_frame32x32.png" },
  { id: "character_11", name: "Hero 11", description: "Pink warrior", sprite: "/sprite_split/character_11/character_11_frame32x32.png" },
  { id: "character_12", name: "Hero 12", description: "Indigo mage", sprite: "/sprite_split/character_12/character_12_frame32x32.png" },
  { id: "character_13", name: "Hero 13", description: "Teal fighter", sprite: "/sprite_split/character_13/character_13_frame32x32.png" },
  { id: "character_14", name: "Hero 14", description: "Golden warrior", sprite: "/sprite_split/character_14/character_14_frame32x32.png" },
  { id: "character_15", name: "Hero 15", description: "Crimson knight", sprite: "/sprite_split/character_15/character_15_frame32x32.png" },
  { id: "character_16", name: "Hero 16", description: "Violet mage", sprite: "/sprite_split/character_16/character_16_frame32x32.png" },
  { id: "character_17", name: "Hero 17", description: "Sky fighter", sprite: "/sprite_split/character_17/character_17_frame32x32.png" },
  { id: "character_18", name: "Hero 18", description: "Lime ranger", sprite: "/sprite_split/character_18/character_18_frame32x32.png" },
  { id: "character_19", name: "Hero 19", description: "Rose warrior", sprite: "/sprite_split/character_19/character_19_frame32x32.png" },
  { id: "character_20", name: "Hero 20", description: "Blue mage", sprite: "/sprite_split/character_20/character_20_frame32x32.png" },
  { id: "character_21", name: "Hero 21", description: "Aqua fighter", sprite: "/sprite_split/character_21/character_21_frame32x32.png" },
  { id: "character_22", name: "Hero 22", description: "Amber warrior", sprite: "/sprite_split/character_22/character_22_frame32x32.png" },
  { id: "character_23", name: "Hero 23", description: "Scarlet knight", sprite: "/sprite_split/character_23/character_23_frame32x32.png" },
  { id: "character_24", name: "Hero 24", description: "Purple mage", sprite: "/sprite_split/character_24/character_24_frame32x32.png" },
  { id: "character_25", name: "Hero 25", description: "Cyan fighter", sprite: "/sprite_split/character_25/character_25_frame32x32.png" },
  { id: "character_26", name: "Hero 26", description: "Lime ranger", sprite: "/sprite_split/character_26/character_26_frame32x32.png" },
  { id: "character_27", name: "Hero 27", description: "Pink warrior", sprite: "/sprite_split/character_27/character_27_frame32x32.png" },
  { id: "character_28", name: "Hero 28", description: "Indigo mage", sprite: "/sprite_split/character_28/character_28_frame32x32.png" },
  { id: "character_29", name: "Hero 29", description: "Teal fighter", sprite: "/sprite_split/character_29/character_29_frame32x32.png" },
  { id: "character_30", name: "Hero 30", description: "Golden warrior", sprite: "/sprite_split/character_30/character_30_frame32x32.png" },
  { id: "character_31", name: "Hero 31", description: "Crimson knight", sprite: "/sprite_split/character_31/character_31_frame32x32.png" },
  { id: "character_32", name: "Hero 32", description: "Violet mage", sprite: "/sprite_split/character_32/character_32_frame32x32.png" },
]


export default function CharacterCreation({ onCharacterCreated }: CharacterCreationProps) {
  const [name, setName] = useState("")

  // Función para asignar un avatar aleatorio
  const assignRandomAvatar = () => {
    const randomIndex = Math.floor(Math.random() * avatars.length)
    return avatars[randomIndex].id
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      const avatar = assignRandomAvatar()
      onCharacterCreated({ name: name.trim(), avatar })
    }
  }


  return (
    <Card className="character-card w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold text-primary mb-2">{"Create Your Hero"}</CardTitle>
        <p className="text-muted-foreground text-lg">{"Enter your name and get a random avatar to begin your adventure"}</p>
      </CardHeader>
      <CardContent className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label htmlFor="name" className="text-lg font-semibold text-foreground">
              {"Hero Name"}
            </label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your hero's name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-lg p-4 border-2 border-primary/30 focus:border-primary"
              maxLength={20}
            />
          </div>

          {/* Información sobre asignación aleatoria */}
          <div className="space-y-4">
            <div className="text-center p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
              <p className="text-muted-foreground text-sm">
                🎲 Your avatar will be randomly assigned when you start your adventure
              </p>
            </div>
          </div>


          <Button
            type="submit"
            disabled={!name.trim()}
            className="w-full text-xl py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:scale-105"
          >
            {"Start Adventure"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

