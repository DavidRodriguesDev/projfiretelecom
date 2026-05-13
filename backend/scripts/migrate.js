/**
 * scripts/migrate.js - Script de migração do banco de dados
 */

require('dotenv').config();
const { sequelize } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🚀 Iniciando migração do banco de dados...');

  try {
    // Criar extensões
    console.log('📦 Criando extensões...');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');
    console.log('✅ Extensões criadas com sucesso!');

    // Carregar schema principal
    console.log('📂 Carregando schema principal...');
    const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await sequelize.query(schemaSql);
    console.log('✅ Schema principal carregado!');

    // Carregar funções e triggers
    console.log('📂 Carregando funções e triggers...');
    const functionsPath = path.join(__dirname, '..', 'sql', 'functions_triggers.sql');
    const functionsSql = fs.readFileSync(functionsPath, 'utf8');
    await sequelize.query(functionsSql);
    console.log('✅ Funções e triggers carregados!');

    // Carregar seeds (opcional)
    if (process.env.LOAD_SEEDS === 'true') {
      console.log('📂 Carregando dados iniciais...');
      const seedsPath = path.join(__dirname, '..', 'sql', 'seeds.sql');
      const seedsSql = fs.readFileSync(seedsPath, 'utf8');
      await sequelize.query(seedsSql);
      console.log('✅ Seeds carregados!');
    }

    console.log('');
    console.log('========================================');
    console.log('✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!');
    console.log('========================================');
    console.log('');
    console.log('Próximos passos:');
    console.log('1. Criar usuário administrador:');
    console.log('   cd backend && node scripts/seedAdmin.js');
    console.log('2. Iniciar o servidor:');
    console.log('   npm run dev');
    console.log('');
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

runMigrations();
