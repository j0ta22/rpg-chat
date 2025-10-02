-- Check what users exist in the database
SELECT 
    id,
    username,
    created_at,
    LENGTH(password_hash) as password_length
FROM users
ORDER BY created_at DESC;

-- Check if there are any users at all
SELECT COUNT(*) as total_users FROM users;

-- Check if there are any users in auth.users (Supabase auth table)
SELECT 
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;
