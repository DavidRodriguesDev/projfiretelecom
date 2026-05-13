/**
 * historico_status_cliente.js - Histórico de mudanças de status do cliente
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HistoricoStatusCliente = sequelize.define('HistoricoStatusCliente', {
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
    status_anterior: {
      type: DataTypes.ENUM('ATIVO', 'INADIMPLENTE', 'CANCELADO', 'SUSPENSO'),
      allowNull: false,
    },
    status_novo: {
      type: DataTypes.ENUM('ATIVO', 'INADIMPLENTE', 'CANCELADO', 'SUSPENSO'),
      allowNull: false,
    },
    razao: {
      type: DataTypes.TEXT,
      comment: 'Motivo da mudança de status',
    },
    usuario_id: {
      type: DataTypes.UUID,
      references: {
        model: 'usuarios',
        key: 'id',
      },
      comment: 'ID do usuário que fez a alteração',
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'historicos_status_cliente',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [
      { fields: ['cliente_id'] },
      { fields: ['criado_em'] },
    ],
  });

  return HistoricoStatusCliente;
};
