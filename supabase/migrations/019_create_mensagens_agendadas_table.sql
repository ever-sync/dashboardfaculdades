-- =============================================
-- TABELA: mensagens_agendadas
-- =============================================
-- Tabela para armazenar mensagens agendadas para envio futuro

CREATE TABLE IF NOT EXISTS mensagens_agendadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    conversa_id UUID REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    telefone VARCHAR(20) NOT NULL,
    conteudo TEXT NOT NULL,
    tipo_mensagem VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensagem IN ('texto', 'imagem', 'documento', 'audio', 'video')),
    midia_url TEXT,
    data_agendamento TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviada', 'cancelada', 'falha')),
    remetente VARCHAR(10) DEFAULT 'agente' CHECK (remetente IN ('usuario', 'agente', 'bot', 'robo', 'humano', 'cliente')),
    atendente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    tentativas INTEGER DEFAULT 0,
    erro_mensagem TEXT,
    enviada_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_agendadas_faculdade ON mensagens_agendadas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_agendadas_conversa ON mensagens_agendadas(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_agendadas_status ON mensagens_agendadas(status);
CREATE INDEX IF NOT EXISTS idx_mensagens_agendadas_data ON mensagens_agendadas(data_agendamento);
CREATE INDEX IF NOT EXISTS idx_mensagens_agendadas_pendentes ON mensagens_agendadas(data_agendamento, status) WHERE status = 'pendente';

-- Habilitar RLS
ALTER TABLE mensagens_agendadas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DO $$ 
BEGIN
    -- Remover políticas existentes se houver
    DROP POLICY IF EXISTS "Permitir leitura para faculdade" ON mensagens_agendadas;
    DROP POLICY IF EXISTS "Permitir inserção para faculdade" ON mensagens_agendadas;
    DROP POLICY IF EXISTS "Permitir atualização para faculdade" ON mensagens_agendadas;
    DROP POLICY IF EXISTS "Permitir exclusão para faculdade" ON mensagens_agendadas;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Permitir leitura para faculdade" ON mensagens_agendadas
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para faculdade" ON mensagens_agendadas
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir atualização para faculdade" ON mensagens_agendadas
    FOR UPDATE USING (true);

CREATE POLICY "Permitir exclusão para faculdade" ON mensagens_agendadas
    FOR DELETE USING (true);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION atualizar_updated_at_mensagens_agendadas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_updated_at_mensagens_agendadas
    BEFORE UPDATE ON mensagens_agendadas
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_updated_at_mensagens_agendadas();

-- Comentários
COMMENT ON TABLE mensagens_agendadas IS 'Armazena mensagens agendadas para envio futuro via WhatsApp';
COMMENT ON COLUMN mensagens_agendadas.data_agendamento IS 'Data e hora em que a mensagem deve ser enviada';
COMMENT ON COLUMN mensagens_agendadas.status IS 'Status da mensagem: pendente, enviada, cancelada ou falha';
COMMENT ON COLUMN mensagens_agendadas.tentativas IS 'Número de tentativas de envio realizadas';

