-- Migration: Criar tabelas para CRM e funcionalidades de conversas
-- Tabelas: etiquetas, configuracoes_conversas, funis_vendas, negociacoes, contatos, empresas, tarefas

-- ============================================
-- 1. TABELA: etiquetas
-- ============================================
CREATE TABLE IF NOT EXISTS public.etiquetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  cor VARCHAR(7) NOT NULL DEFAULT '#3B82F6', -- Cor em hexadecimal
  criada_por VARCHAR(255),
  atualizada_por VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculdade_id, nome) -- Nome único por faculdade
);

CREATE INDEX IF NOT EXISTS idx_etiquetas_faculdade ON public.etiquetas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_etiquetas_nome ON public.etiquetas(nome);

-- ============================================
-- 2. TABELA: configuracoes_conversas
-- ============================================
CREATE TABLE IF NOT EXISTS public.configuracoes_conversas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  configuracoes JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculdade_id) -- Uma configuração por faculdade
);

CREATE INDEX IF NOT EXISTS idx_configuracoes_conversas_faculdade ON public.configuracoes_conversas(faculdade_id);

-- ============================================
-- 3. TABELA: funis_vendas
-- ============================================
CREATE TABLE IF NOT EXISTS public.funis_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  etapas JSONB NOT NULL DEFAULT '[]', -- Array de etapas com: id, nome, sigla, destacar_esfriando, dias_esfriando, ordem
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funis_vendas_faculdade ON public.funis_vendas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_funis_vendas_ativo ON public.funis_vendas(ativo);

-- ============================================
-- 4. TABELA: contatos
-- ============================================
CREATE TABLE IF NOT EXISTS public.contatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  email VARCHAR(255),
  cargo VARCHAR(255),
  empresa_id UUID, -- Referência para empresas (será criada depois)
  observacoes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contatos_faculdade ON public.contatos(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON public.contatos(telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_email ON public.contatos(email);

-- ============================================
-- 5. TABELA: empresas
-- ============================================
CREATE TABLE IF NOT EXISTS public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  observacoes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_empresas_faculdade ON public.empresas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_empresas_nome ON public.empresas(nome);

-- Adicionar foreign key de contatos para empresas
ALTER TABLE public.contatos 
  ADD CONSTRAINT fk_contatos_empresa 
  FOREIGN KEY (empresa_id) 
  REFERENCES public.empresas(id) 
  ON DELETE SET NULL;

-- ============================================
-- 6. TABELA: negociacoes
-- ============================================
CREATE TABLE IF NOT EXISTS public.negociacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  funil_id UUID REFERENCES public.funis_vendas(id) ON DELETE SET NULL,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  conversa_id UUID REFERENCES public.conversas_whatsapp(id) ON DELETE SET NULL,
  prospect_id UUID REFERENCES public.prospects_academicos(id) ON DELETE SET NULL,
  nome VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'nova' CHECK (status IN ('nova', 'em_andamento', 'negociacao', 'venda', 'perdida')),
  etapa VARCHAR(50) DEFAULT 'lead', -- ID da etapa do funil
  qualificacao INTEGER DEFAULT 0 CHECK (qualificacao >= 0 AND qualificacao <= 5),
  valor DECIMAL(12, 2) DEFAULT 0,
  responsavel VARCHAR(255), -- Nome do responsável
  responsavel_id UUID, -- ID do usuário responsável (se tiver tabela usuarios)
  tags TEXT[],
  dias_na_etapa INTEGER DEFAULT 0,
  data_entrada_etapa TIMESTAMPTZ DEFAULT NOW(),
  telefone VARCHAR(20),
  email VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negociacoes_faculdade ON public.negociacoes(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_funil ON public.negociacoes(funil_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_status ON public.negociacoes(status);
CREATE INDEX IF NOT EXISTS idx_negociacoes_etapa ON public.negociacoes(etapa);
CREATE INDEX IF NOT EXISTS idx_negociacoes_responsavel ON public.negociacoes(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_contato ON public.negociacoes(contato_id);
CREATE INDEX IF NOT EXISTS idx_negociacoes_conversa ON public.negociacoes(conversa_id);

-- ============================================
-- 7. TABELA: tarefas
-- ============================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculdade_id UUID NOT NULL REFERENCES public.faculdades(id) ON DELETE CASCADE,
  negociacao_id UUID REFERENCES public.negociacoes(id) ON DELETE CASCADE,
  contato_id UUID REFERENCES public.contatos(id) ON DELETE SET NULL,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  responsavel VARCHAR(255), -- Nome do responsável
  responsavel_id UUID, -- ID do usuário responsável
  status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
  prioridade VARCHAR(20) DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
  prazo TIMESTAMPTZ,
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_faculdade ON public.tarefas(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_negociacao ON public.tarefas(negociacao_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_responsavel ON public.tarefas(responsavel_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_prazo ON public.tarefas(prazo);

-- ============================================
-- FUNÇÕES E TRIGGERS PARA updated_at
-- ============================================

-- Função genérica para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para todas as tabelas
DROP TRIGGER IF EXISTS trigger_update_etiquetas_updated_at ON public.etiquetas;
CREATE TRIGGER trigger_update_etiquetas_updated_at
  BEFORE UPDATE ON public.etiquetas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_configuracoes_conversas_updated_at ON public.configuracoes_conversas;
CREATE TRIGGER trigger_update_configuracoes_conversas_updated_at
  BEFORE UPDATE ON public.configuracoes_conversas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_funis_vendas_updated_at ON public.funis_vendas;
CREATE TRIGGER trigger_update_funis_vendas_updated_at
  BEFORE UPDATE ON public.funis_vendas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_contatos_updated_at ON public.contatos;
CREATE TRIGGER trigger_update_contatos_updated_at
  BEFORE UPDATE ON public.contatos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_empresas_updated_at ON public.empresas;
CREATE TRIGGER trigger_update_empresas_updated_at
  BEFORE UPDATE ON public.empresas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_negociacoes_updated_at ON public.negociacoes;
CREATE TRIGGER trigger_update_negociacoes_updated_at
  BEFORE UPDATE ON public.negociacoes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_tarefas_updated_at ON public.tarefas;
CREATE TRIGGER trigger_update_tarefas_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funis_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negociacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Permitir acesso via service_role (APIs server-side)
-- As políticas serão configuradas conforme necessário pelo sistema de autenticação

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE public.etiquetas IS 'Etiquetas para categorização de conversas e contatos';
COMMENT ON TABLE public.configuracoes_conversas IS 'Configurações específicas de conversas por faculdade';
COMMENT ON TABLE public.funis_vendas IS 'Funis de vendas com etapas configuráveis';
COMMENT ON TABLE public.contatos IS 'Contatos do CRM';
COMMENT ON TABLE public.empresas IS 'Empresas do CRM';
COMMENT ON TABLE public.negociacoes IS 'Negociações do CRM vinculadas a funis de vendas';
COMMENT ON TABLE public.tarefas IS 'Tarefas vinculadas a negociações, contatos ou empresas';

