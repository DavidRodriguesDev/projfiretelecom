#!/bin/bash
echo "🔄 Reiniciando Boleto Manager..."

# Mata processos nas portas
kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:5173) 2>/dev/null
kill -9 $(lsof -t -i:8080) 2>/dev/null
sleep 2

# Inicia Evolution API
echo "📱 Iniciando Evolution API..."
cd /home/davidrsj/Documentos/projfiretelecom/evolution-api && npm start &
sleep 5

# Inicia Backend
echo "⚙️  Iniciando Backend..."
cd /home/davidrsj/Documentos/projfiretelecom/backend && node src/app.js &
sleep 2

# Inicia Frontend
echo "🌐 Iniciando Frontend..."
cd /home/davidrsj/Documentos/projfiretelecom/frontend && npm run dev
