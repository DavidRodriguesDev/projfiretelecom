/**
 * boleto.js - Modelo de Boleto
 */

const { DataTypes } = require('sequelize');

/**
 * Definir o modelo de Boleto
 * @param {Sequelize} sequelize - Instância do Sequelize
 * @returns {Model} - Modelo configurado
 */
module.exports = (sequelize) => {
  const Boleto = sequelize.define('Boleto', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'UUID único do boleto',
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
      comment: 'ID do cliente (FK)',
    },
    plano_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'planos',
        key: 'id',
      },
      comment: 'ID do plano (FK)',
    },
    numero_boleto: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: 'Número do boleto gerado pelo gateway',
    },
    nosso_numero: {
      type: DataTypes.STRING(50),
      unique: true,
      comment: 'Número nosso (registro no banco)',
    },
    codigo_barras: {
      type: DataTypes.STRING(100),
      comment: 'Código de barras completo do boleto',
    },
    valor: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Valor original do boleto',
    },
    valor_pago: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Valor efetivamente pago',
    },
    valor_multa: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Multa aplicada (se houver)',
    },
    valor_juros: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Juros aplicados (se houver)',
    },
    valor_desconto: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      comment: 'Desconto aplicado (se houver)',
    },
    data_vencimento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Data de vencimento original',
    },
    data_pagamento: {
      type: DataTypes.DATEONLY,
      comment: 'Data efetiva de pagamento',
    },
    data_criacao: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data de criação do boleto',
    },
    data_geracao: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'data_geracao',
      comment: 'Data e hora de geração no sistema',
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'CONFIRMED', 'CANCELED', 'EXPIRED'),
      defaultValue: 'PENDING',
      allowNull: false,
      comment: 'Status atual do boleto',
    },
    url_pdf: {
      type: DataTypes.STRING(500),
      comment: 'URL ou caminho do PDF do boleto',
    },
    gateway_id: {
      type: DataTypes.STRING(100),
      comment: 'ID do boleto no gateway externo (Asaas/Efí)',
    },
    gateway: {
      type: DataTypes.ENUM('ASAAS', 'EFIE', 'GERENCIANET'),
      defaultValue: 'ASAAS',
      allowNull: false,
      comment: 'Gateway usado para geração',
    },
    mes_referencia: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'Mês de referência do boleto',
    },
    ano_referencia: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Ano de referência do boleto',
    },
    tentativas_envio_email: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Número de tentativas de envio por e-mail',
    },
    tentativas_envio_whatsapp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: 'Número de tentativas de envio por WhatsApp',
    },
    ultimo_envio_email: {
      type: DataTypes.DATE,
      comment: 'Data do último envio por e-mail',
    },
    ultimo_envio_whatsapp: {
      type: DataTypes.DATE,
      comment: 'Data do último envio por WhatsApp',
    },
    historico_pagamentos: {
      type: DataTypes.JSONB,
      comment: 'Histórico de pagamentos (array de transações)',
      field: 'historico_pagamentos',
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'criado_em',
    },
    atualizado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'atualizado_em',
    },
  }, {
    tableName: 'boletos',
    comment: 'Tabela de boletos de cobrança',
    timestamps: false,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['status'] },
      { fields: ['data_vencimento'] },
      { fields: ['mes_referencia'] },
      { fields: ['plano_id'] },
      { fields: ['gateway'] },
      { fields: ['data_vencimento', 'status'], where: { status: 'PENDING' } },
      { fields: ['status', 'tentativas_envio_email'], where: { status: 'FALHA', tentativas_envio_email: { $lt: 3 } } },
    ],
  });

  return Boleto;
};
