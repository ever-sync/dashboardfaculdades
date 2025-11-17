-- ========================================
-- MIGRAÇÃO: Criar sistema de indicadores de digitação
-- ========================================

-- Criar tabela temporária para indicadores de digitação
-- Esta tabela armazena quando alguém está digitando em uma conversa
CREATE TABLE IF NOT EXISTS typing_indicators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    usuario_tipo VARCHAR(20) NOT NULL CHECK (usuario_tipo IN ('atendente', 'agente', 'cliente')),
    is_typing BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 seconds'
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_typing_conversa ON typing_indicators(conversa_id);
CREATE INDEX IF NOT EXISTS idx_typing_expires ON typing_indicators(expires_at);

-- Criar função para limpar indicadores expirados
CREATE OR REPLACE FUNCTION limpar_typing_expirados()
RETURNS void AS $$
BEGIN
    DELETE FROM typing_indicators WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Criar função para atualizar indicador de digitação
CREATE OR REPLACE FUNCTION atualizar_typing_indicator(
    p_conversa_id UUID,
    p_usuario_id UUID DEFAULT NULL,
    p_usuario_tipo VARCHAR DEFAULT 'atendente',
    p_is_typing BOOLEAN DEFAULT true
)
RETURNS void AS $$
BEGIN
    -- Limpar indicadores expirados primeiro
    PERFORM limpar_typing_expirados();
    
    -- Remover indicador existente para este usuário nesta conversa
    IF p_usuario_id IS NOT NULL THEN
        DELETE FROM typing_indicators 
        WHERE conversa_id = p_conversa_id 
        AND usuario_id = p_usuario_id;
    ELSE
        DELETE FROM typing_indicators 
        WHERE conversa_id = p_conversa_id 
        AND usuario_tipo = p_usuario_tipo;
    END IF;
    
    -- Se está digitando, adicionar novo indicador
    IF p_is_typing THEN
        INSERT INTO typing_indicators (conversa_id, usuario_id, usuario_tipo, is_typing, expires_at)
        VALUES (p_conversa_id, p_usuario_id, p_usuario_tipo, true, NOW() + INTERVAL '5 seconds')
        ON CONFLICT DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "rls_select_typing" ON typing_indicators;
    DROP POLICY IF EXISTS "rls_insert_typing" ON typing_indicators;
    DROP POLICY IF EXISTS "rls_delete_typing" ON typing_indicators;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas RLS
CREATE POLICY "rls_select_typing" ON typing_indicators 
    FOR SELECT USING (true);

CREATE POLICY "rls_insert_typing" ON typing_indicators 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_delete_typing" ON typing_indicators 
    FOR DELETE USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, DELETE ON typing_indicators TO anon, authenticated;

-- Criar trigger para limpar expirados automaticamente (opcional, via job externo)
-- Por enquanto, a limpeza é feita pela função acima

