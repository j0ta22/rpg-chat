-- Migration to create users table and update players table
-- This implements user authentication system

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Add user_id column to players table
ALTER TABLE players 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- Create index for better performance when filtering by user_id
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);

-- Update existing players to have a default user (for backward compatibility)
-- First, create a default user if it doesn't exist
INSERT INTO users (id, username, password_hash, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'legacy_user',
  'legacy',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Update existing players to belong to the legacy user
UPDATE players 
SET user_id = '00000000-0000-0000-0000-000000000000'
WHERE user_id IS NULL;

-- Make user_id NOT NULL after updating existing records
ALTER TABLE players 
ALTER COLUMN user_id SET NOT NULL;

-- Drop old constraints and add new ones
ALTER TABLE players 
DROP CONSTRAINT IF EXISTS players_name_key;

ALTER TABLE players 
DROP CONSTRAINT IF EXISTS players_name_session_unique;

-- Add unique constraint on (name, user_id) to prevent duplicate names within same user
ALTER TABLE players 
ADD CONSTRAINT players_name_user_unique UNIQUE (name, user_id);

-- Drop session_id column as it's no longer needed
ALTER TABLE players 
DROP COLUMN IF EXISTS session_id;

-- Drop session_id index
DROP INDEX IF EXISTS idx_players_session_id;
