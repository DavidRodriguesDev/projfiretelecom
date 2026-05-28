#!/bin/bash
# ============================================================
#  🔥 Boleto Manager — Instalador de Dependências (Linux)
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✅ $1${NC}"; }
info() { echo -e "${CYAN}ℹ️  $1${NC}"; }
warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
err()  { echo -e "${RED}❌ $1${NC}"; exit 1; }
step() { echo -e "\n${BOLD}${CYAN}━━━ $1 ━━━${NC}"; }

# Detecta o diretório raiz do projeto (onde este script está)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${BOLD}${RED}🔥 Boleto Manager — Instalador Linux${NC}"
echo -e "Diretório do projeto: ${CYAN}$PROJECT_DIR${NC}"
echo ""

# ── 1. Node.js ───────────────────────────────────────────────
step "1/6  Node.js"
if command -v node &>/dev/null; then
    NODE_VER=$(node -v)
    ok "Node.js já instalado: $NODE_VER"
else
    info "Instalando Node.js 20 LTS via NodeSource..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ok "Node.js instalado: $(node -v)"
fi

# ── 2. PostgreSQL ─────────────────────────────────────────────
step "2/6  PostgreSQL"
if command -v psql &>/dev/null; then
    ok "PostgreSQL já instalado: $(psql --version)"
else
    info "Instalando PostgreSQL..."
    sudo apt-get update -qq
    sudo apt-get install -y postgresql postgresql-contrib
    sudo systemctl enable postgresql
    sudo systemctl start postgresql
    ok "PostgreSQL instalado"
fi

# ── 3. Redis ─────────────────────────────────────────────────
step "3/6  Redis"
if command -v redis-cli &>/dev/null; then
    ok "Redis já instalado: $(redis-cli --version)"
else
    info "Instalando Redis..."
    sudo apt-get install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    ok "Redis instalado"
fi

# ── 4. Banco de dados ─────────────────────────────────────────
step "4/6  Banco de dados"
info "Criando banco 'boleto_manager' (ignora erro se já existir)..."
sudo -u postgres psql -c "CREATE DATABASE boleto_manager;" 2>/dev/null || warn "Banco já existe — pulando criação."

SQL_FILE="$PROJECT_DIR/backend/sql/demo-data.sql"
if [ -f "$SQL_FILE" ]; then
    sudo -u postgres psql -d boleto_manager -f "$SQL_FILE"
    ok "Dados de demonstração importados"
else
    warn "Arquivo $SQL_FILE não encontrado — pulando importação."
fi

# ── 5. Dependências Node dos módulos ─────────────────────────
step "5/6  Dependências Node.js"

install_deps() {
    local dir="$PROJECT_DIR/$1"
    local label="$2"
    if [ -d "$dir" ]; then
        info "Instalando dependências: $label"
        cd "$dir" && npm install
        ok "$label — OK"
    else
        warn "Diretório não encontrado: $dir"
    fi
}

install_deps "backend"       "Backend (Fastify)"
install_deps "frontend"      "Frontend (React)"
install_deps "evolution-api" "Evolution API"

# Prisma para Evolution API
EVO_DIR="$PROJECT_DIR/evolution-api"
if [ -d "$EVO_DIR" ]; then
    info "Gerando client Prisma (Evolution API)..."
    cd "$EVO_DIR"
    npx prisma generate --schema=prisma/postgresql-schema.prisma
    npx prisma db push --schema=prisma/postgresql-schema.prisma
    ok "Prisma — OK"
fi

# ── 6. Arquivo .env ───────────────────────────────────────────
step "6/6  Arquivo .env"
ENV_DEST="$PROJECT_DIR/backend/.env"
ENV_EXAMPLE="$PROJECT_DIR/backend/.env.example"
if [ ! -f "$ENV_DEST" ]; then
    if [ -f "$ENV_EXAMPLE" ]; then
        cp "$ENV_EXAMPLE" "$ENV_DEST"
        ok ".env criado a partir do .env.example"
        warn "Edite $ENV_DEST com suas credenciais antes de iniciar."
    else
        warn ".env.example não encontrado — crie o .env manualmente."
    fi
else
    ok ".env já existe — não sobrescrito."
fi

# ── Concluído ─────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}✅  Instalação concluída!${NC}"
echo ""
echo -e "  Próximos passos:"
echo -e "  ${CYAN}1.${NC} Edite ${YELLOW}backend/.env${NC} com suas credenciais"
echo -e "  ${CYAN}2.${NC} Acesse ${YELLOW}http://localhost:8080/manager${NC} e conecte o WhatsApp via QR Code"
echo -e "  ${CYAN}3.${NC} Execute ${YELLOW}bash start.sh${NC} para iniciar o sistema"
echo ""