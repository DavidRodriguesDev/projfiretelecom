/**
 * configuracao_envio.js - Configurações de envio (e-mail e WhatsApp)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConfiguracaoEnvio = sequelize.define('ConfiguracaoEnvio', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tipo_canal: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    smtp_host: {
      type: DataTypes.STRING(255),
    },
    smtp_port: {
      type: DataTypes.INTEGER,
    },
    smtp_user: {
      type: DataTypes.STRING(255),
    },
    smtp_password: {
      type: DataTypes.STRING(255),
    },
    smtp_use_tls: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    smtp_from_email: {
      type: DataTypes.STRING(255),
    },
    whatsapp_api_url: {
      type: DataTypes.STRING(255),
    },
    whatsapp_api_token: {
      type: DataTypes.STRING(255),
    },
    whatsapp_numero_origem: {
      type: DataTypes.STRING(50),
    },
    template_boleto_email: {
      type: DataTypes.TEXT,
    },
    template_lembrete_email: {
      type: DataTypes.TEXT,
    },
    template_boleto_whatsapp: {
      type: DataTypes.TEXT,
    },
    template_lembrete_whatsapp: {
      type: DataTypes.TEXT,
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    atualizado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'configuracoes_envio',
    timestamps: false,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return ConfiguracaoEnvio;
};
