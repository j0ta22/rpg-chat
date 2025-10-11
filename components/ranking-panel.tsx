"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Trophy, Sword, Shield, Zap } from "lucide-react"
import { getPlayerRanking, PlayerRanking } from "@/lib/combat-system"

interface RankingPanelProps {
  // Removed isVisible and onClose since it will be always visible
}

export default function RankingPanel({}: RankingPanelProps) {
  const [rankings, setRankings] = useState<PlayerRanking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRankings()
    // Refresh rankings every 30 seconds
    const interval = setInterval(loadRankings, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadRankings = async () => {
    try {
      console.log('🏆 RankingPanel: Starting to load rankings...')
      setLoading(true)
      const data = await getPlayerRanking()
      console.log('🏆 RankingPanel: getPlayerRanking result:', data)
      setRankings(data)
      console.log('🏆 RankingPanel: Rankings set, length:', data?.length || 0)
    } catch (error) {
      console.error('🏆 RankingPanel: Error loading rankings:', error)
    } finally {
      setLoading(false)
      console.log('🏆 RankingPanel: Loading finished')
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Trophy className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Trophy className="h-5 w-5 text-amber-600" />
    return <span className="text-lg font-bold text-amber-200">#{rank}</span>
  }

  const getRankColor = (rank: number) => {
    if (rank === 1) return "bg-gradient-to-r from-yellow-600 to-yellow-800"
    if (rank === 2) return "bg-gradient-to-r from-gray-500 to-gray-700"
    if (rank === 3) return "bg-gradient-to-r from-amber-600 to-amber-800"
    return "bg-gradient-to-r from-amber-700 to-amber-900"
  }

  return (
    <div className="w-full h-fit">
      <Card className="w-full h-fit border-4 border-primary" style={{borderRadius: '0'}}>
        <CardContent className="space-y-4" style={{borderRadius: '0'}}>
          {/* Header del ranking */}
          <div className="p-4" style={{
            background: '#d4af37',
            border: '4px solid #8b4513',
            borderRadius: '0',
            boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
          }}>
            <div className="flex items-center space-x-2 mb-2">
              <Crown className="h-6 w-6 text-accent-foreground" />
              <h3 className="text-lg font-bold pixel-text text-center text-accent border-b-2 border-accent pb-2 flex-1">
                TAVERN RANKINGS
              </h3>
            </div>
            <p className="text-sm pixel-text text-accent-foreground text-center">
              Weekly combat champions
            </p>
          </div>

          {/* Contenido del ranking */}
          <div className="p-4" style={{
            background: '#d4af37',
            border: '4px solid #8b4513',
            borderRadius: '0',
            boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
          }}>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-foreground"></div>
                <span className="ml-3 text-accent-foreground pixel-text">Loading rankings...</span>
              </div>
            ) : rankings.length === 0 ? (
              <div className="text-center py-8">
                <Sword className="h-12 w-12 text-accent-foreground mx-auto mb-4" />
                <p className="text-accent-foreground pixel-text">No combat data yet</p>
                <p className="text-accent-foreground pixel-text text-sm mt-2">
                  Challenge other players to start the rankings!
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {rankings.slice(0, 10).map((player, index) => (
                  <div
                    key={player.username}
                    className="bg-secondary/30 border border-muted p-2 text-destructive font-bold"
                    style={{borderRadius: '0'}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {getRankIcon(player.rank)}
                        <div>
                          <h3 className="font-bold pixel-text text-sm text-destructive">
                            {player.username}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="text-xs pixel-text text-destructive">
                              {player.winRate.toFixed(1)}% WR
                            </span>
                            <span className="text-xs pixel-text text-destructive">
                              {player.totalCombats} fights
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-destructive text-xs pixel-text">
                          <Sword className="h-3 w-3" />
                          <span>{player.wins}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-destructive text-xs pixel-text">
                          <Shield className="h-3 w-3" />
                          <span>{player.losses}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress bar for win rate */}
                    <div className="mt-2">
                      <div className="w-full bg-muted/50 border border-muted h-2" style={{borderRadius: '0'}}>
                        <div
                          className="bg-accent h-full transition-all duration-300"
                          style={{
                            width: `${Math.min(player.winRate, 100)}%`,
                            borderRadius: '0'
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Weekly Champion Highlight */}
          {rankings.length > 0 && (
            <div className="p-4" style={{
              background: '#d4af37',
              border: '4px solid #8b4513',
              borderRadius: '0',
              boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
            }}>
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-accent-foreground" />
                <div>
                  <h4 className="font-bold text-accent pixel-text text-sm">
                    WEEKLY CHAMPION
                  </h4>
                  <p className="text-accent-foreground pixel-text text-xs">
                    {rankings[0]?.username} - {rankings[0]?.winRate.toFixed(1)}% Win Rate
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
