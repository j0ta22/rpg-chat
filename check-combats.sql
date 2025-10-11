-- Check if there are any combats in the database
SELECT COUNT(*) as total_combats FROM combats;

-- Check recent combats
SELECT 
    c.id,
    c.player1_id,
    c.player2_id,
    c.winner_id,
    c.combat_date,
    u1.username as player1_username,
    u2.username as player2_username,
    uw.username as winner_username
FROM combats c
LEFT JOIN users u1 ON u1.id = c.player1_id
LEFT JOIN users u2 ON u2.id = c.player2_id
LEFT JOIN users uw ON uw.id = c.winner_id
ORDER BY c.combat_date DESC
LIMIT 10;
