CREATE TABLE IF NOT EXISTS faculdades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18) UNIQUE,
    telefone VARCHAR(20),
    email VARCHAR(255),
    logo_url TEXT,
    plano VARCHAR(50) DEFAULT 'basico' CHECK (plano IN ('basico', 'pro', 'enterprise')),
    status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso')),
    data_contratacao TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar coluna status se a tabela já existir sem ela
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'faculdades'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'faculdades' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE faculdades 
        ADD COLUMN status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'suspenso'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_faculdades_status ON faculdades(status);
CREATE INDEX IF NOT EXISTS idx_faculdades_plano ON faculdades(plano);

CREATE TABLE IF NOT EXISTS conversas_whatsapp (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    telefone VARCHAR(20) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'encerrado')),
    ultima_mensagem TEXT,
    data_ultima_mensagem TIMESTAMPTZ DEFAULT NOW(),
    nao_lidas INTEGER DEFAULT 0,
    departamento VARCHAR(100) NOT NULL,
    atendente VARCHAR(255),
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir sem elas
DO $$ 
BEGIN
    -- Adicionar coluna status se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pendente' CHECK (status IN ('ativo', 'pendente', 'encerrado'));
    END IF;
    
    -- Adicionar coluna departamento se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'departamento'
    ) THEN
        -- Primeiro adicionar como nullable com default
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN departamento VARCHAR(100) DEFAULT 'geral';
        -- Depois atualizar registros existentes (se houver)
        UPDATE conversas_whatsapp SET departamento = 'geral' WHERE departamento IS NULL;
        -- Por fim, tornar NOT NULL
        ALTER TABLE conversas_whatsapp 
        ALTER COLUMN departamento SET NOT NULL;
    END IF;
    
    -- Adicionar outras colunas que podem estar faltando
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'nao_lidas'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN nao_lidas INTEGER DEFAULT 0;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'tags'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN tags TEXT[];
    END IF;
    
    -- Adicionar coluna data_ultima_mensagem se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'data_ultima_mensagem'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN data_ultima_mensagem TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    -- Adicionar coluna ultima_mensagem se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'ultima_mensagem'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN ultima_mensagem TEXT;
    END IF;
    
    -- Adicionar coluna atendente se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'atendente'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN atendente VARCHAR(255);
    END IF;
    
    -- Adicionar colunas created_at e updated_at se não existirem
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_conversas_faculdade ON conversas_whatsapp(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_conversas_status ON conversas_whatsapp(status);
CREATE INDEX IF NOT EXISTS idx_conversas_departamento ON conversas_whatsapp(departamento);
CREATE INDEX IF NOT EXISTS idx_conversas_data_ultima ON conversas_whatsapp(data_ultima_mensagem);

CREATE TABLE IF NOT EXISTS mensagens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    conteudo TEXT NOT NULL,
    remetente VARCHAR(10) CHECK (remetente IN ('usuario', 'agente', 'bot')),
    tipo_mensagem VARCHAR(20) DEFAULT 'texto' CHECK (tipo_mensagem IN ('texto', 'imagem', 'documento', 'audio', 'video')),
    midia_url TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mensagens_conversa ON mensagens(conversa_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_timestamp ON mensagens(timestamp);
CREATE INDEX IF NOT EXISTS idx_mensagens_remetente ON mensagens(remetente);

CREATE TABLE IF NOT EXISTS prospects_academicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    status_academico VARCHAR(20) DEFAULT 'novo' CHECK (status_academico IN ('novo', 'contatado', 'qualificado', 'matriculado', 'perdido')),
    curso VARCHAR(255) NOT NULL,
    turno VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'noite', 'ead')),
    nota_qualificacao INTEGER DEFAULT 0 CHECK (nota_qualificacao >= 0 AND nota_qualificacao <= 100),
    origem VARCHAR(100),
    ultimo_contato TIMESTAMPTZ DEFAULT NOW(),
    data_matricula TIMESTAMPTZ,
    valor_mensalidade DECIMAL(10, 2),
    observacoes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir sem elas
DO $$ 
BEGIN
    -- Adicionar coluna status_academico se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'status_academico'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN status_academico VARCHAR(20) DEFAULT 'novo' CHECK (status_academico IN ('novo', 'contatado', 'qualificado', 'matriculado', 'perdido'));
    END IF;
    
    -- Adicionar coluna curso se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'curso'
    ) THEN
        -- Primeiro adicionar como nullable com default
        ALTER TABLE prospects_academicos 
        ADD COLUMN curso VARCHAR(255) DEFAULT 'Não informado';
        -- Depois atualizar registros existentes (se houver)
        UPDATE prospects_academicos SET curso = 'Não informado' WHERE curso IS NULL;
        -- Por fim, tornar NOT NULL
        ALTER TABLE prospects_academicos 
        ALTER COLUMN curso SET NOT NULL;
    END IF;
    
    -- Adicionar coluna origem se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'origem'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN origem VARCHAR(100);
    END IF;
    
    -- Adicionar outras colunas que podem estar faltando
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'turno'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN turno VARCHAR(20) CHECK (turno IN ('manha', 'tarde', 'noite', 'ead'));
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'nota_qualificacao'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN nota_qualificacao INTEGER DEFAULT 0 CHECK (nota_qualificacao >= 0 AND nota_qualificacao <= 100);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'ultimo_contato'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN ultimo_contato TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'data_matricula'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN data_matricula TIMESTAMPTZ;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'valor_mensalidade'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN valor_mensalidade DECIMAL(10, 2);
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'observacoes'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN observacoes TEXT;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'prospects_academicos'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE prospects_academicos 
        ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_prospects_faculdade ON prospects_academicos(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_prospects_status ON prospects_academicos(status_academico);
CREATE INDEX IF NOT EXISTS idx_prospects_curso ON prospects_academicos(curso);
CREATE INDEX IF NOT EXISTS idx_prospects_origem ON prospects_academicos(origem);

CREATE TABLE IF NOT EXISTS metricas_diarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    total_conversas INTEGER DEFAULT 0,
    conversas_ativas INTEGER DEFAULT 0,
    novos_prospects INTEGER DEFAULT 0,
    prospects_convertidos INTEGER DEFAULT 0,
    mensagens_enviadas INTEGER DEFAULT 0,
    mensagens_recebidas INTEGER DEFAULT 0,
    taxa_automacao_percentual DECIMAL(5, 2) DEFAULT 0,
    tempo_medio_primeira_resposta_segundos INTEGER DEFAULT 0,
    tempo_medio_resolucao_minutos INTEGER DEFAULT 0,
    nota_media DECIMAL(3, 2) DEFAULT 0,
    departamento VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(faculdade_id, data, departamento)
);

