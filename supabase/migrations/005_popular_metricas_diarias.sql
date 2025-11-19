-- ========================================
-- SCRIPT: Popular Métricas Diárias
-- Descrição: Script para popular métricas diárias (rodar 1x por dia)
-- ========================================

-- ========================================
-- 1. Códigos de atendimento (rodar 1x - setup)
-- ========================================
-- Verificar quais colunas existem e inserir dados
DO $$ 
BEGIN
    -- Verificar se as colunas necessárias existem
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'codigos_atendimento' 
        AND column_name = 'acao'
    ) THEN
        -- Se a coluna acao existe, verificar se descricao também existe
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'codigos_atendimento' 
            AND column_name = 'descricao'
        ) THEN
            -- Inserir com descricao e acao
            INSERT INTO codigos_atendimento (nome, descricao, ativo, acao) VALUES
            ('#PAUSAR', 'Pausar IA e solicitar atendente', true, 'pausar_ia'),
            ('#ATIVAR', 'Reativar IA', true, 'ativar_ia'),
            ('#TRANS', 'Transferir para outro setor', true, 'transferir'),
            ('#HUMANO', 'Falar com humano', true, 'solicitar_humano')
            ON CONFLICT (nome) DO NOTHING;
        ELSE
            -- Inserir sem descricao, mas com acao
            INSERT INTO codigos_atendimento (nome, ativo, acao) VALUES
            ('#PAUSAR', true, 'pausar_ia'),
            ('#ATIVAR', true, 'ativar_ia'),
            ('#TRANS', true, 'transferir'),
            ('#HUMANO', true, 'solicitar_humano')
            ON CONFLICT (nome) DO NOTHING;
        END IF;
    ELSE
        -- Se a coluna acao não existe, inserir apenas nome e ativo
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'codigos_atendimento' 
            AND column_name = 'descricao'
        ) THEN
            INSERT INTO codigos_atendimento (nome, descricao, ativo) VALUES
            ('#PAUSAR', 'Pausar IA e solicitar atendente', true),
            ('#ATIVAR', 'Reativar IA', true),
            ('#TRANS', 'Transferir para outro setor', true),
            ('#HUMANO', 'Falar com humano', true)
            ON CONFLICT (nome) DO NOTHING;
        ELSE
            -- Inserir apenas nome e ativo
            INSERT INTO codigos_atendimento (nome, ativo) VALUES
            ('#PAUSAR', true),
            ('#ATIVAR', true),
            ('#TRANS', true),
            ('#HUMANO', true)
            ON CONFLICT (nome) DO NOTHING;
        END IF;
    END IF;
END $$;

-- ========================================
-- 2. Métricas demográficas
-- ========================================
-- Verificar se a tabela e colunas existem antes de inserir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'metricas_demograficas'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_demograficas' 
        AND column_name = 'cidade'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_demograficas' 
        AND column_name = 'estado'
    ) THEN
        INSERT INTO metricas_demograficas (
            data, faculdade_id, cidade, estado, 
            total_prospects, total_matriculas, receita_estimada
        )
        SELECT 
            CURRENT_DATE,
            faculdade_id,
            COALESCE(cidade, 'Não informado') as cidade,
            COALESCE(estado, 'NA') as estado,
            COUNT(*) as total_prospects,
            COUNT(*) FILTER (WHERE status_academico = 'matriculado') as total_matriculas,
            COUNT(*) FILTER (WHERE status_academico = 'matriculado') * 5000.00 as receita_estimada
        FROM prospects_academicos
        WHERE cidade IS NOT NULL AND estado IS NOT NULL
        GROUP BY faculdade_id, cidade, estado
        ON CONFLICT (faculdade_id, data, cidade, estado) DO UPDATE SET
            total_prospects = EXCLUDED.total_prospects,
            total_matriculas = EXCLUDED.total_matriculas,
            receita_estimada = EXCLUDED.receita_estimada;
    END IF;
END $$;

-- ========================================
-- 3. Métricas diárias
-- ========================================
INSERT INTO metricas_diarias (
    data, faculdade_id, total_conversas, conversas_finalizadas,
    total_mensagens, prospects_novos, tempo_medio_resposta
)
SELECT 
    CURRENT_DATE,
    c.faculdade_id,
    COUNT(DISTINCT c.id) as total_conversas,
    COUNT(DISTINCT c.id) FILTER (WHERE COALESCE(c.status_conversa, c.status) = 'encerrada' OR c.status = 'encerrado') as conversas_finalizadas,
    COUNT(m.id) as total_mensagens,
    COUNT(DISTINCT p.id) FILTER (WHERE p.created_at::date = CURRENT_DATE) as prospects_novos,
    COALESCE(AVG(c.duracao_segundos), 0)::INTEGER as tempo_medio_resposta
FROM conversas_whatsapp c
LEFT JOIN mensagens m ON c.id = m.conversa_id AND m.created_at::date = CURRENT_DATE
LEFT JOIN prospects_academicos p ON c.prospect_id = p.id OR (c.telefone = p.telefone AND c.faculdade_id = p.faculdade_id)
WHERE c.created_at::date = CURRENT_DATE
GROUP BY c.faculdade_id
ON CONFLICT (faculdade_id, data, COALESCE(departamento, '')) DO UPDATE SET
    total_conversas = EXCLUDED.total_conversas,
    conversas_finalizadas = EXCLUDED.conversas_finalizadas,
    total_mensagens = EXCLUDED.total_mensagens,
    prospects_novos = EXCLUDED.prospects_novos,
    tempo_medio_resposta = EXCLUDED.tempo_medio_resposta;

