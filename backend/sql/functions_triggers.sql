-- =============================================================================
-- FUNÇÕES E TRIGGERS - SISTEMA DE GESTÃO DE BOLETOS
-- Provedor de Internet - Fire Telecom
-- =============================================================================

-- =============================================================================
-- FUNÇÃO: Atualizar timestamp de atualização automaticamente
-- Usa para tabelas com coluna 'atualizado_em'
-- =============================================================================

CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- TRIGGERS: Atualizar timestamp automaticamente
-- =============================================================================

-- Tabela: usuarios
DROP TRIGGER IF EXISTS trigger_usuarios_update ON usuarios;
CREATE TRIGGER trigger_usuarios_update
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Tabela: planos
DROP TRIGGER IF EXISTS trigger_planos_update ON planos;
CREATE TRIGGER trigger_planos_update
    BEFORE UPDATE ON planos
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Tabela: clientes
DROP TRIGGER IF EXISTS trigger_clientes_update ON clientes;
CREATE TRIGGER trigger_clientes_update
    BEFORE UPDATE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Tabela: configuracoes_envio
DROP TRIGGER IF EXISTS trigger_configuracoes_envio_update ON configuracoes_envio;
CREATE TRIGGER trigger_configuracoes_envio_update
    BEFORE UPDATE ON configuracoes_envio
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Tabela: configuracoes_sistema
DROP TRIGGER IF EXISTS trigger_configuracoes_sistema_update ON configuracoes_sistema;
CREATE TRIGGER trigger_configuracoes_sistema_update
    BEFORE UPDATE ON configuracoes_sistema
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- Tabela: grupos_whatsapp
DROP TRIGGER IF EXISTS trigger_grupos_whatsapp_update ON grupos_whatsapp;
CREATE TRIGGER trigger_grupos_whatsapp_update
    BEFORE UPDATE ON grupos_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_timestamp();

-- =============================================================================
-- FUNÇÃO: Validar CPF
-- =============================================================================

