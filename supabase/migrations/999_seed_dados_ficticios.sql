-- ========================================
-- SCRIPT: Dados Fictícios para o Sistema
-- Descrição: Popula o banco de dados com dados de exemplo para desenvolvimento e testes
-- ========================================

-- ========================================
-- 1. FACULDADES (se não existirem)
-- ========================================
INSERT INTO faculdades (nome, cnpj, telefone, email, cidade, estado, plano, status) 
SELECT * FROM (VALUES
    ('Universidade Tecnológica do Brasil', '12.345.678/0001-90', '(11) 3456-7890', 'contato@utb.edu.br', 'São Paulo', 'SP', 'enterprise', 'ativo'),
    ('Faculdade de Ciências Aplicadas', '23.456.789/0001-01', '(21) 2345-6789', 'admin@fca.edu.br', 'Rio de Janeiro', 'RJ', 'pro', 'ativo'),
    ('Centro Universitário Educacional', '34.567.890/0001-12', '(31) 3456-7890', 'secretaria@cue.edu.br', 'Belo Horizonte', 'MG', 'basico', 'ativo'),
    ('Instituto Superior de Tecnologia', '45.678.901/0001-23', '(41) 4567-8901', 'contato@ist.edu.br', 'Curitiba', 'PR', 'pro', 'ativo'),
    ('Faculdade Integrada de Ensino', '56.789.012/0001-34', '(51) 5678-9012', 'admin@fie.edu.br', 'Porto Alegre', 'RS', 'enterprise', 'ativo')
) AS v(nome, cnpj, telefone, email, cidade, estado, plano, status)
WHERE NOT EXISTS (
    SELECT 1 FROM faculdades WHERE faculdades.cnpj = v.cnpj
)
ON CONFLICT (cnpj) DO NOTHING;

-- ========================================
-- 2. USUÁRIOS/ATENDENTES
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
    faculdade3_id UUID;
BEGIN
    -- Obter IDs das faculdades
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    SELECT id INTO faculdade3_id FROM faculdades WHERE cnpj = '34.567.890/0001-12' LIMIT 1;
    
    -- Inserir usuários apenas se as faculdades existirem
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO usuarios (faculdade_id, nome, email, setor, status, carga_trabalho_atual, carga_trabalho_maxima, ativo) VALUES
        (faculdade1_id, 'Ana Silva', 'ana.silva@utb.edu.br', 'Atendimento', 'online', 3, 10, true),
        (faculdade1_id, 'Carlos Santos', 'carlos.santos@utb.edu.br', 'Vendas', 'online', 2, 15, true),
        (faculdade1_id, 'Maria Oliveira', 'maria.oliveira@utb.edu.br', 'Suporte', 'ausente', 1, 10, true),
        (faculdade1_id, 'João Pereira', 'joao.pereira@utb.edu.br', 'Atendimento', 'offline', 0, 10, true)
        ON CONFLICT (email) DO NOTHING;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO usuarios (faculdade_id, nome, email, setor, status, carga_trabalho_atual, carga_trabalho_maxima, ativo) VALUES
        (faculdade2_id, 'Pedro Costa', 'pedro.costa@fca.edu.br', 'Vendas', 'online', 5, 15, true),
        (faculdade2_id, 'Juliana Lima', 'juliana.lima@fca.edu.br', 'Atendimento', 'online', 2, 10, true)
        ON CONFLICT (email) DO NOTHING;
    END IF;
    
    IF faculdade3_id IS NOT NULL THEN
        INSERT INTO usuarios (faculdade_id, nome, email, setor, status, carga_trabalho_atual, carga_trabalho_maxima, ativo) VALUES
        (faculdade3_id, 'Roberto Alves', 'roberto.alves@cue.edu.br', 'Suporte', 'online', 1, 10, true)
        ON CONFLICT (email) DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 3. ETIQUETAS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO etiquetas (faculdade_id, nome, descricao, cor, criada_por) VALUES
        (faculdade1_id, 'Interessado', 'Cliente demonstrou interesse', '#10B981', 'Admin'),
        (faculdade1_id, 'Urgente', 'Requer atenção imediata', '#EF4444', 'Admin'),
        (faculdade1_id, 'Matriculado', 'Cliente já realizou matrícula', '#3B82F6', 'Admin'),
        (faculdade1_id, 'Follow-up', 'Necessita acompanhamento', '#F59E0B', 'Admin'),
        (faculdade1_id, 'VIP', 'Cliente VIP', '#8B5CF6', 'Admin')
        ON CONFLICT (faculdade_id, nome) DO NOTHING;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO etiquetas (faculdade_id, nome, descricao, cor, criada_por) VALUES
        (faculdade2_id, 'Interessado', 'Cliente demonstrou interesse', '#10B981', 'Admin'),
        (faculdade2_id, 'Urgente', 'Requer atenção imediata', '#EF4444', 'Admin')
        ON CONFLICT (faculdade_id, nome) DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 4. FUNIS DE VENDAS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    funil1_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO funis_vendas (faculdade_id, nome, etapas, ativo) VALUES
        (faculdade1_id, 'Funil Acadêmico', 
         '[
            {"id": "1", "nome": "Contato Inicial", "sigla": "CI", "destacar_esfriando": true, "dias_esfriando": 3, "ordem": 1},
            {"id": "2", "nome": "Qualificação", "sigla": "Q", "destacar_esfriando": true, "dias_esfriando": 5, "ordem": 2},
            {"id": "3", "nome": "Apresentação", "sigla": "AP", "destacar_esfriando": false, "dias_esfriando": 0, "ordem": 3},
            {"id": "4", "nome": "Proposta", "sigla": "PR", "destacar_esfriando": true, "dias_esfriando": 7, "ordem": 4},
            {"id": "5", "nome": "Fechamento", "sigla": "FC", "destacar_esfriando": false, "dias_esfriando": 0, "ordem": 5}
         ]'::jsonb, 
         true)
        ON CONFLICT DO NOTHING
        RETURNING id INTO funil1_id;
    END IF;
