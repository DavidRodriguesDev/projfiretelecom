/**
 * historico_plano_cliente.js - Histórico de mudanças de plano do cliente
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HistoricoPlanoCliente = sequelize.define('HistoricoPlanoCliente', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    cliente_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id',
      },
    },
    plano_anterior_id: {
      type: DataTypes.UUID,
      references: {
        model: 'planos',
        key: 'id',
      },
    },
    plano_novo_id: {
      type: DataTypes.UUID,
      references: {
        model: 'planos',
        key: 'id',
      },
    },
    valor_anterior: {
      type: DataTypes.DECIMAL(10, 2),
    },
    valor_novo: {
      type: DataTypes.DECIMAL(10, 2),
    },
    motivo: {
      type: DataTypes.TEXT,
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'historicos_plano_cliente',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['criado_em'] },
    ],
  });

  return HistoricoPlanoCliente;
};
