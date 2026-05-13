/**
 * log_envio.js - Logs de envios de e-mail e WhatsApp
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LogEnvio = sequelize.define('LogEnvio', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo_envio: {
      type: DataTypes.ENUM('EMAIL', 'WHATSAPP'),
      allowNull: false,
    },
    destino: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'E-mail ou número de WhatsApp',
    },
    assunto_mensagem: {
      type: DataTypes.STRING(255),
      comment: 'Assunto da mensagem (para e-mail)',
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status_envio: {
      type: DataTypes.ENUM('ENVIANDO', 'ENVIADO', 'FALHA', 'REENVIO', 'AGENDADO'),
      defaultValue: 'ENVIANDO',
    },
    erro: {
      type: DataTypes.TEXT,
      comment: 'Detalhes do erro se falhar',
    },
    id_interno_referencia: {
      type: DataTypes.UUID,
      comment: 'ID do boleto ou cliente (dependendo do contexto)',
    },
    tipo_referencia: {
      type: DataTypes.STRING(50),
      comment: 'TIPO de referência: BOLETO, CLIENTE, LEMBRETE',
    },
    data_envio: {
      type: DataTypes.DATE,
    },
    data_entrega: {
      type: DataTypes.DATE,
    },
    data_falha: {
      type: DataTypes.DATE,
    },
    tentativas: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'logs_envio',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [
      { fields: ['tipo_envio'] },
      { fields: ['status_envio'] },
      { fields: ['criado_em'] },
      { fields: ['id_interno_referencia', 'tipo_referencia'] },
      { fields: ['status_envio', 'tentativas'], where: { status_envio: 'FALHA', tentativas: { $lt: 3 } } },
    ],
  });

  return LogEnvio;
};
