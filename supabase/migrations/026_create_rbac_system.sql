-- ========================================
-- MIGRAÇÃO: Sistema de Permissões e Roles (RBAC)
-- ========================================

-- 1. Adicionar campo role na tabela usuarios
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE usuarios 
        ADD COLUMN role VARCHAR(20) DEFAULT 'atendente' 
        CHECK (role IN ('admin', 'gerente', 'atendente'));
        
        CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
    END IF;
END $$;

-- 2. Criar tabela de permissoes
CREATE TABLE IF NOT EXISTS permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL UNIQUE,
    descricao TEXT,
    recurso VARCHAR(100) NOT NULL, -- Ex: 'faculdades', 'usuarios', 'conversas'
    acao VARCHAR(50) NOT NULL, -- Ex: 'criar', 'ler', 'atualizar', 'deletar'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_permissoes_recurso ON permissoes(recurso);
CREATE INDEX IF NOT EXISTS idx_permissoes_acao ON permissoes(acao);

-- 3. Criar tabela role_permissoes (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'gerente', 'atendente')),
    permissao_id UUID NOT NULL REFERENCES permissoes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, permissao_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissoes_role ON role_permissoes(role);
CREATE INDEX IF NOT EXISTS idx_role_permissoes_permissao ON role_permissoes(permissao_id);

-- 4. Habilitar RLS
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissoes ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para permissoes
CREATE POLICY "rls_select_permissoes" ON permissoes FOR SELECT USING (true);
CREATE POLICY "rls_insert_permissoes" ON permissoes FOR INSERT WITH CHECK (true);
CREATE POLICY "rls_update_permissoes" ON permissoes FOR UPDATE USING (true);
CREATE POLICY "rls_delete_permissoes" ON permissoes FOR DELETE USING (true);

-- 6. Políticas RLS para role_permissoes
CREATE POLICY "rls_select_role_permissoes" ON role_permissoes FOR SELECT USING (true);
CREATE POLICY "rls_insert_role_permissoes" ON role_permissoes FOR INSERT WITH CHECK (true);
CREATE POLICY "rls_update_role_permissoes" ON role_permissoes FOR UPDATE USING (true);
CREATE POLICY "rls_delete_role_permissoes" ON role_permissoes FOR DELETE USING (true);

-- 7. Conceder permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON permissoes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON role_permissoes TO anon, authenticated;

-- 8. Seed de permissões padrão
INSERT INTO permissoes (nome, descricao, recurso, acao) VALUES
    -- Faculdades
    ('faculdades:criar', 'Criar novas faculdades', 'faculdades', 'criar'),
    ('faculdades:ler', 'Visualizar faculdades', 'faculdades', 'ler'),
    ('faculdades:atualizar', 'Editar faculdades', 'faculdades', 'atualizar'),
    ('faculdades:deletar', 'Deletar faculdades', 'faculdades', 'deletar'),
    
    -- Usuários
    ('usuarios:criar', 'Criar novos usuários', 'usuarios', 'criar'),
    ('usuarios:ler', 'Visualizar usuários', 'usuarios', 'ler'),
    ('usuarios:atualizar', 'Editar usuários', 'usuarios', 'atualizar'),
    ('usuarios:deletar', 'Deletar usuários', 'usuarios', 'deletar'),
    
    -- Conversas
    ('conversas:criar', 'Criar conversas', 'conversas', 'criar'),
    ('conversas:ler', 'Visualizar conversas', 'conversas', 'ler'),
    ('conversas:atualizar', 'Editar conversas', 'conversas', 'atualizar'),
    ('conversas:deletar', 'Deletar conversas', 'conversas', 'deletar'),
    ('conversas:atribuir', 'Atribuir conversas a atendentes', 'conversas', 'atribuir'),
    
    -- Prospects
    ('prospects:criar', 'Criar prospects', 'prospects', 'criar'),
    ('prospects:ler', 'Visualizar prospects', 'prospects', 'ler'),
    ('prospects:atualizar', 'Editar prospects', 'prospects', 'atualizar'),
    ('prospects:deletar', 'Deletar prospects', 'prospects', 'deletar'),
    
    -- Relatórios e Métricas
    ('relatorios:ler', 'Visualizar relatórios gerenciais', 'relatorios', 'ler'),
    ('relatorios:exportar', 'Exportar relatórios', 'relatorios', 'exportar'),
    ('metricas:ler', 'Visualizar métricas', 'metricas', 'ler'),
    
    -- Agentes IA
    ('agentes_ia:criar', 'Criar agentes IA', 'agentes_ia', 'criar'),
    ('agentes_ia:ler', 'Visualizar agentes IA', 'agentes_ia', 'ler'),
    ('agentes_ia:atualizar', 'Editar agentes IA', 'agentes_ia', 'atualizar'),
    ('agentes_ia:deletar', 'Deletar agentes IA', 'agentes_ia', 'deletar'),
    
    -- Cursos
    ('cursos:criar', 'Criar cursos', 'cursos', 'criar'),
    ('cursos:ler', 'Visualizar cursos', 'cursos', 'ler'),
    ('cursos:atualizar', 'Editar cursos', 'cursos', 'atualizar'),
    ('cursos:deletar', 'Deletar cursos', 'cursos', 'deletar'),
    
    -- Configurações
    ('configuracoes:ler', 'Visualizar configurações', 'configuracoes', 'ler'),
    ('configuracoes:atualizar', 'Editar configurações', 'configuracoes', 'atualizar'),
    
    -- Permissões (meta)
    ('permissoes:ler', 'Visualizar permissões', 'permissoes', 'ler'),
    ('permissoes:gerenciar', 'Gerenciar permissões de roles', 'permissoes', 'gerenciar')
