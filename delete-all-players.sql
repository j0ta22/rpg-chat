-- =====================================================
-- 🗑️ DELETE ALL PLAYERS AND RELATED DATA
-- =====================================================
-- This script will completely clean the database of all player data
-- Use with caution - this action is IRREVERSIBLE
-- =====================================================

-- ⚠️ WARNING: This will delete ALL player data permanently
-- Make sure you have a backup if needed

-- =====================================================
-- 1. DISABLE RLS TEMPORARILY (if needed)
-- =====================================================
-- Some tables might have RLS that prevents deletion
-- Uncomment if you get permission errors:

-- ALTER TABLE public.saved_players DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.players DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.combats DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.player_inventory DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. DELETE COMBAT DATA FIRST (due to foreign keys)
-- =====================================================

-- Delete all combat records
DELETE FROM public.combats;
-- Note: This will delete all combat history

-- =====================================================
-- 3. DELETE PLAYER INVENTORY DATA
-- =====================================================

-- Delete all player inventory items
DELETE FROM public.player_inventory;
-- Note: This will delete all player equipment and items

-- =====================================================
-- 4. DELETE SAVED PLAYERS
-- =====================================================

-- Delete all saved players
DELETE FROM public.saved_players;
-- Note: This will delete all character data

-- =====================================================
-- 5. DELETE PLAYERS TABLE DATA
-- =====================================================

-- Delete all players
DELETE FROM public.players;
-- Note: This will delete all player characters and their stats

-- =====================================================
-- 6. RESET USERS TABLE (OPTIONAL)
-- =====================================================
-- Uncomment if you also want to reset user accounts:

-- DELETE FROM public.users;
-- Note: This will delete all user accounts

-- =====================================================
-- 7. RESET SEQUENCES (OPTIONAL)
-- =====================================================
-- Reset auto-increment sequences to start from 1:

-- ALTER SEQUENCE IF EXISTS players_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS saved_players_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS combats_id_seq RESTART WITH 1;

-- =====================================================
-- 8. RE-ENABLE RLS (if disabled)
-- =====================================================
-- Re-enable RLS after cleanup:

-- ALTER TABLE public.saved_players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.combats ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the cleanup was successful:

-- Check players table
SELECT COUNT(*) as remaining_players FROM public.players;

-- Check saved_players table  
SELECT COUNT(*) as remaining_saved_players FROM public.saved_players;

-- Check combats table
SELECT COUNT(*) as remaining_combats FROM public.combats;

-- Check player_inventory table
SELECT COUNT(*) as remaining_inventory FROM public.player_inventory;

-- Check users table (if not deleted)
SELECT COUNT(*) as remaining_users FROM public.users;

-- =====================================================
-- 10. CLEANUP COMPLETE
-- =====================================================
-- All player data has been removed from the database
-- The game will start fresh with no existing players
-- New players can be created normally

-- =====================================================
-- 📝 NOTES:
-- =====================================================
-- - All combat history has been deleted
-- - All player characters have been deleted  
-- - All inventory items have been deleted
-- - All rankings and statistics have been reset
-- - The database is now clean and ready for new players
-- - Items catalog (if exists) is preserved
-- - Game configuration is preserved
-- =====================================================