-- Atualizar mensagens_enviadas e mensagens_recebidas baseado no remetente
DO $$ 
BEGIN
    -- Verificar se as colunas existem antes de atualizar
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'metricas_diarias'
    ) THEN
        -- Atualizar mensagens_enviadas se a coluna existir
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_diarias' 
            AND column_name = 'mensagens_enviadas'
        ) THEN
            UPDATE metricas_diarias md
            SET mensagens_enviadas = (
                SELECT COUNT(*)
                FROM mensagens m
                JOIN conversas_whatsapp c ON m.conversa_id = c.id
                WHERE c.faculdade_id = md.faculdade_id
                    AND m.created_at::date = md.data
                    AND m.remetente IN ('agente', 'bot')
            )
            WHERE md.data = CURRENT_DATE;
        END IF;
        
        -- Atualizar mensagens_recebidas se a coluna existir
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_diarias' 
            AND column_name = 'mensagens_recebidas'
        ) THEN
            UPDATE metricas_diarias md
            SET mensagens_recebidas = (
                SELECT COUNT(*)
                FROM mensagens m
                JOIN conversas_whatsapp c ON m.conversa_id = c.id
                WHERE c.faculdade_id = md.faculdade_id
                    AND m.created_at::date = md.data
                    AND m.remetente = 'usuario'
            )
            WHERE md.data = CURRENT_DATE;
        END IF;
        
        -- Sincronizar novos_prospects com prospects_novos se ambas as colunas existirem
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_diarias' 
            AND column_name = 'novos_prospects'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_diarias' 
            AND column_name = 'prospects_novos'
        ) THEN
            UPDATE metricas_diarias md
            SET novos_prospects = prospects_novos
            WHERE md.data = CURRENT_DATE;
        END IF;
        
        -- Sincronizar tempo_medio_primeira_resposta_segundos com tempo_medio_resposta se ambas as colunas existirem
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_diarias' 
            AND column_name = 'tempo_medio_primeira_resposta_segundos'
        ) AND EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'metricas_diarias' 
            AND column_name = 'tempo_medio_resposta'
        ) THEN
            UPDATE metricas_diarias md
            SET tempo_medio_primeira_resposta_segundos = tempo_medio_resposta
            WHERE md.data = CURRENT_DATE;
        END IF;
    END IF;
END $$;

-- ========================================
-- 4. Métricas por horário
-- ========================================
INSERT INTO metricas_por_horario (
    data, faculdade_id, hora, total_mensagens, total_conversas
)
SELECT 
    m.created_at::date as data,
    c.faculdade_id,
    EXTRACT(HOUR FROM m.created_at)::INTEGER as hora,
    COUNT(m.id) as total_mensagens,
    COUNT(DISTINCT c.id) as total_conversas
FROM mensagens m
JOIN conversas_whatsapp c ON m.conversa_id = c.id
WHERE m.created_at::date = CURRENT_DATE
GROUP BY m.created_at::date, c.faculdade_id, EXTRACT(HOUR FROM m.created_at)
ON CONFLICT (faculdade_id, data, hora) DO UPDATE SET
    total_mensagens = EXCLUDED.total_mensagens,
    total_conversas = EXCLUDED.total_conversas;

-- ========================================
-- 5. Métricas por setor
-- ========================================
-- Verificar se a tabela e colunas existem antes de inserir
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'metricas_por_setor'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_por_setor' 
        AND column_name = 'atendimentos_finalizados'
    ) THEN
        INSERT INTO metricas_por_setor (
            data, faculdade_id, setor, total_atendimentos,
            atendimentos_finalizados, tempo_medio_atendimento, avaliacoes_positivas
        )
        SELECT 
            CURRENT_DATE as data,
            faculdade_id,
            COALESCE(setor, departamento) as setor,
            COUNT(*) as total_atendimentos,
            COUNT(*) FILTER (WHERE COALESCE(status_conversa, status) = 'encerrada' OR status = 'encerrado') as atendimentos_finalizados,
            COALESCE(AVG(duracao_segundos), 0)::INTEGER as tempo_medio_atendimento,
            COUNT(*) FILTER (WHERE avaliacao_nota >= 4) as avaliacoes_positivas
        FROM conversas_whatsapp
        WHERE created_at::date = CURRENT_DATE
        GROUP BY faculdade_id, COALESCE(setor, departamento)
        ON CONFLICT (faculdade_id, data, setor) DO UPDATE SET
            total_atendimentos = EXCLUDED.total_atendimentos,
            atendimentos_finalizados = EXCLUDED.atendimentos_finalizados,
            tempo_medio_atendimento = EXCLUDED.tempo_medio_atendimento,
            avaliacoes_positivas = EXCLUDED.avaliacoes_positivas;
    END IF;
END $$;

-- ========================================
-- Validação
-- ========================================
SELECT 'Métricas atualizadas com sucesso!' as status,
    COUNT(*) FILTER (WHERE data = CURRENT_DATE) as metricas_hoje
FROM metricas_diarias;

