FROM node:18-alpine

WORKDIR /app

# Copiar arquivos
COPY package*.json ./
COPY src/ ./src/
COPY public/ ./public/
COPY index.html ./
COPY vite.config.js ./

# Instalar dependências e build
RUN npm ci --only=production
RUN npm run build

# Expor porta
EXPOSE 4173

# Comando
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
