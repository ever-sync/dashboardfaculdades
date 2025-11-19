-- ========================================
-- MIGRAÇÃO: Corrigir colunas da tabela mensagens
-- ========================================
-- Adiciona colunas timestamp e lida caso não existam

-- Adicionar coluna timestamp se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mensagens' 
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE public.mensagens 
        ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
        
        -- Criar índice se não existir
        CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp 
        ON public.mensagens(timestamp);
        
        RAISE NOTICE 'Coluna timestamp adicionada à tabela mensagens';
    ELSE
        RAISE NOTICE 'Coluna timestamp já existe na tabela mensagens';
    END IF;
END $$;

-- Adicionar coluna lida se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'mensagens' 
        AND column_name = 'lida'
    ) THEN
        ALTER TABLE public.mensagens 
        ADD COLUMN lida BOOLEAN DEFAULT FALSE;
        
        RAISE NOTICE 'Coluna lida adicionada à tabela mensagens';
    ELSE
        RAISE NOTICE 'Coluna lida já existe na tabela mensagens';
    END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.mensagens.timestamp IS 'Timestamp da mensagem (pode ser diferente de created_at para mensagens agendadas)';
COMMENT ON COLUMN public.mensagens.lida IS 'Indica se a mensagem foi lida pelo destinatário';

