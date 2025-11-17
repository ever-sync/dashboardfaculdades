-- ========================================
-- MIGRAÇÃO: Criar tabela de Agentes IA
-- Data: 2024-11-XX
-- Descrição: Tabela para gerenciar agentes de IA vinculados às faculdades
-- ========================================

-- ========================================
-- TABELA: agentes_ia
-- ========================================
CREATE TABLE IF NOT EXISTS agentes_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    script_atendimento TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    descricao TEXT,
    configuracao JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT nome_faculdade_unique UNIQUE(faculdade_id, nome)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agentes_faculdade ON agentes_ia(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_agentes_ativo ON agentes_ia(ativo);
CREATE INDEX IF NOT EXISTS idx_agentes_nome ON agentes_ia(nome);

-- ========================================
-- HABILITAR RLS
-- ========================================
ALTER TABLE agentes_ia ENABLE ROW LEVEL SECURITY;

-- ========================================
-- POLÍTICAS RLS
-- ========================================
CREATE POLICY IF NOT EXISTS "rls_select_agentes" ON agentes_ia 
    FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "rls_insert_agentes" ON agentes_ia 
    FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "rls_update_agentes" ON agentes_ia 
    FOR UPDATE USING (true);

CREATE POLICY IF NOT EXISTS "rls_delete_agentes" ON agentes_ia 
    FOR DELETE USING (true);

-- ========================================
-- CONCEDER PERMISSÕES
-- ========================================
GRANT SELECT, INSERT, UPDATE, DELETE ON agentes_ia TO anon, authenticated;

-- ========================================
-- TRIGGER para atualizar updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_agentes_ia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agentes_ia_updated_at
    BEFORE UPDATE ON agentes_ia
    FOR EACH ROW
    EXECUTE FUNCTION update_agentes_ia_updated_at();

