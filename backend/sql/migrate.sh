#!/bin/bash
# =============================================================================
# migrate.sh - Script de migração do banco de dados Fire Telecom
# =============================================================================

set -e

# Configurações do banco de dados
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-firetelecom}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

# Verificar se o banco existe
echo "Verificando banco de dados..."
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
    echo "Criando banco de dados $DB_NAME..."
    createdb -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME"
    echo "Banco de dados $DB_NAME criado com sucesso!"
else
    echo "Banco de dados $DB_NAME já existe."
fi

# Habilitar extensões
echo "Habilitando extensões..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "CREATE EXTENSION IF NOT EXISTS \"pgcrypto\";"

# Carregar schema principal
echo "Carregando schema principal..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/schema.sql" || {
    echo "Erro ao carregar schema principal"
    exit 1
}

# Carregar funções e triggers
echo "Carregando funções e triggers..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/functions_triggers.sql" || {
    echo "Erro ao carregar funções e triggers"
    exit 1
}

# Carregar seeds (opcional - para desenvolvimento)
if [ "${LOAD_SEEDS:-false}" = "true" ]; then
    echo "Carregando dados iniciais..."
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/seeds.sql" || {
        echo "Erro ao carregar seeds"
        exit 1
    }
fi

echo ""
echo "==============================="
echo "Migração concluída com sucesso!"
echo "==============================="
echo ""
echo "Próximos passos:"
echo "1. Configurar variáveis de ambiente (.env)"
echo "2. Iniciar o backend: cd backend && npm install && npm run dev"
echo "3. Testar a API: http://localhost:3000/api/docs"
echo ""
