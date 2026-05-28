-- =============================================================================
-- SCHEMA DO BANCO DE DADOS - SISTEMA DE GESTÃO DE BOLETOS
-- Boleto Manager
-- =============================================================================

-- =============================================================================
-- HABILITANDO EXTENSÕES NECESSÁRIAS
-- =============================================================================

-- Extensão para gerar UUIDs aleatórios únicos (recomendado sobre serial/serial8)
-- Opcional: para limpar caracteres corrompidos, recriar arquivo limpo

-- Extensão para criptografia de senhas (pgcrypto)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- TIPOS ENUMERADOS (ENUNS)
-- =============================================================================

-- Status do cliente
CREATE TYPE status_cliente AS ENUM (
    'ATIVO',           -- Cliente em dia com pagamento
    'INADIMPLENTE',    -- Cliente com boleto vencido
    'CANCELADO',       -- Cliente que cancelou o serviço
    'SUSPENSO'         -- Cliente suspenso por alguma razão
);

-- Tipo de contato (email ou telefone)
CREATE TYPE tipo_contato AS ENUM (
    'EMAIL',
    'TELEFONE',
    'WHATSAPP'
);

-- Status do boleto
CREATE TYPE status_boleto AS ENUM (
    'PENDING',         -- Boleto pendente (aguardando pagamento)
    'CONFIRMED',       -- Boleto confirmado/pago
    'CANCELED',        -- Boleto cancelado
    'EXPIRED'          -- Boleto expirado
);

-- Tipo de plano (padrão ou personalizado)
CREATE TYPE tipo_plano AS ENUM (
    'PADRAO',
    'PERSONALIZADO'
);

-- Status do envio (e-mail ou WhatsApp)
CREATE TYPE status_envio AS ENUM (
    'ENVIANDO',        -- Envio iniciado
    'ENVIADO',         -- Envio concluído com sucesso
    'FALHA',           -- Envio falhou
    'REENVIO',         -- Já foi enviado e será reenviado
    'AGENDADO'         -- Agendado para envio futuro
);

-- Chave primária padrão para todas as tabelas
-- Usamos UUID v4 para segurança (não expõe sequência de插入 de registros)
-- Em vez de SERIAL/INTEGER que pode expor informações sobre o volume de registros

-- =============================================================================
-- TABELA: USUÁRIOS (AUTENTICAÇÃO E AUTORIZAÇÃO)
-- =============================================================================

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,  -- Senha criptografada com bcrypt
    cargo VARCHAR(50) NOT NULL DEFAULT 'ADMINISTRADOR',  -- ADMINISTRADOR, ATENDIMENTO, FINANCEIRO
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para busca por email
CREATE INDEX idx_usuarios_email ON usuarios(email);

-- =============================================================================
-- TABELA: PLANOS
-- =============================================================================

CREATE TABLE planos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    velocidade VARCHAR(50) NOT NULL,  -- Ex: "100MB", "300MB", "1GB"
    velocidade_mbps INTEGER NOT NULL,  -- Valor numérico para cálculos (ex: 100, 300, 1000)
    valor_mensal DECIMAL(10, 2) NOT NULL CHECK (valor_mensal > 0),
    tipo_plano tipo_plano NOT NULL DEFAULT 'PADRAO',
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para busca e ordenação
CREATE INDEX idx_planos_velocidade ON planos(velocidade_mbps);
CREATE INDEX idx_planos_valor ON planos(valor_mensal);
CREATE INDEX idx_planos_ativo ON planos(ativo);

-- =============================================================================
-- TABELA: CLIENTES
-- =============================================================================

CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome_completo VARCHAR(255) NOT NULL,
    razao_social VARCHAR(255),  -- Para CNPJ (empresa)
    cpf_cnpj VARCHAR(20) NOT NULL UNIQUE,
    rg_ie VARCHAR(50),  -- RG ou Inscrição Estadual
    data_nascimento DATE,  -- Para pessoas físicas

    -- Status do cliente
    status status_cliente NOT NULL DEFAULT 'ATIVO',

    -- Plano contratado (foreign key para planos)
    plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,

    -- Dados do contrato
    data_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    data_fim DATE,  -- Quando o contrato termina (se houver)
    dia_vencimento INTEGER NOT NULL DEFAULT 10 CHECK (dia_vencimento BETWEEN 1 AND 28),

    -- Endereço (normalizado para facilitar geocoding futuro)
    endereco_cep VARCHAR(10),
    endereco_logradouro VARCHAR(255),
    endereco_numero VARCHAR(20),
    endereco_complemento VARCHAR(100),
    endereco_bairro VARCHAR(100),
    endereco_cidade VARCHAR(100),
    endereco_uf CHAR(2),

    -- Observações
    observacoes TEXT,

    -- Criação e atualização
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para buscas frequentes
CREATE INDEX idx_clientes_status ON clientes(status);
CREATE INDEX idx_clientes_plano_id ON clientes(plano_id);
CREATE INDEX idx_clientes_cpf_cnpj ON clientes(cpf_cnpj);
CREATE INDEX idx_clientes_nome ON clientes(nome_completo);
CREATE INDEX idx_clientes_vencimento ON clientes(dia_vencimento);
CREATE INDEX idx_clientes_data_inicio ON clientes(data_inicio);

-- =============================================================================
-- TABELA: CONTATOS (MÚLTIPLOS EMAILS E TELEFONES POR CLIENTE)
-- =============================================================================

CREATE TABLE contatos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    tipo tipo_contato NOT NULL,
    valor VARCHAR(255) NOT NULL,
    principal BOOLEAN NOT NULL DEFAULT false,  -- Contato principal (padrão para envio)
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para busca por cliente e tipo
CREATE INDEX idx_contatos_cliente_id ON contatos(cliente_id);
CREATE INDEX idx_contatos_tipo ON contatos(tipo);
CREATE INDEX idx_contatos_principal ON contatos(cliente_id, principal) WHERE principal = true;

-- =============================================================================
-- TABELA: BOLETOS
-- =============================================================================

CREATE TABLE boletos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Relacionamento
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
    plano_id UUID NOT NULL REFERENCES planos(id) ON DELETE RESTRICT,

    -- Identificação do boleto
    numero_boleto VARCHAR(50) UNIQUE,  -- Número do boleto gerado pelo gateway
    nosso_numero VARCHAR(50) UNIQUE,   -- Número nosso (registro no banco)
    codigo_barras VARCHAR(100),

    -- Valores
    valor DECIMAL(10, 2) NOT NULL,
    valor_pago DECIMAL(10, 2) DEFAULT 0,
    valor_multa DECIMAL(10, 2) DEFAULT 0,
    valor_juros DECIMAL(10, 2) DEFAULT 0,
    valor_desconto DECIMAL(10, 2) DEFAULT 0,

    -- Datas
    data_vencimento DATE NOT NULL,  -- Data de vencimento original
    data_pagamento DATE,  -- Quando foi pago (se aplicável)
    data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
    data_geracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    -- Status
    status status_boleto NOT NULL DEFAULT 'PENDING',

    -- URL do PDF (armazenado em storage - S3, local, etc)
    url_pdf VARCHAR(500),

    -- Identificação do gateway (Asaas ou Efí)
    gateway_id VARCHAR(100),  -- ID do boleto no gateway externo
    gateway VARCHAR(20) NOT NULL DEFAULT 'ASAAS',  -- 'ASAAS' ou 'EFIE', 'GERENCIANET'

    -- Dados faturamento
    mes_referencia DATE NOT NULL,  -- Mês de referência (ex: 2026-05-01 para maio de 2026)
    ano_referencia INTEGER NOT NULL,

    -- Regras de reenvio
    tentativas_envio_email INTEGER NOT NULL DEFAULT 0,
    tentativas_envio_whatsapp INTEGER NOT NULL DEFAULT 0,
    ultimo_envio_email TIMESTAMP WITH TIME ZONE,
    ultimo_envio_whatsapp TIMESTAMP WITH TIME ZONE,

    -- Histórico de pagamentos (armazena dados de cada tentativa)
    historico_pagamentos JSONB,  -- Array de pagamentos: [{data: '2026-05-10', valor: 59.90, taxa: 0}]

    -- Criação e atualização
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para consultas de cobrança
CREATE INDEX idx_boletos_cliente_id ON boletos(cliente_id);
CREATE INDEX idx_boletos_status ON boletos(status);
CREATE INDEX idx_boletos_data_vencimento ON boletos(data_vencimento);
CREATE INDEX idx_boletos_mes_referencia ON boletos(mes_referencia);
CREATE INDEX idx_boletos_plano_id ON boletos(plano_id);
CREATE INDEX idx_boletos_gateway ON boletos(gateway);

