-- List all usernames in the database
SELECT 
    id,
    username,
    created_at
FROM users
ORDER BY created_at DESC;
