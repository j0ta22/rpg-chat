-- =====================================================
-- 🧹 SAFE PLAYER DATA CLEANUP
-- =====================================================
-- This script safely deletes all player data while preserving:
-- - Database structure
-- - Items catalog
-- - Game configuration
-- - User accounts (optional)
-- =====================================================

-- =====================================================
-- 1. BACKUP VERIFICATION
-- =====================================================
-- Before running, verify you have backups if needed:

-- Check current data counts
SELECT 
    'players' as table_name, 
    COUNT(*) as record_count 
FROM public.players
UNION ALL
SELECT 
    'saved_players' as table_name, 
    COUNT(*) as record_count 
FROM public.saved_players
UNION ALL
SELECT 
    'combats' as table_name, 
    COUNT(*) as record_count 
FROM public.combats
UNION ALL
SELECT 
    'player_inventory' as table_name, 
    COUNT(*) as record_count 
FROM public.player_inventory;

-- =====================================================
-- 2. SAFE DELETION ORDER (respects foreign keys)
-- =====================================================

-- Step 1: Delete combat records (no dependencies)
DELETE FROM public.combats 
WHERE id IS NOT NULL;

-- Step 2: Delete player inventory (depends on players)
DELETE FROM public.player_inventory 
WHERE player_id IS NOT NULL;

-- Step 3: Delete saved players (depends on users)
DELETE FROM public.saved_players 
WHERE user_id IS NOT NULL;

-- Step 4: Delete players (main character data)
DELETE FROM public.players 
WHERE id IS NOT NULL;

-- =====================================================
-- 3. OPTIONAL: RESET USER ACCOUNTS
-- =====================================================
-- Uncomment the next line if you want to delete user accounts too:
-- DELETE FROM public.users WHERE id IS NOT NULL;

-- =====================================================
-- 4. VERIFICATION
-- =====================================================
-- Verify all data has been deleted:

SELECT 
    'players' as table_name, 
    COUNT(*) as remaining_records 
FROM public.players
UNION ALL
SELECT 
    'saved_players' as table_name, 
    COUNT(*) as remaining_records 
FROM public.saved_players
UNION ALL
SELECT 
    'combats' as table_name, 
    COUNT(*) as remaining_records 
FROM public.combats
UNION ALL
SELECT 
    'player_inventory' as table_name, 
    COUNT(*) as remaining_records 
FROM public.player_inventory;

-- =====================================================
-- 5. PRESERVE IMPORTANT DATA
-- =====================================================
-- These tables are preserved (not deleted):
-- - items (item catalog)
-- - users (user accounts - unless you deleted them)
-- - Any configuration tables
-- - Database structure and indexes

-- =====================================================
-- ✅ CLEANUP COMPLETE
-- =====================================================
-- The database is now clean and ready for new players
-- All game functionality will work normally
-- New players can be created and will start fresh
-- =====================================================