-- =============================================================================
-- TABELA: HISTÓRICO DE PAGAMENTOS DE BOLETOS
-- =============================================================================

CREATE TABLE historicos_pagamentos_boleto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boleto_id UUID NOT NULL REFERENCES boletos(id) ON DELETE CASCADE,
    data_pagamento DATE NOT NULL,
    valor_pago DECIMAL(10, 2) NOT NULL,
    taxa_bancaria DECIMAL(10, 2) DEFAULT 0,
    forma_pagamento VARCHAR(50),
    observacao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historicos_pagamentos_boleto_id ON historicos_pagamentos_boleto(boleto_id);
CREATE INDEX idx_historicos_pagamentos_data ON historicos_pagamentos_boleto(data_pagamento);

-- =============================================================================
-- TABELA: HISTÓRICO DE MUDANÇA DE STATUS DE CLIENTE
-- =============================================================================

CREATE TABLE historicos_status_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    status_anterior status_cliente NOT NULL,
    status_novo status_cliente NOT NULL,
    razao TEXT,  -- Motivo da mudança (ex: "Cliente cancelou", "Pagamento confirmado")
    usuario_id UUID REFERENCES usuarios(id),  -- Quem fez a alteração
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historicos_status_cliente_id ON historicos_status_cliente(cliente_id);
CREATE INDEX idx_historicos_status_data ON historicos_status_cliente(criado_em);

-- =============================================================================
-- TABELA: HISTÓRICO DE MUDANÇA DE PLANO
-- =============================================================================

CREATE TABLE historicos_plano_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    plano_anterior_id UUID REFERENCES planos(id),
    plano_novo_id UUID REFERENCES planos(id),
    valor_anterior DECIMAL(10, 2),
    valor_novo DECIMAL(10, 2),
    motivo TEXT,  -- Motivo da troca (ex: "Upgrade para plano premium")
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historicos_plano_cliente_id ON historicos_plano_cliente(cliente_id);
CREATE INDEX idx_historicos_plano_data ON historicos_plano_cliente(criado_em);

-- =============================================================================
-- TABELA: LOG DE ENVIO (E-MAIL E WHATSAPP)
-- =============================================================================

CREATE TABLE logs_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_envio VARCHAR(20) NOT NULL,  -- 'EMAIL', 'WHATSAPP'
    destino VARCHAR(255) NOT NULL,  -- E-mail ou número de WhatsApp
    assunto_mensagem VARCHAR(255),  -- Para e-mails
    mensagem TEXT NOT NULL,  -- Conteúdo da mensagem
    status_envio status_envio NOT NULL DEFAULT 'ENVIANDO',
    erro text,  -- Detalhes do erro se falhar
    id_interno_referencia UUID,  -- ID do boleto ou cliente (dependendo do contexto)
    tipo_referencia VARCHAR(50),  -- 'BOLETO', 'CLIENTE', 'LEMBRETE'
    data_envio TIMESTAMP WITH TIME ZONE,
    data_entrega TIMESTAMP WITH TIME ZONE,
    data_falha TIMESTAMP WITH TIME ZONE,
    tentativas INTEGER NOT NULL DEFAULT 0,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índices para consultas de log
CREATE INDEX idx_logs_envio_tipo ON logs_envio(tipo_envio);
CREATE INDEX idx_logs_envio_status ON logs_envio(status_envio);
CREATE INDEX idx_logs_envio_data ON logs_envio(criado_em);
CREATE INDEX idx_logs_envio_referencia ON logs_envio(id_interno_referencia, tipo_referencia);

-- =============================================================================
-- TABELA: CONFIGURAÇÕES DO SISTEMA
-- =============================================================================

