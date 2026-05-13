/**
 * scripts/generatePasswordHash.js - Gerar hash de senha bcrypt
 */

const bcrypt = require('bcrypt');

async function generateHash() {
  const senha = process.argv[2];

  if (!senha) {
    console.log('Uso: node generatePasswordHash.js <senha>');
    process.exit(1);
  }

  const saltRounds = 10;
  const hash = await bcrypt.hash(senha, saltRounds);

  console.log(`Senha: ${senha}`);
  console.log(`Hash: ${hash}`);
}

generateHash();
