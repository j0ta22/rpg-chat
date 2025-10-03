"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ShoppingCart, 
  Sword, 
  Shield, 
  Zap, 
  Heart, 
  Coins, 
  Star,
  Crown,
  Shirt,
  Zap as Boots,
  Hand,
  Gem,
  Package
} from "lucide-react"
import { 
  getItemCatalog, 
  getPlayerInventory,
  buyItem,
  sellItem,
  Item,
  PlayerInventoryItem
} from "@/lib/combat-system"

interface ShopPanelProps {
  isVisible: boolean
  onClose: () => void
  userId: string
  userGold: number
  userLevel: number
  onGoldUpdate: (newGold: number) => void
}

export default function ShopPanel({ 
  isVisible, 
  onClose, 
  userId, 
  userGold, 
  userLevel,
  onGoldUpdate 
}: ShopPanelProps) {
  const [shopItems, setShopItems] = useState<Item[]>([])
  const [playerInventory, setPlayerInventory] = useState<PlayerInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("buy")

  useEffect(() => {
    if (isVisible) {
      loadData()
    }
  }, [isVisible, userId])

  const loadData = async () => {
    try {
      setLoading(true)
      const [itemsData, inventoryData] = await Promise.all([
        getItemCatalog(),
        getPlayerInventory(userId)
      ])
      
      // Filtrar items del shop (solo hasta nivel 7)
      const shopItemsFiltered = itemsData.filter(item => item.levelRequired <= 7)
      setShopItems(shopItemsFiltered)
      setPlayerInventory(inventoryData)
    } catch (error) {
      console.error('Error loading shop data:', error)
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
      loadData() // Reload data
    }
  }

  const handleSellItem = async (inventoryItem: PlayerInventoryItem) => {
    const success = await sellItem(userId, inventoryItem.id)
    if (success) {
      const sellPrice = Math.floor(inventoryItem.item.price * 0.5)
      onGoldUpdate(userGold + sellPrice)
      loadData() // Reload data
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

  const getEquipmentSlotIcon = (slot: string) => {
    const iconStyle = "h-6 w-6 object-contain"
    
    switch (slot) {
      case 'helmet': 
        return <img src="/Items Pack/items/crown.png" alt="Helmet" className={iconStyle} />
      case 'chest': 
        return <img src="/Items Pack/armor/common/armor_chest_common_1.png" alt="Chest" className={iconStyle} />
      case 'legs': 
        return <img src="/Items Pack/armor/common/armor_legs_common_1.png" alt="Legs" className={iconStyle} />
      case 'boots': 
        return <img src="/Items Pack/armor/common/armor_boots_common_1.png" alt="Boots" className={iconStyle} />
      case 'gloves': 
        return <img src="/Items Pack/armor/common/armor_gloves_common_1.png" alt="Gloves" className={iconStyle} />
      case 'weapon': 
        return <img src="/Items Pack/weapons/common/sword_common_1.png" alt="Weapon" className={iconStyle} />
      case 'accessory': 
        return <img src="/Items Pack/items/Necklace_of_the_Eternal_Wind.png" alt="Accessory" className={iconStyle} />
      default: 
        return <Package className="h-4 w-4" />
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

  const canBuyItem = (item: Item) => {
    return userGold >= item.price && userLevel >= item.levelRequired
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 w-96 z-50">
      <div className="p-4" style={{
        background: '#d4af37',
        border: '4px solid #8b4513',
        borderRadius: '0',
        boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
      }}>
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-amber-300" />
              <h3 className="text-lg font-bold pixel-text text-center text-accent border-b-2 border-accent pb-2">
                BLACKSMITH SHOP
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-amber-300 hover:text-amber-100 text-xl font-bold"
            >
              ×
            </button>
          </div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-400" />
              <span className="text-amber-200 font-mono text-sm">
                Gold: {userGold}
              </span>
            </div>
            <div className="text-amber-200 font-mono text-sm">
              Level: {userLevel}
            </div>
          </div>
          <div className="text-amber-200 font-mono text-xs mb-3">
            Equipment up to level 7 available
          </div>
        </div>

        <div className="px-4 pb-4" style={{borderRadius: '0'}}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-amber-800" style={{borderRadius: '0'}}>
              <TabsTrigger 
                value="buy" 
                className="font-mono text-sm"
                style={{borderRadius: '0'}}
              >
                Buy
              </TabsTrigger>
              <TabsTrigger 
                value="sell" 
                className="font-mono text-sm"
                style={{borderRadius: '0'}}
              >
                Sell
              </TabsTrigger>
            </TabsList>

            <TabsContent value="buy" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
                  <span className="ml-3 text-amber-200 font-mono">Loading shop...</span>
                </div>
              ) : shopItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-amber-200 font-mono">No items available</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {shopItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-secondary/30 border border-muted p-2 text-destructive font-bold"
                      style={{borderRadius: '0'}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getEquipmentSlotIcon(item.equipmentSlot)}
                          <div>
                            <h3 className="font-bold pixel-text text-sm text-destructive">
                              {item.name}
                            </h3>
                            <p className="text-xs pixel-text text-destructive">
                              {item.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                className={`text-xs font-mono ${getRarityColor(item.rarity)}`}
                                style={{borderRadius: '0'}}
                              >
                                {item.rarity}
                              </Badge>
                              <span className="text-xs pixel-text text-destructive">
                                Lvl {item.levelRequired}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="space-y-1">
                            {Object.entries(item.statBonuses).map(([stat, bonus]) => (
                              <div key={stat} className="flex items-center space-x-1 text-destructive text-xs">
                                {getStatIcon(stat)}
                                <span>+{bonus}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <Coins className="h-3 w-3 text-yellow-400" />
                              <span className="text-xs pixel-text text-destructive">
                                {item.price}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleBuyItem(item)}
                              disabled={!canBuyItem(item)}
                              className={`text-xs font-mono ${
                                canBuyItem(item)
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              }`}
                              style={{borderRadius: '0'}}
                            >
                              Buy
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="sell" className="mt-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div>
                  <span className="ml-3 text-amber-200 font-mono">Loading inventory...</span>
                </div>
              ) : playerInventory.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-amber-400 mx-auto mb-4" />
                  <p className="text-amber-200 font-mono">No items to sell</p>
                  <p className="text-amber-300 font-mono text-sm mt-2">
                    Check your inventory!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {playerInventory.map((inventoryItem) => (
                    <div
                      key={inventoryItem.id}
                      className="bg-secondary/30 border border-muted p-2 text-destructive font-bold"
                      style={{borderRadius: '0'}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getEquipmentSlotIcon(inventoryItem.item.equipmentSlot)}
                          <div>
                            <h3 className="font-bold pixel-text text-sm text-destructive">
                              {inventoryItem.item.name}
                            </h3>
                            <p className="text-xs pixel-text text-destructive">
                              {inventoryItem.item.description}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge 
                                className={`text-xs font-mono ${getRarityColor(inventoryItem.item.rarity)}`}
                                style={{borderRadius: '0'}}
                              >
                                {inventoryItem.item.rarity}
                              </Badge>
                              <span className="text-xs pixel-text text-destructive">
                                Lvl {inventoryItem.item.levelRequired}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="space-y-1">
                            {Object.entries(inventoryItem.item.statBonuses).map(([stat, bonus]) => (
                              <div key={stat} className="flex items-center space-x-1 text-destructive text-xs">
                                {getStatIcon(stat)}
                                <span>+{bonus}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <Coins className="h-3 w-3 text-yellow-400" />
                              <span className="text-xs pixel-text text-destructive">
                                {Math.floor(inventoryItem.item.price * 0.5)}
                              </span>
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={() => handleSellItem(inventoryItem)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-mono"
                              style={{borderRadius: '0'}}
                            >
                              Sell
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

