-- ========================================
-- MIGRAÇÃO: Criar tabela de Base de Conhecimentos
-- ========================================

-- Criar tabela base_conhecimento
CREATE TABLE IF NOT EXISTS base_conhecimento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    pergunta TEXT NOT NULL,
    resposta TEXT NOT NULL,
    categoria VARCHAR(255),
    tags TEXT[],
    ativo BOOLEAN DEFAULT true,
    visualizacoes INTEGER DEFAULT 0,
    util INTEGER DEFAULT 0,
    nao_util INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_base_conhecimento_faculdade ON base_conhecimento(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_base_conhecimento_ativo ON base_conhecimento(ativo);
CREATE INDEX IF NOT EXISTS idx_base_conhecimento_categoria ON base_conhecimento(categoria);
CREATE INDEX IF NOT EXISTS idx_base_conhecimento_pergunta ON base_conhecimento USING gin(to_tsvector('portuguese', pergunta));
CREATE INDEX IF NOT EXISTS idx_base_conhecimento_resposta ON base_conhecimento USING gin(to_tsvector('portuguese', resposta));

-- Habilitar RLS
ALTER TABLE base_conhecimento ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "rls_select_base_conhecimento" ON base_conhecimento;
    DROP POLICY IF EXISTS "rls_insert_base_conhecimento" ON base_conhecimento;
    DROP POLICY IF EXISTS "rls_update_base_conhecimento" ON base_conhecimento;
    DROP POLICY IF EXISTS "rls_delete_base_conhecimento" ON base_conhecimento;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas RLS
CREATE POLICY "rls_select_base_conhecimento" ON base_conhecimento 
    FOR SELECT USING (true);

CREATE POLICY "rls_insert_base_conhecimento" ON base_conhecimento 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update_base_conhecimento" ON base_conhecimento 
    FOR UPDATE USING (true);

CREATE POLICY "rls_delete_base_conhecimento" ON base_conhecimento 
    FOR DELETE USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON base_conhecimento TO anon, authenticated;

-- Criar função para trigger
CREATE OR REPLACE FUNCTION update_base_conhecimento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_base_conhecimento_updated_at ON base_conhecimento;
CREATE TRIGGER trigger_update_base_conhecimento_updated_at
    BEFORE UPDATE ON base_conhecimento
    FOR EACH ROW
    EXECUTE FUNCTION update_base_conhecimento_updated_at();

