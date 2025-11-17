-- ========================================
-- MIGRAÇÃO: Adicionar tabelas de métricas e campos faltantes
-- Data: 2024-11-XX
-- Descrição: Cria tabelas de métricas faltantes e adiciona campos necessários para envio/recebimento de mensagens
-- ========================================

-- ========================================
-- 1. CRIAR TABELA: codigos_atendimento
-- ========================================
CREATE TABLE IF NOT EXISTS codigos_atendimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    ativo BOOLEAN DEFAULT true,
    acao VARCHAR(50) NOT NULL CHECK (acao IN ('pausar_ia', 'ativar_ia', 'transferir', 'solicitar_humano')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_codigos_atendimento_nome ON codigos_atendimento(nome);
CREATE INDEX IF NOT EXISTS idx_codigos_atendimento_ativo ON codigos_atendimento(ativo);

-- ========================================
-- 2. ADICIONAR CAMPOS NA TABELA: conversas_whatsapp
-- ========================================
-- Adicionar campos para suporte completo ao script de métricas
ALTER TABLE conversas_whatsapp 
    ADD COLUMN IF NOT EXISTS status_conversa VARCHAR(20) CHECK (status_conversa IN ('ativa', 'pendente', 'encerrada')),
    ADD COLUMN IF NOT EXISTS prospect_id UUID REFERENCES prospects_academicos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS duracao_segundos INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS setor VARCHAR(100),
    ADD COLUMN IF NOT EXISTS avaliacao_nota INTEGER CHECK (avaliacao_nota >= 0 AND avaliacao_nota <= 5);

-- Sincronizar status_conversa com status se status_conversa for NULL
UPDATE conversas_whatsapp 
SET status_conversa = CASE 
    WHEN status = 'ativo' THEN 'ativa'
    WHEN status = 'pendente' THEN 'pendente'
    WHEN status = 'encerrado' THEN 'encerrada'
    ELSE 'pendente'
END
WHERE status_conversa IS NULL;

-- Sincronizar setor com departamento se setor for NULL
UPDATE conversas_whatsapp 
SET setor = departamento 
WHERE setor IS NULL AND departamento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conversas_status_conversa ON conversas_whatsapp(status_conversa);
CREATE INDEX IF NOT EXISTS idx_conversas_prospect_id ON conversas_whatsapp(prospect_id);
CREATE INDEX IF NOT EXISTS idx_conversas_setor ON conversas_whatsapp(setor);

-- ========================================
-- 3. ADICIONAR CAMPOS NA TABELA: prospects_academicos
-- ========================================
ALTER TABLE prospects_academicos 
    ADD COLUMN IF NOT EXISTS cidade VARCHAR(100),
    ADD COLUMN IF NOT EXISTS estado VARCHAR(2);

CREATE INDEX IF NOT EXISTS idx_prospects_cidade ON prospects_academicos(cidade);
CREATE INDEX IF NOT EXISTS idx_prospects_estado ON prospects_academicos(estado);

-- ========================================
-- 4. ADICIONAR CAMPOS NA TABELA: metricas_diarias
-- ========================================
ALTER TABLE metricas_diarias 
    ADD COLUMN IF NOT EXISTS total_mensagens INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS prospects_novos INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tempo_medio_resposta INTEGER DEFAULT 0;

-- Sincronizar campos existentes com novos se necessário
UPDATE metricas_diarias 
SET 
    total_mensagens = COALESCE(total_mensagens, mensagens_enviadas + mensagens_recebidas),
    prospects_novos = COALESCE(prospects_novos, novos_prospects),
    tempo_medio_resposta = COALESCE(tempo_medio_resposta, tempo_medio_primeira_resposta_segundos)
WHERE total_mensagens = 0 OR prospects_novos = 0 OR tempo_medio_resposta = 0;

-- Ajustar constraint UNIQUE para permitir sem departamento
ALTER TABLE metricas_diarias 
    DROP CONSTRAINT IF EXISTS metricas_diarias_faculdade_id_data_departamento_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_metricas_diarias_unique 
    ON metricas_diarias(faculdade_id, data, COALESCE(departamento, ''));

-- ========================================
-- 5. CRIAR TABELA: metricas_demograficas
-- ========================================
CREATE TABLE IF NOT EXISTS metricas_demograficas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    total_prospects INTEGER DEFAULT 0,
    total_matriculas INTEGER DEFAULT 0,
    receita_estimada DECIMAL(10, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, cidade, estado)
);

CREATE INDEX IF NOT EXISTS idx_metricas_demograficas_faculdade ON metricas_demograficas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_metricas_demograficas_data ON metricas_demograficas(data);
CREATE INDEX IF NOT EXISTS idx_metricas_demograficas_cidade ON metricas_demograficas(cidade);
CREATE INDEX IF NOT EXISTS idx_metricas_demograficas_estado ON metricas_demograficas(estado);

-- ========================================
-- 6. CRIAR TABELA: metricas_por_setor
-- ========================================
CREATE TABLE IF NOT EXISTS metricas_por_setor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    setor VARCHAR(100) NOT NULL,
    total_atendimentos INTEGER DEFAULT 0,
    atendimentos_finalizados INTEGER DEFAULT 0,
    tempo_medio_atendimento INTEGER DEFAULT 0,
    avaliacoes_positivas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, setor)
);

CREATE INDEX IF NOT EXISTS idx_metricas_por_setor_faculdade ON metricas_por_setor(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_metricas_por_setor_data ON metricas_por_setor(data);
CREATE INDEX IF NOT EXISTS idx_metricas_por_setor_setor ON metricas_por_setor(setor);

-- ========================================
-- 7. CRIAR TABELA: metricas_por_horario
-- ========================================
CREATE TABLE IF NOT EXISTS metricas_por_horario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    hora INTEGER NOT NULL CHECK (hora >= 0 AND hora <= 23),
    total_mensagens INTEGER DEFAULT 0,
    total_conversas INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, hora)
);

CREATE INDEX IF NOT EXISTS idx_metricas_por_horario_faculdade ON metricas_por_horario(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_metricas_por_horario_data ON metricas_por_horario(data);
CREATE INDEX IF NOT EXISTS idx_metricas_por_horario_hora ON metricas_por_horario(hora);

-- ========================================
-- 8. HABILITAR RLS NAS NOVAS TABELAS
-- ========================================
ALTER TABLE codigos_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_demograficas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_por_setor ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_por_horario ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 9. CRIAR POLÍTICAS RLS
-- ========================================
CREATE POLICY IF NOT EXISTS "rls_select_codigos_atendimento" ON codigos_atendimento 
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "rls_select_metricas_demograficas" ON metricas_demograficas 
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "rls_insert_metricas_demograficas" ON metricas_demograficas 
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "rls_update_metricas_demograficas" ON metricas_demograficas 
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "rls_select_metricas_por_setor" ON metricas_por_setor 
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "rls_insert_metricas_por_setor" ON metricas_por_setor 
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "rls_update_metricas_por_setor" ON metricas_por_setor 
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "rls_select_metricas_por_horario" ON metricas_por_horario 
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "rls_insert_metricas_por_horario" ON metricas_por_horario 
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "rls_update_metricas_por_horario" ON metricas_por_horario 
    FOR UPDATE USING (true);

-- ========================================
-- 10. CONCEDER PERMISSÕES
-- ========================================
GRANT SELECT, INSERT, UPDATE ON codigos_atendimento TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON metricas_demograficas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON metricas_por_setor TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON metricas_por_horario TO anon, authenticated;

