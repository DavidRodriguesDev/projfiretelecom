/**
 * scripts/seedAdmin.js - Script para criar usuário administrador
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || 5432,
  database: process.env.DATABASE_NAME || 'boleto_manager',
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  dialect: 'postgres',
});

const saltRounds = 10;

async function createAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado ao banco de dados');

    // Gerar hash da senha
    const senha = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = await bcrypt.hash(senha, saltRounds);

    // Verificar se já existe administrador
    const admin = await sequelize.query(
      "SELECT * FROM usuarios WHERE email = 'admin@boleto_manager.com'",
      { type: sequelize.QueryTypes.SELECT }
    );

    if (admin.length > 0) {
      console.log('❌ Administrador já existe');
      console.log(`Email: admin@boleto_manager.com`);
      console.log(`Senha: ${senha}`);
      process.exit(0);
    }

    // Criar administrador
    await sequelize.query(
      `INSERT INTO usuarios (nome, email, senha, cargo, ativo)
       VALUES ('Administrador do Sistema', 'admin@boleto_manager.com', '${hash}', 'ADMINISTRADOR', true)`,
      { type: sequelize.QueryTypes.INSERT }
    );

    console.log('✅ Administrador criado com sucesso!');
    console.log(`Email: admin@boleto_manager.com`);
    console.log(`Senha: ${senha}`);
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

createAdmin();
