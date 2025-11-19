-- ========================================
-- MIGRAÇÃO: Criar tabela de usuários/atendentes
-- ========================================

-- Criar tabela usuarios (atendentes)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculdade_id UUID NOT NULL REFERENCES faculdades(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    senha_hash TEXT, -- Para autenticação futura
    setor VARCHAR(100) CHECK (setor IN ('Suporte', 'Vendas', 'Atendimento')),
    status VARCHAR(20) DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'ausente', 'ocupado')),
    carga_trabalho_atual INTEGER DEFAULT 0, -- Número de conversas ativas
    carga_trabalho_maxima INTEGER DEFAULT 10, -- Máximo de conversas simultâneas
    horario_trabalho_inicio TIME DEFAULT '08:00:00',
    horario_trabalho_fim TIME DEFAULT '18:00:00',
    dias_trabalho INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 1=Segunda, 2=Terça, etc. (1-7)
    ultima_atividade TIMESTAMPTZ DEFAULT NOW(),
    ativo BOOLEAN DEFAULT true,
    foto_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_usuarios_faculdade ON usuarios(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_status ON usuarios(status);
CREATE INDEX IF NOT EXISTS idx_usuarios_setor ON usuarios(setor);
CREATE INDEX IF NOT EXISTS idx_usuarios_ativo ON usuarios(ativo);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);

-- Criar índice para buscar atendentes disponíveis
CREATE INDEX IF NOT EXISTS idx_usuarios_disponiveis 
ON usuarios(faculdade_id, setor, status, ativo, carga_trabalho_atual) 
WHERE status = 'online' AND ativo = true;

-- Adicionar campo atendente_id na tabela conversas_whatsapp (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversas_whatsapp' 
        AND column_name = 'atendente_id'
    ) THEN
        ALTER TABLE conversas_whatsapp 
        ADD COLUMN atendente_id UUID REFERENCES usuarios(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_conversas_atendente 
        ON conversas_whatsapp(atendente_id);
    END IF;
END $$;

-- Habilitar RLS
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes (se existirem)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "rls_select_usuarios" ON usuarios;
    DROP POLICY IF EXISTS "rls_insert_usuarios" ON usuarios;
    DROP POLICY IF EXISTS "rls_update_usuarios" ON usuarios;
    DROP POLICY IF EXISTS "rls_delete_usuarios" ON usuarios;
EXCEPTION
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Criar políticas RLS
CREATE POLICY "rls_select_usuarios" ON usuarios 
    FOR SELECT USING (true);

CREATE POLICY "rls_insert_usuarios" ON usuarios 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "rls_update_usuarios" ON usuarios 
    FOR UPDATE USING (true);

CREATE POLICY "rls_delete_usuarios" ON usuarios 
    FOR DELETE USING (true);

-- Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios TO anon, authenticated;

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_usuarios_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS trigger_update_usuarios_updated_at ON usuarios;
CREATE TRIGGER trigger_update_usuarios_updated_at
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION update_usuarios_updated_at();

-- Função para atualizar carga_trabalho_atual automaticamente
CREATE OR REPLACE FUNCTION atualizar_carga_trabalho_atendente()
RETURNS TRIGGER AS $$
BEGIN
    -- Se uma conversa foi atribuída a um atendente
    IF NEW.atendente_id IS NOT NULL AND (OLD.atendente_id IS NULL OR OLD.atendente_id != NEW.atendente_id) THEN
        -- Incrementar carga do novo atendente
        UPDATE usuarios 
        SET carga_trabalho_atual = carga_trabalho_atual + 1,
            ultima_atividade = NOW()
        WHERE id = NEW.atendente_id;
        
        -- Decrementar carga do atendente antigo (se houver)
        IF OLD.atendente_id IS NOT NULL AND OLD.atendente_id != NEW.atendente_id THEN
            UPDATE usuarios 
            SET carga_trabalho_atual = GREATEST(0, carga_trabalho_atual - 1)
            WHERE id = OLD.atendente_id;
        END IF;
    END IF;
    
    -- Se uma conversa foi removida de um atendente
    IF OLD.atendente_id IS NOT NULL AND NEW.atendente_id IS NULL THEN
        UPDATE usuarios 
        SET carga_trabalho_atual = GREATEST(0, carga_trabalho_atual - 1)
        WHERE id = OLD.atendente_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar carga automaticamente
DROP TRIGGER IF EXISTS trigger_atualizar_carga_atendente ON conversas_whatsapp;
CREATE TRIGGER trigger_atualizar_carga_atendente
    AFTER INSERT OR UPDATE OF atendente_id ON conversas_whatsapp
    FOR EACH ROW
    EXECUTE FUNCTION atualizar_carga_trabalho_atendente();

-- Função para buscar atendente disponível (round-robin)
CREATE OR REPLACE FUNCTION buscar_atendente_disponivel(
    p_faculdade_id UUID,
    p_setor VARCHAR DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_atendente_id UUID;
    v_hora_atual TIME := CURRENT_TIME;
    v_dia_semana INTEGER := EXTRACT(DOW FROM NOW())::INTEGER; -- 0=Domingo, 1=Segunda, etc.
BEGIN
    -- Buscar atendente com menor carga de trabalho e disponível
    SELECT u.id INTO v_atendente_id
    FROM usuarios u
    WHERE u.faculdade_id = p_faculdade_id
        AND u.ativo = true
        AND u.status = 'online'
        AND u.carga_trabalho_atual < u.carga_trabalho_maxima
        AND (p_setor IS NULL OR u.setor = p_setor)
        AND (
            -- Verificar se está dentro do horário de trabalho
            (u.horario_trabalho_inicio <= u.horario_trabalho_fim 
                AND v_hora_atual >= u.horario_trabalho_inicio 
                AND v_hora_atual <= u.horario_trabalho_fim)
            OR
            -- Para horários que cruzam meia-noite
            (u.horario_trabalho_inicio > u.horario_trabalho_fim 
                AND (v_hora_atual >= u.horario_trabalho_inicio 
                    OR v_hora_atual <= u.horario_trabalho_fim))
        )
        AND (
            -- Verificar se o dia atual está nos dias de trabalho
            -- Converter domingo de 0 para 7 para compatibilidade
            CASE WHEN v_dia_semana = 0 THEN 7 ELSE v_dia_semana END = ANY(u.dias_trabalho)
        )
    ORDER BY 
        u.carga_trabalho_atual ASC, -- Menor carga primeiro
        u.ultima_atividade ASC -- Mais antigo sem atividade primeiro (round-robin)
    LIMIT 1;
    
    RETURN v_atendente_id;
END;
$$ LANGUAGE plpgsql;

-- Validação
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'usuarios'
ORDER BY column_name;