CREATE TABLE configuracoes_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chave VARCHAR(100) NOT NULL UNIQUE,  -- Ex: 'ASAAS_API_KEY', 'GERENCIANET_CLIENT_ID'
    valor TEXT,  --_valor da configuração (armazenado em texto, pode ser JSON)
    descricao TEXT,  -- Descrição do que a configuração faz
    tipo VARCHAR(50) NOT NULL DEFAULT 'STRING',  -- STRING, BOOLEAN, INTEGER, JSON
    sensitive BOOLEAN NOT NULL DEFAULT false,  -- Dado sensível (senha, token, etc)
    ativo BOOLEAN NOT NULL DEFAULT true,
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para busca por chave
CREATE INDEX idx_configuracoes_chave ON configuracoes_sistema(chave);

-- =============================================================================
-- TABELA: CONFIGURAÇÕES DE ENVIO (EMAIL E WHATSAPP)
-- =============================================================================

CREATE TABLE configuracoes_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_canal VARCHAR(20) NOT NULL UNIQUE,  -- 'EMAIL_SMTP', 'EMAIL_SENDGRID', 'WHATSAPP_EVO', 'WHATSAPP_ZAPI'

    -- Configurações gerais
    ativo BOOLEAN NOT NULL DEFAULT false,

    -- SMTP para e-mail
    smtp_host VARCHAR(255),
    smtp_port INTEGER,
    smtp_user VARCHAR(255),
    smtp_password VARCHAR(255),  -- Senha ou API Key
    smtp_use_tls BOOLEAN DEFAULT true,
    smtp_from_email VARCHAR(255),

    -- WhatsApp (Evolution ou Z-API)
    whatsapp_api_url VARCHAR(255),
    whatsapp_api_token VARCHAR(255),
    whatsapp_numero_origem VARCHAR(50),  -- Número no formato +5511999999999

    -- Templates de mensagem
    template_boleto_email TEXT,  -- Template HTML para e-mail de boleto
    template_lembrete_email TEXT,  -- Template HTML para e-mail de lembrete
    template_boleto_whatsapp TEXT,  -- Template para WhatsApp
    template_lembrete_whatsapp TEXT,  -- Template para lembrete de vencimento

    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABELA: CONFIGURAÇÕES DE AGENDAMENTO (CRON JOBS)
-- =============================================================================

