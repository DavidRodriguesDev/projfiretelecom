/**
 * usuario.js - Modelo de Usuário com autenticação JWT
 */

const { DataTypes } = require('sequelize');

/**
 * Definir o modelo de Usuário
 * @param {Sequelize} sequelize - Instância do Sequelize
 * @returns {Model} - Modelo configurado
 */
module.exports = (sequelize) => {
  const Usuario = sequelize.define('Usuario', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'UUID único do usuário',
    },
    nome: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Nome completo do usuário',
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: 'Endereço de e-mail (login)',
    },
    senha: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Senha criptografada com bcrypt',
    },
    cargo: {
      type: DataTypes.ENUM('ADMINISTRADOR', 'ATENDIMENTO', 'FINANCEIRO'),
      defaultValue: 'ADMINISTRADOR',
      allowNull: false,
      comment: 'Cargo do usuário no sistema',
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: 'Se o usuário está ativo ou desativado',
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'criado_em',
      comment: 'Data de criação do registro',
    },
    atualizado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'atualizado_em',
      comment: 'Data da última atualização',
    },
  }, {
    tableName: 'usuarios',
    comment: 'Tabela de usuários do sistema',
    timestamps: false,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  });

  return Usuario;
};
