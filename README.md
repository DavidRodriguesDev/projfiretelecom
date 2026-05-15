# 🔥 Fire Telecom - Sistema de Gestão de Cobrança

Sistema web completo para gestão de clientes, geração automatizada de boletos e envio de notificações por e-mail e WhatsApp para provedores de internet.

---

## Stack Tecnológica

| Frontend | Backend | Banco | Cache | WhatsApp |
|----------|---------|-------|-------|----------|
| React 18 + TypeScript | Node.js 26 + Fastify 4 | PostgreSQL | Redis | Evolution API v2 |

---

## Funcionalidades

- **Gestão de Clientes** — Cadastro completo com CPF/CNPJ, endereço e contatos
- **Gestão de Planos** — Criação e ajuste de planos de internet (Básico, Intermediário, Premium)
- **Geração automática de boletos** — Agendamento mensal (dia 1 de cada mês)
- **Notificações via WhatsApp** — Lembretes 2 dias antes do vencimento via Evolution API
- **Notificações via E-mail** — Avisos de boleto com Gmail SMTP
- **Dashboard** — Estatísticas, gráficos de crescimento e inadimplência
- **Painel administrativo** — CRUD completo de clientes, planos e boletos

---

## Pré-requisitos

- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- Conta Gmail com senha de app gerada
- Evolution API (inclusa no projeto)

---

## Instalação

### 1. Banco de dados

```bash
psql -U postgres -c "CREATE DATABASE firetelecom;"
psql -U postgres -d firetelecom -f backend/sql/demo-data.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edite o .env com suas configurações
npm run dev
```

### 3. Evolution API (WhatsApp)

```bash
cd evolution-api
npm install
npx prisma generate --schema=prisma/postgresql-schema.prisma
npx prisma db push --schema=prisma/postgresql-schema.prisma
npm start
```

Acesse `http://localhost:8080/manager` e conecte seu WhatsApp via QR Code.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`

### 5. Iniciar tudo de uma vez

```bash
bash start.sh    # primeira vez (inicia PostgreSQL e Redis também)
bash restart.sh  # reiniciar sem precisar dos serviços do sistema
```

---

## Configuração do `.env` (backend)

```env
# Servidor
PORT=3000
HOST=localhost
NODE_ENV=development

# Banco de dados
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=firetelecom
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=firetelecom-super-segredo-senha-min-32-caracteres
JWT_EXPIRES_IN=7d

# Gmail SMTP
EMAIL_TYPE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu@gmail.com
SMTP_PASSWORD=sua-senha-de-app
SMTP_FROM=seu@gmail.com

# WhatsApp (Evolution API)
WHATSAPP_API_TYPE=evolution
WHATSAPP_API_URL=http://localhost:8080
WHATSAPP_API_TOKEN=429683C4C977415CAAFCCE10F7D57E11
WHATSAPP_INSTANCE=firetelecom
WHATSAPP_NUMERO_ORIGEM=5531999999999

# Agendamentos
GERA_BOLETOS_DIA_MES=1
ENVIO_LEMBRETES_DIAS_ANTES=2

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

---

## Credenciais Default

```
E-mail: admin@firetelecom.com.br
Senha:  admin123
```

---

## Estrutura do Projeto

```
projfiretelecom/
├── backend/                  # API REST (Fastify)
│   ├── src/
│   │   ├── config/           # DB, Redis, JWT
│   │   ├── routes/           # Rotas da API
│   │   ├── services/         # Email, WhatsApp, Agendamentos
│   │   └── models/           # Sequelize models
│   └── sql/                  # Scripts SQL
├── evolution-api/            # WhatsApp via Evolution API v2
├── frontend/                 # Painel React + TypeScript
│   └── src/
│       ├── pages/            # Dashboard, Clientes, Boletos, Planos
│       └── services/         # API Client
├── start.sh                  # Inicia todo o sistema
└── restart.sh                # Reinicia todo o sistema
```

---

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/api/auth/login` | Login do usuário |
| GET | `/api/clientes` | Listar clientes |
| POST | `/api/clientes` | Criar cliente |
| PUT | `/api/clientes/:id` | Editar cliente |
| DELETE | `/api/clientes/:id` | Remover cliente |
| GET | `/api/planos` | Listar planos |
| POST | `/api/planos` | Criar plano |
| GET | `/api/boletos` | Listar boletos |
| POST | `/api/boletos` | Criar boleto |
| GET | `/api/dashboard/estatisticas` | Estatísticas do dashboard |

Documentação completa: **http://localhost:3000/api/docs**

---

## Testes

```bash
# Testar WhatsApp
bash ~/testar_boleto_zap.sh

# Testar E-mail
cd backend && node testar_email.js
```


