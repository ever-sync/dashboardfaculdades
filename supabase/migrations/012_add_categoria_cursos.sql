-- ========================================
-- MIGRAÇÃO: Adicionar campo Categoria na tabela de Cursos
-- ========================================

-- Adicionar campo categoria
ALTER TABLE cursos
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Criar índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_cursos_categoria ON cursos(categoria);

-- Validar alteração
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'cursos'
  AND column_name = 'categoria';

