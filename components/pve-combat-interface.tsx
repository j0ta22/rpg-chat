import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PvECombatState {
  player: {
    name: string
    avatar: string
    stats: {
      health: number
      maxHealth: number
      attack: number
      defense: number
      speed: number
    }
    health: number
    maxHealth: number
  }
  enemy: {
    name: string
    avatar: string
    stats: {
      health: number
      maxHealth: number
      attack: number
      defense: number
      speed: number
    }
    health: number
    maxHealth: number
  }
  currentTurn: 'player' | 'enemy'
  turnNumber: number
  isPlayerTurn: boolean
  enemyId: string
  // Combat tracking for XP calculation
  damageDealt: number
  damageTaken: number
  isFirstBlood: boolean
}

interface PvECombatInterfaceProps {
  combatState: PvECombatState
  onCombatEnd: (result: 'victory' | 'defeat', enemyId: string, combatStats?: { damageDealt: number, damageTaken: number, turnsTaken: number, isFirstBlood: boolean }) => void
  onClose: () => void
}

const PvECombatInterface: React.FC<PvECombatInterfaceProps> = ({
  combatState,
  onCombatEnd,
  onClose
}) => {
  const [currentState, setCurrentState] = useState<PvECombatState>(combatState)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  // Update state when prop changes
  useEffect(() => {
    setCurrentState(combatState)
  }, [combatState])

  const addToLog = (message: string) => {
    setCombatLog(prev => [...prev, message])
  }

  const calculateDamage = (attacker: any, defender: any) => {
    const baseDamage = Math.max(1, attacker.stats.attack - defender.stats.defense)
    const variance = Math.random() * 0.4 + 0.8 // 80% to 120% damage
    return Math.floor(baseDamage * variance)
  }

  const playerAttack = () => {
    if (isProcessing || !currentState.isPlayerTurn) return

    setIsProcessing(true)
    addToLog(`${currentState.player.name} attacks!`)

    setTimeout(() => {
      const damage = calculateDamage(currentState.player, currentState.enemy)
      const newEnemyHealth = Math.max(0, currentState.enemy.health - damage)
      
      addToLog(`${currentState.player.name} deals ${damage} damage!`)
      
      // Track damage dealt and first blood
      const isFirstBlood = currentState.damageDealt === 0 && damage > 0
      
      if (newEnemyHealth <= 0) {
        addToLog(`${currentState.enemy.name} is defeated!`)
        setTimeout(() => {
          const combatStats = {
            damageDealt: currentState.damageDealt + damage,
            damageTaken: currentState.damageTaken,
            turnsTaken: currentState.turnNumber,
            isFirstBlood: isFirstBlood
          }
          onCombatEnd('victory', currentState.enemyId, combatStats)
        }, 1000)
        return
      }

      setCurrentState(prev => ({
        ...prev,
        enemy: { ...prev.enemy, health: newEnemyHealth },
        currentTurn: 'enemy',
        isPlayerTurn: false,
        damageDealt: prev.damageDealt + damage,
        isFirstBlood: prev.isFirstBlood || isFirstBlood
      }))

      // Enemy turn after a delay
      setTimeout(() => {
        enemyAttack(newEnemyHealth)
      }, 1500)
    }, 500)
  }

  const enemyAttack = (enemyHealth: number) => {
    addToLog(`${currentState.enemy.name} attacks!`)

    setTimeout(() => {
      const damage = calculateDamage(currentState.enemy, currentState.player)
      const newPlayerHealth = Math.max(0, currentState.player.health - damage)
      
      addToLog(`${currentState.enemy.name} deals ${damage} damage!`)
      
      if (newPlayerHealth <= 0) {
        addToLog(`${currentState.player.name} is defeated!`)
        setTimeout(() => {
          const combatStats = {
            damageDealt: currentState.damageDealt,
            damageTaken: currentState.damageTaken + damage,
            turnsTaken: currentState.turnNumber,
            isFirstBlood: currentState.isFirstBlood
          }
          onCombatEnd('defeat', currentState.enemyId, combatStats)
        }, 1000)
        return
      }

      setCurrentState(prev => ({
        ...prev,
        player: { ...prev.player, health: newPlayerHealth },
        currentTurn: 'player',
        isPlayerTurn: true,
        turnNumber: prev.turnNumber + 1,
        damageTaken: prev.damageTaken + damage
      }))

      setIsProcessing(false)
    }, 500)
  }

  const getHealthBarColor = (current: number, max: number) => {
    const percentage = current / max
    if (percentage > 0.6) return 'bg-green-500'
    if (percentage > 0.3) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl mx-4 bg-gradient-to-b from-gray-900 to-gray-800 border-2 border-gray-600">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white pixel-text">
            ⚔️ PvE Combat - Turn {currentState.turnNumber}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Combatants */}
          <div className="grid grid-cols-2 gap-6">
            {/* Player */}
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400 mb-2">
                {currentState.player.name}
              </div>
              <div className="w-24 h-24 mx-auto mb-2 bg-gray-700 rounded border-2 border-blue-400 flex items-center justify-center">
                <span className="text-2xl">🧙‍♂️</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-300">
                  HP: {currentState.player.health}/{currentState.player.maxHealth}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getHealthBarColor(currentState.player.health, currentState.player.maxHealth)}`}
                    style={{ width: `${(currentState.player.health / currentState.player.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Enemy */}
            <div className="text-center">
              <div className="text-lg font-bold text-red-400 mb-2">
                {currentState.enemy.name}
              </div>
              <div className="w-24 h-24 mx-auto mb-2 bg-gray-700 rounded border-2 border-red-400 flex items-center justify-center">
                <span className="text-2xl">👹</span>
              </div>
              <div className="space-y-1">
                <div className="text-sm text-gray-300">
                  HP: {currentState.enemy.health}/{currentState.enemy.maxHealth}
                </div>
                <div className="w-full bg-gray-600 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${getHealthBarColor(currentState.enemy.health, currentState.enemy.maxHealth)}`}
                    style={{ width: `${(currentState.enemy.health / currentState.enemy.maxHealth) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Combat Log */}
          <div className="bg-black bg-opacity-50 rounded p-4 h-32 overflow-y-auto">
            <div className="text-sm text-gray-300 space-y-1">
              {combatLog.map((log, index) => (
                <div key={index} className="font-mono">
                  {log}
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-4">
            {currentState.isPlayerTurn && !isProcessing ? (
              <Button
                onClick={playerAttack}
                className="pixel-button bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3"
              >
                Attack
              </Button>
            ) : (
              <Button
                disabled
                className="pixel-button bg-gray-600 text-gray-400 font-bold px-8 py-3"
              >
                {isProcessing ? 'Processing...' : 'Enemy Turn'}
              </Button>
            )}
            
            <Button
              onClick={onClose}
              className="pixel-button bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 py-3"
            >
              Flee
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PvECombatInterface
