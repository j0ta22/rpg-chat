# Combat System Enhancement Migration Guide

## Changes Made

### 1. Enhanced Damage Calculation
- **Before**: Fixed damage range (15-25) with simple block/dodge
- **After**: Stats-based damage with critical hits, defense reduction, and level bonuses

### 2. New Combat Actions
- **Attack**: Normal damage (100% base damage)
- **Strong Attack**: +50% damage, -25% next turn speed
- **Quick Attack**: -30% damage, +50% next turn speed
- **Block**: 75% damage reduction, +25% next turn defense
- **Dodge**: 50% chance to avoid damage, +50% next turn speed

### 3. Critical Hit System
- Base 5% critical chance
- +0.1% per speed point (max 10% bonus)
- +10% for dagger weapons
- +0.5% per level
- Critical hits deal 2x damage + special effects

### 4. Defense System
- 1% damage reduction per defense point
- Maximum 75% damage reduction
- Defense also increases block chance

### 5. Speed System
- Speed increases dodge chance (+0.2% per point)
- Speed increases critical chance (+0.1% per point)
- Maximum 60% dodge chance

### 6. Level Difference Bonus
- +5% damage per level difference
- Maximum 50% bonus, minimum -20% penalty

### 7. Weapon Types
- **Sword**: Normal damage (1.0x)
- **Axe**: +20% damage, -10% speed
- **Mace**: +15% damage, -5% speed
- **Spear**: -10% damage, +15% speed
- **Staff**: -20% damage, +25% speed, +magic
- **Dagger**: -15% damage, +20% speed, +10% crit

### 8. Elemental Effects
- Fire: Burning effect
- Ice: Frozen effect
- Lightning: Shocked effect
- Poison: Poisoned effect

## How to Test

1. **Start the enhanced server**:
   ```bash
   cd server
   node websocket-server.js
   ```

2. **Test combat with different equipment**:
   - Equip different weapons to see damage variations
   - Test with different armor to see defense effects
   - Try different level characters

3. **Verify new actions work**:
   - Strong Attack should deal more damage
   - Quick Attack should deal less damage
   - Block should reduce incoming damage
   - Dodge should have higher chance to avoid damage

## Rollback Instructions

If you need to rollback:

1. **Restore original server**:
   ```bash
   cd server
   mv websocket-server.js.backup websocket-server.js
   ```

2. **Restore original interface**:
   ```bash
   mv components/combat-interface.tsx.backup components/combat-interface.tsx
   ```

## Performance Notes

- Enhanced calculations add minimal overhead
- All calculations are done server-side for security
- Client only receives final damage results
- No additional network traffic

## Future Enhancements

- Status effects (burning, frozen, etc.)
- Combo system
- Special abilities
- Team combat
- Boss battles
