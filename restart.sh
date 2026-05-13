#!/bin/bash
echo "Reiniciando Fire Telecom..."

kill -9 $(lsof -t -i:3000) 2>/dev/null
kill -9 $(lsof -t -i:5173) 2>/dev/null
kill -9 $(lsof -t -i:8080) 2>/dev/null
sleep 2

echo "Iniciando Evolution API..."
cd /home/davidrsj/Documentos/projfiretelecom/evolution-api && npm start &
sleep 5

echo "Iniciando Backend..."
cd /home/davidrsj/Documentos/projfiretelecom/backend && node src/app.js &
sleep 2

echo "Iniciando Frontend..."
cd /home/davidrsj/Documentos/projfiretelecom/frontend && npm run dev