CREATE OR REPLACE FUNCTION validar_cpf(cpf VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    digitos VARCHAR;
    dv1 INTEGER;
    dv2 INTEGER;
    soma INTEGER;
    resto INTEGER;
    peso INTEGER;
BEGIN
    -- Remove caracteres não numéricos
    digitos := REGEXP_REPLACE(cpf, '[^0-9]', '', 'g');

    -- Verifica se tem 11 dígitos e não é sequencial
    IF LENGTH(digitos) != 11 OR digitos = '00000000000' OR digitos = '11111111111' OR digitos = '22222222222'
       OR digitos = '33333333333' OR digitos = '44444444444' OR digitos = '55555555555'
       OR digitos = '66666666666' OR digitos = '77777777777' OR digitos = '88888888888' OR digitos = '99999999999' THEN
        RETURN FALSE;
    END IF;

    -- Cálculo do primeiro dígito verificador
    soma := 0;
    peso := 10;
    FOR i IN 1..9 LOOP
        soma := soma + (SUBSTRING(digitos, i, 1)::INTEGER) * peso;
        peso := peso - 1;
    END LOOP;
    resto := soma % 11;
    IF resto < 2 THEN
        dv1 := 0;
    ELSE
        dv1 := 11 - resto;
    END IF;

    -- Cálculo do segundo dígito verificador
    soma := 0;
    peso := 11;
    FOR i IN 1..10 LOOP
        soma := soma + (SUBSTRING(digitos, i, 1)::INTEGER) * peso;
        peso := peso - 1;
    END LOOP;
    resto := soma % 11;
    IF resto < 2 THEN
        dv2 := 0;
    ELSE
        dv2 := 11 - resto;
    END IF;

    -- Verifica se os dígitos calculados são iguais aos informados
    RETURN SUBSTRING(digitos, 10, 2)::INTEGER = (dv1 * 10 + dv2);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Validar CNPJ
-- =============================================================================

CREATE OR REPLACE FUNCTION validar_cnpj(cnpj VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    digitos VARCHAR;
    dv1 INTEGER;
    dv2 INTEGER;
    soma INTEGER;
    resto INTEGER;
    peso INTEGER;
BEGIN
    -- Remove caracteres não numéricos
    digitos := REGEXP_REPLACE(cnpj, '[^0-9]', '', 'g');

    -- Verifica se tem 14 dígitos e não é sequencial
    IF LENGTH(digitos) != 14 OR digitos = '00000000000000' OR digitos = '11111111111111'
       OR digitos = '22222222222222' OR digitos = '33333333333333' OR digitos = '44444444444444'
       OR digitos = '55555555555555' OR digitos = '66666666666666' OR digitos = '77777777777777'
       OR digitos = '88888888888888' OR digitos = '99999999999999' THEN
        RETURN FALSE;
    END IF;

    -- Cálculo do primeiro dígito verificador
    soma := 0;
    peso := 2;
    FOR i IN 1..12 LOOP
        soma := soma + (SUBSTRING(digitos, i, 1)::INTEGER) * peso;
        peso := peso + 1;
        IF peso > 9 THEN
            peso := 2;
        END IF;
    END LOOP;
    resto := soma % 11;
    IF resto < 2 THEN
        dv1 := 0;
    ELSE
        dv1 := 11 - resto;
    END IF;

    -- Cálculo do segundo dígito verificador
    soma := 0;
    peso := 2;
    FOR i IN 1..13 LOOP
        soma := soma + (SUBSTRING(digitos, i, 1)::INTEGER) * peso;
        peso := peso + 1;
        IF peso > 9 THEN
            peso := 2;
        END IF;
    END LOOP;
    resto := soma % 11;
    IF resto < 2 THEN
        dv2 := 0;
    ELSE
        dv2 := 11 - resto;
    END IF;

    -- Verifica se os dígitos calculados são iguais aos informados
    RETURN SUBSTRING(digitos, 13, 2)::INTEGER = (dv1 * 10 + dv2);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Gerar histórico de mudança de plano
-- =============================================================================

CREATE OR REPLACE FUNCTION gerar_historico_plano_alteracao()
RETURNS TRIGGER AS $$
DECLARE
    plano_anterior_id UUID;
    plano_novo_id UUID;
BEGIN
    -- Verificar se o plano foi alterado
    IF OLD.plano_id IS DISTINCT FROM NEW.plano_id THEN
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
            OLD.plano_id,
            NEW.plano_id,
            (SELECT valor_mensal FROM planos WHERE id = OLD.plano_id),
            (SELECT valor_mensal FROM planos WHERE id = NEW.plano_id),
            'Alteração de plano via painel administrativo'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TABELA:Clientes
DROP TRIGGER IF EXISTS trigger_clientes_plano_alteracao ON clientes;
CREATE TRIGGER trigger_clientes_plano_alteracao
    AFTER UPDATE ON clientes
    FOR EACH ROW
    WHEN (OLD.plano_id IS DISTINCT FROM NEW.plano_id)
    EXECUTE FUNCTION gerar_historico_plano_alteracao();

-- =============================================================================
-- FUNÇÃO: Atualizar status do cliente após pagamento de boleto
-- =============================================================================

CREATE OR REPLACE FUNCTION atualizar_status_cliente_apos_pagamento()
RETURNS TRIGGER AS $$
DECLARE
    boletos_pendentes INTEGER;
    cliente_temp clientes%ROWTYPE;
BEGIN
    -- Verificar se o boleto foi pago (status mudou de PENDING para CONFIRMED)
    IF (OLD.status = 'PENDING' OR OLD.status = 'EXPIRED') AND NEW.status = 'CONFIRMED' THEN
        -- Verificar se há outros boletos pendentes para este cliente
        SELECT COUNT(*) INTO boletos_pendentes
        FROM boletos
        WHERE cliente_id = NEW.cliente_id
          AND status IN ('PENDING', 'EXPIRED');

        -- Buscar o status atual do cliente
        SELECT * INTO cliente_temp
        FROM clientes
        WHERE id = NEW.cliente_id;

        -- Se não há mais boletos pendentes e cliente está inadimplente, voltar para ativo
        IF boletos_pendentes = 0 AND cliente_temp.status = 'INADIMPLENTE' THEN
            UPDATE clientes
            SET status = 'ATIVO'
            WHERE id = NEW.cliente_id;

            -- Registrar histórico de mudança de status
            INSERT INTO historicos_status_cliente (
                cliente_id, status_anterior, status_novo, razao
            ) VALUES (
                NEW.cliente_id, 'INADIMPLENTE', 'ATIVO',
                'Todos os boletos foram pagos'
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Atualizar status do cliente quando boleto for pago
DROP TRIGGER IF EXISTS trigger_boleto_pagamento_update ON boletos;
CREATE TRIGGER trigger_boleto_pagamento_update
    AFTER UPDATE ON boletos
    FOR EACH ROW
    WHEN (OLD.status IN ('PENDING', 'EXPIRED') AND NEW.status = 'CONFIRMED')
    EXECUTE FUNCTION atualizar_status_cliente_apos_pagamento();

-- =============================================================================
-- FUNÇÃO: Remover contatos principais ao excluir cliente
-- =============================================================================

CREATE OR REPLACE FUNCTION remover_contatos_cliente()
RETURNS TRIGGER AS $$
BEGIN
    -- Excluir contatos do cliente
    DELETE FROM contatos WHERE cliente_id = OLD.id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- TRIGGER: Remover contatos ao excluir cliente
DROP TRIGGER IF EXISTS trigger_clientes_remover_contatos ON clientes;
CREATE TRIGGER trigger_clientes_remover_contatos
    BEFORE DELETE ON clientes
    FOR EACH ROW
    EXECUTE FUNCTION remover_contatos_cliente();

-- =============================================================================
-- FUNÇÃO: Gerar número do boleto sequencial
-- =============================================================================

CREATE OR REPLACE FUNCTION gerar_numero_boleto(cliente_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    numero VARCHAR;
    count INTEGER;
    cliente_cpf VARCHAR;
BEGIN
    -- Obter o CPF do cliente para usar como prefixo
    SELECT REPLACE(cpf_cnpj, '[^0-9]', '') INTO cliente_cpf
    FROM clientes WHERE id = cliente_id;

    -- Contar quantos boletos já existem para este cliente
    SELECT COALESCE(COUNT(*), 0) + 1 INTO count
    FROM boletos WHERE cliente_id = cliente_id;

    -- Gerar número: CPF + número sequencial (padrão 6 dígitos)
    numero := LPAD(count::VARCHAR, 6, '0');

    RETURN cliente_cpf || numero;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Calcular datas de vencimento baseadas no dia do mês
-- =============================================================================

CREATE OR REPLACE FUNCTION calcular_data_vencimento(dia_vencimento INTEGER, data_referencia DATE)
RETURNS DATE AS $$
DECLARE
    data_vencimento DATE;
    dia_actual INTEGER;
BEGIN
    dia_actual := EXTRACT(DAY FROM data_referencia)::INTEGER;

    -- Se o dia de vencimento já passou neste mês, vencimento será no próximo mês
    IF dia_actual > dia_vencimento THEN
        data_vencimento := (date_trunc('month', data_referencia) + interval '1 month') + (dia_vencimento - 1)||' days'::interval;
    ELSE
        -- Se ainda não passou, vencimento é neste mês
        data_vencimento := date_trunc('month', data_referencia) + (dia_vencimento - 1)||' days'::interval;
    END IF;

    RETURN data_vencimento;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Converter valor numérico por extenso (para extrato bancário)
-- =============================================================================

CREATE OR REPLACE FUNCTION valor_por_extenso(valor DECIMAL(10,2))
RETURNS VARCHAR AS $$
DECLARE
    valor_inteiro INTEGER;
    valor_cents INTEGER;
    resultado VARCHAR;
BEGIN
    valor_inteiro := FLOOR(valor);
    valor_cents := ROUND((valor - valor_inteiro) * 100)::INTEGER;

    -- Simplificado - em produção usar função mais completa
    resultado := to_char(valor_inteiro, '999G999G999') || ' reais e ' ||
                 LPAD(valor_cents::VARCHAR, 2, '0') || ' centavos';

    RETURN resultado;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Verificar se cliente está apto para geração de boleto
-- =============================================================================

CREATE OR REPLACE FUNCTION cliente_aptos_boleto(cliente_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    cliente_status VARCHAR;
    plano_ativo BOOLEAN;
BEGIN
    -- Verificar status do cliente
    SELECT c.status, p.ativo INTO cliente_status, plano_ativo
    FROM clientes c
    JOIN planos p ON c.plano_id = p.id
    WHERE c.id = cliente_id;

    -- Cliente deve estar ativo e plano deve estar ativo
    IF cliente_status = 'ATIVO' AND plano_ativo THEN
        RETURN TRUE;
    END IF;

    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Calcular valor total com multa e juros
-- =============================================================================

CREATE OR REPLACE FUNCTION calcular_valor_total_com_multa_juros(
    valor_base DECIMAL,
    dias_atraso INTEGER,
    taxa_multa DECIMAL DEFAULT 2.0,  -- 2% padrão
    taxa_juros_diarios DECIMAL DEFAULT 0.033  -- 1% ao mês ≈ 0.033% ao dia
)
RETURNS DECIMAL AS $$
DECLARE
    valor_multa DECIMAL;
    valor_juros DECIMAL;
    valor_total DECIMAL;
BEGIN
    -- Calcular multa
    valor_multa := valor_base * (taxa_multa / 100);

    -- Calcular juros
    valor_juros := valor_base * (taxa_juros_diarios / 100) * dias_atraso;

    -- Valor total
    valor_total := valor_base + valor_multa + valor_juros;

    RETURN ROUND(valor_total, 2);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Retornar estatísticas do sistema
-- =============================================================================

CREATE OR REPLACE FUNCTION obter_estatisticas_sistema()
RETURNS JSON AS $$
DECLARE
    estatisticas JSON;
BEGIN
    SELECT json_build_object(
        'total_clientes', (SELECT COUNT(*) FROM clientes),
        'clientes_ativos', (SELECT COUNT(*) FROM clientes WHERE status = 'ATIVO'),
        'clientes_inadimplentes', (SELECT COUNT(*) FROM clientes WHERE status = 'INADIMPLENTE'),
        'clientes_cancelados', (SELECT COUNT(*) FROM clientes WHERE status = 'CANCELADO'),
        'total_boletos', (SELECT COUNT(*) FROM boletos),
        'boletos_pagos', (SELECT COUNT(*) FROM boletos WHERE status = 'CONFIRMED'),
        'boletos_em_aberto', (SELECT COUNT(*) FROM boletos WHERE status = 'PENDING'),
        'boletos_vencidos', (SELECT COUNT(*) FROM boletos WHERE status = 'EXPIRED'),
        'valor_a_receber', (SELECT COALESCE(SUM(valor), 0) FROM boletos WHERE status IN ('PENDING', 'EXPIRED')),
        'valor_recebido', (SELECT COALESCE(SUM(valor_pago), 0) FROM boletos WHERE status = 'CONFIRMED')
    ) INTO estatisticas;

    RETURN estatisticas;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Retornar rendiment mensal por plano
-- =============================================================================

CREATE OR REPLACE FUNCTION obter_rendimento_mensal_por_plano(mes_referencia DATE)
RETURNS TABLE (
    plano_id UUID,
    plano_nome VARCHAR,
    valor_mensal DECIMAL,
    total_clientes INTEGER,
    total_receita DECIMAL,
    boletos_pagos INTEGER,
    valor_recebido DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS plano_id,
        p.nome AS plano_nome,
        p.valor_mensal,
        COUNT(DISTINCT c.id) AS total_clientes,
        COUNT(b.id) AS total_boletos,
        COALESCE(SUM(b.valor), 0) AS total_receita,
        COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS boletos_pagos,
        COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.valor_pago ELSE 0 END), 0) AS valor_recebido
    FROM planos p
    LEFT JOIN clientes c ON p.id = c.plano_id
    LEFT JOIN boletos b ON c.id = b.cliente_id
        AND DATE_TRUNC('month', b.data_vencimento) = DATE_TRUNC('month', mes_referencia)
    GROUP BY p.id, p.nome, p.valor_mensal
    ORDER BY total_clientes DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FUNÇÃO: Retornar lista de clientes com histórico dePagamentos
-- =============================================================================

CREATE OR REPLACE FUNCTION obter_clientes_com_historico_pagamentos()
RETURNS TABLE (
    cliente_id UUID,
    nome_completo VARCHAR,
    plano_nome VARCHAR,
    valor_mensal DECIMAL,
    total_boletos INTEGER,
    boletos_pagos INTEGER,
    valor_total_pago DECIMAL,
    ultima_compra DATE,
    status_cliente VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS cliente_id,
        c.nome_completo,
        p.nome AS plano_nome,
        p.valor_mensal,
        COUNT(b.id) AS total_boletos,
        COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS boletos_pagos,
        COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.valor_pago ELSE 0 END), 0) AS valor_total_pago,
        MAX(b.data_pagamento) AS ultima_compra,
        c.status AS status_cliente
    FROM clientes c
    JOIN planos p ON c.plano_id = p.id
    LEFT JOIN boletos b ON c.id = b.cliente_id
    GROUP BY c.id, c.nome_completo, p.nome, p.valor_mensal, c.status
    ORDER BY valor_total_pago DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- FIM DAS FUNÇÕES E TRIGGERS
-- =============================================================================
