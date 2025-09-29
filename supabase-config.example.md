# Supabase Configuration

Para configurar la persistencia del progreso del jugador, necesitas:

## 1. Crear un proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una cuenta y un nuevo proyecto
3. Anota la URL del proyecto y la clave anónima

## 2. Crear el archivo .env.local

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
```

## 3. Configurar la base de datos

Ejecuta el siguiente SQL en el editor SQL de Supabase:

```sql
-- Crear tabla de jugadores (solo name, avatar y stats)
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  avatar TEXT NOT NULL,
  stats JSONB NOT NULL DEFAULT '{
    "level": 1,
    "experience": 0,
    "health": 100,
    "maxHealth": 100,
    "attack": 10,
    "defense": 5,
    "speed": 5
  }',
  last_saved TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices para mejor rendimiento
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_last_saved ON players(last_saved);

-- Habilitar RLS (Row Level Security)
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir lectura y escritura para todos por ahora)
CREATE POLICY "Allow all operations on players" ON players FOR ALL USING (true);
```

## 4. Instalar dependencias

```bash
npm install @supabase/supabase-js
```

## 5. Reiniciar el servidor de desarrollo

```bash
npm run dev
```
