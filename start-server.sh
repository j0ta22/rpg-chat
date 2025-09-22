#!/bin/bash

# Script para iniciar el servidor con configuración para acceso externo

echo "🚀 Iniciando servidor RPG Chat..."
echo "📡 Configurando para acceso externo..."

# Cambiar al directorio del servidor
cd server

# Instalar dependencias si es necesario
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
fi

# Mostrar la IP local
echo "🌐 Tu IP local es:"
ip addr show | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | cut -d/ -f1

echo ""
echo "🔧 Iniciando servidor en todas las interfaces..."
echo "📱 El servidor estará disponible en:"
echo "   - http://localhost:3001 (local)"
echo "   - http://TU_IP:3001 (externo)"
echo ""
echo "⚠️  Asegúrate de configurar la variable NEXT_PUBLIC_SERVER_URL en Netlify"
echo "   con tu IP local: http://TU_IP:3001"
echo ""

# Iniciar el servidor
HOST=0.0.0.0 npm run dev
