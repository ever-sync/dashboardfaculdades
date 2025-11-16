-- Criar tabela de faculdades
CREATE TABLE IF NOT EXISTS public.faculdades (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(20) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(2),
    plano VARCHAR(20) DEFAULT 'basico' CHECK (plano IN ('basico', 'pro', 'enterprise')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_atualizacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    configuracoes JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_faculdades_nome ON public.faculdades(nome);
CREATE INDEX IF NOT EXISTS idx_faculdades_cnpj ON public.faculdades(cnpj);
CREATE INDEX IF NOT EXISTS idx_faculdades_status ON public.faculdades(status);
CREATE INDEX IF NOT EXISTS idx_faculdades_plano ON public.faculdades(plano);

-- Habilitar RLS
ALTER TABLE public.faculdades ENABLE ROW LEVEL SECURITY;

-- Criar políticas de segurança
CREATE POLICY "Permitir leitura para todos" ON public.faculdades
    FOR SELECT USING (true);

CREATE POLICY "Permitir inserção para usuários autenticados" ON public.faculdades
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Permitir atualização para usuários autenticados" ON public.faculdades
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir exclusão para usuários autenticados" ON public.faculdades
    FOR DELETE USING (auth.role() = 'authenticated');

-- Inserir dados de exemplo
INSERT INTO public.faculdades (nome, cnpj, telefone, email, cidade, estado, plano, status) VALUES
    ('Universidade Exemplo', '12.345.678/0001-90', '(11) 1234-5678', 'contato@universidadeexemplo.com', 'São Paulo', 'SP', 'enterprise', 'ativo'),
    ('Faculdade Tecnologia', '98.765.432/0001-10', '(21) 9876-5432', 'admin@faculdadetecnologia.com', 'Rio de Janeiro', 'RJ', 'pro', 'ativo'),
    ('Centro Universitário', '11.223.344/0001-55', '(31) 3333-4444', 'secretaria@centrouniversitario.com', 'Belo Horizonte', 'MG', 'basico', 'ativo'),
    ('Instituto Superior', '55.667.788/0001-20', '(41) 5555-6666', 'contato@institutosuperior.com', 'Curitiba', 'PR', 'pro', 'inativo'),
    ('Faculdade Integrada', '77.889.900/0001-35', '(51) 7777-8888', 'admin@faculdadeintegrada.com', 'Porto Alegre', 'RS', 'enterprise', 'ativo');

-- Conceder permissões
GRANT SELECT ON public.faculdades TO anon;
GRANT ALL ON public.faculdades TO authenticated;