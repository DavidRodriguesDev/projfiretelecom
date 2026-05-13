FROM node:18-alpine

WORKDIR /app

# Copiar arquivos
COPY package*.json ./
COPY src/ ./src/
COPY config/ ./config/
COPY sql/ ./sql/

# Instalar dependências
RUN npm ci --only=production

# Exportar variáveis de ambiente
ENV NODE_ENV=production
ENV PORT=3000

# Expor porta
EXPOSE 3000

# Comando
CMD ["node", "src/app.js"]