END $$;

-- ========================================
-- 5. PROSPECTS ACADÊMICOS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
    faculdade3_id UUID;
    tem_coluna_status BOOLEAN;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    SELECT id INTO faculdade3_id FROM faculdades WHERE cnpj = '34.567.890/0001-12' LIMIT 1;
    
    -- Verificar se existe coluna status na tabela
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'prospects_academicos' 
        AND column_name = 'status'
    ) INTO tem_coluna_status;
    
    IF faculdade1_id IS NOT NULL THEN
        -- Inserir prospects usando apenas status_academico (coluna correta)
        -- Se houver coluna status, definir explicitamente como NULL para evitar constraint violation
        IF tem_coluna_status THEN
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Fernando Souza', '5511999887766', 'fernando.souza@email.com', NULL, 'qualificado', 'Engenharia de Software', 'noite', 'São Paulo', 'SP', 'Google Ads', 85
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Patricia Mendes', '5511888776655', 'patricia.mendes@email.com', NULL, 'contatado', 'Administração', 'manha', 'São Paulo', 'SP', 'Facebook', 70
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Ricardo Ferreira', '5511777665544', 'ricardo.ferreira@email.com', NULL, 'matriculado', 'Ciência da Computação', 'tarde', 'São Paulo', 'SP', 'Indicação', 95
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Amanda Costa', '5511666554433', 'amanda.costa@email.com', NULL, 'novo', 'Psicologia', 'manha', 'São Paulo', 'SP', 'Instagram', 60
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Lucas Almeida', '5511555443322', 'lucas.almeida@email.com', NULL, 'qualificado', 'Direito', 'noite', 'São Paulo', 'SP', 'Site', 80
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id);
        ELSE
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Fernando Souza', '5511999887766', 'fernando.souza@email.com', 'qualificado', 'Engenharia de Software', 'noite', 'São Paulo', 'SP', 'Google Ads', 85
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Patricia Mendes', '5511888776655', 'patricia.mendes@email.com', 'contatado', 'Administração', 'manha', 'São Paulo', 'SP', 'Facebook', 70
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Ricardo Ferreira', '5511777665544', 'ricardo.ferreira@email.com', 'matriculado', 'Ciência da Computação', 'tarde', 'São Paulo', 'SP', 'Indicação', 95
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Amanda Costa', '5511666554433', 'amanda.costa@email.com', 'novo', 'Psicologia', 'manha', 'São Paulo', 'SP', 'Instagram', 60
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade1_id, 'Lucas Almeida', '5511555443322', 'lucas.almeida@email.com', 'qualificado', 'Direito', 'noite', 'São Paulo', 'SP', 'Site', 80
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id);
        END IF;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        IF tem_coluna_status THEN
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade2_id, 'Beatriz Rocha', '5521999887766', 'beatriz.rocha@email.com', NULL, 'contatado', 'Medicina', 'manha', 'Rio de Janeiro', 'RJ', 'Google Ads', 90
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5521999887766' AND faculdade_id = faculdade2_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade2_id, 'Thiago Martins', '5521888776655', 'thiago.martins@email.com', NULL, 'novo', 'Enfermagem', 'tarde', 'Rio de Janeiro', 'RJ', 'Facebook', 65
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5521888776655' AND faculdade_id = faculdade2_id);
        ELSE
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade2_id, 'Beatriz Rocha', '5521999887766', 'beatriz.rocha@email.com', 'contatado', 'Medicina', 'manha', 'Rio de Janeiro', 'RJ', 'Google Ads', 90
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5521999887766' AND faculdade_id = faculdade2_id);
            
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade2_id, 'Thiago Martins', '5521888776655', 'thiago.martins@email.com', 'novo', 'Enfermagem', 'tarde', 'Rio de Janeiro', 'RJ', 'Facebook', 65
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5521888776655' AND faculdade_id = faculdade2_id);
        END IF;
    END IF;
    
    IF faculdade3_id IS NOT NULL THEN
        IF tem_coluna_status THEN
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade3_id, 'Camila Dias', '5531999887766', 'camila.dias@email.com', NULL, 'qualificado', 'Pedagogia', 'manha', 'Belo Horizonte', 'MG', 'Indicação', 75
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5531999887766' AND faculdade_id = faculdade3_id);
        ELSE
            INSERT INTO prospects_academicos (faculdade_id, nome, telefone, email, status_academico, curso, turno, cidade, estado, origem, nota_qualificacao) 
            SELECT faculdade3_id, 'Camila Dias', '5531999887766', 'camila.dias@email.com', 'qualificado', 'Pedagogia', 'manha', 'Belo Horizonte', 'MG', 'Indicação', 75
            WHERE NOT EXISTS (SELECT 1 FROM prospects_academicos WHERE telefone = '5531999887766' AND faculdade_id = faculdade3_id);
        END IF;
    END IF;
