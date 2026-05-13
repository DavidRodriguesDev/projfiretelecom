/**
 * middlewares/errorHandler.js - Middleware centralizado de erros
 */

/**
 * Handler de erros para Fastify
 * @param {object} error - Erro lançado
 * @param {object} request - Request Fastify
 * @param {object} reply - Reply Fastify
 */
async function errorHandler(error, request, reply) {
  // Log do erro para desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    console.error('Erro:', error);
  }

  // Resposta padrão
  const statusCode = error.statusCode || 500;
  const errorType = error.errorType || 'INTERNAL_ERROR';

  // Mensagens específicas por tipo
  const messages = {
    BAD_REQUEST: 'Requisição inválida',
    UNAUTHORIZED: 'Acesso não autorizado',
    FORBIDDEN: 'Acesso negado',
    NOT_FOUND: 'Recurso não encontrado',
    CONFLICT: 'Conflito de dados',
    INTERNAL_ERROR: 'Erro interno do servidor',
  };

  reply.code(statusCode).send({
    error: messages[errorType] || error.message || messages.INTERNAL_ERROR,
    code: errorType,
    details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
    path: request.url,
    method: request.method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Handler específico para erros de validação
 */
function validationErrorHandler(error) {
  return {
    errorType: 'BAD_REQUEST',
    statusCode: 400,
    message: error.message || 'Dados inválidos',
    details: error.validation || undefined,
  };
}

/**
 * Handler para erros de Autenticação
 */
function authErrorHandler(error) {
  return {
    errorType: 'UNAUTHORIZED',
    statusCode: 401,
    message: error.message || 'Token inválido ou expirado',
  };
}

/**
 * Handler para erros de Banco de Dados
 */
function databaseErrorHandler(error) {
  // Erros específicos do PostgreSQL/Sequelize
  if (error.name === 'SequelizeUniqueConstraintError') {
    return {
      errorType: 'CONFLICT',
      statusCode: 409,
      message: 'Registro já existente',
      details: error.errors,
    };
  }

  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return {
      errorType: 'CONFLICT',
      statusCode: 409,
      message: 'Registro referenciado por outro registro',
    };
  }

  if (error.name === 'SequelizeValidationError') {
    return {
      errorType: 'BAD_REQUEST',
      statusCode: 400,
      message: 'Validação falhou',
      details: error.errors,
    };
  }

  return {
    errorType: 'INTERNAL_ERROR',
    statusCode: 500,
    message: 'Erro no banco de dados',
  };
}

module.exports = {
  errorHandler,
  validationErrorHandler,
  authErrorHandler,
  databaseErrorHandler,
};
