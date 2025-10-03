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
  X,
  Crown,
  Shirt,
  Zap as Boots,
  Hand,
  Gem
} from "lucide-react"
import { 
  getPlayerInventory, 
  getUserEquipment,
  equipItem,
  unequipItem,
  sellItem,
  getInventorySize,
  canEquipItem,
  calculatePlayerStats,
  PlayerInventoryItem,
  Item,
  UserEquipment
} from "@/lib/combat-system"
import { supabase } from "@/lib/supabase"

interface AdvancedInventoryPanelProps {
  isVisible: boolean
  onClose: () => void
  userId: string
  userGold: number
  userLevel: number
  onGoldUpdate: (newGold: number) => void
  onStatsUpdate?: (newStats: any) => void
}

export default function AdvancedInventoryPanel({ 
  isVisible, 
  onClose, 
  userId, 
  userGold, 
  userLevel,
  onGoldUpdate,
  onStatsUpdate
}: AdvancedInventoryPanelProps) {
  const [inventory, setInventory] = useState<PlayerInventoryItem[]>([])
  const [equipment, setEquipment] = useState<UserEquipment>({
    helmet: null,
    chest: null,
    legs: null,
    boots: null,
    gloves: null,
    weapon: null,
    accessory: null
  })
  const [inventorySize, setInventorySize] = useState({ current: 0, max: 20 })
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
      const [inventoryData, equipmentData, sizeData] = await Promise.all([
        getPlayerInventory(userId),
        getUserEquipment(userId),
        getInventorySize(userId)
      ])
      setInventory(inventoryData)
      setEquipment(equipmentData)
      setInventorySize(sizeData)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const recalculateStats = async () => {
    if (!onStatsUpdate) return
    
    try {
      // Obtener los stats base del jugador desde la base de datos
      const { data: player, error } = await supabase
        .from('players')
        .select('stats')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error || !player) {
        console.error('Error fetching player stats:', error)
        return
      }

      // Calcular stats con bonuses de equipamiento
      const finalStats = await calculatePlayerStats(userId, player.stats)
      onStatsUpdate(finalStats)
    } catch (error) {
      console.error('Error recalculating stats:', error)
    }
  }

  const handleEquipItem = async (item: Item) => {
    const result = await equipItem(userId, item.id)
    if (result.success) {
      loadData() // Reload data
      recalculateStats() // Recalculate stats with equipment bonuses
    } else {
      alert(`Cannot equip item: ${result.reason}`)
    }
  }

  const handleUnequipItem = async (slot: string) => {
    const success = await unequipItem(userId, slot)
    if (success) {
      loadData() // Reload data
      recalculateStats() // Recalculate stats without equipment bonuses
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
        return <img src="/Items Pack/armor/common/leather_cap.png" alt="Helmet" className={iconStyle} />
      case 'chest': 
        return <img src="/Items Pack/armor/common/leather_jacket.png" alt="Chest" className={iconStyle} />
      case 'legs': 
        return <img src="/Items Pack/armor/common/leather_pants.png" alt="Legs" className={iconStyle} />
      case 'boots': 
        return <img src="/Items Pack/armor/common/leather_boots.png" alt="Boots" className={iconStyle} />
      case 'gloves': 
        return <img src="/Items Pack/armor/common/leather_gloves.png" alt="Gloves" className={iconStyle} />
      case 'weapon': 
        return <img src="/Items Pack/weapons/common/short_sword.png" alt="Weapon" className={iconStyle} />
      case 'accessory': 
        return <img src="/Items Pack/items/power_ring.png" alt="Accessory" className={iconStyle} />
      default: 
        return <Package className="h-4 w-4" />
    }
  }

  const getItemIcon = (item: Item) => {
    const iconStyle = "h-6 w-6 object-contain"
    
    // Si el item tiene iconUrl, usarlo directamente
    if (item.iconUrl) {
      return <img src={item.iconUrl} alt={item.name} className={iconStyle} />
    }
    
    // Si no tiene iconUrl, mapear según tipo y rareza
    const getAssetPath = (itemType: string, rarity: string, equipmentSlot: string) => {
      const rarityPath = rarity.toLowerCase()
      
      switch (itemType) {
        case 'weapon':
          switch (equipmentSlot) {
            case 'weapon':
              // Mapear según el nombre del item para mayor variedad
              const weaponName = item.name.toLowerCase()
              
              if (weaponName.includes('sword') || weaponName.includes('blade')) {
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/rusty_sword.png'
                  case 'uncommon': return '/Items Pack/weapons/uncommon/steel_sword.png'
                  case 'rare': return '/Items Pack/weapons/rare/claymore.png'
                  case 'epic': return '/Items Pack/weapons/epic/dragon_slayer_sword.png'
                  case 'legendary': return '/Items Pack/weapons/legendary/excalibur.png'
                  default: return '/Items Pack/weapons/common/rusty_sword.png'
                }
              } else if (weaponName.includes('axe') || weaponName.includes('hatchet')) {
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/battle_axe.png'
                  case 'uncommon': return '/Items Pack/weapons/uncommon/berserker_axe.png'
                  case 'rare': return '/Items Pack/weapons/rare/berserker_war_axe.png'
                  case 'epic': return '/Items Pack/weapons/epic/brutal_war_axe.png'
                  case 'legendary': return '/Items Pack/weapons/legendary/warlord_battle_axe.png'
                  default: return '/Items Pack/weapons/common/battle_axe.png'
                }
              } else if (weaponName.includes('mace') || weaponName.includes('hammer')) {
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/war_hammer.png'
                  case 'uncommon': return '/Items Pack/weapons/uncommon/maul.png'
                  case 'rare': return '/Items Pack/weapons/rare/flanged_mace.png'
                  case 'epic': return '/Items Pack/weapons/epic/thunder_hammer.png'
                  case 'legendary': return '/Items Pack/weapons/legendary/molten_war_mace.png'
                  default: return '/Items Pack/weapons/common/war_hammer.png'
                }
              } else if (weaponName.includes('dagger') || weaponName.includes('knife')) {
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/iron_dagger.png'
                  case 'uncommon': return '/Items Pack/weapons/uncommon/iron_dagger.png'
                  case 'rare': return '/Items Pack/weapons/rare/rapier.png'
                  case 'epic': return '/Items Pack/weapons/epic/kris_dagger.png'
                  case 'legendary': return '/Items Pack/weapons/legendary/dragon_slayer.png'
                  default: return '/Items Pack/weapons/common/iron_dagger.png'
                }
              } else if (weaponName.includes('spear') || weaponName.includes('lance')) {
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/hunting_spear.png'
                  case 'uncommon': return '/Items Pack/weapons/uncommon/iron_spear.png'
                  case 'rare': return '/Items Pack/weapons/rare/zweihander.png'
                  case 'epic': return '/Items Pack/weapons/epic/lava_war_axe.png'
                  case 'legendary': return '/Items Pack/weapons/legendary/dragon_slayer.png'
                  default: return '/Items Pack/weapons/common/hunting_spear.png'
                }
              } else if (weaponName.includes('staff') || weaponName.includes('wand')) {
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/wooden_staff.png'
                  case 'uncommon': return '/Items Pack/weapons/common/wooden_staff.png'
                  case 'rare': return '/Items Pack/weapons/common/wooden_staff.png'
                  case 'epic': return '/Items Pack/weapons/common/wooden_staff.png'
                  case 'legendary': return '/Items Pack/weapons/common/wooden_staff.png'
                  default: return '/Items Pack/weapons/common/wooden_staff.png'
                }
              } else {
                // Fallback por rareza
                switch (rarityPath) {
                  case 'common': return '/Items Pack/weapons/common/short_sword.png'
                  case 'uncommon': return '/Items Pack/weapons/uncommon/longsword.png'
                  case 'rare': return '/Items Pack/weapons/rare/broadsword.png'
                  case 'epic': return '/Items Pack/weapons/epic/dragon_slayer_sword.png'
                  case 'legendary': return '/Items Pack/weapons/legendary/excalibur.png'
                  default: return '/Items Pack/weapons/common/short_sword.png'
                }
              }
            default: return '/Items Pack/weapons/common/short_sword.png'
          }
        case 'armor':
          switch (equipmentSlot) {
            case 'helmet':
              switch (rarityPath) {
                case 'common': return '/Items Pack/armor/common/leather_cap.png'
                case 'uncommon': return '/Items Pack/armor/uncommon/chainmail_coif.png'
                case 'rare': return '/Items Pack/armor/rare/platemail_helmet.png'
                case 'epic': return '/Items Pack/armor/epic/dragon_scale_helmet.png'
                case 'legendary': return '/Items Pack/armor/legendary/crown_of_kings.png'
                default: return '/Items Pack/armor/common/leather_cap.png'
              }
            case 'chest':
              switch (rarityPath) {
                case 'common': return '/Items Pack/armor/common/leather_jacket.png'
                case 'uncommon': return '/Items Pack/armor/uncommon/chainmail_jacket.png'
                case 'rare': return '/Items Pack/armor/rare/platemail.png'
                case 'epic': return '/Items Pack/armor/epic/dragon_scale_armor.png'
                case 'legendary': return '/Items Pack/armor/legendary/armor_of_ancients.png'
                default: return '/Items Pack/armor/common/leather_jacket.png'
              }
            case 'legs':
              switch (rarityPath) {
                case 'common': return '/Items Pack/armor/common/leather_pants.png'
                case 'uncommon': return '/Items Pack/armor/uncommon/chainmail_pants.png'
                case 'rare': return '/Items Pack/armor/rare/platemail_pants.png'
                case 'epic': return '/Items Pack/armor/epic/dragon_scale_leggings.png'
                case 'legendary': return '/Items Pack/armor/legendary/leggings_of_power.png'
                default: return '/Items Pack/armor/common/leather_pants.png'
              }
            case 'boots':
              switch (rarityPath) {
                case 'common': return '/Items Pack/armor/common/leather_boots.png'
                case 'uncommon': return '/Items Pack/armor/uncommon/chainmail_boots.png'
                case 'rare': return '/Items Pack/armor/rare/greaves.png'
                case 'epic': return '/Items Pack/armor/epic/dragon_scale_boots.png'
                case 'legendary': return '/Items Pack/armor/legendary/boots_of_swiftness.png'
                default: return '/Items Pack/armor/common/leather_boots.png'
              }
            case 'gloves':
              switch (rarityPath) {
                case 'common': return '/Items Pack/armor/common/leather_gloves.png'
                case 'uncommon': return '/Items Pack/armor/uncommon/chainmail_gloves.png'
                case 'rare': return '/Items Pack/armor/rare/gauntlets.png'
                case 'epic': return '/Items Pack/armor/epic/dragon_scale_gloves.png'
                case 'legendary': return '/Items Pack/armor/legendary/gauntlets_of_might.png'
                default: return '/Items Pack/armor/common/leather_gloves.png'
              }
            default: return '/Items Pack/armor/common/leather_jacket.png'
          }
        case 'accessory':
          // Mapear según el nombre del item para mayor variedad
          const accessoryName = item.name.toLowerCase()
          
          if (accessoryName.includes('crown') || accessoryName.includes('tiara') || accessoryName.includes('diadem')) {
            return '/Items Pack/items/crown.png'
          } else if (accessoryName.includes('ring') || accessoryName.includes('band')) {
            return '/Items Pack/items/power_ring.png'
          } else if (accessoryName.includes('necklace') || accessoryName.includes('amulet') || accessoryName.includes('pendant')) {
            return '/Items Pack/items/Necklace_of_the_Eternal_Wind.png'
          } else {
            // Fallback por rareza
            switch (rarityPath) {
              case 'common': return '/Items Pack/items/power_ring.png'
              case 'uncommon': return '/Items Pack/items/power_ring.png'
              case 'rare': return '/Items Pack/items/Necklace_of_the_Eternal_Wind.png'
              case 'epic': return '/Items Pack/items/Necklace_of_the_Eternal_Wind.png'
              case 'legendary': return '/Items Pack/items/crown.png'
              default: return '/Items Pack/items/power_ring.png'
            }
          }
        default:
          return '/Items Pack/items/power_ring.png'
      }
    }
    
    const assetPath = getAssetPath(item.itemType, item.rarity, item.equipmentSlot)
    return <img src={assetPath} alt={item.name} className={iconStyle} />
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

  const canEquipItemLocal = (item: Item) => {
    const canEquip = userLevel >= item.levelRequired
    console.log('🔍 canEquipItemLocal check:', {
      itemName: item.name,
      userLevel,
      requiredLevel: item.levelRequired,
      canEquip,
      equipmentSlot: item.equipmentSlot
    })
    return canEquip
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-4 left-4 w-96 z-50">
      <div className="p-4" style={{
        background: '#d4af37',
        border: '4px solid #8b4513',
        borderRadius: '0',
        boxShadow: 'inset 2px 2px 0px #654321, inset -2px -2px 0px #654321'
      }}>
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Package className="h-6 w-6 text-amber-300" />
              <h3 className="text-lg font-bold pixel-text text-center text-accent border-b-2 border-accent pb-2">
                ADVANCED INVENTORY
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
            Inventory: {inventorySize.current}/{inventorySize.max}
          </div>
        </div>

        <div className="px-4 pb-4" style={{borderRadius: '0'}}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 bg-amber-800" style={{borderRadius: '0'}}>
              <TabsTrigger 
                value="inventory" 
                className="font-mono text-sm"
                style={{borderRadius: '0'}}
              >
                Inventory
              </TabsTrigger>
              <TabsTrigger 
                value="equipment" 
                className="font-mono text-sm"
                style={{borderRadius: '0'}}
              >
                Equipment
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
                    Visit NPCs to buy items!
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {inventory.map((inventoryItem) => (
                    <div
                      key={inventoryItem.id}
                      className="bg-secondary/30 border border-muted p-2 text-destructive font-bold"
                      style={{borderRadius: '0'}}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getItemIcon(inventoryItem.item)}
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
                            {inventoryItem.item.statBonuses && Object.entries(inventoryItem.item.statBonuses).map(([stat, bonus]) => (
                              <div key={stat} className="flex items-center space-x-1 text-destructive text-xs">
                                {getStatIcon(stat)}
                                <span>+{bonus}</span>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex space-x-1 mt-2">
                            {inventoryItem.item.equipmentSlot !== 'consumable' && (
                              <Button
                                size="sm"
                                onClick={() => handleEquipItem(inventoryItem.item)}
                                disabled={!canEquipItemLocal(inventoryItem.item)}
                                className={`text-xs font-mono ${
                                  canEquipItemLocal(inventoryItem.item)
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                }`}
                                style={{borderRadius: '0'}}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Equip
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              onClick={() => handleSellItem(inventoryItem)}
                              className="bg-red-600 hover:bg-red-700 text-white text-xs font-mono"
                              style={{borderRadius: '0'}}
                            >
                              <Coins className="h-3 w-3 mr-1" />
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

            <TabsContent value="equipment" className="mt-4">
              <div className="space-y-4">
                {Object.entries(equipment).map(([slot, item]) => (
                  <div
                    key={slot}
                    className="bg-secondary/30 border border-muted p-3 text-destructive font-bold"
                    style={{borderRadius: '0'}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {item ? getItemIcon(item) : getEquipmentSlotIcon(slot)}
                        <div>
                          <h3 className="font-bold pixel-text text-sm text-destructive capitalize">
                            {slot}
                          </h3>
                          {item ? (
                            <div>
                              <p className="text-xs pixel-text text-destructive">
                                {item.name}
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
                          ) : (
                            <p className="text-xs pixel-text text-destructive">
                              Empty
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {item && (
                          <div className="space-y-1">
                            {item.statBonuses && Object.entries(item.statBonuses).map(([stat, bonus]) => (
                              <div key={stat} className="flex items-center space-x-1 text-destructive text-xs">
                                {getStatIcon(stat)}
                                <span>+{typeof bonus === 'number' ? bonus : 0}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {item && (
                          <Button
                            size="sm"
                            onClick={() => handleUnequipItem(slot)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-mono mt-2"
                            style={{borderRadius: '0'}}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Unequip
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

