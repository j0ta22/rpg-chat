const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Faltan variables de entorno de Supabase');
    console.log('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY configuradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyWinrateStorage() {
    console.log('🔍 Verificando el almacenamiento del winrate en Supabase...\n');

    try {
        // 1. Verificar estructura de la tabla users
        console.log('📊 1. Verificando estructura de la tabla users...');
        const { data: columns, error: columnsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable')
            .eq('table_name', 'users')
            .eq('table_schema', 'public');

        if (columnsError) {
            console.error('❌ Error al verificar estructura:', columnsError);
        } else {
            console.log('✅ Columnas de la tabla users:');
            columns.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
            });
        }

        // 2. Obtener estadísticas actuales de usuarios
        console.log('\n📈 2. Estadísticas actuales de usuarios...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, total_wins, total_losses, win_rate, created_at')
            .order('win_rate', { ascending: false });

        if (usersError) {
            console.error('❌ Error al obtener usuarios:', usersError);
        } else {
            console.log(`✅ Encontrados ${users.length} usuarios:`);
            users.slice(0, 10).forEach(user => {
                const totalCombats = (user.total_wins || 0) + (user.total_losses || 0);
                console.log(`   - ${user.username}: ${user.total_wins}W/${user.total_losses}L (${user.win_rate}%) - Total: ${totalCombats}`);
            });
        }

        // 3. Verificar combates registrados
        console.log('\n⚔️ 3. Verificando combates registrados...');
        const { data: combats, error: combatsError } = await supabase
            .from('combats')
            .select('id, player1_id, player2_id, winner_id, combat_date')
            .order('created_at', { ascending: false })
            .limit(20);

        if (combatsError) {
            console.error('❌ Error al obtener combates:', combatsError);
        } else {
            console.log(`✅ Últimos ${combats.length} combates:`);
            combats.forEach(combat => {
                console.log(`   - Combate ${combat.id}: P1(${combat.player1_id}) vs P2(${combat.player2_id}) - Ganador: ${combat.winner_id}`);
            });
        }

        // 4. Verificar consistencia de datos
        console.log('\n🔍 4. Verificando consistencia de datos...');
        
        for (const user of users.slice(0, 5)) { // Verificar solo los primeros 5 usuarios
            // Obtener combates donde el usuario participó
            const { data: userCombats, error: userCombatsError } = await supabase
                .from('combats')
                .select('id, player1_id, player2_id, winner_id')
                .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`);

            if (userCombatsError) {
                console.error(`❌ Error al obtener combates de ${user.username}:`, userCombatsError);
                continue;
            }

            const actualWins = userCombats.filter(combat => combat.winner_id === user.id).length;
            const actualLosses = userCombats.filter(combat => 
                combat.winner_id !== user.id && 
                (combat.player1_id === user.id || combat.player2_id === user.id)
            ).length;
            const actualTotal = actualWins + actualLosses;
            const actualWinRate = actualTotal > 0 ? Math.round((actualWins / actualTotal) * 100 * 100) / 100 : 0;

            const storedWins = user.total_wins || 0;
            const storedLosses = user.total_losses || 0;
            const storedWinRate = user.win_rate || 0;

            const isConsistent = storedWins === actualWins && storedLosses === actualLosses;

            console.log(`\n👤 ${user.username}:`);
            console.log(`   Almacenado: ${storedWins}W/${storedLosses}L (${storedWinRate}%)`);
            console.log(`   Calculado:  ${actualWins}W/${actualLosses}L (${actualWinRate}%)`);
            console.log(`   Estado: ${isConsistent ? '✅ CONSISTENTE' : '⚠️ INCONSISTENTE'}`);
            
            if (!isConsistent) {
                console.log(`   📝 Necesita actualización: wins=${actualWins}, losses=${actualLosses}, win_rate=${actualWinRate}`);
            }
        }

        // 5. Estadísticas generales
        console.log('\n📊 5. Estadísticas generales...');
        const { data: totalCombats, error: totalCombatsError } = await supabase
            .from('combats')
            .select('id', { count: 'exact' });

        const { data: activeUsers, error: activeUsersError } = await supabase
            .from('users')
            .select('id', { count: 'exact' })
            .or('total_wins.gt.0,total_losses.gt.0');

        if (!totalCombatsError && !activeUsersError) {
            console.log(`✅ Total de combates: ${totalCombats.length}`);
            console.log(`✅ Usuarios activos: ${activeUsers.length}`);
        }

        console.log('\n🎯 Verificación completada!');

    } catch (error) {
        console.error('❌ Error general:', error);
    }
}

// Ejecutar verificación
verifyWinrateStorage();
