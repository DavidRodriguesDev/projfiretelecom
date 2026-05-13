/**
 * middlewares/auth.js - Middleware de autenticação JWT
 */

const jwt = require('../config/jwt');
const { getSequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Verificar autenticação do usuário
 * @param {object} req - Request Fastify
 * @param {object} reply - Reply Fastify
 */
async function authMiddleware(request, reply) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    return reply.code(401).send({
      error: 'Token não fornecido',
      code: 'NO_TOKEN',
    });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return reply.code(401).send({
      error: 'Token inválido',
      code: 'INVALID_TOKEN_FORMAT',
    });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verifyToken(token);
    request.userId = decoded.id;
    request.userRole = decoded.role;
    request.userNome = decoded.nome;
  } catch (error) {
    return reply.code(401).send({
      error: 'Token inválido ou expirado',
      code: 'TOKEN_EXPIRED_OR_INVALID',
    });
  }
}

/**
 * Verificar permissões do usuário
 * @param {string[]} recursosPermitidos - Array de recursos permitidos
 */
function checkPermissions(...recursosPermitidos) {
  return async (request, reply) => {
    const sequelize = getSequelize();
    const { Usuario, PermissaoUsuario } = require('../models/index');

    // Admin tem acesso total
    if (request.userRole === 'ADMINISTRADOR') {
      return;
    }

    // Verificar permissões
    const permissoes = await PermissaoUsuario.findOne({
      where: {
        usuario_id: request.userId,
        recurso: { [Op.in]: recursosPermitidos },
      },
      attributes: ['permissoes'],
    });

    if (!permissoes) {
      return reply.code(403).send({
        error: 'Acesso negado. Permissões insuficientes',
        code: 'ACCESS_DENIED',
      });
    }

    // Se não tiver permissão de ESCRITA em recursos que exigem
    if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
      if (!permissoes.permissoes.includes('ESCRITA') && !permissoes.permissoes.includes('EXCLUSAO')) {
        return reply.code(403).send({
          error: 'Permissão de escrita necessary para esta ação',
          code: 'WRITE_ACCESS_DENIED',
        });
      }
    }
  };
}

/**
 * Middleware para validar se usuário existe
 */
async function validateUserExists(request, reply) {
  const sequelize = getSequelize();
  const { Usuario } = require('../models/index');

  const usuario = await Usuario.findByPk(request.userId);

  if (!usuario || !usuario.ativo) {
    return reply.code(401).send({
      error: 'Usuário não encontrado ou inativo',
      code: 'USER_NOT_FOUND',
    });
  }
}

module.exports = {
  authMiddleware,
  checkPermissions,
  validateUserExists,
};
