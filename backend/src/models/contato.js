/**
 * contato.js - Modelo de Contato (Email, Telefone, WhatsApp)
 */

const { DataTypes } = require('sequelize');

/**
 * Definir o modelo de Contato
 * @param {Sequelize} sequelize - Instância do Sequelize
 * @returns {Model} - Modelo configurado
 */
module.exports = (sequelize) => {
  const Contato = sequelize.define('Contato', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'UUID único do contato',
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
    tipo: {
      type: DataTypes.ENUM('EMAIL', 'TELEFONE', 'WHATSAPP'),
      allowNull: false,
      comment: 'Tipo do contato',
    },
    valor: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Valor do contato (e-mail, telefone ou WhatsApp)',
    },
    principal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Se este é o contato principal para este tipo',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se o contato está ativo',
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'criado_em',
    },
  }, {
    tableName: 'contatos',
    comment: 'Tabela de contatos dos clientes',
    timestamps: false,
    createdAt: 'criado_em',
    indices: [
      { fields: ['cliente_id'] },
      { fields: ['tipo'] },
      { fields: ['cliente_id', 'principal'], where: { principal: true } },
    ],
  });

  return Contato;
};
