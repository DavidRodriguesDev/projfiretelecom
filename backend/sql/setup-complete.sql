-- Script SQL para criar e popular o banco de dados Boleto Manager

-- Criar banco se não existir
-- CREATE DATABASE boleto_manager;

-- Conectar ao banco
\c boleto_manager

-- Habilitar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabelas (já criadas via schema.sql, aqui apenas validação)
-- Se precisar recrear:DROP TABLE IF EXISTS usuarios CASCADE;
-- ... (ou usar o schema.sql completo)

-- Carregar schema
\i /home/davidrsj/Documentos/projfiretelecom/backend/sql/schema.sql

-- Carregar funções
\i /home/davidrsj/Documentos/projfiretelecom/backend/sql/functions_triggers.sql

-- Inserir usuário administrador
INSERT INTO usuarios (nome, email, senha, cargo, ativo)
VALUES (
    'Administrador Sistema',
    'admin@boleto_manager.com',
    crypt('admin123', gen_salt('bf')),
    'ADMINISTRADOR',
    true
)
ON CONFLICT (email) DO UPDATE SET nome = excluded.nome, ativo = true;

-- Inserir planos de demonstração
INSERT INTO planos (nome, velocidade, velocidade_mbps, valor_mensal, tipo_plano, descricao, ativo)
VALUES
    ('Plano Básico 100MB', '100MB', 100, 59.90, 'PADRAO', 'Plano básico com velocidade de 100 Mbps para navegação e streaming', true),
    ('Plano Intermediário 300MB', '300MB', 300, 89.90, 'PADRAO', 'Plano intermediário com velocidade de 300 Mbps para jogos e downloads', true),
    ('Plano Premium 1GB', '1GB', 1000, 129.90, 'PADRAO', 'Plano premium com velocidade de 1 Gbps para uso intensivo', true)
ON CONFLICT (nome) DO NOTHING;

-- Inserir clientes de demonstração
INSERT INTO clientes (nome_completo, cpf_cnpj, plano_id, dia_vencimento, data_inicio, status, endereco_cep, endereco_logradouro, endereco_numero, endereco_bairro, endereco_cidade, endereco_uf)
VALUES
    ('João da Silva', '12345678900', (SELECT id FROM planos WHERE nome = 'Plano Básico 100MB'), 10, '2024-01-15', 'ATIVO', '01000-000', 'Av. Paulista', '1000', 'Bela Vista', 'São Paulo', 'SP'),
    ('Maria Oliveira', '98765432100', (SELECT id FROM planos WHERE nome = 'Plano Intermediário 300MB'), 15, '2024-02-20', 'ATIVO', '01000-000', 'Rua da Consolação', '200', 'Consolação', 'São Paulo', 'SP'),
    ('Empresa Tech LTDA', '12345678000190', (SELECT id FROM planos WHERE nome = 'Plano Premium 1GB'), 5, '2024-03-10', 'ATIVO', '01000-000', 'Av. Faria Lima', '3000', 'Jardins', 'São Paulo', 'SP')
ON CONFLICT (cpf_cnpj) DO NOTHING;

-- Inserir contatos dos clientes
INSERT INTO contatos (cliente_id, tipo, valor, principal)
VALUES
    ((SELECT id FROM clientes WHERE cpf_cnpj = '12345678900'), 'EMAIL', 'joao.silva@email.com', true),
    ((SELECT id FROM clientes WHERE cpf_cnpj = '12345678900'), 'WHATSAPP', '5511999991111', true),
    ((SELECT id FROM clientes WHERE cpf_cnpj = '98765432100'), 'EMAIL', 'maria.oliveira@email.com', true),
    ((SELECT id FROM clientes WHERE cpf_cnpj = '98765432100'), 'WHATSAPP', '5511999992222', true),
    ((SELECT id FROM clientes WHERE cpf_cnpj = '12345678000190'), 'EMAIL', 'contato@tech.com.br', true),
    ((SELECT id FROM clientes WHERE cpf_cnpj = '12345678000190'), 'WHATSAPP', '5511999993333', true)
ON CONFLICT DO NOTHING;

-- Inserir configurações
INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, ativo)
VALUES
    ('GATEWAY_BOLETO', 'ASAAS', 'Gateway para geração de boletos', 'STRING', true),
    ('ASAAS_URL_BASE', 'https://sandbox.asaas.com/api/v3', 'URL base do Asaas', 'STRING', true)
ON CONFLICT (chave) DO NOTHING;

-- Inserir agendamentos
INSERT INTO configuracoes_agendamento (tarefa, cron_expression, ativo, descricao)
VALUES
    ('gerar_boletos_mensais', '0 0 1 * *', true, 'Gera automaticamente boletos para todos os clientes ativos'),
    ('enviar_lembretes_boletos', '0 8 * * *', true, 'Envia lembretes de vencimento por e-mail e WhatsApp')
ON CONFLICT (tarefa) DO NOTHING;

-- Verificar dados inseridos
SELECT '✅ Sistema configurado com sucesso!' as status;
SELECT '_usuários' as tabela, COUNT(*) as total FROM usuarios
UNION ALL
SELECT 'planos', COUNT(*) FROM planos
UNION ALL
SELECT 'clientes', COUNT(*) FROM clientes
UNION ALL
SELECT 'contatos', COUNT(*) FROM contatos;
