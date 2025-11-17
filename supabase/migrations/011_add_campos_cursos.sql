-- ========================================
-- MIGRAÇÃO: Adicionar campos extras na tabela de Cursos
-- ========================================

-- Adicionar campo link do curso
ALTER TABLE cursos
ADD COLUMN IF NOT EXISTS link TEXT;

-- Adicionar campo descrição do curso
ALTER TABLE cursos
ADD COLUMN IF NOT EXISTS descricao TEXT;

-- Criar índice para busca por descrição (opcional)
CREATE INDEX IF NOT EXISTS idx_cursos_descricao ON cursos USING gin(to_tsvector('portuguese', descricao));

-- Validar alterações
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cursos'
  AND column_name IN ('link', 'descricao')
ORDER BY column_name;

