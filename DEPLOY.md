# Deploy Instructions for RPG Chat

## Backend (Render)

### 1. Preparar el servidor para Render
```bash
cd server
npm install
```

### 2. Deploy en Render

1. **Crear cuenta en Render:**
fy y   - Ve a [render.com](https://render.com)
   - Conecta tu cuenta de GitHub

2. **Crear nuevo Web Service:**
   - Selecciona tu repositorio
   - Configura:
     - **Name**: `rpg-chat-server`
     - **Environment**: `Node`
     - **Build Command**: `npm install`
     - **Start Command**: `node index.js`
     - **Root Directory**: `server`

3. **Variables de entorno:**
   - `NODE_ENV=production`
   - `PORT=10000` (Render usa este puerto)

4. **Deploy:**
   - Render hará el build automáticamente
   - Tu servidor estará disponible en: `https://rpg-chat-server.onrender.com`

## Frontend (Netlify)

### 1. Deploy en Netlify

1. **Conectar repositorio a Netlify:**
   - Ve a [netlify.com](https://netlify.com)
   - Conecta tu repositorio de GitHub
   - Netlify detectará automáticamente que es Next.js

2. **Configurar variables de entorno:**
   - En Netlify Dashboard → Site settings → Environment variables
   - Agregar: `NEXT_PUBLIC_SERVER_URL=https://rpg-chat-mfru.onrender.com`
   - Agregar: `NODE_ENV=production`

3. **Deploy:**
   - Netlify hará el build automáticamente
   - El archivo `netlify.toml` ya está configurado

### 2. Actualizar URLs en el código

Después del deploy, actualiza las URLs en `lib/socket-multiplayer.ts`:
- Cambia `https://rpg-chat-mfru.onrender.com` por tu URL real de Render (ya actualizado)
- Cambia `https://dancing-banoffee-3f1566.netlify.app` por tu URL real de Netlify (ya actualizado)

## Estructura del Proyecto

```
rpg-chat/
├── components/          # Componentes React
├── lib/                # Lógica del juego y Socket.IO
├── server/             # Servidor Express + Socket.IO
│   ├── render.yaml     # Configuración de Render
│   └── Procfile        # Para Heroku (backup)
├── netlify.toml        # Configuración de Netlify
└── DEPLOY.md           # Este archivo
```

## Notas Importantes

- **Render Free Tier**: El servidor se "duerme" después de 15 minutos de inactividad
- **Primera conexión**: Puede tardar 30-60 segundos en despertar
- **CORS configurado**: Para el dominio de Netlify
- **Variables de entorno**: Configuradas para producción

## Comandos útiles

```bash
# Desarrollo local
cd server && npm run dev

# Build del frontend
npm run build

# Deploy manual a Netlify
npm run deploy:netlify
```

## URLs de ejemplo

- **Servidor**: `https://rpg-chat-mfru.onrender.com`
- **Frontend**: `https://dancing-banoffee-3f1566.netlify.app`
- **API**: `https://rpg-chat-mfru.onrender.com/api/state`