-- Adicionar colunas se a tabela já existir sem elas
DO $$ 
BEGIN
    -- Adicionar coluna departamento se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'metricas_diarias'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_diarias' 
        AND column_name = 'departamento'
    ) THEN
        ALTER TABLE metricas_diarias 
        ADD COLUMN departamento VARCHAR(100);
    END IF;
    
    -- Adicionar outras colunas que podem estar faltando
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'metricas_diarias'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_diarias' 
        AND column_name = 'data'
    ) THEN
        ALTER TABLE metricas_diarias 
        ADD COLUMN data DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'metricas_diarias'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'metricas_diarias' 
        AND column_name = 'created_at'
    ) THEN
        ALTER TABLE metricas_diarias 
        ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_metricas_faculdade ON metricas_diarias(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_metricas_data ON metricas_diarias(data);
CREATE INDEX IF NOT EXISTS idx_metricas_departamento ON metricas_diarias(departamento);

CREATE TABLE IF NOT EXISTS transferencias_setores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    conversa_id UUID NOT NULL REFERENCES conversas_whatsapp(id) ON DELETE CASCADE,
    setor_origem VARCHAR(100) NOT NULL,
    setor_destino VARCHAR(100) NOT NULL,
    motivo TEXT,
    atendente_origem VARCHAR(255),
    atendente_destino VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar colunas se a tabela já existir sem elas
DO $$ 
BEGIN
    -- Adicionar coluna conversa_id se não existir
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transferencias_setores'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transferencias_setores' 
        AND column_name = 'conversa_id'
    ) THEN
        -- Primeiro verificar se a tabela conversas_whatsapp existe
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'conversas_whatsapp'
        ) THEN
            -- Adicionar como nullable primeiro
            ALTER TABLE transferencias_setores 
            ADD COLUMN conversa_id UUID REFERENCES conversas_whatsapp(id) ON DELETE CASCADE;
            
            -- Se não houver registros, tornar NOT NULL
            IF NOT EXISTS (SELECT 1 FROM transferencias_setores LIMIT 1) THEN
                ALTER TABLE transferencias_setores 
                ALTER COLUMN conversa_id SET NOT NULL;
            END IF;
        END IF;
    END IF;
    
    -- Adicionar outras colunas que podem estar faltando
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transferencias_setores'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transferencias_setores' 
        AND column_name = 'setor_origem'
    ) THEN
        ALTER TABLE transferencias_setores 
        ADD COLUMN setor_origem VARCHAR(100) DEFAULT 'geral';
        UPDATE transferencias_setores SET setor_origem = 'geral' WHERE setor_origem IS NULL;
        ALTER TABLE transferencias_setores 
        ALTER COLUMN setor_origem SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transferencias_setores'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transferencias_setores' 
        AND column_name = 'setor_destino'
    ) THEN
        ALTER TABLE transferencias_setores 
        ADD COLUMN setor_destino VARCHAR(100) DEFAULT 'geral';
        UPDATE transferencias_setores SET setor_destino = 'geral' WHERE setor_destino IS NULL;
        ALTER TABLE transferencias_setores 
        ALTER COLUMN setor_destino SET NOT NULL;
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'transferencias_setores'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'transferencias_setores' 
        AND column_name = 'timestamp'
    ) THEN
        ALTER TABLE transferencias_setores 
        ADD COLUMN timestamp TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transferencias_faculdade ON transferencias_setores(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_conversa ON transferencias_setores(conversa_id);

ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_setores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para faculdades
DROP POLICY IF EXISTS "rls_select_faculdades" ON faculdades;
CREATE POLICY "rls_select_faculdades" ON faculdades FOR SELECT USING (true);

-- Políticas RLS para conversas_whatsapp
DROP POLICY IF EXISTS "rls_select_conversas" ON conversas_whatsapp;
CREATE POLICY "rls_select_conversas" ON conversas_whatsapp FOR SELECT USING (true);

-- Políticas RLS para mensagens
DROP POLICY IF EXISTS "rls_select_mensagens" ON mensagens;
CREATE POLICY "rls_select_mensagens" ON mensagens FOR SELECT USING (true);

-- Políticas RLS para prospects_academicos
DROP POLICY IF EXISTS "rls_select_prospects" ON prospects_academicos;
CREATE POLICY "rls_select_prospects" ON prospects_academicos FOR SELECT USING (true);

-- Políticas RLS para metricas_diarias
DROP POLICY IF EXISTS "rls_select_metricas" ON metricas_diarias;
CREATE POLICY "rls_select_metricas" ON metricas_diarias FOR SELECT USING (true);

-- Políticas RLS para transferencias_setores
DROP POLICY IF EXISTS "rls_select_transferencias" ON transferencias_setores;
CREATE POLICY "rls_select_transferencias" ON transferencias_setores FOR SELECT USING (true);