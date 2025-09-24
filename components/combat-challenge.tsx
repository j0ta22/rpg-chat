"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CombatChallenge, COMBAT_CONSTANTS } from "@/lib/combat-system"

interface CombatChallengeProps {
  challenge: CombatChallenge
  onAccept: () => void
  onDecline: () => void
  onExpire: () => void
}

export default function CombatChallengeComponent({ 
  challenge, 
  onAccept, 
  onDecline, 
  onExpire 
}: CombatChallengeProps) {
  const [timeLeft, setTimeLeft] = useState(COMBAT_CONSTANTS.CHALLENGE_TIMEOUT / 1000)

  // Timer para el desafío
  useEffect(() => {
    if (challenge.status !== 'pending') {
      return
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onExpire()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [challenge.status, onExpire])

  if (challenge.status === 'expired') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium mb-4">
              El desafío de {challenge.challengerName} ha expirado
            </p>
            <Button onClick={onDecline} className="w-full">
              Cerrar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (challenge.status === 'declined') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <p className="text-lg font-medium mb-4">
              Has declinado el desafío de {challenge.challengerName}
            </p>
            <Button onClick={onDecline} className="w-full">
              Cerrar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold">¡Desafío de Combate!</CardTitle>
          <Badge variant="destructive" className="mx-auto">
            Tiempo: {timeLeft}s
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {challenge.challengerName} te desafía a un combate!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Ambos comenzaréis con {COMBAT_CONSTANTS.MAX_HEALTH} puntos de vida.
              El combate será por turnos: atacar, bloquear o esquivar.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Reglas del combate:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Atacar:</strong> Inflige 15-25 de daño</li>
              <li>• <strong>Bloquear:</strong> Reduce el daño a la mitad</li>
              <li>• <strong>Esquivar:</strong> 30% de probabilidad de evitar daño</li>
              <li>• Cada turno tiene 30 segundos de tiempo límite</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={onAccept}
              className="flex-1"
              variant="default"
            >
              Aceptar
            </Button>
            <Button 
              onClick={onDecline}
              className="flex-1"
              variant="outline"
            >
              Declinar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
