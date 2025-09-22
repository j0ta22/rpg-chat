@echo off
echo 🚀 Iniciando servidor RPG Chat...
echo 📡 Configurando para acceso externo...

REM Cambiar al directorio del servidor
cd server

REM Instalar dependencias si es necesario
if not exist "node_modules" (
    echo 📦 Instalando dependencias...
    npm install
)

REM Mostrar la IP local
echo 🌐 Tu IP local es:
ipconfig | findstr "IPv4"

echo.
echo 🔧 Iniciando servidor en todas las interfaces...
echo 📱 El servidor estará disponible en:
echo    - http://localhost:3001 (local)
echo    - http://TU_IP:3001 (externo)
echo.
echo ⚠️  Asegúrate de configurar la variable NEXT_PUBLIC_SERVER_URL en Netlify
echo    con tu IP local: http://TU_IP:3001
echo.

REM Iniciar el servidor
set HOST=0.0.0.0
npm run dev
