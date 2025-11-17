-- ========================================
-- MIGRAÇÃO: Adicionar campo anotacoes à tabela conversas_whatsapp
-- ========================================

-- Adicionar campo anotacoes (JSONB) para armazenar anotações internas
ALTER TABLE conversas_whatsapp
ADD COLUMN IF NOT EXISTS anotacoes JSONB DEFAULT '[]'::jsonb;

-- Criar índice GIN para busca eficiente em anotações
CREATE INDEX IF NOT EXISTS idx_conversas_anotacoes ON conversas_whatsapp USING GIN (anotacoes);

-- Comentário na coluna
COMMENT ON COLUMN conversas_whatsapp.anotacoes IS 'Array de objetos JSON com anotações internas: [{id, autor, texto, timestamp, editado_em}]';

-- Validação
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'conversas_whatsapp'
  AND column_name = 'anotacoes'
ORDER BY column_name;

