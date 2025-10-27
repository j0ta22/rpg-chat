"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CombatChallenge } from "@/lib/combat-system"

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
  const [timeLeft, setTimeLeft] = useState(30) // 30 seconds challenge timeout

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
              {challenge.challengerName}'s challenge has expired
            </p>
            <Button onClick={onDecline} className="w-full">
              Close
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
              You declined {challenge.challengerName}'s challenge
            </p>
            <Button onClick={onDecline} className="w-full">
              Close
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
          <CardTitle className="text-xl font-bold">Combat Challenge!</CardTitle>
          <Badge variant="destructive" className="mx-auto">
            Time: {timeLeft}s
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">
              {challenge.challengerName} challenges you to combat!
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Both players will start with 100 health points.
              The combat will be turn-based: attack, block, or dodge.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="font-semibold">Combat Rules:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Attack:</strong> Deal 15-25 damage</li>
              <li>• <strong>Block:</strong> Reduce damage by half</li>
              <li>• <strong>Dodge:</strong> 30% chance to avoid damage</li>
              <li>• Each turn has a 30 second time limit</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <Button 
              onClick={onAccept}
              className="flex-1"
              variant="default"
            >
              Accept
            </Button>
            <Button 
              onClick={onDecline}
              className="flex-1"
              variant="outline"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
