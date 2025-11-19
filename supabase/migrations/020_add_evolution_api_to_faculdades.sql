-- Adicionar campos Evolution API na tabela faculdades
-- Permite que cada faculdade tenha sua própria instância do Evolution API

ALTER TABLE public.faculdades
ADD COLUMN IF NOT EXISTS evolution_api_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS evolution_api_key VARCHAR(255),
ADD COLUMN IF NOT EXISTS evolution_instance VARCHAR(100),
ADD COLUMN IF NOT EXISTS evolution_status VARCHAR(20) DEFAULT 'desconectado' CHECK (evolution_status IN ('conectado', 'desconectado', 'conectando', 'erro')),
ADD COLUMN IF NOT EXISTS evolution_qr_code TEXT,
ADD COLUMN IF NOT EXISTS evolution_qr_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evolution_connected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS evolution_last_error TEXT;

-- Criar índice para busca por instância
CREATE INDEX IF NOT EXISTS idx_faculdades_evolution_instance ON public.faculdades(evolution_instance) WHERE evolution_instance IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.faculdades.evolution_api_url IS 'URL da API Evolution (opcional, usa global se não especificado)';
COMMENT ON COLUMN public.faculdades.evolution_api_key IS 'Chave de API Evolution (opcional, usa global se não especificado)';
COMMENT ON COLUMN public.faculdades.evolution_instance IS 'Nome da instância Evolution para esta faculdade';
COMMENT ON COLUMN public.faculdades.evolution_status IS 'Status da conexão Evolution: conectado, desconectado, conectando, erro';
COMMENT ON COLUMN public.faculdades.evolution_qr_code IS 'QR Code base64 para conexão (temporário)';
COMMENT ON COLUMN public.faculdades.evolution_qr_expires_at IS 'Data de expiração do QR Code';
COMMENT ON COLUMN public.faculdades.evolution_connected_at IS 'Data da última conexão bem-sucedida';
COMMENT ON COLUMN public.faculdades.evolution_last_error IS 'Última mensagem de erro da conexão';

