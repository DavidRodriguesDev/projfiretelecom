/**
 * plano.js - Modelo de Plano de Internet
 */

const { DataTypes } = require('sequelize');

/**
 * Definir o modelo de Plano
 * @param {Sequelize} sequelize - Instância do Sequelize
 * @returns {Model} - Modelo configurado
 */
module.exports = (sequelize) => {
  const Plano = sequelize.define('Plano', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'UUID único do plano',
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Nome do plano (ex: "Plano Básico 100MB")',
    },
    velocidade: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Velocidade em texto (ex: "100MB", "300MB")',
    },
    velocidade_mbps: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Velocidade em Mbps para cálculos',
    },
    valor_mensal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
      comment: 'Valor mensal do plano',
    },
    tipo_plano: {
      type: DataTypes.ENUM('PADRAO', 'PERSONALIZADO'),
      defaultValue: 'PADRAO',
      allowNull: false,
      comment: 'Tipo do plano: padrão ou personalizado',
    },
    descricao: {
      type: DataTypes.TEXT,
      comment: 'Descrição detalhada do plano',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se o plano está ativo para novos contratos',
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
    tableName: 'planos',
    comment: 'Tabela de planos de internet',
    timestamps: false,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['velocidade_mbps'] },
      { fields: ['valor_mensal'] },
      { fields: ['ativo'] },
    ],
  });

  return Plano;
};
