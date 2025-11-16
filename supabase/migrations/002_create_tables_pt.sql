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

CREATE INDEX IF NOT EXISTS idx_transferencias_faculdade ON transferencias_setores(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_transferencias_conversa ON transferencias_setores(conversa_id);

ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_setores ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "rls_select_faculdades" ON faculdades FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "rls_select_conversas" ON conversas_whatsapp FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "rls_select_mensagens" ON mensagens FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "rls_select_prospects" ON prospects_academicos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "rls_select_metricas" ON metricas_diarias FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "rls_select_transferencias" ON transferencias_setores FOR SELECT USING (true);