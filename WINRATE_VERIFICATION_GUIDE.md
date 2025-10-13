# Guía de Verificación del Winrate

## Opciones para verificar si los players están guardando su winrate correctamente

### 1. 🖥️ Verificación en el Navegador (Recomendado)

**Archivo:** `verify-winrate-browser.js`

**Pasos:**
1. Abre tu aplicación en el navegador
2. Abre la consola del desarrollador (F12)
3. Copia y pega el contenido del archivo `verify-winrate-browser.js`
4. Presiona Enter para ejecutar

**Funciones disponibles:**
- `verifyWinrateStorage()` - Verificar todas las estadísticas
- `updateUserStats(userId, wins, losses, winRate)` - Actualizar usuario específico
- `fixAllInconsistentStats()` - Corregir todas las inconsistencias

### 2. 🗄️ Verificación con SQL Directo

**Archivo:** `verify-winrate-sql.sql`

**Pasos:**
1. Ve a tu proyecto en Supabase
2. Abre el SQL Editor
3. Copia y pega el contenido del archivo `verify-winrate-sql.sql`
4. Ejecuta las consultas una por una

**Consultas incluidas:**
- Verificación de estructura de tabla
- Estadísticas actuales de usuarios
- Verificación de consistencia de datos
- Resumen de inconsistencias
- Últimos combates registrados
- Usuarios con estadísticas desactualizadas

### 3. 📊 Consulta Existente

**Archivo:** `check-combat-stats.sql`

Ya tienes una consulta completa que incluye:
- Estadísticas de usuarios
- Combates registrados
- Verificación de consistencia
- Top 10 jugadores
- Estadísticas por día

## ¿Qué verificar?

### ✅ Datos Consistentes
- `total_wins` coincide con combates ganados
- `total_losses` coincide con combates perdidos
- `win_rate` está calculado correctamente

### ⚠️ Posibles Problemas
- Estadísticas no se actualizan después de combates
- Cálculo incorrecto del winrate
- Datos duplicados o faltantes
- Problemas con triggers o funciones RPC

## Soluciones Comunes

### Si encuentras inconsistencias:

1. **Actualización Manual:**
   ```javascript
   // En la consola del navegador
   updateUserStats('user-id', wins, losses, winRate);
   ```

2. **Corrección Masiva:**
   ```javascript
   // En la consola del navegador
   fixAllInconsistentStats();
   ```

3. **Verificación de Triggers:**
   - Asegúrate de que los triggers se ejecuten después de insertar combates
   - Verifica que las funciones RPC estén funcionando

### Funciones RPC Recomendadas

Si no existen, crea estas funciones en Supabase:

```sql
-- Función para actualizar estadísticas de usuario
CREATE OR REPLACE FUNCTION update_user_ranking_stats(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE users SET
        total_wins = (
            SELECT COUNT(*) FROM combats 
            WHERE winner_id = user_id
        ),
        total_losses = (
            SELECT COUNT(*) FROM combats 
            WHERE (player1_id = user_id OR player2_id = user_id) 
            AND winner_id != user_id
        )
    WHERE id = user_id;
    
    UPDATE users SET
        win_rate = CASE 
            WHEN (total_wins + total_losses) > 0 THEN 
                ROUND((total_wins::decimal / (total_wins + total_losses)) * 100, 2)
            ELSE 0 
        END
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

## Próximos Pasos

1. **Ejecuta la verificación** usando cualquiera de los métodos
2. **Identifica inconsistencias** en los datos
3. **Corrige los problemas** encontrados
4. **Implementa triggers** si no existen
5. **Monitorea regularmente** el sistema

## Archivos Creados

- `verify-winrate-browser.js` - Script para navegador
- `verify-winrate-sql.sql` - Consultas SQL
- `verify-winrate-storage.js` - Script Node.js (requiere variables de entorno)
- `WINRATE_VERIFICATION_GUIDE.md` - Esta guía
