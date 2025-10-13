# 🔧 RLS Policy Debug Guide

## 🚨 **Problema Actual**

El error indica que la política RLS ya existe:
```
ERROR: 42710: policy "Users can update their own gold" for table "users" already exists
```

Esto significa que las políticas están configuradas, pero algo más está bloqueando las actualizaciones de oro.

## 🔍 **Pasos de Debug**

### **Paso 1: Verificar Estado Actual**

Ejecuta este SQL en **Supabase SQL Editor**:

```sql
-- 1. Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE tablename = 'users';

-- 2. Check all RLS policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'users';

-- 3. Check current user and gold
SELECT id, gold, updated_at 
FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
```

### **Paso 2: Probar Diferentes Enfoques**

Ejecuta el script `test-gold-update-approaches.sql`:

```sql
-- Test different update approaches
-- 1. Simple update
UPDATE users SET gold = 17 WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 2. Update with timestamp
UPDATE users SET gold = 18, updated_at = NOW() WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- 3. Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
UPDATE users SET gold = 20 WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Paso 3: Verificar Triggers y Constraints**

```sql
-- Check for triggers
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';

-- Check for constraints
SELECT constraint_name, constraint_type, column_name
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu 
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.table_name = 'users' AND ccu.column_name = 'gold';
```

### **Paso 4: Verificar Contexto de Usuario**

```sql
-- Check current user context
SELECT auth.uid() as current_user_id;

-- Check if the user ID matches
SELECT id, gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
```

## 🎯 **Posibles Causas**

### **1. Políticas RLS Conflictivas**
- Múltiples políticas pueden estar en conflicto
- Una política puede estar sobrescribiendo otra

### **2. Triggers de Base de Datos**
- Un trigger puede estar revirtiendo los cambios
- Un trigger puede estar bloqueando las actualizaciones

### **3. Constraints de Base de Datos**
- Un constraint puede estar validando el valor
- Un constraint puede estar rechazando la actualización

### **4. Contexto de Usuario**
- El usuario actual no coincide con el ID en la política
- La política RLS no está evaluando correctamente

## ✅ **Soluciones Posibles**

### **Solución 1: Limpiar y Recrear Políticas**

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "Users can update their own gold" ON users;
DROP POLICY IF EXISTS "Service role can update any user gold" ON users;

-- Create new policies
CREATE POLICY "Users can update their own gold" ON users
FOR UPDATE USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Test update
UPDATE users SET gold = 17 WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
```

### **Solución 2: Deshabilitar RLS Temporalmente**

```sql
-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Test update
UPDATE users SET gold = 17 WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';

-- If it works, the issue is with RLS policies
-- Re-enable RLS and fix policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### **Solución 3: Usar Service Role Key**

Si tienes acceso a la service role key:

```bash
# Add to .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Run test
node test-gold-update-service-role.js
```

## 🧪 **Testing**

### **Test 1: Verificar Políticas**
```sql
SELECT policyname, cmd, qual, with_check
FROM pg_policies WHERE tablename = 'users';
```

### **Test 2: Verificar RLS**
```sql
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables WHERE tablename = 'users';
```

### **Test 3: Verificar Actualización**
```sql
UPDATE users SET gold = 17 WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
SELECT gold FROM users WHERE id = 'c5e0e4a4-489f-4646-8216-dd5ff2c21a9d';
```

## 📊 **Resultado Esperado**

Después de aplicar la solución correcta:

- ✅ **Las actualizaciones de oro funcionan** en la base de datos
- ✅ **El oro se actualiza** cuando compras items
- ✅ **El oro persiste** al refrescar la página
- ✅ **No hay duplicación** de oro

## 🔧 **Archivos Creados**

- `debug-rls-policies.sql` - Script para debuggear políticas RLS
- `test-gold-update-approaches.sql` - Script para probar diferentes enfoques
- `test-gold-update-service-role.js` - Script para probar con service role
- `RLS_POLICY_DEBUG_GUIDE.md` - Esta guía de debug

## 🎉 **Conclusión**

El problema está en la configuración de RLS o en algún trigger/constraint de la base de datos. Una vez que identifiques y resuelvas la causa específica, el sistema de oro funcionará perfectamente. 🎮✨
