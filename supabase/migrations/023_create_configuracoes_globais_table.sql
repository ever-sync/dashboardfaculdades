-- Criar tabela de configurações globais do sistema
-- Armazena configurações compartilhadas por todas as faculdades (API keys, URLs, etc)

CREATE TABLE IF NOT EXISTS public.configuracoes_globais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  descricao TEXT,
  tipo VARCHAR(50) DEFAULT 'texto', -- texto, json, boolean, number
  sensivel BOOLEAN DEFAULT false, -- Se true, valor não deve ser exposto na interface
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_configuracoes_globais_chave ON public.configuracoes_globais(chave);

-- Inserir configurações padrão da Evolution API
INSERT INTO public.configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES 
  ('evolution_api_url', NULL, 'URL da API Evolution (compartilhada por todas as faculdades)', 'texto', false),
  ('evolution_api_key', NULL, 'Chave de API Evolution (compartilhada por todas as faculdades)', 'texto', true)
ON CONFLICT (chave) DO NOTHING;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_configuracoes_globais_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at
CREATE TRIGGER trigger_update_configuracoes_globais_updated_at
  BEFORE UPDATE ON public.configuracoes_globais
  FOR EACH ROW
  EXECUTE FUNCTION update_configuracoes_globais_updated_at();

-- Comentários
COMMENT ON TABLE public.configuracoes_globais IS 'Configurações globais do sistema compartilhadas por todas as faculdades';
COMMENT ON COLUMN public.configuracoes_globais.chave IS 'Chave única da configuração (ex: evolution_api_url)';
COMMENT ON COLUMN public.configuracoes_globais.valor IS 'Valor da configuração (pode ser texto, JSON, etc)';
COMMENT ON COLUMN public.configuracoes_globais.sensivel IS 'Se true, valor contém informações sensíveis (senhas, keys) e não deve ser exposto';

-- Habilitar RLS
ALTER TABLE public.configuracoes_globais ENABLE ROW LEVEL SECURITY;

-- Política: Apenas service role pode acessar (APIs server-side)
DROP POLICY IF EXISTS "configuracoes_globais_service_role" ON public.configuracoes_globais;
CREATE POLICY "configuracoes_globais_service_role" ON public.configuracoes_globais
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

