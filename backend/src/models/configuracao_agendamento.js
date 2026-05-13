/**
 * configuracao_agendamento.js - Configurações de agendamento (cron jobs)
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ConfiguracaoAgendamento = sequelize.define('ConfiguracaoAgendamento', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    tarefa: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    cron_expression: {
      type: DataTypes.STRING(100),
      defaultValue: '0 0 1 * *',
    },
    proxima_execucao: {
      type: DataTypes.DATE,
    },
    ultima_execucao: {
      type: DataTypes.DATE,
    },
    ultima_execucao_sucesso: {
      type: DataTypes.BOOLEAN,
    },
    duracao_ultima_execucao_segundos: {
      type: DataTypes.INTEGER,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    descricao: {
      type: DataTypes.TEXT,
    },
    criado_em: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'configuracoes_agendamento',
    timestamps: false,
    createdAt: 'criado_em',
    indexes: [{ fields: ['tarefa'] }, { fields: ['proxima_execucao'] }],
  });

  return ConfiguracaoAgendamento;
};
