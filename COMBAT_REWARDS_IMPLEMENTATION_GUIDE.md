# Combat Rewards System Implementation Guide

## 🎯 New Combat Rewards System

### Gold Rewards
- **Base Gold**: 25 oro
- **Level Bonus**: +5 oro por nivel del ganador
- **Performance Bonus**: +10% oro por daño causado (máximo 20% extra)
- **Maximum Gold**: 100 oro por combate

### XP Rewards
- **Base XP**: 50 XP
- **Level Bonus**: +10 XP por nivel del ganador
- **Performance Bonus**: +0.5 XP por punto de daño causado
- **Survival Bonus**: +1 XP por segundo de duración del combate
- **Maximum XP**: 200 XP por combate

### Item Drops
- **Drop Chance**: 30% base chance de obtener un item
- **Rarity Probabilities**:
  - Common: 40% chance
  - Uncommon: 25% chance
  - Rare: 15% chance
  - Epic: 10% chance
  - Legendary: 5% chance

### XP Loss for Losers
- **Base Loss**: 20 XP
- **Level Penalty**: +5 XP perdido por nivel del perdedor
- **Level Difference Penalty**: +2 XP perdido por cada nivel de diferencia > 5
- **Maximum Loss**: 50 XP

### Level Difference Penalties
- **No Penalty**: Diferencia ≤ 5 niveles
- **No Rewards**: Diferencia > 5 niveles
  - Ganador: No recibe oro, XP, ni items
  - Perdedor: Pierde XP normal

## 🛠️ Technical Implementation

### Database Functions Added
1. `increment_user_gold(user_id, amount)` - Añade oro al usuario
2. `add_user_experience(user_id, xp_amount)` - Añade XP al usuario
3. `remove_user_experience(user_id, xp_amount)` - Remueve XP del usuario
4. `get_user_combat_stats(user_id)` - Obtiene stats de combate
5. `record_combat_result(...)` - Registra resultado completo del combate
6. `get_user_combat_history(user_id, limit)` - Obtiene historial de combates
7. `get_user_combat_stats_summary(user_id)` - Obtiene estadísticas de combate

### New Database Columns
- `combats.player1_level` - Nivel del jugador 1
- `combats.player2_level` - Nivel del jugador 2
- `combats.damage_dealt` - Daño total causado
- `combats.critical_hits` - Número de críticos
- `combats.gold_reward` - Oro otorgado
- `combats.xp_reward` - XP otorgado
- `combats.xp_loss` - XP perdido
- `combats.item_dropped_id` - ID del item obtenido
- `combats.level_difference` - Diferencia de nivel
- `combats.no_rewards` - Si no hubo recompensas

### New Components
- `CombatRewardsDisplay` - Muestra recompensas y penalizaciones
- `lib/combat-rewards-system.ts` - Sistema de cálculo de recompensas

## 🎮 How to Test

### 1. Execute Database Migration
```sql
-- Run the combat-rewards-migration.sql file in Supabase SQL Editor
```

### 2. Start Enhanced Server
```bash
cd server
node websocket-server.js
```

### 3. Test Combat Scenarios

#### Scenario 1: Normal Combat (Same Level)
- Two players of similar level fight
- Winner should receive gold, XP, and possible item
- Loser should lose some XP

#### Scenario 2: Level Difference > 5
- High level player vs low level player
- Winner should receive NO rewards
- Loser should lose normal XP

#### Scenario 3: High Performance Combat
- Player deals lots of damage
- Should receive bonus gold and XP
- Higher chance of better items

### 4. Verify Database Records
Check the `combats` table for:
- Proper level recording
- Damage tracking
- Reward calculations
- Penalty applications

## 📊 Expected Results

### Winner Rewards (Normal Combat)
- Gold: 25-100 (based on level and performance)
- XP: 50-200 (based on level and performance)
- Item: 30% chance, rarity based on probabilities

### Loser Penalties
- XP Loss: 20-50 (based on level and difference)
- No gold loss
- No item loss

### Level Difference > 5
- Winner: No rewards at all
- Loser: Normal XP loss
- Reason: "Diferencia de nivel muy grande"

## 🔧 Configuration

### Adjustable Constants
All reward values can be modified in `REWARDS_CONSTANTS`:

```javascript
const REWARDS_CONSTANTS = {
  BASE_GOLD: 25,           // Oro base
  LEVEL_BONUS_GOLD: 5,     // Oro por nivel
  MAX_GOLD: 100,           // Oro máximo
  BASE_XP: 50,             // XP base
  LEVEL_BONUS_XP: 10,      // XP por nivel
  MAX_XP: 200,             // XP máximo
  PENALTY_THRESHOLD: 5,    // Umbral de penalización
  // ... más constantes
}
```

## 🚀 Deployment Steps

1. **Backup Database**: Always backup before migration
2. **Run Migration**: Execute `combat-rewards-migration.sql`
3. **Update Server**: Deploy new WebSocket server
4. **Test Thoroughly**: Verify all scenarios work
5. **Monitor Performance**: Check database performance
6. **User Feedback**: Gather feedback on reward balance

## 🐛 Troubleshooting

### Common Issues
1. **No Rewards Given**: Check level difference calculation
2. **Wrong XP Loss**: Verify XP loss calculation
3. **Database Errors**: Check function permissions
4. **Item Not Added**: Verify inventory table structure

### Debug Commands
```sql
-- Check recent combats
SELECT * FROM combats ORDER BY created_at DESC LIMIT 10;

-- Check user stats
SELECT * FROM get_user_combat_stats_summary('user-id-here');

-- Check combat history
SELECT * FROM get_user_combat_history('user-id-here', 5);
```

## 📈 Future Enhancements

1. **Daily Combat Limits**: Prevent farming
2. **Streak Bonuses**: Consecutive win bonuses
3. **Achievement System**: Combat-based achievements
4. **Tournament Mode**: Special combat events
5. **Guild Wars**: Team-based combat rewards
