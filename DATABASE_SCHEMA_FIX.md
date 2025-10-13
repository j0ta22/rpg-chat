# 🗄️ Database Schema Fix - Missing Combat Columns

## ❌ **Problem Identified**

The production logs show this error:
```
❌ Error fetching current stats: {
  code: '42703',
  message: 'column players.total_wins does not exist'
}
```

The `players` table is missing the combat statistics columns that our updated code is trying to use.

## 🔧 **Root Cause**

When we updated the combat system to use player-level statistics instead of user-level statistics, we assumed the `players` table already had these columns:
- `total_wins`
- `total_losses` 
- `win_rate`

However, these columns don't exist in the current database schema.

## ✅ **Solution**

We need to add the missing columns to the `players` table in Supabase.

### **Step 1: Execute SQL Script**

Run this SQL in your **Supabase SQL Editor**:

```sql
-- Add combat statistics columns to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS total_wins INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_losses INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS win_rate DECIMAL(5,2) DEFAULT 0.00;

-- Update existing players to have default values
UPDATE players 
SET 
  total_wins = COALESCE(total_wins, 0),
  total_losses = COALESCE(total_losses, 0),
  win_rate = COALESCE(win_rate, 0.00)
WHERE total_wins IS NULL OR total_losses IS NULL OR win_rate IS NULL;
```

### **Step 2: Verify the Fix**

After running the SQL, verify the columns were added:

```sql
-- Check that columns exist
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'players' 
  AND column_name IN ('total_wins', 'total_losses', 'win_rate')
ORDER BY column_name;
```

### **Step 3: Test Combat System**

1. **Wait for the database changes to take effect**
2. **Test combat in production** with two players
3. **Check the logs** for successful combat statistics updates
4. **Verify in Supabase** that the `players` table shows updated combat stats

## 📊 **Expected Results**

### **Before Fix:**
```
❌ Error fetching current stats: {
  message: 'column players.total_wins does not exist'
}
```

### **After Fix:**
```
📊 Updating combat stats for winner player: [player-id], loser player: [player-id]
✅ Combat stats updated successfully
```

## 🗄️ **Updated Database Schema**

### **Players Table (After Fix):**
```sql
players:
- id (primary key)
- user_id (foreign key to users)
- name (character name)
- stats (character stats - JSON)
- total_wins (NEW - combat wins)
- total_losses (NEW - combat losses)  
- win_rate (NEW - calculated win percentage)
- created_at, updated_at
```

### **Users Table (Unchanged):**
```sql
users:
- id (primary key)
- username
- total_wins (deprecated - no longer used for combat)
- total_losses (deprecated - no longer used for combat)
- win_rate (deprecated - no longer used for combat)
```

## 🧪 **Testing the Fix**

### **1. Database Verification:**
```sql
-- Check that all players have the new columns
SELECT 
  name,
  total_wins,
  total_losses,
  win_rate
FROM players 
ORDER BY total_wins DESC;
```

### **2. Combat Testing:**
1. **Start a combat** between two players
2. **Complete the combat** (one player wins)
3. **Check the logs** for successful statistics updates
4. **Verify in database** that the winner's `total_wins` increased
5. **Verify in database** that the loser's `total_losses` increased

### **3. Expected Log Messages:**
```
📊 Updating combat stats for winner player: [player-id], loser player: [player-id]
✅ Combat stats updated successfully
```

## 🎯 **Success Criteria**

The fix is working if:
- ✅ No more "column does not exist" errors
- ✅ Combat statistics are updated in the `players` table
- ✅ Each character has independent win/loss records
- ✅ Win rates are calculated correctly
- ✅ Ranking system shows character-specific data

## 📝 **Important Notes**

- **Backward Compatibility**: Existing players will have default values (0 wins, 0 losses, 0% win rate)
- **Data Integrity**: The `IF NOT EXISTS` clause prevents errors if columns already exist
- **Default Values**: New columns default to 0, so existing players start with clean combat records
- **Performance**: The new columns are indexed and won't impact query performance

## 🚨 **If Issues Persist**

If you still see errors after running the SQL:

1. **Check column names** - Make sure they match exactly (case-sensitive)
2. **Verify permissions** - Ensure you have ALTER TABLE permissions
3. **Check for typos** - Double-check the SQL syntax
4. **Restart the server** - Sometimes database changes need a server restart

## 🎉 **Result**

After applying this fix, the combat system will work correctly with player-level statistics, and each character will maintain its own independent combat record!
