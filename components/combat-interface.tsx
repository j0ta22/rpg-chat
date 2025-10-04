'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Sword, 
  Shield, 
  Zap, 
  Flame, 
  Snowflake, 
  Zap as Lightning,
  Skull,
  Target,
  Clock,
  Heart,
  Shield as Defense,
  Zap as Speed
} from 'lucide-react'

interface CombatPlayer {
  id: string
  name: string
  health: number
  maxHealth: number
  attack: number
  defense: number
  speed: number
  level: number
  isAlive: boolean
}

interface CombatAction {
  type: 'attack' | 'strong_attack' | 'quick_attack' | 'block' | 'dodge' | 'special'
  damage?: number
  isCritical?: boolean
  isBlocked?: boolean
  isDodged?: boolean
  effects?: string[]
  blockedBy?: 'armor' | 'shield' | 'dodge' | null
  weaponType?: string
  element?: string
}

interface CombatTurn {
  playerId: string
  action: CombatAction
  timestamp: number
}

interface CombatState {
  id: string
  challenger: CombatPlayer
  challenged: CombatPlayer
  currentTurn: string
  turns: CombatTurn[]
  status: 'waiting' | 'active' | 'finished'
  winner?: string
  startTime: number
  endTime?: number
}

interface CombatInterfaceProps {
  combatState: CombatState
  currentPlayerId: string
  onAction: (action: CombatAction) => void
  onClose: () => void
}

