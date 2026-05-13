/**
 * configuracao_sistema.js - Configurações globais do sistema
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConfiguracaoSistema = sequelize.define('ConfiguracaoSistema', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    chave: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    valor: {
      type: DataTypes.TEXT,
    },
    descricao: {
      type: DataTypes.TEXT,
    },
    tipo: {
      type: DataTypes.ENUM('STRING', 'BOOLEAN', 'INTEGER', 'JSON'),
      defaultValue: 'STRING',
    },
    sensitive: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Dado sensível (senha, token, etc)',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    atualizado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'configuracoes_sistema',
    timestamps: false,
    updatedAt: 'atualizado_em',
    indexes: [{ fields: ['chave'] }],
  });

  return ConfiguracaoSistema;
};
