-- =============================================================================
-- SEEDS - DADOS INICIAIS PARA TESTE
-- Fire Telecom - Sistema de Gestão de Boleto
-- =============================================================================

-- =============================================================================
-- 1. USUÁRIO ADMINISTRADOR PADRÃO
-- Senha: admin123 (bcrypt hash gerado com: SELECT crypt('admin123', gen_salt('bf')))
-- =============================================================================

INSERT INTO usuarios (nome, email, senha, cargo, ativo)
VALUES (
    'Administrador do Sistema',
    'admin@firetelecom.com.br',
    '$2a$10$N3p4qF8V9X2Z3Y4Z5W6X7Y8Z9Z0a1b2c3d4e5f6g7h8i9j0k', -- Exemplo, gerar novo hash
    'ADMINISTRADOR',
    true
)
ON CONFLICT (email) DO NOTHING;

-- =============================================================================
-- 2. PLANOS DE EXEMPLO
-- =============================================================================

INSERT INTO planos (nome, velocidade, velocidade_mbps, valor_mensal, tipo_plano, descricao, ativo)
VALUES (
    'Plano Básico 100MB',
    '100MB',
    100,
    59.90,
    'PADRAO',
    'Plano básico com velocidade de 100 Mbps para navegação e streaming',
    true
),
(
    'Plano Intermediário 300MB',
    '300MB',
    300,
    89.90,
    'PADRAO',
    'Plano intermediário com velocidade de 300 Mbps para jogos e downloads',
    true
),
(
    'Plano Premium 1GB',
    '1GB',
    1000,
    129.90,
    'PADRAO',
    'Plano premium com velocidade de 1 Gbps para uso intensivo',
    true
),
(
    'Plano SMB 500MB',
    '500MB',
    500,
    199.90,
    'PERSONALIZADO',
    'Plano personalizado para pequenas empresas com 500 Mbps',
    true
)
ON CONFLICT (nome) DO NOTHING;

-- =============================================================================
-- 3. CONFIGURAÇÕES DE GATEWAY (Asaas)
-- =============================================================================

INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, sensitive, ativo)
VALUES
    ('GATEWAY_BOLETO', 'ASAAS', 'Gateway para geração de boletos', 'STRING', false, true),
    ('ASAAS_API_KEY', '', 'API Key do Asaas (sandbox)', 'STRING', true, true),
    ('ASAAS_URL_BASE', 'https://sandbox.asaas.com/api/v3', 'URL base do Asaas', 'STRING', false, true)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- =============================================================================
-- 4. CONFIGURAÇÕES DE ENVIO DE EMAIL (SMTP)
-- =============================================================================

INSERT INTO configuracoes_envio (tipo_canal, ativo, smtp_host, smtp_port, smtp_use_tls, smtp_from_email)
VALUES (
    'EMAIL_SMTP',
    false, -- Ativar após configurar credenciais
    'smtp.gmail.com',
    587,
    true,
    'noreply@firetelecom.com.br'
)
ON CONFLICT (tipo_canal) DO NOTHING;

-- =============================================================================
-- 5. CONFIGURAÇÕES DE WHATSAPP (Evolution API)
-- =============================================================================

INSERT INTO configuracoes_envio (tipo_canal, ativo, whatsapp_api_url, whatsapp_numero_origem)
VALUES (
    'WHATSAPP_EVO',
    false, -- Ativar após configurar credenciais
    'http://localhost:8080',
    '5511999999999'
)
ON CONFLICT (tipo_canal) DO NOTHING;

-- =============================================================================
-- 6. CONFIGURAÇÕES DE AGENDAMENTO (CRON JOBS)
-- =============================================================================

-- Geração automática de boletos (dia 1 de cada mês, 00:00)
INSERT INTO configuracoes_agendamento (tarefa, cron_expression, ativo, descricao)
VALUES (
    'gerar_boletos_mensais',
    '0 0 1 * *',  -- Todos os dias 1 de cada mês, à meia-noite
    true,
    'Gera automaticamente boletos para todos os clientes ativos'
)
ON CONFLICT (tarefa) DO NOTHING;

-- Envio de lembretes (todo dia às 8h)
INSERT INTO configuracoes_agendamento (tarefa, cron_expression, ativo, descricao)
VALUES (
    'enviar_lembretes_boletos',
    '0 8 * * *',  -- Todos os dias às 8h da manhã
    true,
    'Envia lembretes de vencimento por e-mail e WhatsApp'
)
ON CONFLICT (tarefa) DO NOTHING;

-- =============================================================================
-- 7. GRUPOS DE WHATSAPP
-- =============================================================================

INSERT INTO grupos_whatsapp (nome, descricao, ativo)
VALUES (
    'CLIENTES_ATIVOS',
    'Clientes ativos para comunicação periódica',
    true
),
(
    'CLIENTES_INADIMPLENTES',
    'Clientes com pendências para cobrança',
    true
)
ON CONFLICT (nome) DO NOTHING;

-- =============================================================================
-- FIM DOS SEEDS
-- =============================================================================

-- Para gerar hash de senha valído em produção:
-- SELECT crypt('minha_senha_segura', gen_salt('bf'));

-- Para gerar API Key do Asaas:
-- Acesse https://sandbox.asaas.com e crie uma conta de desenvolvedor
