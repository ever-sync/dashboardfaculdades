-- Remover campos evolution_api_url e evolution_api_key da tabela faculdades
-- API key e URL serão sempre globais (variáveis de ambiente)
-- Cada faculdade terá apenas sua própria instância (evolution_instance)

ALTER TABLE public.faculdades
DROP COLUMN IF EXISTS evolution_api_url,
DROP COLUMN IF EXISTS evolution_api_key;

-- Atualizar comentários
COMMENT ON COLUMN public.faculdades.evolution_instance IS 'Nome da instância Evolution para esta faculdade (único por faculdade)';
COMMENT ON COLUMN public.faculdades.evolution_status IS 'Status da conexão Evolution: conectado, desconectado, conectando, erro, nao_configurado';