export default function CombatInterfaceEnhanced({ 
  combatState, 
  currentPlayerId, 
  onAction, 
  onClose 
}: CombatInterfaceProps) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [lastAction, setLastAction] = useState<CombatAction | null>(null)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)

  const isCurrentPlayerTurn = combatState.currentTurn === currentPlayerId
  const currentPlayer = combatState.challenger.id === currentPlayerId 
    ? combatState.challenger 
    : combatState.challenged
  const opponent = combatState.challenger.id === currentPlayerId 
    ? combatState.challenged 
    : combatState.challenger

  // Ensure player names are not undefined or empty
  const safeCurrentPlayer = {
    ...currentPlayer,
    name: currentPlayer.name || 'Unknown Player'
  }
  const safeOpponent = {
    ...opponent,
    name: opponent.name || 'Unknown Player'
  }

  // Debug logging to identify the "unknown player" issue
  console.log('🔍 Combat Interface Debug:', {
    currentPlayerId,
    combatState: {
      challenger: combatState.challenger,
      challenged: combatState.challenged,
      currentTurn: combatState.currentTurn
    },
    currentPlayer: safeCurrentPlayer,
    opponent: safeOpponent
  })

  // Timer para el turno
  useEffect(() => {
    if (combatState.status !== 'active' || !isCurrentPlayerTurn) {
      setTimeLeft(30)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timeout - ataque automático
          onAction({ type: 'attack' })
          return 30
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [combatState.status, isCurrentPlayerTurn, onAction])

  // Actualizar última acción
  useEffect(() => {
    if (combatState.turns.length > 0) {
      const lastTurn = combatState.turns[combatState.turns.length - 1]
      setLastAction(lastTurn.action)
    }
  }, [combatState.turns])

  const handleAction = (actionType: 'attack' | 'strong_attack' | 'quick_attack' | 'block' | 'dodge') => {
    if (!isCurrentPlayerTurn || combatState.status !== 'active') return
    
    const action: CombatAction = { type: actionType }
    onAction(action)
    setSelectedAction(null)
  }

  const getHealthColor = (health: number, maxHealth: number) => {
    const percentage = (health / maxHealth) * 100
    if (percentage > 60) return "bg-green-500"
    if (percentage > 30) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getActionDescription = (action: CombatAction, playerName: string) => {
    let description = ''
    
    switch (action.type) {
      case 'attack':
        if (action.isDodged) {
          description = `${playerName} atacó pero fue esquivado!`
        } else if (action.isBlocked) {
          description = `${playerName} atacó por ${action.damage} de daño (bloqueado)!`
        } else {
          description = `${playerName} atacó por ${action.damage} de daño!`
        }
        break
      case 'strong_attack':
        if (action.isDodged) {
          description = `${playerName} hizo un ataque fuerte pero fue esquivado!`
        } else if (action.isBlocked) {
          description = `${playerName} hizo un ataque fuerte por ${action.damage} de daño (bloqueado)!`
        } else {
          description = `${playerName} hizo un ataque fuerte por ${action.damage} de daño!`
        }
        break
      case 'quick_attack':
        if (action.isDodged) {
          description = `${playerName} hizo un ataque rápido pero fue esquivado!`
        } else if (action.isBlocked) {
          description = `${playerName} hizo un ataque rápido por ${action.damage} de daño (bloqueado)!`
        } else {
          description = `${playerName} hizo un ataque rápido por ${action.damage} de daño!`
        }
        break
      case 'block':
        description = `${playerName} se preparó para bloquear!`
        break
      case 'dodge':
        description = `${playerName} se preparó para esquivar!`
        break
      default:
        description = `${playerName} hizo una acción!`
    }

    // Add critical hit indicator
    if (action.isCritical) {
      description += ' 💥 ¡CRÍTICO!'
    }

    // Add effects
    if (action.effects && action.effects.length > 0) {
      description += ` (Efectos: ${action.effects.join(', ')})`
    }

    return description
  }

  const getEffectIcon = (effect: string) => {
    switch (effect) {
      case 'fire':
      case 'burning':
        return <Flame className="h-4 w-4 text-red-500" />
      case 'ice':
      case 'frozen':
        return <Snowflake className="h-4 w-4 text-blue-500" />
      case 'lightning':
      case 'shocked':
        return <Lightning className="h-4 w-4 text-yellow-500" />
      case 'poison':
      case 'poisoned':
        return <Skull className="h-4 w-4 text-green-500" />
      case 'stunned':
        return <Zap className="h-4 w-4 text-purple-500" />
      case 'bleeding':
        return <Heart className="h-4 w-4 text-red-600" />
      case 'armor_break':
        return <Shield className="h-4 w-4 text-gray-500" />
      default:
        return <Target className="h-4 w-4 text-gray-500" />
    }
  }

  const getWeaponIcon = (weaponType?: string) => {
    switch (weaponType) {
      case 'sword':
        return <Sword className="h-4 w-4" />
      case 'axe':
        return <Sword className="h-4 w-4 text-orange-500" />
      case 'mace':
        return <Sword className="h-4 w-4 text-yellow-600" />
      case 'spear':
        return <Sword className="h-4 w-4 text-blue-600" />
      case 'staff':
        return <Sword className="h-4 w-4 text-purple-500" />
      case 'dagger':
        return <Sword className="h-4 w-4 text-gray-600" />
      default:
        return <Sword className="h-4 w-4" />
    }
  }

  if (combatState.status === 'finished') {
    const isWinner = combatState.winner === currentPlayerId
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isWinner ? "🏆 ¡Victoria!" : "💀 Derrota"}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">
              {isWinner 
                ? `¡Has derrotado a ${safeOpponent.name}!` 
                : `${safeOpponent.name} te ha derrotado!`
              }
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Duración: {Math.floor((combatState.endTime! - combatState.startTime) / 1000)}s
              </p>
              <p className="text-sm text-gray-600">
                Turnos: {combatState.turns.length}
              </p>
            </div>
            <Button onClick={onClose} className="w-full">
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            ⚔️ Combate: {safeCurrentPlayer.name} vs {safeOpponent.name}
          </CardTitle>
          <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>Tiempo: {timeLeft}s</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              <span>Turno: {isCurrentPlayerTurn ? 'Tu turno' : 'Esperando'}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Player Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Player */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{safeCurrentPlayer.name}</h3>
                <Badge variant="secondary">Nivel {safeCurrentPlayer.level}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    Vida
                  </span>
                  <span>{safeCurrentPlayer.health}/{safeCurrentPlayer.maxHealth}</span>
                </div>
                <Progress 
                  value={(safeCurrentPlayer.health / safeCurrentPlayer.maxHealth) * 100} 
                  className="h-2"
                />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Sword className="h-3 w-3 text-red-600" />
                    <span>{safeCurrentPlayer.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Defense className="h-3 w-3 text-blue-600" />
                    <span>{safeCurrentPlayer.defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Speed className="h-3 w-3 text-green-600" />
                    <span>{safeCurrentPlayer.speed}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Opponent */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{safeOpponent.name}</h3>
                <Badge variant="secondary">Nivel {safeOpponent.level}</Badge>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4 text-red-500" />
                    Vida
                  </span>
                  <span>{safeOpponent.health}/{safeOpponent.maxHealth}</span>
                </div>
                <Progress 
                  value={(safeOpponent.health / safeOpponent.maxHealth) * 100} 
                  className="h-2"
                />
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Sword className="h-3 w-3 text-red-600" />
                    <span>{safeOpponent.attack}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Defense className="h-3 w-3 text-blue-600" />
                    <span>{safeOpponent.defense}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Speed className="h-3 w-3 text-green-600" />
                    <span>{safeOpponent.speed}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Last Action */}
          {lastAction && (
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                {lastAction.weaponType && getWeaponIcon(lastAction.weaponType)}
                <span className="font-medium">
                  {getActionDescription(lastAction, 
                    combatState.challenger.id === combatState.turns[combatState.turns.length - 1]?.playerId ? 
                    combatState.challenger.name : combatState.challenged.name
                  )}
                </span>
              </div>
              {lastAction.effects && lastAction.effects.length > 0 && (
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-xs text-gray-600">Efectos:</span>
                  {lastAction.effects.map((effect, index) => (
                    <div key={index} className="flex items-center gap-1">
                      {getEffectIcon(effect)}
                      <span className="text-xs">{effect}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {isCurrentPlayerTurn && combatState.status === 'active' && (
            <div className="space-y-4">
              <h3 className="font-semibold text-center">Elige tu acción:</h3>
              
              {/* Attack Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Button
                  onClick={() => handleAction('attack')}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <Sword className="h-4 w-4" />
                  Ataque Normal
                </Button>
                <Button
                  onClick={() => handleAction('strong_attack')}
                  className="flex items-center gap-2"
                  variant="destructive"
                >
                  <Sword className="h-4 w-4" />
                  Ataque Fuerte
                </Button>
                <Button
                  onClick={() => handleAction('quick_attack')}
                  className="flex items-center gap-2"
                  variant="secondary"
                >
                  <Zap className="h-4 w-4" />
                  Ataque Rápido
                </Button>
              </div>

              {/* Defense Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Button
                  onClick={() => handleAction('block')}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Shield className="h-4 w-4" />
                  Bloquear
                </Button>
                <Button
                  onClick={() => handleAction('dodge')}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Zap className="h-4 w-4" />
                  Esquivar
                </Button>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-center">
            <Button onClick={onClose} variant="outline">
              Salir del Combate
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
