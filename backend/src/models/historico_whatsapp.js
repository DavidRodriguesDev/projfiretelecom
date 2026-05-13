/**
 * historico_whatsapp.js - Histórico de mensagens WhatsApp
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HistoricoWhatsApp = sequelize.define('HistoricoWhatsApp', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    grupo_id: {
      type: DataTypes.UUID,
      references: {
        model: 'grupos_whatsapp',
        key: 'id',
      },
    },
    cliente_id: {
      type: DataTypes.UUID,
      references: {
        model: 'clientes',
        key: 'id',
      },
    },
    mensagem: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status_envio: {
      type: DataTypes.ENUM('ENVIANDO', 'ENVIADO', 'FALHA', 'REENVIO', 'AGENDADO'),
      defaultValue: 'ENVIANDO',
    },
    id_destino: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    erro: {
      type: DataTypes.TEXT,
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
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'historico_whatsapp',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [
      { fields: ['grupo_id'] },
      { fields: ['cliente_id'] },
      { fields: ['criado_em'] },
    ],
  });

  return HistoricoWhatsApp;
};
