/**
 * routes/authRoutes.js - Rotas de autenticação
 */

const bcrypt = require('bcrypt');
const jwt = require('../config/jwt');
const { Usuario } = require('../models/index');

/**
 * Rota de login
 * @param {Fastify} fastify - Instância do Fastify
 */
async function authRoutes(fastify) {
  // Login
  fastify.post('/auth/login', {
    schema: {
      tags: ['Autenticação'],
      summary: 'Realizar login no sistema',
      body: {
        type: 'object',
        required: ['email', 'senha'],
        properties: {
          email: { type: 'string', format: 'email' },
          senha: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            token: { type: 'string' },
            usuario: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                nome: { type: 'string' },
                email: { type: 'string' },
                cargo: { type: 'string' },
              },
            },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { email, senha } = request.body;

    // Buscar usuário
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return reply.code(401).send({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return reply.code(401).send({
        error: 'Credenciais inválidas',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Gerar token
    const token = jwt.generateToken({
      id: usuario.id,
      email: usuario.email,
      role: usuario.cargo,
      nome: usuario.nome,
    });

    // Remover senha do retorno
    const usuarioResposta = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      cargo: usuario.cargo,
    };

    reply.send({
      token,
      usuario: usuarioResposta,
    });
  });

  // Logout
  fastify.post('/auth/logout', async (request, reply) => {
    // Para JWT Stateless, Não há necessidade de invalidar o token no servidor
    // O token permanecerá válido até expirar
    reply.send({
      message: 'Logout realizado com sucesso',
      code: 'LOGOUT_SUCCESS',
    });
  });

  // Refresh Token
  fastify.post('/auth/refresh', async (request, reply) => {
    const { token } = request.body;

    if (!token) {
      return reply.code(400).send({
        error: 'Token não fornecido',
        code: 'NO_TOKEN',
      });
    }

    try {
      const decoded = jwt.verifyToken(token);
      const novoToken = jwt.generateToken({
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        nome: decoded.nome,
      });

      reply.send({ token: novoToken });
    } catch (error) {
      return reply.code(401).send({
        error: 'Token inválido ou expirado',
        code: 'TOKEN_EXPIRED_OR_INVALID',
      });
    }
  });
}

module.exports = authRoutes;
