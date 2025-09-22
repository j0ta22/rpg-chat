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

// Definición de las 4 clases disponibles
const classes = [
  { 
    id: "warrior", 
    name: "Warrior", 
    description: "Strong melee fighter",
    sprite: "/4.png" 
  },
  { 
    id: "archer", 
    name: "Archer", 
    description: "Ranged combat expert",
    sprite: "/3.png" 
  },
  { 
    id: "lancer", 
    name: "Lancer",  
    description: "Spear-wielding warrior",
    sprite: "/2.png" 
  },
  { 
    id: "monk", 
    name: "Monk",  
    description: "Spiritual fighter",
    sprite: "/1.png" 
  },
]

// Definición de los 4 colores disponibles
const colors = [
  { id: "black", name: "Black", color: "bg-gray-800", textColor: "text-white" },
  { id: "blue", name: "Blue", color: "bg-blue-500", textColor: "text-white" },
  { id: "red", name: "Red", color: "bg-red-500", textColor: "text-white" },
  { id: "yellow", name: "Yellow", color: "bg-yellow-500", textColor: "text-black" },
]

export default function CharacterCreation({ onCharacterCreated }: CharacterCreationProps) {
  const [name, setName] = useState("")
  const [selectedClass, setSelectedClass] = useState<string>("")
  const [selectedColor, setSelectedColor] = useState<string>("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim() && selectedClass && selectedColor) {
      const avatarId = `${selectedColor}-${selectedClass}`
      onCharacterCreated({ name: name.trim(), avatar: avatarId })
    }
  }

  // Generar sprite path dinámicamente
  const getSpritePath = (classId: string, colorId: string) => {
    const colorName = colorId.charAt(0).toUpperCase() + colorId.slice(1)
    const className = classId.charAt(0).toUpperCase() + classId.slice(1)
    
    // Caso especial para Monk (no tiene sufijo _Idle)
    if (classId === 'monk') {
      return `/Tiny Swords (Free Pack)/Units/${colorName} Units/${className}/Idle.png`
    }
    
    return `/Tiny Swords (Free Pack)/Units/${colorName} Units/${className}/${className}_Idle.png`
  }

  return (
    <Card className="character-card w-full max-w-2xl">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold text-primary mb-2">{"Create Your Hero"}</CardTitle>
        <p className="text-muted-foreground text-lg">{"Choose your name and avatar to begin your adventure"}</p>
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

          {/* Selección de Clase */}
          <div className="space-y-4">
            <label className="text-lg font-semibold text-foreground">{"Choose Your Class"}</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {classes.map((classItem) => (
                <button
                  key={classItem.id}
                  type="button"
                  onClick={() => setSelectedClass(classItem.id)}
                  className={`p-4 rounded-xl border-3 transition-all duration-300 hover:scale-105 ${
                    selectedClass === classItem.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {/* Preview del sprite */}
                    <div className="w-16 h-16 relative">
                      <img
                        src={classItem.sprite}
                        alt={classItem.name}
                        className="w-full h-full object-contain pixel-art"
                      />
                    </div>
                    {/* Fallback emoji si el sprite no carga */}
                    <div className="text-center">
                      <p className="font-semibold text-foreground text-sm">{classItem.name}</p>
                      <p className="text-xs text-muted-foreground">{classItem.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selección de Color */}
          <div className="space-y-4">
            <label className="text-lg font-semibold text-foreground">{"Choose Your Color"}</label>
            <div className="grid grid-cols-4 gap-4">
              {colors.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setSelectedColor(color.id)}
                  className={`p-4 rounded-xl border-3 transition-all duration-300 hover:scale-105 ${
                    selectedColor === color.id
                      ? "border-primary bg-primary/10 shadow-lg"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {/* Preview del sprite con color seleccionado */}
                 
                    {/* Fallback emoji con color */}
                    <div
                      className={`w-8 h-8 rounded-full ${color.color} flex items-center justify-center text-lg ${color.textColor}`}
                    >

                    </div>
                    <p className={`font-semibold text-sm ${color.textColor}`}>{color.name}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>


          <Button
            type="submit"
            disabled={!name.trim() || !selectedClass || !selectedColor}
            className="w-full text-xl py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all duration-300 hover:scale-105"
          >
            {"Start Adventure"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
