/**
 * models/index.js - Inicialização dos modelos Sequelize
 */

const { sequelize } = require('../config/database');

/**
 * Importar todos os modelos
 */
const Usuario = require('./usuario')(sequelize);
const Plano = require('./plano')(sequelize);
const Cliente = require('./cliente')(sequelize);
const Contato = require('./contato')(sequelize);
const Boleto = require('./boleto')(sequelize);
const HistoricoPagamentoBoleto = require('./historico_pagamento_boleto')(sequelize);
const HistoricoStatusCliente = require('./historico_status_cliente')(sequelize);
const HistoricoPlanoCliente = require('./historico_plano_cliente')(sequelize);
const LogEnvio = require('./log_envio')(sequelize);
const ConfiguracaoSistema = require('./configuracao_sistema')(sequelize);
const ConfiguracaoEnvio = require('./configuracao_envio')(sequelize);
const ConfiguracaoAgendamento = require('./configuracao_agendamento')(sequelize);
const GrupoWhatsApp = require('./grupo_whatsapp')(sequelize);
const HistoricoWhatsApp = require('./historico_whatsapp')(sequelize);
const PermissaoUsuario = require('./permissao_usuario')(sequelize);

/**
 * Definir relacionamentos
 */
function defineRelacionamentos() {
  // Um plano pode ter muitos clientes
  Plano.hasMany(Cliente, { foreignKey: 'plano_id' });
  Cliente.belongsTo(Plano, { foreignKey: 'plano_id' });

  // Um plano pode ter muitos boletos
  Plano.hasMany(Boleto, { foreignKey: 'plano_id' });
  Boleto.belongsTo(Plano, { foreignKey: 'plano_id' });

  // Um cliente pode ter muitos contatos
  Cliente.hasMany(Contato, { foreignKey: 'cliente_id' });
  Contato.belongsTo(Cliente, { foreignKey: 'cliente_id' });

  // Um cliente pode ter muitos boletos
  Cliente.hasMany(Boleto, { foreignKey: 'cliente_id' });
  Boleto.belongsTo(Cliente, { foreignKey: 'cliente_id' });

  // Um cliente pode ter muitos históricos de status
  Cliente.hasMany(HistoricoStatusCliente, { foreignKey: 'cliente_id' });
  HistoricoStatusCliente.belongsTo(Cliente, { foreignKey: 'cliente_id' });

  // Um cliente pode ter muitos históricos de plano
  Cliente.hasMany(HistoricoPlanoCliente, { foreignKey: 'cliente_id' });
  HistoricoPlanoCliente.belongsTo(Cliente, { foreignKey: 'cliente_id' });

  // Um boleto pode ter muitos pagamentos
  Boleto.hasMany(HistoricoPagamentoBoleto, { foreignKey: 'boleto_id' });
  HistoricoPagamentoBoleto.belongsTo(Boleto, { foreignKey: 'boleto_id' });

  // Um usuário pode ter muitas permissões
  Usuario.hasMany(PermissaoUsuario, { foreignKey: 'usuario_id' });
  PermissaoUsuario.belongsTo(Usuario, { foreignKey: 'usuario_id' });

  // Um grupo de WhatsApp pode ter muitos históricos
  GrupoWhatsApp.hasMany(HistoricoWhatsApp, { foreignKey: 'grupo_id' });
  HistoricoWhatsApp.belongsTo(GrupoWhatsApp, { foreignKey: 'grupo_id' });

  // Um cliente pode ter muitos históricos de WhatsApp
  Cliente.hasMany(HistoricoWhatsApp, { foreignKey: 'cliente_id' });
  HistoricoWhatsApp.belongsTo(Cliente, { foreignKey: 'cliente_id' });
}

/**
 * Sincronizar todos os modelos com o banco de dados
 */
async function syncModels() {
  await sequelize.sync({ alter: true });
  console.log('✅ Todos os modelos sincronizados com sucesso!');
}

/**
 * Retornar instância do sequelize para queries customizadas
 */
function getSequelize() {
  return sequelize;
}

module.exports = {
  sequelize,
  Usuario,
  Plano,
  Cliente,
  Contato,
  Boleto,
  HistoricoPagamentoBoleto,
  HistoricoStatusCliente,
  HistoricoPlanoCliente,
  LogEnvio,
  ConfiguracaoSistema,
  ConfiguracaoEnvio,
  ConfiguracaoAgendamento,
  GrupoWhatsApp,
  HistoricoWhatsApp,
  PermissaoUsuario,
  defineRelacionamentos,
  syncModels,
  getSequelize,
};
