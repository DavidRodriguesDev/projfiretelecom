/**
 * cliente.js - Modelo de Cliente
 */

const { DataTypes } = require('sequelize');

/**
 * Definir o modelo de Cliente
 * @param {Sequelize} sequelize - Instância do Sequelize
 * @returns {Model} - Modelo configurado
 */
module.exports = (sequelize) => {
  const Cliente = sequelize.define('Cliente', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      comment: 'UUID único do cliente',
    },
    nome_completo: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nome completo do cliente',
    },
    razao_social: {
      type: DataTypes.STRING(255),
      comment: 'Razão social (para CNPJ)',
    },
    cpf_cnpj: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
      validate: {
        is: /^(\d{3}\.?\d{3}\.?\d{3}-?\d{2}|\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2})$/, // CPF ou CNPJ
      },
      comment: 'CPF ou CNPJ do cliente',
    },
    rg_ie: {
      type: DataTypes.STRING(50),
      comment: 'RG ou Inscrição Estadual',
    },
    data_nascimento: {
      type: DataTypes.DATEONLY,
      comment: 'Data de nascimento (para pessoas físicas)',
    },
    status: {
      type: DataTypes.ENUM('ATIVO', 'INADIMPLENTE', 'CANCELADO', 'SUSPENSO'),
      defaultValue: 'ATIVO',
      allowNull: false,
      comment: 'Status atual do cliente',
    },
    plano_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'planos',
        key: 'id',
      },
      comment: 'Plano contratado (FK)',
    },
    data_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Data de início do contrato',
    },
    data_fim: {
      type: DataTypes.DATEONLY,
      comment: 'Data de fim do contrato (se houver)',
    },
    dia_vencimento: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: 1,
        max: 28,
      },
      comment: 'Dia do mês para vencimento (1-28)',
    },
    endereco_cep: {
      type: DataTypes.STRING(10),
      comment: 'CEP do endereço',
    },
    endereco_logradouro: {
      type: DataTypes.STRING(255),
      comment: 'Logradouro (rua, avenida)',
    },
    endereco_numero: {
      type: DataTypes.STRING(20),
      comment: 'Número do endereço',
    },
    endereco_complemento: {
      type: DataTypes.STRING(100),
      comment: 'Complemento do endereço',
    },
    endereco_bairro: {
      type: DataTypes.STRING(100),
      comment: 'Bairro',
    },
    endereco_cidade: {
      type: DataTypes.STRING(100),
      comment: 'Cidade',
    },
    endereco_uf: {
      type: DataTypes.CHAR(2),
      comment: 'Estado (UF)',
    },
    observacoes: {
      type: DataTypes.TEXT,
      comment: 'Observações sobre o cliente',
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
    tableName: 'clientes',
    comment: 'Tabela de clientes',
    timestamps: false,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
    indexes: [
      { fields: ['status'] },
      { fields: ['plano_id'] },
      { fields: ['cpf_cnpj'] },
      { fields: ['nome_completo'] },
      { fields: ['dia_vencimento'] },
      { fields: ['data_inicio'] },
    ],
  });

  return Cliente;
};
