/**
 * redis.js - Configuração do Redis para filas Bull e cache
 */

const Redis = require('ioredis');

/**
 * Criar instância do Redis
 * Suporta both URL-based e host/port-based conexões
 */
const createRedisClient = () => {
  const redisUrl = process.env.REDIS_URL;
  const host = process.env.REDIS_HOST || 'localhost';
  const port = process.env.REDIS_PORT || 6379;
  const password = process.env.REDIS_PASSWORD || '';

  if (redisUrl) {
    return new Redis(redisUrl);
  }

  return new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: 5,
    retryStrategy: (times) => {
      // Exponential backoff
      return Math.min(times * 50, 2000);
    },
    reconnectOnFail: true,
  });
};

// Criar instâncias separadas para filas e cache
const redisQueueClient = createRedisClient();
const redisCacheClient = createRedisClient();

/**
 * Fechar conexões
 */
async function closeConnections() {
  await redisQueueClient.quit();
  await redisCacheClient.quit();
}

/**
 * Obter instância para filas (Bull)
 */
function getQueueClient() {
  return redisQueueClient;
}

/**
 * Obter instância para cache
 */
function getCacheClient() {
  return redisCacheClient;
}

// Exportar instância para uso com Bull
module.exports = {
  redisQueueClient,
  redisCacheClient,
  closeConnections,
  getQueueClient,
  getCacheClient,
};
