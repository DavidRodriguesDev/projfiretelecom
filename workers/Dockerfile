FROM node:18-alpine

WORKDIR /app

# Copiar arquivos
COPY package*.json ./
COPY src/ ./src/

# Instalar dependências
RUN npm ci

# Comando
CMD ["node", "index.js"]
