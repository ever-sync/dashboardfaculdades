-- ========================================
-- MIGRAÇÃO: Adicionar campo bloqueado à tabela conversas_whatsapp
-- ========================================

-- Adicionar campo bloqueado (boolean)
ALTER TABLE conversas_whatsapp
ADD COLUMN IF NOT EXISTS bloqueado BOOLEAN DEFAULT false;

-- Criar índice para busca rápida de conversas bloqueadas
CREATE INDEX IF NOT EXISTS idx_conversas_bloqueado ON conversas_whatsapp(bloqueado);

-- Criar índice composto para filtrar conversas não bloqueadas por faculdade
CREATE INDEX IF NOT EXISTS idx_conversas_faculdade_bloqueado ON conversas_whatsapp(faculdade_id, bloqueado) WHERE bloqueado = false;

-- Adicionar campo motivo_bloqueio (texto opcional)
ALTER TABLE conversas_whatsapp
ADD COLUMN IF NOT EXISTS motivo_bloqueio TEXT;

-- Adicionar campo data_bloqueio (timestamp)
ALTER TABLE conversas_whatsapp
ADD COLUMN IF NOT EXISTS data_bloqueio TIMESTAMPTZ;

-- Comentários nas colunas
COMMENT ON COLUMN conversas_whatsapp.bloqueado IS 'Indica se o contato está bloqueado';
COMMENT ON COLUMN conversas_whatsapp.motivo_bloqueio IS 'Motivo do bloqueio do contato';
COMMENT ON COLUMN conversas_whatsapp.data_bloqueio IS 'Data e hora do bloqueio';

-- Validação
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'conversas_whatsapp'
  AND column_name IN ('bloqueado', 'motivo_bloqueio', 'data_bloqueio')
ORDER BY column_name;

