-- ========================================
-- MIGRAÇÃO: Criar tabela de tags pré-definidas
-- ========================================

-- Criar tabela para tags pré-definidas (opcional, para gestão centralizada)
CREATE TABLE IF NOT EXISTS tags_predefinidas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    cor VARCHAR(50) DEFAULT 'gray',
    setor VARCHAR(100) CHECK (setor IN ('Suporte', 'Vendas', 'Atendimento', 'Financeiro')),
    ordem INTEGER DEFAULT 0,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_tags_predefinidas_faculdade ON tags_predefinidas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_tags_predefinidas_setor ON tags_predefinidas(setor);
CREATE INDEX IF NOT EXISTS idx_tags_predefinidas_ativo ON tags_predefinidas(ativo);

-- Habilitar RLS
ALTER TABLE tags_predefinidas ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "rls_select_tags_predefinidas" ON tags_predefinidas;
    DROP POLICY IF EXISTS "rls_insert_tags_predefinidas" ON tags_predefinidas;
    DROP POLICY IF EXISTS "rls_update_tags_predefinidas" ON tags_predefinidas;
    DROP POLICY IF EXISTS "rls_delete_tags_predefinidas" ON tags_predefinidas;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas RLS
CREATE POLICY "rls_select_tags_predefinidas" ON tags_predefinidas 
    FOR SELECT USING (true);

CREATE POLICY "rls_insert_tags_predefinidas" ON tags_predefinidas 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update_tags_predefinidas" ON tags_predefinidas 
    FOR UPDATE USING (true);

CREATE POLICY "rls_delete_tags_predefinidas" ON tags_predefinidas 
    FOR DELETE USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON tags_predefinidas TO anon, authenticated;

-- Inserir tags educacionais padrão (se não existirem)
INSERT INTO tags_predefinidas (nome, cor, setor, ordem, ativo)
VALUES
    ('Interesse em Matrícula', 'emerald', 'Vendas', 1, true),
    ('Dúvida sobre Curso', 'blue', 'Vendas', 2, true),
    ('Financeiro', 'yellow', 'Financeiro', 3, true),
    ('Vestibular', 'purple', 'Vendas', 4, true),
    ('EAD', 'cyan', 'Vendas', 5, true),
    ('Presencial', 'indigo', 'Vendas', 6, true),
    ('Bolsa de Estudos', 'orange', 'Financeiro', 7, true),
    ('Urgente', 'red', 'Atendimento', 8, true),
    ('Retorno', 'gray', 'Atendimento', 9, true),
    ('Primeira Vez', 'green', 'Atendimento', 10, true)
ON CONFLICT DO NOTHING;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_tags_predefinidas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_tags_predefinidas_updated_at ON tags_predefinidas;
CREATE TRIGGER trigger_update_tags_predefinidas_updated_at
    BEFORE UPDATE ON tags_predefinidas
    FOR EACH ROW
    EXECUTE FUNCTION update_tags_predefinidas_updated_at;

