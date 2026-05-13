/**
 * middlewares/validator.js - Middleware de validação com Ajv
 */

const Ajv = require('ajv');
const addFormats = require('ajv-formats');
const ajv = addFormats(new Ajv({ coerceTypes: true }));

/**
 * Validador de CPF/CNPJ
 * @param {string} valor - CPF ou CNPJ
 * @returns {boolean}
 */
function validarCpfCnpj(valor) {
  const limpo = valor.replace(/[^\d]/g, '');

  // CPF (11 dígitos)
  if (limpo.length === 11) {
    if (limpo === '00000000000' || limpo === '11111111111' ||
        limpo === '22222222222' || limpo === '33333333333' ||
        limpo === '44444444444' || limpo === '55555555555' ||
        limpo === '66666666666' || limpo === '77777777777' ||
        limpo === '88888888888' || limpo === '99999999999') {
      return false;
    }

    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(limpo[i]) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    if (resto >= 10) resto = 0;
    if (resto !== parseInt(limpo[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(limpo[i]) * (11 - i);
    }
    resto = 11 - (soma % 11);
    if (resto >= 10) resto = 0;
    return resto === parseInt(limpo[10]);
  }

  // CNPJ (14 dígitos)
  if (limpo.length === 14) {
    if (limpo === '00000000000000' || limpo === '11111111111111' ||
        limpo === '22222222222222' || limpo === '33333333333333' ||
        limpo === '44444444444444' || limpo === '55555555555555' ||
        limpo === '66666666666666' || limpo === '77777777777777' ||
        limpo === '88888888888888' || limpo === '99999999999999') {
      return false;
    }

    let tamanho = limpo.length - 2;
    let numeros = limpo.substring(0, tamanho);
    const digitos = limpo.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = limpo.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += numeros.charAt(tamanho - i) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === digitos.charAt(1);
  }

  return false;
}

/**
 * Schema de validação para clientes
 */
const schemaClienteCreate = {
  type: 'object',
  required: ['nome_completo', 'cpf_cnpj', 'plano_id', 'dia_vencimento'],
  properties: {
    nome_completo: { type: 'string', minLength: 3, maxLength: 255 },
    razao_social: { type: 'string', maxLength: 255 },
    cpf_cnpj: { type: 'string', pattern: '^(\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}|\\d{2}\\.?\\d{3}\\.?\\d{3}\\/?\\d{4}-?\\d{2})$' },
    rg_ie: { type: 'string', maxLength: 50 },
    data_nascimento: { type: 'string', format: 'date' },
    status: { type: 'string', enum: ['ATIVO', 'INADIMPLENTE', 'CANCELADO', 'SUSPENSO'] },
    plano_id: { type: 'string' },
    data_inicio: { type: 'string', format: 'date' },
    data_fim: { type: 'string', format: 'date' },
    dia_vencimento: { type: 'integer', minimum: 1, maximum: 28 },
    endereco_cep: { type: 'string', pattern: '^\\d{5}-?\\d{3}$' },
    endereco_logradouro: { type: 'string', maxLength: 255 },
    endereco_numero: { type: 'string', maxLength: 20 },
    endereco_complemento: { type: 'string', maxLength: 100 },
    endereco_bairro: { type: 'string', maxLength: 100 },
    endereco_cidade: { type: 'string', maxLength: 100 },
    endereco_uf: { type: 'string', pattern: '^[A-Z]{2}$' },
    observacoes: { type: 'string' },
  },
};

const schemaClienteUpdate = {
  type: 'object',
  properties: {
    nome_completo: { type: 'string', minLength: 3, maxLength: 255 },
    razao_social: { type: 'string', maxLength: 255 },
    cpf_cnpj: { type: 'string', pattern: '^(\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}|\\d{2}\\.?\\d{3}\\.?\\d{3}\\/?\\d{4}-?\\d{2})$' },
    rg_ie: { type: 'string', maxLength: 50 },
    data_nascimento: { type: 'string', format: 'date' },
    status: { type: 'string', enum: ['ATIVO', 'INADIMPLENTE', 'CANCELADO', 'SUSPENSO'] },
    plano_id: { type: 'string' },
    data_inicio: { type: 'string', format: 'date' },
    data_fim: { type: 'string', format: 'date' },
    dia_vencimento: { type: 'integer', minimum: 1, maximum: 28 },
    endereco_cep: { type: 'string', pattern: '^\\d{5}-?\\d{3}$' },
    endereco_logradouro: { type: 'string', maxLength: 255 },
    endereco_numero: { type: 'string', maxLength: 20 },
    endereco_complemento: { type: 'string', maxLength: 100 },
    endereco_bairro: { type: 'string', maxLength: 100 },
    endereco_cidade: { type: 'string', maxLength: 100 },
    endereco_uf: { type: 'string', pattern: '^[A-Z]{2}$' },
    observacoes: { type: 'string' },
  },
  anyOf: [{ required: ['nome_completo'] }, { required: ['cpf_cnpj'] }],
};

/**
 * Schema de validação para boletos
 */
const schemaBoletoCreate = {
  type: 'object',
  required: ['cliente_id', 'plano_id', 'valor', 'mes_referencia', 'ano_referencia'],
  properties: {
    cliente_id: { type: 'string' },
    plano_id: { type: 'string' },
    valor: { type: 'number', minimum: 0.01 },
    mes_referencia: { type: 'string', format: 'date' },
    ano_referencia: { type: 'integer', minimum: 2000, maximum: 2100 },
    data_vencimento: { type: 'string', format: 'date' },
  },
};

/**
 * Middleware para validar request body
 * @param {object} schema - Schema Ajv para validação
 */
function validationMiddleware(schema) {
  const validate = ajv.compile(schema);

  return async (request, reply) => {
    const valid = validate(request.body);

    if (!valid) {
      return reply.code(400).send({
        error: 'Dados inválidos',
        code: 'VALIDATION_ERROR',
        details: validate.errors,
      });
    }
  };
}

module.exports = {
  validarCpfCnpj,
  schemaClienteCreate,
  schemaClienteUpdate,
  schemaBoletoCreate,
  validationMiddleware,
};
