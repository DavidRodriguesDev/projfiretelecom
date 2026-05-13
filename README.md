# Fire Telecom - Sistema de Gestão de Cobrança

Sistema web completo para gestão de clientes, geração automatizada de boletos e envio de notificações por e-mail e WhatsApp para provedores de internet.

---

## Stack Tecnológica

| Frontend | Backend | Banco | Cache/Filas |
|----------|---------|-------|-------------|
| React 18 | Node.js 18 | PostgreSQL 14 | Redis 6 |
| TypeScript | Fastify 4 | --- | Bull |

---

## Funcionalidades

- **Gestão de Clientes**: Cadastro completo com CPF/CNPJ, endereço, múltiplos contatos
- **Gestão de Planos**: Criação e ajuste de planos de internet
- **Geração automática de boletos**: Agendamento mensal (dia 1 de cada mês)
- **Envio de notificações**: E-mail com PDF + WhatsApp (lembretes 2 dias antes do vencimento)
- **Dashboard**: Estatísticas, gráficos de crescimento e inadimplência
- **Painel administrativo**: CRUD completo de clientes, planos e boletos

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+

---

## Instalação Rápida

### 1. Backend

```bash
cd backend
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações (DATABASE_PASSWORD, JWT_SECRET, etc.)

# Criar banco de dados
psql -U postgres -d postgres -c "CREATE DATABASE firetelecom;"
psql -U postgres -d firetelecom -f sql/schema.sql
psql -U postgres -d firetelecom -f sql/functions_triggers.sql
psql -U postgres -d firetelecom -f sql/demo-data.sql

# Iniciar servidor
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`

### 3. Credenciais Default

```
E-mail: admin@firetelecom.com.br
Senha: admin123
```

---

## Documentação da API

Acessar após iniciar o backend: **http://localhost:3000/api/docs**

---

## Estrutura do Projeto

```
projfiretelecom/
├── backend/           # API REST (Fastify)
│   ├── src/
│   │   ├── config/    # DB, Redis, JWT
│   │   ├── routes/    #todas as rotas da API
│   │   ├── services/  # Integrações (Asaas, Email, WhatsApp)
│   │   └── models/    # Sequelize models
│   └── sql/           # Schema SQL
├── frontend/          # Painel React
│   └── src/
│       ├── pages/     # Páginas da aplicação
│       └── services/  # API Client
└── docker-compose.yml # Containerização
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login do usuário |
| GET | `/api/clientes` | Listar clientes |
| GET | `/api/planos` | Listar planos |
| GET | `/api/boletos` | Listar boletos |
| GET | `/api/dashboard/estatisticas` | Estatísticas |

---

**Status: Sistema em Produção** ✅
