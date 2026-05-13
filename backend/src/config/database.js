/**
 * database.js - Configuração do Sequelize para PostgreSQL
 */

const { Sequelize } = require('sequelize');

/**
 * Configuração do banco de dados
 * Usa connection string para facilitar o deploy em diferentes ambientes
 */
const config = {
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  name: process.env.DATABASE_NAME || 'firetelecom',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
};

// Construir a connection URL
const databaseUrl = `postgresql://${config.user}:${config.password}@${config.host}:${config.port}/${config.name}`;

// Criar instância do Sequelize
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.DATABASE_LOGGING !== 'false',
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'criado_em',
    updatedAt: 'atualizado_em',
  },
  // Opções para tipos PostgreSQL
  typeValidation: true,
});

/**
 * Testar a conexão
 */
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com PostgreSQL estabelecida com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao PostgreSQL:', error);
    return false;
  }
}

/**
 * Sincronizar o schema com o banco de dados
 * @param {boolean} force - Se true, Dropa e recria as tabelas (perigoso!)
 * @param {boolean} alter - Se true, altera as tabelas para atender aos modelos
 */
async function syncDatabase({ force = false, alter = false } = {}) {
  try {
    const options = {};
    if (force) options.force = true;
    if (alter) options.alter = true;

    await sequelize.sync(options);
    console.log(`✅ Banco de dados sincronizado! (force=${force}, alter=${alter})`);
  } catch (error) {
    console.error('❌ Erro ao sincronizar banco de dados:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
