#!/bin/bash
echo "Iniciando Fire Telecom..."

echo "Iniciando Evolution API..."
cd /home/davidrsj/Documentos/projfiretelecom/evolution-api && npm start &
sleep 5

echo "Iniciando Backend..."
cd /home/davidrsj/Documentos/projfiretelecom/backend && node src/app.js &
sleep 2

echo "Iniciando Frontend..."
cd /home/davidrsj/Documentos/projfiretelecom/frontend && npm run dev