ON CONFLICT (nome) DO NOTHING;

-- 9. Atribuir permissões aos roles

-- ADMIN: Todas as permissões
INSERT INTO role_permissoes (role, permissao_id)
SELECT 'admin', id FROM permissoes
ON CONFLICT (role, permissao_id) DO NOTHING;

-- GERENTE: Permissões operacionais (sem gerenciar faculdades, usuários ou permissões)
INSERT INTO role_permissoes (role, permissao_id)
SELECT 'gerente', id FROM permissoes
WHERE nome IN (
    'conversas:criar', 'conversas:ler', 'conversas:atualizar', 'conversas:deletar', 'conversas:atribuir',
    'prospects:criar', 'prospects:ler', 'prospects:atualizar', 'prospects:deletar',
    'relatorios:ler', 'relatorios:exportar', 'metricas:ler',
    'agentes_ia:ler', 'agentes_ia:atualizar',
    'cursos:ler',
    'usuarios:ler'
)
ON CONFLICT (role, permissao_id) DO NOTHING;

-- ATENDENTE: Permissões básicas (apenas suas conversas e prospects)
INSERT INTO role_permissoes (role, permissao_id)
SELECT 'atendente', id FROM permissoes
WHERE nome IN (
    'conversas:ler', 'conversas:atualizar',
    'prospects:criar', 'prospects:ler', 'prospects:atualizar',
    'metricas:ler',
    'cursos:ler'
)
ON CONFLICT (role, permissao_id) DO NOTHING;

-- 10. Função para verificar permissão de um usuário
CREATE OR REPLACE FUNCTION usuario_tem_permissao(
    p_usuario_id UUID,
    p_recurso VARCHAR,
    p_acao VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_role VARCHAR(20);
    v_tem_permissao BOOLEAN;
BEGIN
    -- Buscar role do usuário
    SELECT role INTO v_role
    FROM usuarios
    WHERE id = p_usuario_id;
    
    IF v_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar se o role tem a permissão
    SELECT EXISTS (
        SELECT 1
        FROM role_permissoes rp
        JOIN permissoes p ON rp.permissao_id = p.id
        WHERE rp.role = v_role
        AND p.recurso = p_recurso
        AND p.acao = p_acao
    ) INTO v_tem_permissao;
    
    RETURN v_tem_permissao;
END;
$$ LANGUAGE plpgsql;

-- 11. Função para buscar todas as permissões de um usuário
CREATE OR REPLACE FUNCTION buscar_permissoes_usuario(p_usuario_id UUID)
RETURNS TABLE (
    permissao_nome VARCHAR,
    recurso VARCHAR,
    acao VARCHAR
) AS $$
DECLARE
    v_role VARCHAR(20);
BEGIN
    -- Buscar role do usuário
    SELECT role INTO v_role
    FROM usuarios
    WHERE id = p_usuario_id;
    
    IF v_role IS NULL THEN
        RETURN;
    END IF;
    
    -- Retornar todas as permissões do role
    RETURN QUERY
    SELECT p.nome, p.recurso, p.acao
    FROM role_permissoes rp
    JOIN permissoes p ON rp.permissao_id = p.id
    WHERE rp.role = v_role;
END;
$$ LANGUAGE plpgsql;

-- 12. Atualizar usuário demo para ser admin
UPDATE usuarios 
SET role = 'admin' 
WHERE email = 'admin@unifatecie.com.br';

-- Validação
SELECT 
    'Permissões criadas' as status,
    COUNT(*) as total
FROM permissoes;

SELECT 
    role,
    COUNT(*) as total_permissoes
FROM role_permissoes
GROUP BY role
ORDER BY role;