END $$;

-- ========================================
-- 6. CONVERSAS WHATSAPP
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
    faculdade3_id UUID;
    usuario1_id UUID;
    usuario2_id UUID;
    prospect1_id UUID;
    prospect2_id UUID;
    conversa1_id UUID;
    conversa2_id UUID;
    conversa3_id UUID;
    conversa4_id UUID;
    conversa5_id UUID;
    tem_coluna_nome BOOLEAN;
    tem_coluna_instancia BOOLEAN;
    instancia1 VARCHAR(255);
    instancia2 VARCHAR(255);
    instancia3 VARCHAR(255);
BEGIN
    -- Verificar se a coluna nome existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'nome'
    ) INTO tem_coluna_nome;
    
    -- Verificar se a coluna instancia existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'conversas_whatsapp' 
        AND column_name = 'instancia'
    ) INTO tem_coluna_instancia;
    
    -- Obter IDs
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    SELECT id INTO faculdade3_id FROM faculdades WHERE cnpj = '34.567.890/0001-12' LIMIT 1;
    SELECT id INTO usuario1_id FROM usuarios WHERE email = 'ana.silva@utb.edu.br' LIMIT 1;
    SELECT id INTO usuario2_id FROM usuarios WHERE email = 'carlos.santos@utb.edu.br' LIMIT 1;
    SELECT id INTO prospect1_id FROM prospects_academicos WHERE telefone = '5511999887766' LIMIT 1;
    SELECT id INTO prospect2_id FROM prospects_academicos WHERE telefone = '5511888776655' LIMIT 1;
    
    -- Obter instâncias Evolution das faculdades (se existir coluna instancia)
    IF tem_coluna_instancia THEN
        SELECT evolution_instance INTO instancia1 FROM faculdades WHERE id = faculdade1_id LIMIT 1;
        SELECT evolution_instance INTO instancia2 FROM faculdades WHERE id = faculdade2_id LIMIT 1;
        SELECT evolution_instance INTO instancia3 FROM faculdades WHERE id = faculdade3_id LIMIT 1;
        -- Se não tiver instância configurada, usar um valor padrão
        IF instancia1 IS NULL THEN instancia1 := 'default'; END IF;
        IF instancia2 IS NULL THEN instancia2 := 'default'; END IF;
        IF instancia3 IS NULL THEN instancia3 := 'default'; END IF;
    END IF;
    
    IF faculdade1_id IS NOT NULL THEN
        IF tem_coluna_nome AND tem_coluna_instancia THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511999887766', 'Fernando Souza', instancia1, 'ativo', 'Olá, gostaria de mais informações sobre o curso', 2, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Interessado'], NOW() - INTERVAL '10 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa1_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511888776655', 'Patricia Mendes', instancia1, 'ativo', 'Quando começa o próximo semestre?', 1, 'Atendimento', COALESCE(usuario1_id::text, 'Ana Silva'), ARRAY['Follow-up'], NOW() - INTERVAL '30 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa2_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511777665544', 'Ricardo Ferreira', instancia1, 'ativo', 'Obrigado pela ajuda!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Matriculado'], NOW() - INTERVAL '2 hours'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa3_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511666554433', 'Amanda Costa', instancia1, 'pendente', 'Bom dia!', 3, 'Vendas', NULL, NULL, NOW() - INTERVAL '1 hour'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa4_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511555443322', 'Lucas Almeida', instancia1, 'encerrado', 'Obrigado!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Follow-up'], NOW() - INTERVAL '1 day'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa5_id;
        ELSIF tem_coluna_nome THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511999887766', 'Fernando Souza', 'ativo', 'Olá, gostaria de mais informações sobre o curso', 2, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Interessado'], NOW() - INTERVAL '10 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa1_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511888776655', 'Patricia Mendes', 'ativo', 'Quando começa o próximo semestre?', 1, 'Atendimento', COALESCE(usuario1_id::text, 'Ana Silva'), ARRAY['Follow-up'], NOW() - INTERVAL '30 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa2_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511777665544', 'Ricardo Ferreira', 'ativo', 'Obrigado pela ajuda!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Matriculado'], NOW() - INTERVAL '2 hours'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa3_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511666554433', 'Amanda Costa', 'pendente', 'Bom dia!', 3, 'Vendas', NULL, NULL, NOW() - INTERVAL '1 hour'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa4_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511555443322', 'Lucas Almeida', 'encerrado', 'Obrigado!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Follow-up'], NOW() - INTERVAL '1 day'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa5_id;
        ELSIF tem_coluna_instancia THEN
            -- Se não tem coluna nome mas tem instancia, inserir sem nome
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511999887766', instancia1, 'ativo', 'Olá, gostaria de mais informações sobre o curso', 2, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Interessado'], NOW() - INTERVAL '10 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa1_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511888776655', instancia1, 'ativo', 'Quando começa o próximo semestre?', 1, 'Atendimento', COALESCE(usuario1_id::text, 'Ana Silva'), ARRAY['Follow-up'], NOW() - INTERVAL '30 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa2_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511777665544', instancia1, 'ativo', 'Obrigado pela ajuda!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Matriculado'], NOW() - INTERVAL '2 hours'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa3_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511666554433', instancia1, 'pendente', 'Bom dia!', 3, 'Vendas', NULL, NULL, NOW() - INTERVAL '1 hour'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa4_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511555443322', instancia1, 'encerrado', 'Obrigado!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Follow-up'], NOW() - INTERVAL '1 day'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa5_id;
        ELSIF tem_coluna_instancia THEN
            -- Se não tem coluna nome mas tem instancia, inserir sem nome
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511999887766', instancia1, 'ativo', 'Olá, gostaria de mais informações sobre o curso', 2, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Interessado'], NOW() - INTERVAL '10 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa1_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511888776655', instancia1, 'ativo', 'Quando começa o próximo semestre?', 1, 'Atendimento', COALESCE(usuario1_id::text, 'Ana Silva'), ARRAY['Follow-up'], NOW() - INTERVAL '30 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa2_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511777665544', instancia1, 'ativo', 'Obrigado pela ajuda!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Matriculado'], NOW() - INTERVAL '2 hours'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa3_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511666554433', instancia1, 'pendente', 'Bom dia!', 3, 'Vendas', NULL, NULL, NOW() - INTERVAL '1 hour'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa4_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511555443322', instancia1, 'encerrado', 'Obrigado!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Follow-up'], NOW() - INTERVAL '1 day'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa5_id;
        ELSE
            -- Se não tem coluna nome nem instancia, inserir sem elas
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511999887766', 'ativo', 'Olá, gostaria de mais informações sobre o curso', 2, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Interessado'], NOW() - INTERVAL '10 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511999887766' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa1_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511888776655', 'ativo', 'Quando começa o próximo semestre?', 1, 'Atendimento', COALESCE(usuario1_id::text, 'Ana Silva'), ARRAY['Follow-up'], NOW() - INTERVAL '30 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511888776655' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa2_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511777665544', 'ativo', 'Obrigado pela ajuda!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Matriculado'], NOW() - INTERVAL '2 hours'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511777665544' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa3_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511666554433', 'pendente', 'Bom dia!', 3, 'Vendas', NULL, NULL, NOW() - INTERVAL '1 hour'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511666554433' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa4_id;
            
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade1_id, '5511555443322', 'encerrado', 'Obrigado!', 0, 'Vendas', COALESCE(usuario2_id::text, 'Carlos Santos'), ARRAY['Follow-up'], NOW() - INTERVAL '1 day'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5511555443322' AND faculdade_id = faculdade1_id)
            RETURNING id INTO conversa5_id;
        END IF;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        IF tem_coluna_nome AND tem_coluna_instancia THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade2_id, '5521999887766', 'Beatriz Rocha', instancia2, 'ativo', 'Preciso de informações sobre a mensalidade', 1, 'Vendas', NULL, ARRAY['Urgente'], NOW() - INTERVAL '15 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5521999887766' AND faculdade_id = faculdade2_id);
        ELSIF tem_coluna_nome THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade2_id, '5521999887766', 'Beatriz Rocha', 'ativo', 'Preciso de informações sobre a mensalidade', 1, 'Vendas', NULL, ARRAY['Urgente'], NOW() - INTERVAL '15 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5521999887766' AND faculdade_id = faculdade2_id);
        ELSIF tem_coluna_instancia THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade2_id, '5521999887766', instancia2, 'ativo', 'Preciso de informações sobre a mensalidade', 1, 'Vendas', NULL, ARRAY['Urgente'], NOW() - INTERVAL '15 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5521999887766' AND faculdade_id = faculdade2_id);
        ELSE
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade2_id, '5521999887766', 'ativo', 'Preciso de informações sobre a mensalidade', 1, 'Vendas', NULL, ARRAY['Urgente'], NOW() - INTERVAL '15 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5521999887766' AND faculdade_id = faculdade2_id);
        END IF;
    END IF;
    
    IF faculdade3_id IS NOT NULL THEN
        IF tem_coluna_nome AND tem_coluna_instancia THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade3_id, '5531999887766', 'Camila Dias', instancia3, 'ativo', 'Qual o valor do curso?', 2, 'Vendas', NULL, NULL, NOW() - INTERVAL '45 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5531999887766' AND faculdade_id = faculdade3_id);
        ELSIF tem_coluna_nome THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, nome, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade3_id, '5531999887766', 'Camila Dias', 'ativo', 'Qual o valor do curso?', 2, 'Vendas', NULL, NULL, NOW() - INTERVAL '45 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5531999887766' AND faculdade_id = faculdade3_id);
        ELSIF tem_coluna_instancia THEN
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, instancia, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade3_id, '5531999887766', instancia3, 'ativo', 'Qual o valor do curso?', 2, 'Vendas', NULL, NULL, NOW() - INTERVAL '45 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5531999887766' AND faculdade_id = faculdade3_id);
        ELSE
            INSERT INTO conversas_whatsapp (faculdade_id, telefone, status, ultima_mensagem, nao_lidas, departamento, atendente, tags, data_ultima_mensagem) 
            SELECT faculdade3_id, '5531999887766', 'ativo', 'Qual o valor do curso?', 2, 'Vendas', NULL, NULL, NOW() - INTERVAL '45 minutes'
            WHERE NOT EXISTS (SELECT 1 FROM conversas_whatsapp WHERE telefone = '5531999887766' AND faculdade_id = faculdade3_id);
        END IF;
    END IF;
