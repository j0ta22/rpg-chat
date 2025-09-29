-- Migration to add session_id column to players table
-- This ensures each player can only access their own characters

-- Add session_id column to players table
ALTER TABLE players 
ADD COLUMN session_id TEXT;

-- Create index for better performance when filtering by session_id
CREATE INDEX idx_players_session_id ON players(session_id);

-- Update existing records to have a default session_id (for backward compatibility)
-- This will assign all existing players to a default session
UPDATE players 
SET session_id = 'legacy_session_' || id 
WHERE session_id IS NULL;

-- Make session_id NOT NULL after updating existing records
ALTER TABLE players 
ALTER COLUMN session_id SET NOT NULL;

-- Add unique constraint on (name, session_id) to prevent duplicate names within same session
-- This replaces the existing unique constraint on name only
ALTER TABLE players 
DROP CONSTRAINT IF EXISTS players_name_key;

ALTER TABLE players 
ADD CONSTRAINT players_name_session_unique UNIQUE (name, session_id);
