/**
 * historico_pagamento_boleto.js - Histórico de pagamentos por boleto
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const HistoricoPagamentoBoleto = sequelize.define('HistoricoPagamentoBoleto', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    boleto_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'boletos',
        key: 'id',
      },
    },
    data_pagamento: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    valor_pago: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    taxa_bancaria: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    forma_pagamento: {
      type: DataTypes.STRING(50),
    },
    observacao: {
      type: DataTypes.TEXT,
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'historicos_pagamentos_boleto',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [
      { fields: ['boleto_id'] },
      { fields: ['data_pagamento'] },
    ],
  });

  return HistoricoPagamentoBoleto;
};