END $$;

-- ========================================
-- 7. MENSAGENS
-- ========================================
DO $$ 
DECLARE
    conversa1_id UUID;
    conversa2_id UUID;
    conversa3_id UUID;
BEGIN
    SELECT id INTO conversa1_id FROM conversas_whatsapp WHERE telefone = '5511999887766' LIMIT 1;
    SELECT id INTO conversa2_id FROM conversas_whatsapp WHERE telefone = '5511888776655' LIMIT 1;
    SELECT id INTO conversa3_id FROM conversas_whatsapp WHERE telefone = '5511777665544' LIMIT 1;
    
    IF conversa1_id IS NOT NULL THEN
        INSERT INTO mensagens (conversa_id, conteudo, remetente, tipo_mensagem, timestamp, lida) VALUES
        (conversa1_id, 'Olá, gostaria de mais informações sobre o curso de Engenharia de Software', 'usuario', 'texto', NOW() - INTERVAL '1 hour', false),
        (conversa1_id, 'Olá! Claro, ficarei feliz em ajudar. O curso tem duração de 4 anos e é no período noturno.', 'agente', 'texto', NOW() - INTERVAL '55 minutes', true),
        (conversa1_id, 'Qual o valor da mensalidade?', 'usuario', 'texto', NOW() - INTERVAL '50 minutes', false),
        (conversa1_id, 'A mensalidade é de R$ 850,00. Oferecemos descontos para pagamento antecipado.', 'agente', 'texto', NOW() - INTERVAL '45 minutes', true),
        (conversa1_id, 'Olá, gostaria de mais informações sobre o curso', 'usuario', 'texto', NOW() - INTERVAL '10 minutes', false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF conversa2_id IS NOT NULL THEN
        INSERT INTO mensagens (conversa_id, conteudo, remetente, tipo_mensagem, timestamp, lida) VALUES
        (conversa2_id, 'Bom dia! Quando começa o próximo semestre?', 'usuario', 'texto', NOW() - INTERVAL '1 hour', false),
        (conversa2_id, 'Bom dia! O próximo semestre inicia em fevereiro de 2025.', 'agente', 'texto', NOW() - INTERVAL '55 minutes', true),
        (conversa2_id, 'Quando começa o próximo semestre?', 'usuario', 'texto', NOW() - INTERVAL '30 minutes', false)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF conversa3_id IS NOT NULL THEN
        INSERT INTO mensagens (conversa_id, conteudo, remetente, tipo_mensagem, timestamp, lida) VALUES
        (conversa3_id, 'Obrigado pela ajuda!', 'usuario', 'texto', NOW() - INTERVAL '2 hours', true),
        (conversa3_id, 'De nada! Estamos à disposição para qualquer dúvida.', 'agente', 'texto', NOW() - INTERVAL '2 hours', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 8. NEGOCIAÇÕES (CRM)
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    funil1_id UUID;
    contato1_id UUID;
    contato2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO funil1_id FROM funis_vendas WHERE nome = 'Funil Acadêmico' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        -- Criar contatos primeiro
        INSERT INTO contatos (faculdade_id, nome, telefone, email) VALUES
        (faculdade1_id, 'Fernando Souza', '5511999887766', 'fernando.souza@email.com'),
        (faculdade1_id, 'Patricia Mendes', '5511888776655', 'patricia.mendes@email.com')
        ON CONFLICT DO NOTHING
        RETURNING id INTO contato1_id, contato2_id;
        
        -- Buscar IDs dos contatos criados
        SELECT id INTO contato1_id FROM contatos WHERE telefone = '5511999887766' LIMIT 1;
        SELECT id INTO contato2_id FROM contatos WHERE telefone = '5511888776655' LIMIT 1;
        
        -- Criar negociações
        INSERT INTO negociacoes (faculdade_id, funil_id, etapa, contato_id, titulo, valor_estimado, probabilidade, data_entrada_etapa, telefone, conversa_id) 
        SELECT 
            faculdade1_id,
            funil1_id,
            '1', -- Contato Inicial
            contato1_id,
            'Negociação - Engenharia de Software',
            8500.00,
            30,
            NOW() - INTERVAL '2 days',
            '5511999887766',
            (SELECT id FROM conversas_whatsapp WHERE telefone = '5511999887766' LIMIT 1)
        WHERE funil1_id IS NOT NULL AND contato1_id IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        INSERT INTO negociacoes (faculdade_id, funil_id, etapa, contato_id, titulo, valor_estimado, probabilidade, data_entrada_etapa, telefone, conversa_id) 
        SELECT 
            faculdade1_id,
            funil1_id,
            '2', -- Qualificação
            contato2_id,
            'Negociação - Administração',
            6500.00,
            50,
            NOW() - INTERVAL '1 day',
            '5511888776655',
            (SELECT id FROM conversas_whatsapp WHERE telefone = '5511888776655' LIMIT 1)
        WHERE funil1_id IS NOT NULL AND contato2_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 9. EMPRESAS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    empresa1_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO empresas (faculdade_id, nome, cnpj, telefone, email, cidade, estado, tags) VALUES
        (faculdade1_id, 'Tech Solutions Ltda', '11.222.333/0001-44', '(11) 3333-4444', 'contato@techsolutions.com.br', 'São Paulo', 'SP', ARRAY['Parceiro', 'VIP']),
        (faculdade1_id, 'Inovação Educacional SA', '22.333.444/0001-55', '(11) 4444-5555', 'contato@inovacaoedu.com.br', 'São Paulo', 'SP', ARRAY['Parceiro'])
        ON CONFLICT DO NOTHING
        RETURNING id INTO empresa1_id;
        
        -- Atualizar contatos com empresa_id
        UPDATE contatos 
        SET empresa_id = empresa1_id 
        WHERE faculdade_id = faculdade1_id AND empresa_id IS NULL
        LIMIT 1;
    END IF;
END $$;

-- ========================================
-- 10. TAREFAS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    negociacao1_id UUID;
    usuario1_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO negociacao1_id FROM negociacoes LIMIT 1;
    SELECT id INTO usuario1_id FROM usuarios WHERE email = 'carlos.santos@utb.edu.br' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO tarefas (faculdade_id, negociacao_id, responsavel_id, titulo, descricao, prioridade, status, data_vencimento) 
        SELECT 
            faculdade1_id,
            negociacao1_id,
            usuario1_id,
            'Enviar proposta comercial',
            'Enviar proposta detalhada do curso de Engenharia de Software',
            'alta',
            'pendente',
            NOW() + INTERVAL '2 days'
        WHERE negociacao1_id IS NOT NULL AND usuario1_id IS NOT NULL
        ON CONFLICT DO NOTHING;
        
        INSERT INTO tarefas (faculdade_id, negociacao_id, responsavel_id, titulo, descricao, prioridade, status, data_vencimento) 
        SELECT 
            faculdade1_id,
            negociacao1_id,
            usuario1_id,
            'Agendar reunião',
            'Agendar reunião presencial com o cliente',
            'media',
            'pendente',
            NOW() + INTERVAL '5 days'
        WHERE negociacao1_id IS NOT NULL AND usuario1_id IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 11. AGENTES IA
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO agentes_ia (faculdade_id, nome, script_atendimento, ativo, descricao) VALUES
        (faculdade1_id, 'Assistente Virtual - Vendas', 
         'Você é um assistente virtual especializado em vendas educacionais. Seja cordial, informativo e sempre ofereça agendar uma conversa com um consultor quando necessário.',
         true,
         'Agente IA para atendimento inicial de vendas'),
        (faculdade1_id, 'Assistente Virtual - Suporte', 
         'Você é um assistente virtual de suporte. Ajude os clientes com dúvidas sobre cursos, matrículas e processos acadêmicos.',
         true,
         'Agente IA para suporte técnico')
        ON CONFLICT (faculdade_id, nome) DO NOTHING;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO agentes_ia (faculdade_id, nome, script_atendimento, ativo, descricao) VALUES
        (faculdade2_id, 'Assistente Virtual Principal', 
         'Você é o assistente virtual da faculdade. Ajude os visitantes com informações sobre cursos, valores e processos.',
         true,
         'Agente IA principal')
        ON CONFLICT (faculdade_id, nome) DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 12. CURSOS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO cursos (faculdade_id, nome, descricao, duracao_meses, valor_mensalidade, turno, ativo) VALUES
        (faculdade1_id, 'Engenharia de Software', 'Curso completo de Engenharia de Software com foco em desenvolvimento moderno', 48, 850.00, 'noite', true),
        (faculdade1_id, 'Administração', 'Curso de Administração com ênfase em gestão empresarial', 36, 650.00, 'manha', true),
        (faculdade1_id, 'Ciência da Computação', 'Curso de Ciência da Computação com base sólida em programação', 48, 900.00, 'tarde', true),
        (faculdade1_id, 'Psicologia', 'Curso de Psicologia com formação completa', 60, 750.00, 'manha', true),
        (faculdade1_id, 'Direito', 'Curso de Direito com preparação para OAB', 60, 950.00, 'noite', true)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO cursos (faculdade_id, nome, descricao, duracao_meses, valor_mensalidade, turno, ativo) VALUES
        (faculdade2_id, 'Medicina', 'Curso de Medicina com formação completa', 72, 3500.00, 'manha', true),
        (faculdade2_id, 'Enfermagem', 'Curso de Enfermagem com estágios práticos', 48, 800.00, 'tarde', true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 13. BASE DE CONHECIMENTO
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO base_conhecimento (faculdade_id, titulo, conteudo, categoria, tags, ativo) VALUES
        (faculdade1_id, 'Como realizar a matrícula?', 
         'Para realizar a matrícula, você precisa: 1) Preencher o formulário online, 2) Enviar documentos, 3) Efetuar o pagamento da primeira mensalidade.',
         'Matrícula',
         ARRAY['matrícula', 'documentos', 'pagamento'],
         true),
        (faculdade1_id, 'Quais são os métodos de pagamento?', 
         'Aceitamos: cartão de crédito, boleto bancário, PIX e financiamento estudantil.',
         'Pagamento',
         ARRAY['pagamento', 'financiamento', 'boleto'],
         true),
        (faculdade1_id, 'Como funciona o processo seletivo?', 
         'O processo seletivo pode ser feito através de: vestibular, ENEM, ou análise de histórico escolar.',
         'Admissão',
         ARRAY['vestibular', 'enem', 'admissão'],
         true)
        ON CONFLICT DO NOTHING;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO base_conhecimento (faculdade_id, titulo, conteudo, categoria, tags, ativo) VALUES
        (faculdade2_id, 'Informações sobre bolsas de estudo', 
         'Oferecemos bolsas de estudo de até 50% para estudantes de baixa renda. Entre em contato para mais informações.',
         'Bolsas',
         ARRAY['bolsa', 'desconto', 'financiamento'],
         true)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 14. CONFIGURAÇÕES DE CONVERSAS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO configuracoes_conversas (faculdade_id, configuracoes) VALUES
        (faculdade1_id, '{
            "saudacao_inicial": "Olá! Bem-vindo à Universidade Tecnológica do Brasil. Como posso ajudar?",
            "horario_atendimento": "Segunda a Sexta, das 8h às 18h",
            "mensagem_fora_horario": "Nossos atendentes retornarão em breve. Deixe sua mensagem!",
            "transferencia_automatica": true,
            "tempo_espera_transferencia": 300
        }'::jsonb)
        ON CONFLICT (faculdade_id) DO UPDATE SET
        configuracoes = EXCLUDED.configuracoes;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO configuracoes_conversas (faculdade_id, configuracoes) VALUES
        (faculdade2_id, '{
            "saudacao_inicial": "Olá! Bem-vindo à Faculdade de Ciências Aplicadas. Como posso ajudar?",
            "horario_atendimento": "Segunda a Sexta, das 9h às 17h",
            "mensagem_fora_horario": "Estamos fora do horário de atendimento. Retornaremos em breve!",
            "transferencia_automatica": false,
            "tempo_espera_transferencia": 600
        }'::jsonb)
        ON CONFLICT (faculdade_id) DO UPDATE SET
        configuracoes = EXCLUDED.configuracoes;
    END IF;
END $$;

-- ========================================
-- 15. MÉTRICAS DIÁRIAS (últimos 30 dias)
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
    i INTEGER;
    data_atual DATE;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    -- Gerar métricas para os últimos 30 dias
    FOR i IN 0..29 LOOP
        data_atual := CURRENT_DATE - i;
        
        IF faculdade1_id IS NOT NULL THEN
            INSERT INTO metricas_diarias (
                faculdade_id, 
                data, 
                total_conversas, 
                conversas_ativas, 
                novos_prospects, 
                prospects_convertidos,
                mensagens_enviadas,
                mensagens_recebidas,
                departamento
            ) VALUES (
                faculdade1_id,
                data_atual,
                10 + (RANDOM() * 20)::INTEGER,
                5 + (RANDOM() * 10)::INTEGER,
                2 + (RANDOM() * 5)::INTEGER,
                1 + (RANDOM() * 3)::INTEGER,
                50 + (RANDOM() * 100)::INTEGER,
                40 + (RANDOM() * 80)::INTEGER,
                'Vendas'
            )
            ON CONFLICT (faculdade_id, data, COALESCE(departamento, '')) DO UPDATE SET
                total_conversas = EXCLUDED.total_conversas,
                conversas_ativas = EXCLUDED.conversas_ativas,
                novos_prospects = EXCLUDED.novos_prospects,
                prospects_convertidos = EXCLUDED.prospects_convertidos,
                mensagens_enviadas = EXCLUDED.mensagens_enviadas,
                mensagens_recebidas = EXCLUDED.mensagens_recebidas;
        END IF;
        
        IF faculdade2_id IS NOT NULL THEN
            INSERT INTO metricas_diarias (
                faculdade_id, 
                data, 
                total_conversas, 
                conversas_ativas, 
                novos_prospects, 
                prospects_convertidos,
                mensagens_enviadas,
                mensagens_recebidas,
                departamento
            ) VALUES (
                faculdade2_id,
                data_atual,
                8 + (RANDOM() * 15)::INTEGER,
                4 + (RANDOM() * 8)::INTEGER,
                1 + (RANDOM() * 4)::INTEGER,
                1 + (RANDOM() * 2)::INTEGER,
                40 + (RANDOM() * 80)::INTEGER,
                35 + (RANDOM() * 70)::INTEGER,
                'Vendas'
            )
            ON CONFLICT (faculdade_id, data, COALESCE(departamento, '')) DO UPDATE SET
                total_conversas = EXCLUDED.total_conversas,
                conversas_ativas = EXCLUDED.conversas_ativas,
                novos_prospects = EXCLUDED.novos_prospects,
                prospects_convertidos = EXCLUDED.prospects_convertidos,
                mensagens_enviadas = EXCLUDED.mensagens_enviadas,
                mensagens_recebidas = EXCLUDED.mensagens_recebidas;
        END IF;
    END LOOP;
END $$;

-- ========================================
-- 16. MÉTRICAS POR HORÁRIO (hoje)
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    hora INTEGER;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        FOR hora IN 8..18 LOOP
            INSERT INTO metricas_por_horario (
                faculdade_id,
                data,
                hora,
                total_mensagens,
                total_conversas
            ) VALUES (
                faculdade1_id,
                CURRENT_DATE,
                hora,
                5 + (RANDOM() * 20)::INTEGER,
                2 + (RANDOM() * 8)::INTEGER
            )
            ON CONFLICT (faculdade_id, data, hora) DO UPDATE SET
                total_mensagens = EXCLUDED.total_mensagens,
                total_conversas = EXCLUDED.total_conversas;
        END LOOP;
    END IF;
END $$;

-- ========================================
-- 17. MÉTRICAS POR SETOR (hoje)
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO metricas_por_setor (
            faculdade_id,
            data,
            setor,
            total_atendimentos,
            atendimentos_finalizados,
            tempo_medio_atendimento,
            avaliacoes_positivas
        ) VALUES
        (faculdade1_id, CURRENT_DATE, 'Vendas', 15, 8, 1800, 12),
        (faculdade1_id, CURRENT_DATE, 'Atendimento', 12, 10, 1200, 11),
        (faculdade1_id, CURRENT_DATE, 'Suporte', 8, 7, 900, 7)
        ON CONFLICT (faculdade_id, data, setor) DO UPDATE SET
            total_atendimentos = EXCLUDED.total_atendimentos,
            atendimentos_finalizados = EXCLUDED.atendimentos_finalizados,
            tempo_medio_atendimento = EXCLUDED.tempo_medio_atendimento,
            avaliacoes_positivas = EXCLUDED.avaliacoes_positivas;
    END IF;
END $$;

-- ========================================
-- 18. MÉTRICAS DEMOGRÁFICAS (hoje)
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
    faculdade2_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    SELECT id INTO faculdade2_id FROM faculdades WHERE cnpj = '23.456.789/0001-01' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO metricas_demograficas (
            faculdade_id,
            data,
            cidade,
            estado,
            total_prospects,
            total_matriculas,
            receita_estimada
        ) VALUES
        (faculdade1_id, CURRENT_DATE, 'São Paulo', 'SP', 25, 5, 42500.00),
        (faculdade1_id, CURRENT_DATE, 'Campinas', 'SP', 8, 2, 17000.00),
        (faculdade1_id, CURRENT_DATE, 'Santos', 'SP', 5, 1, 8500.00)
        ON CONFLICT (faculdade_id, data, cidade, estado) DO UPDATE SET
            total_prospects = EXCLUDED.total_prospects,
            total_matriculas = EXCLUDED.total_matriculas,
            receita_estimada = EXCLUDED.receita_estimada;
    END IF;
    
    IF faculdade2_id IS NOT NULL THEN
        INSERT INTO metricas_demograficas (
            faculdade_id,
            data,
            cidade,
            estado,
            total_prospects,
            total_matriculas,
            receita_estimada
        ) VALUES
        (faculdade2_id, CURRENT_DATE, 'Rio de Janeiro', 'RJ', 15, 3, 10500.00),
        (faculdade2_id, CURRENT_DATE, 'Niterói', 'RJ', 6, 1, 800.00)
        ON CONFLICT (faculdade_id, data, cidade, estado) DO UPDATE SET
            total_prospects = EXCLUDED.total_prospects,
            total_matriculas = EXCLUDED.total_matriculas,
            receita_estimada = EXCLUDED.receita_estimada;
    END IF;
END $$;

-- ========================================
-- 19. TAGS PREDEFINIDAS
-- ========================================
DO $$ 
DECLARE
    faculdade1_id UUID;
BEGIN
    SELECT id INTO faculdade1_id FROM faculdades WHERE cnpj = '12.345.678/0001-90' LIMIT 1;
    
    IF faculdade1_id IS NOT NULL THEN
        INSERT INTO tags_predefinidas (faculdade_id, nome, cor, ativo) VALUES
        (faculdade1_id, 'Interessado', '#10B981', true),
        (faculdade1_id, 'Urgente', '#EF4444', true),
        (faculdade1_id, 'Matriculado', '#3B82F6', true),
        (faculdade1_id, 'Follow-up', '#F59E0B', true),
        (faculdade1_id, 'VIP', '#8B5CF6', true),
        (faculdade1_id, 'Reagendado', '#6366F1', true),
        (faculdade1_id, 'Cancelado', '#6B7280', true)
        ON CONFLICT (faculdade_id, nome) DO NOTHING;
    END IF;
END $$;

-- ========================================
-- 20. CONFIGURAÇÕES GLOBAIS
-- ========================================
DO $$ 
BEGIN
    INSERT INTO configuracoes_globais (chave, valor, descricao) VALUES
    ('evolution_api_url', 'https://api.evolution.com.br', 'URL base da API Evolution'),
    ('evolution_api_key', 'demo_key_12345', 'Chave de API da Evolution (exemplo)'),
    ('whatsapp_webhook_url', 'https://seu-dominio.com/api/webhook/whatsapp', 'URL do webhook para receber mensagens'),
    ('sistema_nome', 'Dashboard Faculdades', 'Nome do sistema'),
    ('sistema_versao', '1.0.0', 'Versão atual do sistema')
    ON CONFLICT (chave) DO UPDATE SET
        valor = EXCLUDED.valor,
        descricao = EXCLUDED.descricao;
END $$;

-- ========================================
-- VALIDAÇÃO FINAL
-- ========================================
-- Para verificar os dados criados, execute as seguintes queries:
-- SELECT COUNT(*) as total_faculdades FROM faculdades;
-- SELECT COUNT(*) as total_usuarios FROM usuarios;
-- SELECT COUNT(*) as total_conversas FROM conversas_whatsapp;
-- SELECT COUNT(*) as total_mensagens FROM mensagens;
-- SELECT COUNT(*) as total_prospects FROM prospects_academicos;
-- SELECT COUNT(*) as total_negociacoes FROM negociacoes;
-- SELECT COUNT(*) as total_etiquetas FROM etiquetas;
-- SELECT COUNT(*) as total_funis FROM funis_vendas;
-- SELECT COUNT(*) as total_empresas FROM empresas;
-- SELECT COUNT(*) as total_contatos FROM contatos;
-- SELECT COUNT(*) as total_tarefas FROM tarefas;
-- SELECT COUNT(*) as total_agentes_ia FROM agentes_ia;
-- SELECT COUNT(*) as total_cursos FROM cursos;
-- SELECT COUNT(*) as total_base_conhecimento FROM base_conhecimento;
-- SELECT COUNT(*) as total_metricas_diarias FROM metricas_diarias;

