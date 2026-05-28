-- Script SQL para criar e popular o banco de dados Boleto Manager

-- Criar tabelas se não existirem
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Criar tabelas (baseadas no schema.sql)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    cargo VARCHAR(50) NOT NULL DEFAULT 'ADMINISTRADOR',
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS planos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    velocidade VARCHAR(50) NOT NULL,
    velocidade_mbps INTEGER NOT NULL,
    valor_mensal DECIMAL(10, 2) NOT NULL,
    tipo_plano VARCHAR(20) NOT NULL DEFAULT 'PADRAO',
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
    plano_id UUID NOT NULL,
    dia_vencimento INTEGER NOT NULL DEFAULT 10,
    status VARCHAR(20) NOT NULL DEFAULT 'ATIVO',
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    endereco_cep VARCHAR(10),
    endereco_logradouro VARCHAR(255),
    endereco_numero VARCHAR(20),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_uf CHAR(2),
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    valor VARCHAR(255) NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT false,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL,
    plano_id UUID NOT NULL,
    numero_boleto VARCHAR(50),
    valor DECIMAL(10, 2) NOT NULL,
    data_vencimento DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    mes_referencia DATE NOT NULL,
    ano_referencia INTEGER NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Criar usuário administrador
INSERT INTO usuarios (nome, email, senha, cargo, ativo)
VALUES (
    'Administrador Sistema',
    'admin@boleto_manager.com',
    crypt('admin123', gen_salt('bf')),
    'ADMINISTRADOR',
    true
)
ON CONFLICT (email) DO UPDATE SET ativo = true;

-- Criar planos de demonstração
INSERT INTO planos (nome, velocidade, velocidade_mbps, valor_mensal, tipo_plano, descricao, ativo)
VALUES
    ('Plano Básico 100MB', '100MB', 100, 59.90, 'PADRAO', 'Plano básico com velocidade de 100 Mbps', true),
    ('Plano Intermediário 300MB', '300MB', 300, 89.90, 'PADRAO', 'Plano intermediário com velocidade de 300 Mbps', true),
    ('Plano Premium 1GB', '1GB', 1000, 129.90, 'PADRAO', 'Plano premium com velocidade de 1 Gbps', true)
ON CONFLICT (nome) DO NOTHING;

-- Criar clientes de demonstração
DO $$
DECLARE
    plano1 UUID;
    plano2 UUID;
BEGIN
    SELECT INTO plano1 id FROM planos WHERE nome = 'Plano Básico 100MB';
    SELECT INTO plano2 id FROM planos WHERE nome = 'Plano Intermediário 300MB';

    INSERT INTO clientes (nome_completo, cpf_cnpj, plano_id, dia_vencimento, status, data_inicio, endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf)
    VALUES
        ('João da Silva', '12345678900', plano1, 10, 'ATIVO', '2024-01-15', '01000-000', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP'),
        ('Maria Oliveira', '98765432100', plano2, 15, 'ATIVO', '2024-02-20', '01000-000', 'Rua da Consolação', '200', 'Consolação', 'São Paulo', 'SP')
    ON CONFLICT (cpf_cnpj) DO NOTHING;

    INSERT INTO contatos (cliente_id, tipo, valor, principal)
    VALUES
        ((SELECT id FROM clientes WHERE cpf_cnpj = '12345678900'), 'EMAIL', 'joao.silva@email.com', true),
        ((SELECT id FROM clientes WHERE cpf_cnpj = '12345678900'), 'WHATSAPP', '5511999991111', true),
        ((SELECT id FROM clientes WHERE cpf_cnpj = '98765432100'), 'EMAIL', 'maria.oliveira@email.com', true),
        ((SELECT id FROM clientes WHERE cpf_cnpj = '98765432100'), 'WHATSAPP', '5511999992222', true)
    ON CONFLICT DO NOTHING;
END $$;

-- Verificar dados
SELECT '✅ Sistema configurado!' as status;
SELECT '_usuarios' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'planos', COUNT(*) FROM planos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes;
