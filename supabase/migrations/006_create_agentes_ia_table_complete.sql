-- ========================================
-- MIGRAÇÃO COMPLETA: Criar tabela de Agentes IA
-- ========================================

-- Criar tabela agentes_ia
CREATE TABLE IF NOT EXISTS agentes_ia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    script_atendimento TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    setor VARCHAR(100) CHECK (setor IN ('Suporte', 'Vendas', 'Atendimento')),
    descricao TEXT,
    configuracao JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_agentes_faculdade ON agentes_ia(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_agentes_ativo ON agentes_ia(ativo);
CREATE INDEX IF NOT EXISTS idx_agentes_nome ON agentes_ia(nome);
CREATE INDEX IF NOT EXISTS idx_agentes_setor ON agentes_ia(setor);

-- Criar índice único para garantir unicidade de nome + faculdade + setor
-- Usa COALESCE para tratar NULL como string vazia
CREATE UNIQUE INDEX IF NOT EXISTS agentes_nome_faculdade_setor_unique 
ON agentes_ia(faculdade_id, nome, COALESCE(setor, ''));

-- Habilitar RLS
ALTER TABLE agentes_ia ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "rls_select_agentes" ON agentes_ia;
    DROP POLICY IF EXISTS "rls_insert_agentes" ON agentes_ia;
    DROP POLICY IF EXISTS "rls_update_agentes" ON agentes_ia;
    DROP POLICY IF EXISTS "rls_delete_agentes" ON agentes_ia;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas RLS
CREATE POLICY "rls_select_agentes" ON agentes_ia 
    FOR SELECT USING (true);

CREATE POLICY "rls_insert_agentes" ON agentes_ia 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update_agentes" ON agentes_ia 
    FOR UPDATE USING (true);

CREATE POLICY "rls_delete_agentes" ON agentes_ia 
    FOR DELETE USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON agentes_ia TO anon, authenticated;

-- Criar função para trigger
CREATE OR REPLACE FUNCTION update_agentes_ia_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_agentes_ia_updated_at ON agentes_ia;
CREATE TRIGGER trigger_update_agentes_ia_updated_at
    BEFORE UPDATE ON agentes_ia
    FOR EACH ROW
    EXECUTE FUNCTION update_agentes_ia_updated_at();
