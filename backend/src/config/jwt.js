/**
 * jwt.js - Configuração e utilitários para JWT
 */

const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Gerar token JWT
 * @param {object} payload - Dados para incluir no token
 * @param {string} expiresIn - Tempo de expiração (ex: '7d')
 * @returns {string} Token JWT
 */
function generateToken(payload, expiresIn = config.jwt.expiresIn) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn,
  });
}

/**
 * Verify token JWT
 * @param {string} token - Token a ser verificado
 * @returns {object} - Payload decodificado
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

/**
 * Extrair dados do token sem verificar assinatura (apenas para debugging)
 * @param {string} token - Token JWT
 * @returns {object} - Payload
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

/**
 * Verificar se token está expirado
 * @param {string} token - Token JWT
 * @returns {boolean} - true se expirado
 */
function isTokenExpired(token) {
  try {
    const decoded = jwt.decode(token);
    if (!decoded || !decoded.exp) return true;
    return Date.now() >= decoded.exp * 1000;
  } catch (error) {
    return true;
  }
}

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  isTokenExpired,
};
