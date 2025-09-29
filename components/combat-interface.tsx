"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { 
  CombatState, 
  CombatAction, 
  CombatPlayer, 
  CombatUtils,
  COMBAT_CONSTANTS 
} from "@/lib/combat-system"

interface CombatInterfaceProps {
  combatState: CombatState
  currentPlayerId: string
  onAction: (action: CombatAction) => void
  onClose: () => void
}

export default function CombatInterface({ 
  combatState, 
  currentPlayerId, 
  onAction, 
  onClose 
}: CombatInterfaceProps) {
  const [timeLeft, setTimeLeft] = useState(COMBAT_CONSTANTS.TURN_TIMEOUT / 1000)
  const [lastAction, setLastAction] = useState<CombatAction | null>(null)

  const isCurrentPlayerTurn = combatState.currentTurn === currentPlayerId
  const currentPlayer = combatState.challenger.id === currentPlayerId 
    ? combatState.challenger 
    : combatState.challenged
  const opponent = combatState.challenger.id === currentPlayerId 
    ? combatState.challenged 
    : combatState.challenger

  // Timer para el turno
  useEffect(() => {
    if (combatState.status !== 'active' || !isCurrentPlayerTurn) {
      setTimeLeft(COMBAT_CONSTANTS.TURN_TIMEOUT / 1000)
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Timeout - ataque automático
          onAction({ type: 'attack' })
          return COMBAT_CONSTANTS.TURN_TIMEOUT / 1000
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

  const handleAction = (actionType: 'attack' | 'block' | 'dodge') => {
    if (!isCurrentPlayerTurn || combatState.status !== 'active') return
    
    const action: CombatAction = { type: actionType }
    onAction(action)
  }

  const getHealthColor = (health: number, maxHealth: number) => {
    const percentage = (health / maxHealth) * 100
    if (percentage > 60) return "bg-green-500"
    if (percentage > 30) return "bg-yellow-500"
    return "bg-red-500"
  }

  const getActionDescription = (action: CombatAction, playerName: string) => {
    switch (action.type) {
      case 'attack':
        if (action.dodged) {
          return `${playerName} atacó pero fue esquivado!`
        }
        if (action.blocked) {
          return `${playerName} atacó por ${action.damage} de daño (bloqueado)!`
        }
        return `${playerName} atacó por ${action.damage} de daño!`
      case 'block':
        return `${playerName} se preparó para bloquear!`
      case 'dodge':
        return `${playerName} se preparó para esquivar!`
      default:
        return `${playerName} hizo una acción!`
    }
  }

  if (combatState.status === 'finished') {
    console.log('🏁 CombatInterface: Combat finished, showing victory screen')
    const isWinner = combatState.winner === currentPlayerId
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">
              {isWinner ? "¡Victoria!" : "Derrota"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg mb-4">
                {isWinner 
                  ? `¡Has derrotado a ${opponent.name}!` 
                  : `${opponent.name} te ha derrotado!`
                }
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Duración: {Math.floor((combatState.endTime! - combatState.startTime) / 1000)}s
                </p>
                <p className="text-sm text-muted-foreground">
                  Turnos: {combatState.turns.length}
                </p>
              </div>
            </div>
            <Button onClick={() => {
              console.log('🚪 CombatInterface: Continuar button clicked')
              onClose()
            }} className="w-full" size="lg">
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Combate</CardTitle>
          <div className="flex justify-center space-x-4">
            <Badge variant={isCurrentPlayerTurn ? "default" : "secondary"}>
              {isCurrentPlayerTurn ? "Tu turno" : "Turno del oponente"}
            </Badge>
            {isCurrentPlayerTurn && (
              <Badge variant="destructive">
                Tiempo: {timeLeft}s
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información de los jugadores */}
          <div className="grid grid-cols-2 gap-4">
            {/* Jugador actual */}
            <div className="space-y-2">
              <h3 className="font-bold text-center">{currentPlayer.name}</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Vida:</span>
                  <span>{currentPlayer.health}/{currentPlayer.maxHealth}</span>
                </div>
                <Progress 
                  value={(currentPlayer.health / currentPlayer.maxHealth) * 100}
                  className="h-2"
                />
              </div>
            </div>

            {/* Oponente */}
            <div className="space-y-2">
              <h3 className="font-bold text-center">{opponent.name}</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Vida:</span>
                  <span>{opponent.health}/{opponent.maxHealth}</span>
                </div>
                <Progress 
                  value={(opponent.health / opponent.maxHealth) * 100}
                  className="h-2"
                />
              </div>
            </div>
          </div>

          {/* Última acción */}
          {lastAction && (
            <div className="text-center p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                {getActionDescription(lastAction, 
                  combatState.turns[combatState.turns.length - 1]?.playerId === currentPlayerId 
                    ? currentPlayer.name 
                    : opponent.name
                )}
              </p>
            </div>
          )}

          {/* Acciones disponibles */}
          {isCurrentPlayerTurn && combatState.status === 'active' && (
            <div className="space-y-3">
              <h4 className="font-semibold text-center">Elige tu acción:</h4>
              <div className="grid grid-cols-3 gap-3">
                <Button 
                  onClick={() => handleAction('attack')}
                  variant="destructive"
                  className="h-16 flex flex-col"
                >
                  <span className="text-lg">⚔️</span>
                  <span className="text-xs">Atacar</span>
                </Button>
                <Button 
                  onClick={() => handleAction('block')}
                  variant="secondary"
                  className="h-16 flex flex-col"
                >
                  <span className="text-lg">🛡️</span>
                  <span className="text-xs">Bloquear</span>
                </Button>
                <Button 
                  onClick={() => handleAction('dodge')}
                  variant="outline"
                  className="h-16 flex flex-col"
                >
                  <span className="text-lg">💨</span>
                  <span className="text-xs">Esquivar</span>
                </Button>
              </div>
              <div className="text-xs text-muted-foreground text-center space-y-1">
                <p><strong>Atacar:</strong> Inflige daño aleatorio (15-25)</p>
                <p><strong>Bloquear:</strong> Reduce el daño recibido a la mitad</p>
                <p><strong>Esquivar:</strong> 30% de probabilidad de evitar el daño</p>
              </div>
            </div>
          )}

          {/* Esperando turno del oponente */}
          {!isCurrentPlayerTurn && combatState.status === 'active' && (
            <div className="text-center p-4">
              <p className="text-lg font-medium">Esperando que {opponent.name} elija su acción...</p>
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            </div>
          )}

          {/* Botón de cerrar (solo si no es tu turno) */}
          {!isCurrentPlayerTurn && (
            <div className="text-center">
              <Button variant="outline" onClick={onClose}>
                Minimizar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
