-- ========================================
-- MIGRAÇÃO: Criar tabela de Cursos
-- ========================================

-- Criar tabela cursos
CREATE TABLE IF NOT EXISTS cursos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    curso VARCHAR(255) NOT NULL,
    quantidade_de_parcelas INTEGER NOT NULL DEFAULT 1,
    modalidade VARCHAR(100) NOT NULL CHECK (modalidade IN ('Presencial', 'EAD', 'Híbrido')),
    duracao VARCHAR(100) NOT NULL,
    valor_com_desconto_pontualidade DECIMAL(10, 2) NOT NULL DEFAULT 0,
    desconto_percentual DECIMAL(5, 2) DEFAULT 0,
    pratica BOOLEAN DEFAULT false,
    laboratorio BOOLEAN DEFAULT false,
    estagio BOOLEAN DEFAULT false,
    tcc BOOLEAN DEFAULT false,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT cursos_faculdade_curso_unique UNIQUE(faculdade_id, curso)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_cursos_faculdade ON cursos(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_cursos_ativo ON cursos(ativo);
CREATE INDEX IF NOT EXISTS idx_cursos_modalidade ON cursos(modalidade);
CREATE INDEX IF NOT EXISTS idx_cursos_curso ON cursos(curso);

-- Habilitar RLS
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "rls_select_cursos" ON cursos;
    DROP POLICY IF EXISTS "rls_insert_cursos" ON cursos;
    DROP POLICY IF EXISTS "rls_update_cursos" ON cursos;
    DROP POLICY IF EXISTS "rls_delete_cursos" ON cursos;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas RLS
CREATE POLICY "rls_select_cursos" ON cursos 
    FOR SELECT USING (true);

CREATE POLICY "rls_insert_cursos" ON cursos 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update_cursos" ON cursos 
    FOR UPDATE USING (true);

CREATE POLICY "rls_delete_cursos" ON cursos 
    FOR DELETE USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON cursos TO anon, authenticated;

-- Criar função para trigger
CREATE OR REPLACE FUNCTION update_cursos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_cursos_updated_at ON cursos;
CREATE TRIGGER trigger_update_cursos_updated_at
    BEFORE UPDATE ON cursos
    FOR EACH ROW
    EXECUTE FUNCTION update_cursos_updated_at();