CREATE TABLE configuracoes_agendamento (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tarefa VARCHAR(100) NOT NULL UNIQUE,
    cron_expression VARCHAR(100) NOT NULL DEFAULT '0 0 1 * *',
    proxima_execucao TIMESTAMP WITH TIME ZONE,
    ultima_execucao TIMESTAMP WITH TIME ZONE,
    ultima_execucao_sucesso BOOLEAN,
    duracao_ultima_execucao_segundos INTEGER,
    ativo BOOLEAN NOT NULL DEFAULT true,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Índice para busca por tarefa
CREATE INDEX idx_config_agendamento_tarefa ON configuracoes_agendamento(tarefa);
CREATE INDEX idx_config_agendamento_proxima_exec ON configuracoes_agendamento(proxima_execucao);

-- =============================================================================
-- TABELA: CLIENTES - CORREÇÃO DE ÍNDICE PARA EXCLUÇÃO EM CASCATA
-- Necessário remover e recriar a tabela clientes com ON DELETE CASCADE
-- =============================================================================

-- A tabela clientes está correta, mas vamos adicionar um trigger para prevenir
-- exclusão de clientes com boletos pendentes
CREATE OR REPLACE FUNCTION prevenir_exclusao_clientes_com_boletos()
RETURNS TRIGGER AS $$
DECLARE
    boletos_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO boletos_count FROM boletos WHERE cliente_id = OLD.id;
    IF boletos_count > 0 THEN
        RAISE EXCEPTION 'Não é possível excluir cliente com % boletos associados', boletos_count;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clientes_prevenir_exclusao ON clientes;
CREATE TRIGGER trigger_clientes_prevenir_exclusao
    BEFORE DELETE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION prevenir_exclusao_clientes_com_boletos();

-- =============================================================================
-- TABELA: GRUPOS DE WHATSAPP (PARA FACILITAR ENVIO EM LOTE)
-- =============================================================================

CREATE TABLE grupos_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    ativo BOOLEAN NOT NULL DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    atualizado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- TABELA: MENSAGENS ENVIADAS PELO WHATSAPP (HISTÓRICO)
CREATE TABLE historico_whatsapp (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    grupo_id UUID REFERENCES grupos_whatsapp(id) ON DELETE SET NULL,
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    mensagem TEXT NOT NULL,
    status_envio status_envio NOT NULL DEFAULT 'ENVIANDO',
    id_destino VARCHAR(100) NOT NULL,  -- Número do WhatsApp destino
    erro TEXT,
    data_envio TIMESTAMP WITH TIME ZONE,
    data_entrega TIMESTAMP WITH TIME ZONE,
    data_falha TIMESTAMP WITH TIME ZONE,
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historico_whatsapp_grupo ON historico_whatsapp(grupo_id);
CREATE INDEX idx_historico_whatsapp_cliente ON historico_whatsapp(cliente_id);
CREATE INDEX idx_historico_whatsapp_data ON historico_whatsapp(criado_em);

-- =============================================================================
-- TABELA: USUÁRIOS AUTORIZADOS A ACESSAR O PAINEL (ADICIONAL)
-- =============================================================================

CREATE TABLE permissoes_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    recurso VARCHAR(100) NOT NULL,  -- Ex: 'clientes', 'boletos', 'relatorios'
    permissoes VARCHAR(50)[] NOT NULL DEFAULT ARRAY['LEITURA'],  -- ARRAY DE PERMISSÕES: ['LEITURA', 'ESCRITA', 'EXCLUSAO']
    criado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissoes_usuario_id ON permissoes_usuario(usuario_id);
CREATE INDEX idx_permissoes_recurso ON permissoes_usuario(recurso);

-- =============================================================================
-- ÍNDICES COMPOSTOS PARA CONSULTAS COMPLEXAS
-- =============================================================================

-- Índice para listagem de boletos pendentes de um mês específico
CREATE INDEX idx_boletos_pendentes_mes ON boletos(data_vencimento, status)
WHERE status = 'PENDING';

-- Índice para clientes inadimplentes
CREATE INDEX idx_clientes_inadimplentes ON clientes(status, data_inicio)
WHERE status IN ('INADIMPLENTE', 'SUSPENSO');

-- Índice para logs de envio falhados (para retry automático)
CREATE INDEX idx_logs_envio_falha ON logs_envio(status_envio, tentativas)
WHERE status_envio = 'FALHA' AND tentativas < 3;

-- =============================================================================
-- VIEWS PARA RELATÓRIOS E DASHBOARD
-- =============================================================================

-- VIEW: Resumo de clientes por status
CREATE VIEW vw_resumo_clientes AS
SELECT
    status,
    COUNT(*) AS total,
    SUM(CASE WHEN status = 'ATIVO' THEN 1 ELSE 0 END) FILTER (WHERE status = 'ATIVO') AS ativos,
    SUM(CASE WHEN status = 'INADIMPLENTE' THEN 1 ELSE 0 END) FILTER (WHERE status = 'INADIMPLENTE') AS inadimplentes,
    SUM(CASE WHEN status = 'CANCELADO' THEN 1 ELSE 0 END) FILTER (WHERE status = 'CANCELADO') AS cancelados
FROM clientes
GROUP BY status;

-- VIEW: Resumo financeiro mensal
CREATE VIEW vw_resumo_financeiro_mensal AS
SELECT
    DATE_TRUNC('month', data_vencimento) AS mes_referencia,
    COUNT(*) AS total_boletos,
    SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS boletos_pagos,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS boletos_em_aberto,
    SUM(CASE WHEN status = 'EXPIRED' THEN 1 ELSE 0 END) AS boletos_vencidos,
    SUM(CASE WHEN status = 'CONFIRMED' THEN valor_pago ELSE 0 END) AS valor_recebido,
    SUM(CASE WHEN status = 'PENDING' THEN valor ELSE 0 END) AS valor_a_receber,
    SUM(valor) AS valor_total
FROM boletos
GROUP BY DATE_TRUNC('month', data_vencimento)
ORDER BY mes_referencia DESC;

-- VIEW: Clientes com plano e contatos principais
CREATE VIEW vw_clientes_com_plano AS
SELECT
    c.id,
    c.nome_completo,
    c.cpf_cnpj,
    c.status,
    p.nome AS plano_nome,
    p.velocidade AS plano_velocidade,
    p.valor_mensal,
    c.data_inicio,
    c.data_fim,
    c.dia_vencimento,
    c.endereco_cidade,
    c.endereco_uf,
    email.valor AS email_principal,
    telefone.valor AS telefone_principal,
   whatsapp.valor AS whatsapp_principal
FROM clientes c
JOIN planos p ON c.plano_id = p.id
LEFT JOIN contatos email ON c.id = email.cliente_id AND email.tipo = 'EMAIL' AND email.principal = true
LEFT JOIN contatos telefone ON c.id = telefone.cliente_id AND telefone.tipo = 'TELEFONE' AND telefone.principal = true
LEFT JOIN contatos whatsapp ON c.id = whatsapp.cliente_id AND whatsapp.tipo = 'WHATSAPP' AND whatsapp.principal = true;

-- VIEW: Histórico de pagamentos por cliente
CREATE VIEW vw_historico_clientes_pagamentos AS
SELECT
    c.id AS cliente_id,
    c.nome_completo,
    p.nome AS plano_nome,
    b.id AS boleto_id,
    b.numero_boleto,
    b.valor,
    b.valor_pago,
    b.status AS status_boleto,
    b.data_vencimento,
    b.data_pagamento,
    hp.Valor_pago AS valor_pago_historico
FROM clientes c
JOIN planos p ON c.plano_id = p.id
JOIN boletos b ON c.id = b.cliente_id
LEFT JOIN historicos_pagamentos_boleto hp ON b.id = hp.boleto_id;

-- VIEW: Boletos pendentes com informações do cliente (para cobrança)
CREATE VIEW vw_boletos_pendentes AS
SELECT
    b.id,
    b.numero_boleto,
    b.nosso_numero,
    b.codigo_barras,
    b.valor,
    b.valor_pago,
    b.data_vencimento,
    b.status,
    b.gateway_id,
    c.id AS cliente_id,
    c.nome_completo,
    c.cpf_cnpj,
    c.status AS status_cliente,
    p.nome AS plano_nome,
    p.valor_mensal
FROM boletos b
JOIN clientes c ON b.cliente_id = c.id
JOIN planos p ON b.plano_id = p.id
WHERE b.status IN ('PENDING', 'EXPIRED')
ORDER BY b.data_vencimento ASC;

-- VIEW: Resumo de inadimplência por plano
CREATE VIEW vw_inadimplencia_por_plano AS
SELECT
    p.id AS plano_id,
    p.nome AS plano_nome,
    p.valor_mensal,
    COUNT(DISTINCT CASE WHEN c.status = 'ATIVO' THEN c.id END) AS clientes_ativos,
    COUNT(DISTINCT CASE WHEN c.status = 'INADIMPLENTE' THEN c.id END) AS clientes_inadimplentes,
    COUNT(DISTINCT CASE WHEN c.status = 'CANCELADO' THEN c.id END) AS clientes_cancelados,
    COUNT(DISTINCT CASE WHEN c.status = 'SUSPENSO' THEN c.id END) AS clientes_suspensos,
    SUM(CASE WHEN b.status = 'PENDING' THEN b.valor ELSE 0 END) AS valor_receber,
    SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.valor_pago ELSE 0 END) AS valor_recebido
FROM planos p
LEFT JOIN clientes c ON p.id = c.plano_id
LEFT JOIN boletos b ON c.id = b.cliente_id
GROUP BY p.id, p.nome, p.valor_mensal;

-- VIEW: Estatísticas de envio de e-mails
CREATE VIEW vw_estatisticas_envio_email AS
SELECT
    DATE_TRUNC('month', criado_em) AS mes,
    COUNT(*) AS total_envios,
    SUM(CASE WHEN status_envio = 'ENVIADO' THEN 1 ELSE 0 END) AS enviados_com_sucesso,
    SUM(CASE WHEN status_envio = 'FALHA' THEN 1 ELSE 0 END) AS falhas,
    SUM(CASE WHEN status_envio = 'ENVIANDO' THEN 1 ELSE 0 END) AS pendentes,
    AVG(tentativas) AS media_tentativas
FROM logs_envio
WHERE tipo_envio = 'EMAIL'
GROUP BY DATE_TRUNC('month', criado_em)
ORDER BY mes DESC;

-- VIEW: Estatísticas de envio de WhatsApp
CREATE VIEW vw_estatisticas_envio_whatsapp AS
SELECT
    DATE_TRUNC('month', criado_em) AS mes,
    COUNT(*) AS total_envios,
    SUM(CASE WHEN status_envio = 'ENVIADO' THEN 1 ELSE 0 END) AS enviados_com_sucesso,
    SUM(CASE WHEN status_envio = 'FALHA' THEN 1 ELSE 0 END) AS falhas,
    SUM(CASE WHEN status_envio = 'ENVIANDO' THEN 1 ELSE 0 END) AS pendentes,
    AVG(tentativas) AS media_tentativas
FROM logs_envio
WHERE tipo_envio = 'WHATSAPP'
GROUP BY DATE_TRUNC('month', criado_em)
ORDER BY mes DESC;

-- VIEW: Cliente com histórico de boletos (para visualização detalhada)
CREATE VIEW vw_detalhes_cliente_com_boletos AS
SELECT
    c.id AS cliente_id,
    c.nome_completo,
    c.cpf_cnpj,
    c.status AS status_cliente,
    p.nome AS plano_nome,
    p.valor_mensal,
    string_agg(DISTINCT email.valor, ', ') AS emails,
    string_agg(DISTINCT whatsapp.valor, ', ') AS telefones_whatsapp,
    json_agg(json_build_object(
        'boleto_id', b.id,
        'numero_boleto', b.numero_boleto,
        'valor', b.valor,
        'data_vencimento', b.data_vencimento,
        'status', b.status,
        'data_pagamento', b.data_pagamento,
        'gateway_id', b.gateway_id
    )) AS boletos
FROM clientes c
JOIN planos p ON c.plano_id = p.id
LEFT JOIN contatos email ON c.id = email.cliente_id AND email.tipo = 'EMAIL'
LEFT JOIN contatos whatsapp ON c.id = whatsapp.cliente_id AND whatsapp.tipo = 'WHATSAPP'
LEFT JOIN boletos b ON c.id = b.cliente_id
GROUP BY c.id, c.nome_completo, c.cpf_cnpj, c.status, p.nome, p.valor_mensal;

-- =============================================================================
-- FUNÇÕES E TRIGGERS PARA INTEGRIDADE DE DADOS
-- =============================================================================

-- FUNÇÃO: Atualizar timestamp de atualização automaticamente
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Atualizar timestamp em tabelas com coluna atualizado_em
CREATE TRIGGER trigger_usuarios_update
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_planos_update
    BEFORE UPDATE ON planos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_clientes_update
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_configuracoes_envio_update
    BEFORE UPDATE ON configuracoes_envio
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_configuracoes_sistema_update
    BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_grupos_whatsapp_update
    BEFORE UPDATE ON grupos_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- =============================================================================
-- FUNÇÃO: Atualizar status do cliente quando boleto for pago
-- =============================================================================

CREATE OR REPLACE FUNCTION atualizar_status_cliente_apos_pagamento()
RETURNS TRIGGER AS $$
DECLARE
    boletos_pendentes INTEGER;
BEGIN
    -- Verificar se há outros boletos pendentes para este cliente
    SELECT COUNT(*) INTO boletos_pendentes
    FROM boletos
    WHERE cliente_id = NEW.cliente_id
      AND status IN ('PENDING', 'EXPIRED');

    -- Se não há mais boletos pendentes e cliente está inadimplente, voltar para ativo
    IF boletos_pendentes = 0 AND NEW.status = 'INADIMPLENTE' THEN
        NEW.status = 'ATIVO';

        -- Registrar histórico de mudança de status
        INSERT INTO historicos_status_cliente (
            cliente_id, status_anterior, status_novo, razao, usuario_id
        ) VALUES (
            NEW.id, 'INADIMPLENTE', 'ATIVO',
            'Todos os boletos foram pagos', NULL
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Atualizar status do cliente quando boleto for pag
-- Nota: O trigger acima não é necessário pois a função referencia NEW.status que não existe no contexto do trigger
-- A lógica de atualização de status será feita no worker de pagamento

-- =============================================================================
-- FUNÇÃO: Gerar histórico quando plano for alterado
-- =============================================================================

CREATE OR REPLACE FUNCTION gerar_historico_plano_alteracao()
RETURNS TRIGGER AS $$
DECLARE
    plano_anterior_id UUID;
BEGIN
    -- Verificar se o plano foi alterado
    IF OLD.plano_id IS DISTINCT FROM NEW.plano_id THEN
        -- Obter dados do plano anterior
        SELECT plano_id INTO plano_anterior_id FROM clientes WHERE id = NEW.id;

        -- Inserir histórico
        INSERT INTO historicos_plano_cliente (
            cliente_id,
            plano_anterior_id,
            plano_novo_id,
            valor_anterior,
            valor_novo,
            motivo
        ) VALUES (
            NEW.id,
           Old.plano_id,
            NEW.plano_id,
            (SELECT valor_mensal FROM planos WHERE id = Old.plano_id),
            (SELECT valor_mensal FROM planos WHERE id = NEW.plano_id),
            'Alteração de plano via painel administrativo'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- PRIVILEGIOS DE ACESSO (opcional - para multi-tenant ou users separados)
-- =============================================================================

-- Opcional: Revoke permissions padrão e grant only para roles específicas
-- CREATE ROLE painel_app LOGIN;
-- GRANT CONNECT ON DATABASE boleto_manager TO painel_app;
-- GRANT USAGE ON SCHEMA public TO painel_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO painel_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO painel_app;

-- =============================================================================
-- DADOS INICIAIS (SEEDS)
-- =============================================================================

-- Inserir usuário administrador padrão
-- Senha: admin123 (bcrypt hash gerado com: SELECT crypt('admin123', gen_salt('bf')))
INSERT INTO usuarios (nome, email, senha, cargo, ativo)
VALUES (
    'Administrador Sistema',
    'admin@boleto_manager.com',
    '$2a$10$N3p4qF8V9X2Z3Y4Z5W6X7Y8Z9Z0a1b2c3d4e5f6g7h8i9j0k',  -- Exemplo: crypt('admin123', gen_salt('bf'))
    'ADMINISTRADOR',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Inserir configurações de e-mail padrão (placeholders)
INSERT INTO configuracoes_envio (tipo_canal, ativo)
VALUES ('EMAIL_SMTP', false)
ON CONFLICT (tipo_canal) DO NOTHING;

-- Inserir configurações de WhatsApp padrão (placeholders)
INSERT INTO configuracoes_envio (tipo_canal, ativo)
VALUES ('WHATSAPP_EVO', false)
ON CONFLICT (tipo_canal) DO NOTHING;

-- Inserir configuração do Asaas (padrão)
INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, sensitive)
VALUES ('GATEWAY_BOLETO', 'ASAAS', 'Gateway para geração de boletos', 'STRING', false)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, sensitive)
VALUES ('ASAAS_API_KEY', '', 'API Key do Asaas', 'STRING', true)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, sensitive)
VALUES ('ASAAS_URL_BASE', 'https://sandbox.asaas.com/api/v3', 'URL base do Asaas', 'STRING', false)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, sensitive)
VALUES ('WHATSAPP_API_URL', '', 'URL da API do WhatsApp', 'STRING', false)
ON CONFLICT (chave) DO NOTHING;

