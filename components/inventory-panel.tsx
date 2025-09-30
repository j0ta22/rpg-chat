"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Package, 
  Sword, 
  Shield, 
  Zap, 
  Heart, 
  Coins, 
  Star,
  Check,
  X
} from "lucide-react"
import { 
  getPlayerInventory, 
  getItemCatalog, 
  buyItem, 
  toggleItemEquip,
  PlayerInventoryItem,
  Item 
} from "@/lib/combat-system"

interface InventoryPanelProps {
  isVisible: boolean
  onClose: () => void
  userId: string
  userGold: number
  onGoldUpdate: (newGold: number) => void
}

export default function InventoryPanel({ 
  isVisible, 
  onClose, 
  userId, 
  userGold, 
  onGoldUpdate 
}: InventoryPanelProps) {
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([])
  const [catalog, setCatalog] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("inventory")

  useEffect(() => {
    if (isVisible) {
      loadData()
    }
  }, [isVisible, userId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [inventoryData, catalogData] = await Promise.all([
        getPlayerInventory(userId),
        getItemCatalog()
      ])
      setInventory(inventoryData)
      setCatalog(catalogData)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBuyItem = async (item: Item) => {
    if (userGold < item.price) {
      alert('Not enough gold!')
      return
    }

    const success = await buyItem(userId, item.id)
    if (success) {
      onGoldUpdate(userGold - item.price)
      loadData() // Reload inventory
    }
  }

  const handleToggleEquip = async (inventoryItem: PlayerInventoryItem) => {
    const success = await toggleItemEquip(userId, inventoryItem.id)
    if (success) {
      loadData() // Reload inventory
    }
  }

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-600 text-gray-100'
      case 'uncommon': return 'bg-green-600 text-green-100'
      case 'rare': return 'bg-blue-600 text-blue-100'
      case 'epic': return 'bg-purple-600 text-purple-100'
      case 'legendary': return 'bg-yellow-600 text-yellow-100'
      default: return 'bg-gray-600 text-gray-100'
    }
  }

  const getItemTypeIcon = (itemType: string) => {
    switch (itemType) {
      case 'weapon': return <Sword className="h-4 w-4" />
      case 'armor': return <Shield className="h-4 w-4" />
      case 'accessory': return <Star className="h-4 w-4" />
      case 'consumable': return <Heart className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  const getStatIcon = (stat: string) => {
    switch (stat) {
      case 'attack': return <Sword className="h-3 w-3" />
      case 'defense': return <Shield className="h-3 w-3" />
      case 'speed': return <Zap className="h-3 w-3" />
      case 'health': return <Heart className="h-3 w-3" />
      default: return <Star className="h-3 w-3" />
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-4 w-96 z-50">
      <Card className="bg-gradient-to-br from-amber-900/95 to-amber-800/95 border-4 border-amber-600 shadow-2xl" style={{borderRadius: '0'}}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-amber-300" />
              <CardTitle className="text-xl font-bold text-amber-100 font-mono tracking-wider">
                TAVERN INVENTORY
              </CardTitle>
            </div>
            <button
              onClick={onClose}
              className="text-amber-300 hover:text-amber-100 text-xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <Coins className="h-4 w-4 text-yellow-400" />
            <span className="text-amber-200 font-mono text-sm">
              Gold: {userGold}
            </span>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-4" style={{borderRadius: '0'}}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-amber-800" style={{borderRadius: '0'}}>
              <TabsTrigger 
                value="inventory" 
                className="font-mono text-sm"
                style={{borderRadius: '0'}}
              >
                My Items
              </TabsTrigger>
              <TabsTrigger 
                value="shop" 
                className="font-mono text-sm"
                style={{borderRadius: '0'}}
              >
                Shop
              </TabsTrigger>
            </TabsList>

            <TabsContent value="inventory" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
                  <span className="ml-3 text-amber-200 font-mono">Loading inventory...</span>
                </div>
              ) : inventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-amber-200 font-mono">Inventory empty</p>
                  <p className="text-amber-300 font-mono text-sm mt-2">
                    Visit the shop to buy items!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {inventory.map((inventoryItem) => (
                    <div
                      key={inventoryItem.id}
                      className={`p-3 rounded border-2 transition-all duration-200 ${
                        inventoryItem.equipped 
                          ? 'bg-green-700/50 border-green-500' 
                          : 'bg-amber-700/50 border-amber-600'
                      }`}
                      style={{borderRadius: '0'}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getItemTypeIcon(inventoryItem.item.itemType)}
                          <div>
                            <h3 className="font-bold text-amber-100 font-mono text-sm">
                              {inventoryItem.item.name}
                            </h3>
                            <p className="text-amber-300 font-mono text-xs">
                              {inventoryItem.item.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                className={`text-xs font-mono ${getRarityColor(inventoryItem.item.rarity)}`}
                                style={{borderRadius: '0'}}
                              >
                                {inventoryItem.item.rarity}
                              </Badge>
                              {inventoryItem.equipped && (
                                <Badge 
                                  variant="secondary" 
                                  className="bg-green-600 text-green-100 text-xs font-mono"
                                  style={{borderRadius: '0'}}
                                >
                                  EQUIPPED
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="space-y-1">
                            {Object.entries(inventoryItem.item.statBonuses).map(([stat, bonus]) => (
                              <div key={stat} className="flex items-center space-x-1 text-amber-200 text-xs">
                                {getStatIcon(stat)}
                                <span>+{bonus}</span>
                              </div>
                            ))}
                          </div>
                          
                          {inventoryItem.item.itemType !== 'consumable' && (
                            <Button
                              size="sm"
                              onClick={() => handleToggleEquip(inventoryItem)}
                              className={`mt-2 text-xs font-mono ${
                                inventoryItem.equipped
                                  ? 'bg-red-600 hover:bg-red-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              style={{borderRadius: '0'}}
                            >
                              {inventoryItem.equipped ? (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  Unequip
                                </>
                              ) : (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  Equip
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="shop" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
                  <span className="ml-3 text-amber-200 font-mono">Loading shop...</span>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {catalog.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded border-2 bg-amber-700/50 border-amber-600 transition-all duration-200"
                      style={{borderRadius: '0'}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getItemTypeIcon(item.itemType)}
                          <div>
                            <h3 className="font-bold text-amber-100 font-mono text-sm">
                              {item.name}
                            </h3>
                            <p className="text-amber-300 font-mono text-xs">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                className={`text-xs font-mono ${getRarityColor(item.rarity)}`}
                                style={{borderRadius: '0'}}
                              >
                                {item.rarity}
                              </Badge>
                              <div className="flex items-center space-x-1 text-yellow-400 text-xs font-mono">
                                <Coins className="h-3 w-3" />
                                <span>{item.price}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="space-y-1">
                            {Object.entries(item.statBonuses).map(([stat, bonus]) => (
                              <div key={stat} className="flex items-center space-x-1 text-amber-200 text-xs">
                                {getStatIcon(stat)}
                                <span>+{bonus}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleBuyItem(item)}
                            disabled={userGold < item.price}
                            className={`mt-2 text-xs font-mono ${
                              userGold < item.price
                                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                : 'bg-amber-600 hover:bg-amber-700 text-amber-100'
                            }`}
                            style={{borderRadius: '0'}}
                          >
                            <Coins className="h-3 w-3 mr-1" />
                            Buy
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

