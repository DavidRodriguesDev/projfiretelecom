/**
 * src/app.js - Aplicação Fastify principal
 */

require('dotenv').config();

const Fastify = require('fastify');
const fastifyJwt = require('@fastify/jwt');
const fastifyCors = require('@fastify/cors');
const fastifySwagger = require('@fastify/swagger');
const fastifySwaggerUi = require('@fastify/swagger-ui');

const config = require('./config/config');
const { defineRelacionamentos } = require('./models/index');
const { iniciarAgendamentos } = require('./services/agendamentoService');
defineRelacionamentos();
iniciarAgendamentos();

// Importar rotas
const authRoutes = require('./routes/authRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const planoRoutes = require('./routes/planoRoutes');
const boletoRoutes = require('./routes/boletoRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Inicializar Fastify
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
  },
});

// Registrar plugins
app.register(fastifyCors, {
  origin: config.cors.origin,
  credentials: true,
});

app.register(fastifyJwt, {
  secret: config.jwt.secret,
  cookie: {
    cookieName: 'token',
    signed: false,
  },
  verify: {
    property: 'user',
  },
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Fire Telecom API',
      description: 'API REST para sistema de gestão de boletos',
      version: '1.0.0',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  exposeRoute: true,
});

app.register(fastifySwaggerUi, {
  routePrefix: '/api/docs',
  uiConfig: {
    deepLinking: false,
    displayRequestDuration: true,
    layout: 'BaseLayout',
  },
});

// Registrar rotas
app.register(authRoutes, { prefix: '/api' });
app.register(clienteRoutes, { prefix: '/api' });
app.register(planoRoutes, { prefix: '/api' });
app.register(boletoRoutes, { prefix: '/api' });
app.register(dashboardRoutes, { prefix: '/api' });

// Rota de health check
app.get('/health', async (request, reply) => {
  reply.send({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas Swagger
app.get('/openapi.json', async (request, reply) => {
  reply.send(fastifySwagger.swagger());
});

// Tratativa de erros
app.setNotFoundHandler((request, reply) => {
  reply.code(404).send({
    error: 'Rota não encontrada',
    code: 'NOT_FOUND',
    path: request.url,
    method: request.method,
  });
});

// Iniciar servidor
app.listen({ port: config.app.port, host: config.app.host }, (err, address) => {
  if (err) {
    console.error('❌ Erro ao iniciar servidor:', err);
    process.exit(1);
  }

  console.log(`✅ Servidor rodando em: ${address}`);
  console.log(`✅ Documentação da API: http://localhost:${config.app.port}/api/docs`);
});

module.exports = app;

// Handler global de erros - TEMPORÁRIO PARA DEBUG
app.setErrorHandler((error, request, reply) => {
  console.error('FASTIFY ERROR HANDLER:', error.message, error.stack);
  reply.code(500).send({ error: error.message });
});