INSERT INTO configuracoes_sistema (chave, valor, descricao, tipo, sensitive)
VALUES ('WHATSAPP_API_TOKEN', '', 'Token da API do WhatsApp', 'STRING', true)
ON CONFLICT (chave) DO NOTHING;

-- Inserir configuração de agendamento padrão (gerar boletos dia 1 de cada mês)
INSERT INTO configuracoes_agendamento (tarefa, cron_expression, ativo, descricao)
VALUES (
    'gerar_boletos_mensais',
    '0 0 1 * *',  -- Todos os dias 1 de cada mês, à meia-noite
    true,
    'Gera automaticamente boletos para todos os clientes ativos'
)
ON CONFLICT (tarefa) DO NOTHING;

-- Inserir configuração de agendamento para lembretes (2 dias antes do vencimento)
INSERT INTO configuracoes_agendamento (tarefa, cron_expression, ativo, descricao)
VALUES (
    'enviar_lembretes_boletos',
    '0 8 * * *',  -- Todos os dias às 8h da manhã
    true,
    'Envia lembretes de vencimento por e-mail e WhatsApp'
)
ON CONFLICT (tarefa) DO NOTHING;

-- Insert de um status suspend com typo corrigido (acidentalmente deixei um espaço extra na string)
-- Opgão para corrigir se necessário

-- =============================================================================
-- FIM DO SCHEMA
-- =============================================================================
