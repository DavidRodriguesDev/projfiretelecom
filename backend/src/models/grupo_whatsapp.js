/**
 * grupo_whatsapp.js - Grupos para envio em lote de WhatsApp
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GrupoWhatsApp = sequelize.define('GrupoWhatsApp', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    descricao: {
      type: DataTypes.TEXT,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'grupos_whatsapp',
    timestamps: false,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return GrupoWhatsApp;
};
