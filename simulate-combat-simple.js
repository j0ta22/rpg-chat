// Script simple para simular combates usando el cliente de Supabase existente
// Ejecutar en la consola del navegador cuando estés en la aplicación

console.log('⚔️ Simulando combates (VERSIÓN SIMPLE)...\n');

// Función para simular combates usando el cliente existente
async function simulateCombatSimple() {
    try {
        console.log('🔍 Buscando cliente de Supabase...');
        
        // Buscar el cliente de Supabase en diferentes ubicaciones posibles
        let supabaseClient = null;
        
        // Intentar acceder desde el contexto global
        if (typeof window !== 'undefined') {
            // Buscar en diferentes propiedades del window
            const possibleClients = [
                window.supabase,
                window.__supabase,
                window.__NEXT_DATA__?.props?.pageProps?.supabase,
                // Buscar en el contexto de React/Next.js
                document.querySelector('script[data-supabase]')?.dataset?.supabase
            ];
            
            for (const client of possibleClients) {
                if (client && typeof client.from === 'function') {
                    supabaseClient = client;
                    console.log('✅ Cliente de Supabase encontrado en window');
                    break;
                }
            }
        }
        
        if (!supabaseClient) {
            console.error('❌ No se pudo encontrar cliente de Supabase');
            console.log('💡 Intentando crear cliente desde variables de entorno...');
            
            // Intentar crear cliente desde variables de entorno
            try {
                const { createClient } = await import('@supabase/supabase-js');
                
                // Buscar variables de entorno en el contexto
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 
                                  window.location.origin.includes('netlify') ? 
                                  'https://your-project.supabase.co' : null;
                
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
                                  'your-anon-key';
                
                if (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project')) {
                    supabaseClient = createClient(supabaseUrl, supabaseKey);
                    console.log('✅ Cliente de Supabase creado desde variables de entorno');
                }
            } catch (e) {
                console.log('⚠️ No se pudo crear cliente desde variables de entorno');
            }
        }
        
        if (!supabaseClient) {
            console.error('❌ No se pudo encontrar o crear cliente de Supabase');
            console.log('💡 Solución alternativa: Usar consultas SQL directas en Supabase');
            console.log('📝 Ve a tu proyecto de Supabase > SQL Editor y ejecuta:');
            console.log(`
-- Simular combates directamente en SQL
INSERT INTO combats (player1_id, player2_id, winner_id, player1_stats, player2_stats, combat_duration, player1_level, player2_level, damage_dealt, critical_hits, gold_reward, xp_reward, xp_loss, level_difference, no_rewards)
SELECT 
    u1.id as player1_id,
    u2.id as player2_id,
    u1.id as winner_id,
    '{"level": 1, "health": 100, "attack": 10, "defense": 5, "speed": 5}'::jsonb as player1_stats,
    '{"level": 1, "health": 100, "attack": 10, "defense": 5, "speed": 5}'::jsonb as player2_stats,
    45 as combat_duration,
    1 as player1_level,
    1 as player2_level,
    75 as damage_dealt,
    1 as critical_hits,
    20 as gold_reward,
    50 as xp_reward,
    0 as xp_loss,
    0 as level_difference,
    false as no_rewards
FROM users u1, users u2
WHERE u1.id != u2.id
LIMIT 3;

-- Actualizar estadísticas de usuarios
UPDATE users SET 
    total_wins = total_wins + 1,
    updated_at = NOW()
WHERE id IN (
    SELECT winner_id FROM combats 
    WHERE created_at > NOW() - INTERVAL '1 minute'
);

UPDATE users SET 
    total_losses = total_losses + 1,
    updated_at = NOW()
WHERE id IN (
    SELECT CASE 
        WHEN player1_id = winner_id THEN player2_id 
        ELSE player1_id 
    END as loser_id
    FROM combats 
    WHERE created_at > NOW() - INTERVAL '1 minute'
);

-- Actualizar win rates
UPDATE users SET 
    win_rate = CASE 
        WHEN (total_wins + total_losses) > 0 THEN 
            ROUND((total_wins::decimal / (total_wins + total_losses)) * 100, 2)
        ELSE 0 
    END
WHERE total_wins > 0 OR total_losses > 0;
            `);
            return;
        }

        console.log('✅ Cliente de Supabase disponible');

        // 1. Obtener usuarios disponibles
        console.log('\n1. Obteniendo usuarios disponibles...');
        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('id, username, total_wins, total_losses, win_rate')
            .order('username');
        
        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError);
            return;
        }

        console.log(`✅ Encontrados ${users.length} usuarios:`);
        users.forEach(user => {
            console.log(`   - ${user.username}: ${user.total_wins}W/${user.total_losses}L (${user.win_rate}%)`);
        });

        if (users.length < 2) {
            console.error('❌ Se necesitan al menos 2 usuarios para simular combates');
            return;
        }

        // 2. Simular combates
        console.log('\n2. Simulando combates...');
        const numCombats = Math.min(3, Math.floor(users.length / 2)); // Máximo 3 combates
        
        for (let i = 0; i < numCombats; i++) {
            const player1 = users[i * 2];
            const player2 = users[(i * 2) + 1];
            const winner = Math.random() > 0.5 ? player1 : player2;
            const loser = winner === player1 ? player2 : player1;

            console.log(`\n⚔️ Combate ${i + 1}: ${player1.username} vs ${player2.username}`);
            console.log(`   Ganador: ${winner.username}`);

            // Insertar combate
            const { data: combat, error: combatError } = await supabaseClient
                .from('combats')
                .insert({
                    player1_id: player1.id,
                    player2_id: player2.id,
                    winner_id: winner.id,
                    player1_stats: { 
                        level: 1, 
                        health: 100, 
                        attack: 10, 
                        defense: 5,
                        speed: 5
                    },
                    player2_stats: { 
                        level: 1, 
                        health: 100, 
                        attack: 10, 
                        defense: 5,
                        speed: 5
                    },
                    combat_duration: Math.floor(Math.random() * 60) + 30,
                    player1_level: 1,
                    player2_level: 1,
                    damage_dealt: Math.floor(Math.random() * 100) + 50,
                    critical_hits: Math.floor(Math.random() * 3),
                    gold_reward: 20,
                    xp_reward: 50,
                    xp_loss: 0,
                    level_difference: 0,
                    no_rewards: false
                })
                .select()
                .single();

            if (combatError) {
                console.error(`❌ Error al insertar combate ${i + 1}:`, combatError);
                continue;
            }

            console.log(`   ✅ Combate insertado: ${combat.id}`);

            // Actualizar estadísticas del ganador
            const { error: winnerError } = await supabaseClient
                .from('users')
                .update({ 
                    total_wins: supabaseClient.raw('total_wins + 1'),
                    updated_at: new Date().toISOString()
                })
                .eq('id', winner.id);

            if (winnerError) {
                console.error(`❌ Error al actualizar estadísticas del ganador:`, winnerError);
            } else {
                console.log(`   ✅ Estadísticas del ganador actualizadas`);
            }

            // Actualizar estadísticas del perdedor
            const { error: loserError } = await supabaseClient
                .from('users')
                .update({ 
                    total_losses: supabaseClient.raw('total_losses + 1'),
                    updated_at: new Date().toISOString()
                })
                .eq('id', loser.id);

            if (loserError) {
                console.error(`❌ Error al actualizar estadísticas del perdedor:`, loserError);
            } else {
                console.log(`   ✅ Estadísticas del perdedor actualizadas`);
            }

            // Actualizar win rates
            await updateWinRateSimple(winner.id, supabaseClient);
            await updateWinRateSimple(loser.id, supabaseClient);
        }

        console.log('\n✅ Combates simulados completados!');
        console.log('🔄 Recarga la página para ver los cambios en el ranking');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Función para actualizar win rate
async function updateWinRateSimple(userId, supabaseClient) {
    try {
        const { data: user, error: userError } = await supabaseClient
            .from('users')
            .select('total_wins, total_losses')
            .eq('id', userId)
            .single();

        if (userError) {
            console.error('❌ Error al obtener usuario:', userError);
            return;
        }

        const totalCombats = (user.total_wins || 0) + (user.total_losses || 0);
        const winRate = totalCombats > 0 ? Math.round((user.total_wins / totalCombats) * 100 * 100) / 100 : 0;

        const { error: updateError } = await supabaseClient
            .from('users')
            .update({ win_rate: winRate })
            .eq('id', userId);

        if (updateError) {
            console.error('❌ Error al actualizar win rate:', updateError);
        } else {
            console.log(`   ✅ Win rate actualizado: ${winRate}%`);
        }
    } catch (error) {
        console.error('❌ Error en updateWinRate:', error);
    }
}

// Ejecutar simulación
simulateCombatSimple();

// Exportar funciones
window.simulateCombatSimple = simulateCombatSimple;

console.log('\n📝 Funciones disponibles:');
console.log('   - simulateCombatSimple() - Simular combates');
