// Script para simular combates directamente en la base de datos
// Ejecutar en la consola del navegador cuando estés en la aplicación

console.log('⚔️ Simulando combates directamente en la base de datos...\n');

async function simulateCombatDirect() {
    try {
        // Buscar el cliente de Supabase desde el contexto de la aplicación
        let supabaseClient = null;
        
        // Intentar diferentes formas de acceder al cliente
        if (typeof window.supabase !== 'undefined') {
            supabaseClient = window.supabase;
        } else if (typeof window.__NEXT_DATA__ !== 'undefined') {
            // Buscar en el contexto de Next.js
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
            
            if (supabaseUrl && supabaseKey) {
                supabaseClient = createClient(supabaseUrl, supabaseKey);
            }
        }
        
        if (!supabaseClient) {
            console.error('❌ No se pudo encontrar cliente de Supabase');
            console.log('💡 Ejecuta este script desde la página principal de la aplicación');
            return;
        }

        console.log('✅ Cliente de Supabase encontrado');

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

        // 2. Simular varios combates
        console.log('\n2. Simulando combates...');
        const numCombats = Math.min(5, Math.floor(users.length / 2)); // Máximo 5 combates
        
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
                    combat_duration: Math.floor(Math.random() * 60) + 30, // 30-90 segundos
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
            await updateWinRateDirect(winner.id, supabaseClient);
            await updateWinRateDirect(loser.id, supabaseClient);
        }

        console.log('\n✅ Combates simulados completados!');
        console.log('🔄 Recarga la página para ver los cambios en el ranking');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Función para actualizar win rate
async function updateWinRateDirect(userId, supabaseClient) {
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

// Función para verificar resultados
async function checkResults() {
    try {
        let supabaseClient = window.supabase;
        if (!supabaseClient) {
            console.error('❌ Cliente de Supabase no disponible');
            return;
        }

        console.log('\n📊 Verificando resultados...');

        // Verificar combates
        const { data: combats, error: combatsError } = await supabaseClient
            .from('combats')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (combatsError) {
            console.error('❌ Error al obtener combates:', combatsError);
        } else {
            console.log(`✅ Combates en la base de datos: ${combats.length}`);
            combats.forEach(combat => {
                console.log(`   - ${combat.id}: P1(${combat.player1_id}) vs P2(${combat.player2_id}) - Ganador: ${combat.winner_id}`);
            });
        }

        // Verificar usuarios actualizados
        const { data: users, error: usersError } = await supabaseClient
            .from('users')
            .select('id, username, total_wins, total_losses, win_rate')
            .order('total_wins', { ascending: false });

        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError);
        } else {
            console.log('\n📈 Ranking actualizado:');
            users.forEach((user, index) => {
                console.log(`   ${index + 1}. ${user.username}: ${user.total_wins}W/${user.total_losses}L (${user.win_rate}%)`);
            });
        }

    } catch (error) {
        console.error('❌ Error al verificar resultados:', error);
    }
}

// Ejecutar simulación
simulateCombatDirect();

// Exportar funciones
window.simulateCombatDirect = simulateCombatDirect;
window.checkResults = checkResults;

console.log('\n📝 Funciones disponibles:');
console.log('   - simulateCombatDirect() - Simular combates');
console.log('   - checkResults() - Verificar resultados');
