// Configurações do sistema
require('dotenv').config();

/**
 * Configurações globais do sistema
 */
const config = {
  // Servidor
  app: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Banco de dados PostgreSQL
  database: {
    host: process.env.DATABASE_HOST || 'localhost',
    port: process.env.DATABASE_PORT || 5432,
    name: process.env.DATABASE_NAME || 'firetelecom',
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    dialect: 'postgres',
    logging: process.env.DATABASE_LOGGING !== 'false',
  },

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || '',
    url: process.env.REDIS_URL || '',
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'seu-super-segredo-senha-min-32-caracteres',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Gateway de pagamentos (Asaas)
  asaas: {
    apiKey: process.env.ASAAS_API_KEY,
    urlBase: process.env.ASAAS_URL_BASE || 'https://sandbox.asaas.com/api/v3',
    currency: 'BRL',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
  },

  // E-mail
  email: {
    type: process.env.EMAIL_TYPE || 'smtp', // 'smtp' ou 'sendgrid'
    smtp: {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASSWORD,
    },
    from: process.env.SMTP_FROM || 'noreply@firetelecom.com.br',
  },

  // WhatsApp
  whatsapp: {
    apiType: process.env.WHATSAPP_API_TYPE || 'evolution', // 'evolution' ou 'zapi'
    apiUrl: process.env.WHATSAPP_API_URL || 'http://localhost:8080',
    apiToken: process.env.WHATSAPP_API_TOKEN || '',
    numeroOrigem: process.env.WHATSAPP_NUMERO_ORIGEM || '',
  },

  // Agendamentos
  agendamento: {
    gerarBoletosDiaMes: parseInt(process.env.GERA_BOLETOS_DIA_MES, 10) || 1,
    enviarLembretesDiasAntes: parseInt(process.env.ENVIO_LEMBRETES_DIAS_ANTES, 10) || 2,
  },

  // Segurança
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
};

module.exports = config;
