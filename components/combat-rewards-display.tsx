'use client'

import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Coins, 
  Star, 
  Gift, 
  AlertTriangle, 
  X, 
  CheckCircle,
  Crown,
  Zap,
  Shield,
  Sword
} from 'lucide-react'

interface CombatRewards {
  gold: number
  experience: number
  item?: {
    id: string
    name: string
    rarity: string
    iconUrl: string
  }
  penalties: {
    levelDifference: number
    noRewards: boolean
    reason?: string
  }
}

interface CombatRewardsDisplayProps {
  isVisible: boolean
  isWinner: boolean
  rewards?: CombatRewards
  xpLoss?: number
  levelDifference?: number
  onClose: () => void
}

export default function CombatRewardsDisplay({
  isVisible,
  isWinner,
  rewards,
  xpLoss = 0,
  levelDifference = 0,
  onClose
}: CombatRewardsDisplayProps) {
  if (!isVisible) return null

  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common':
        return 'bg-gray-500'
      case 'uncommon':
        return 'bg-green-500'
      case 'rare':
        return 'bg-blue-500'
      case 'epic':
        return 'bg-purple-500'
      case 'legendary':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getRarityIcon = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'legendary':
        return <Crown className="h-4 w-4" />
      case 'epic':
        return <Zap className="h-4 w-4" />
      case 'rare':
        return <Shield className="h-4 w-4" />
      case 'uncommon':
        return <Sword className="h-4 w-4" />
      default:
        return <Gift className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            {isWinner ? (
              <CheckCircle className="h-8 w-8 text-green-500" />
            ) : (
              <X className="h-8 w-8 text-red-500" />
            )}
            <CardTitle className="text-2xl font-bold">
              {isWinner ? "🏆 ¡Victoria!" : "💀 Derrota"}
            </CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isWinner ? (
            // Winner rewards
            <div className="space-y-4">
              {rewards?.penalties.noRewards ? (
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto" />
                  <h3 className="text-lg font-semibold text-yellow-600">
                    Sin Recompensas
                  </h3>
                  <p className="text-sm text-gray-600">
                    {rewards.penalties.reason}
                  </p>
                  <Badge variant="outline" className="text-yellow-600">
                    Diferencia de nivel: {rewards.penalties.levelDifference}
                  </Badge>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-center">
                    Recompensas Recibidas
                  </h3>
                  
                  {/* Gold Reward */}
                  {rewards?.gold && rewards.gold > 0 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium">Oro</span>
                      </div>
                      <span className="text-lg font-bold text-yellow-600">
                        +{rewards.gold}
                      </span>
                    </div>
                  )}
                  
                  {/* XP Reward */}
                  {rewards?.experience && rewards.experience > 0 && (
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Experiencia</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        +{rewards.experience}
                      </span>
                    </div>
                  )}
                  
                  {/* Item Drop */}
                  {rewards?.item && (
                    <div className="p-3 bg-purple-50 rounded-lg border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Gift className="h-5 w-5 text-purple-600" />
                          <span className="font-medium">Item Obtenido</span>
                        </div>
                        <Badge 
                          className={`${getRarityColor(rewards.item.rarity)} text-white`}
                        >
                          {rewards.item.rarity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {getRarityIcon(rewards.item.rarity)}
                        <span className="font-medium">{rewards.item.name}</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Level Difference Warning */}
                  {levelDifference > 0 && levelDifference <= 5 && (
                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-700 text-center">
                        ⚠️ Diferencia de nivel: {levelDifference} niveles
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Loser penalties
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center text-red-600">
                Penalizaciones
              </h3>
              
              {/* XP Loss */}
              {xpLoss > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Experiencia Perdida</span>
                  </div>
                  <span className="text-lg font-bold text-red-600">
                    -{xpLoss}
                  </span>
                </div>
              )}
              
              {/* Level Difference Warning */}
              {levelDifference > 5 && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span className="font-medium text-red-600">
                      Diferencia de Nivel Alta
                    </span>
                  </div>
                  <p className="text-sm text-red-700">
                    Diferencia: {levelDifference} niveles
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Close Button */}
          <div className="flex justify-center pt-4">
            <Button onClick={onClose} className="w-full">
              Continuar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
