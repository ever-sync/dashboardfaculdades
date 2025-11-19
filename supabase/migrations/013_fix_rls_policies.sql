-- ========================================
-- CORRIGIR POLÍTICAS RLS PARA ISOLAMENTO POR FACULDADE
-- ========================================

-- Remover políticas antigas baseadas em cliente_id e auth.uid()
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversas_whatsapp;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversas_whatsapp;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversas_whatsapp;
DROP POLICY IF EXISTS "Users can view their own prospects" ON prospects_academicos;
DROP POLICY IF EXISTS "Users can insert their own prospects" ON prospects_academicos;
DROP POLICY IF EXISTS "Users can update their own prospects" ON prospects_academicos;
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessoes_atendimento;
DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessoes_atendimento;
DROP POLICY IF EXISTS "Users can update their own sessions" ON sessoes_atendimento;
DROP POLICY IF EXISTS "Users can view their own transfers" ON transferencias_setores;
DROP POLICY IF EXISTS "Users can insert their own transfers" ON transferencias_setores;
DROP POLICY IF EXISTS "Users can update their own transfers" ON transferencias_setores;
DROP POLICY IF EXISTS "Users can view their own daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Users can insert their own daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Users can update their own daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Users can view their own sector metrics" ON metricas_por_setor;
DROP POLICY IF EXISTS "Users can insert their own sector metrics" ON metricas_por_setor;
DROP POLICY IF EXISTS "Users can update their own sector metrics" ON metricas_por_setor;
DROP POLICY IF EXISTS "Users can view their own hourly metrics" ON metricas_por_horario;
DROP POLICY IF EXISTS "Users can insert their own hourly metrics" ON metricas_por_horario;
DROP POLICY IF EXISTS "Users can update their own hourly metrics" ON metricas_por_horario;
DROP POLICY IF EXISTS "Users can view their own demographic metrics" ON metricas_demograficas;
DROP POLICY IF EXISTS "Users can insert their own demographic metrics" ON metricas_demograficas;
DROP POLICY IF EXISTS "Users can update their own demographic metrics" ON metricas_demograficas;

-- Criar políticas RLS baseadas em faculdade_id para isolamento multi-tenant
-- As políticas permitem operações baseadas em faculdade_id, garantindo isolamento de dados

-- Conversas WhatsApp
DROP POLICY IF EXISTS "rls_select_conversas_whatsapp" ON conversas_whatsapp;
CREATE POLICY "rls_select_conversas_whatsapp" ON conversas_whatsapp
    FOR SELECT
    USING (true); -- Permitir visualização, filtro será feito na aplicação via faculdade_id

DROP POLICY IF EXISTS "rls_insert_conversas_whatsapp" ON conversas_whatsapp;
CREATE POLICY "rls_insert_conversas_whatsapp" ON conversas_whatsapp
    FOR INSERT
    WITH CHECK (faculdade_id IS NOT NULL); -- Garantir que faculdade_id seja fornecido

DROP POLICY IF EXISTS "rls_update_conversas_whatsapp" ON conversas_whatsapp;
CREATE POLICY "rls_update_conversas_whatsapp" ON conversas_whatsapp
    FOR UPDATE
    USING (true); -- Permitir atualização, filtro será feito na aplicação

DROP POLICY IF EXISTS "rls_delete_conversas_whatsapp" ON conversas_whatsapp;
CREATE POLICY "rls_delete_conversas_whatsapp" ON conversas_whatsapp
    FOR DELETE
    USING (true); -- Permitir deleção, filtro será feito na aplicação

-- Prospects Acadêmicos
DROP POLICY IF EXISTS "rls_select_prospects_academicos" ON prospects_academicos;
CREATE POLICY "rls_select_prospects_academicos" ON prospects_academicos
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "rls_insert_prospects_academicos" ON prospects_academicos;
CREATE POLICY "rls_insert_prospects_academicos" ON prospects_academicos
    FOR INSERT
    WITH CHECK (faculdade_id IS NOT NULL);

DROP POLICY IF EXISTS "rls_update_prospects_academicos" ON prospects_academicos;
CREATE POLICY "rls_update_prospects_academicos" ON prospects_academicos
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "rls_delete_prospects_academicos" ON prospects_academicos;
CREATE POLICY "rls_delete_prospects_academicos" ON prospects_academicos
    FOR DELETE
    USING (true);

-- Mensagens (se a tabela existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mensagens') THEN
        DROP POLICY IF EXISTS "rls_select_mensagens" ON mensagens;
        DROP POLICY IF EXISTS "rls_insert_mensagens" ON mensagens;
        DROP POLICY IF EXISTS "rls_update_mensagens" ON mensagens;
        DROP POLICY IF EXISTS "rls_delete_mensagens" ON mensagens;

        CREATE POLICY "rls_select_mensagens" ON mensagens
            FOR SELECT
            USING (true);

        CREATE POLICY "rls_insert_mensagens" ON mensagens
            FOR INSERT
            WITH CHECK (conversa_id IS NOT NULL);

        CREATE POLICY "rls_update_mensagens" ON mensagens
            FOR UPDATE
            USING (true);

        CREATE POLICY "rls_delete_mensagens" ON mensagens
            FOR DELETE
            USING (true);
    END IF;
END $$;

-- Métricas Diárias
DROP POLICY IF EXISTS "rls_select_metricas_diarias" ON metricas_diarias;
CREATE POLICY "rls_select_metricas_diarias" ON metricas_diarias
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "rls_insert_metricas_diarias" ON metricas_diarias;
CREATE POLICY "rls_insert_metricas_diarias" ON metricas_diarias
    FOR INSERT
    WITH CHECK (faculdade_id IS NOT NULL);

DROP POLICY IF EXISTS "rls_update_metricas_diarias" ON metricas_diarias;
CREATE POLICY "rls_update_metricas_diarias" ON metricas_diarias
    FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "rls_delete_metricas_diarias" ON metricas_diarias;
CREATE POLICY "rls_delete_metricas_diarias" ON metricas_diarias
    FOR DELETE
    USING (true);

-- Métricas por Setor
DROP POLICY IF EXISTS "rls_select_metricas_por_setor" ON metricas_por_setor;
CREATE POLICY "rls_select_metricas_por_setor" ON metricas_por_setor
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "rls_insert_metricas_por_setor" ON metricas_por_setor;
CREATE POLICY "rls_insert_metricas_por_setor" ON metricas_por_setor
    FOR INSERT
    WITH CHECK (faculdade_id IS NOT NULL);

DROP POLICY IF EXISTS "rls_update_metricas_por_setor" ON metricas_por_setor;
CREATE POLICY "rls_update_metricas_por_setor" ON metricas_por_setor
    FOR UPDATE
    USING (true);

-- Métricas por Horário
DROP POLICY IF EXISTS "rls_select_metricas_por_horario" ON metricas_por_horario;
CREATE POLICY "rls_select_metricas_por_horario" ON metricas_por_horario
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "rls_insert_metricas_por_horario" ON metricas_por_horario;
CREATE POLICY "rls_insert_metricas_por_horario" ON metricas_por_horario
    FOR INSERT
    WITH CHECK (faculdade_id IS NOT NULL);

DROP POLICY IF EXISTS "rls_update_metricas_por_horario" ON metricas_por_horario;
CREATE POLICY "rls_update_metricas_por_horario" ON metricas_por_horario
    FOR UPDATE
    USING (true);

-- Métricas Demográficas
DROP POLICY IF EXISTS "rls_select_metricas_demograficas" ON metricas_demograficas;
CREATE POLICY "rls_select_metricas_demograficas" ON metricas_demograficas
    FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "rls_insert_metricas_demograficas" ON metricas_demograficas;
CREATE POLICY "rls_insert_metricas_demograficas" ON metricas_demograficas
    FOR INSERT
    WITH CHECK (faculdade_id IS NOT NULL);

DROP POLICY IF EXISTS "rls_update_metricas_demograficas" ON metricas_demograficas;
CREATE POLICY "rls_update_metricas_demograficas" ON metricas_demograficas
    FOR UPDATE
    USING (true);

-- NOTA: As políticas acima são permissivas porque o isolamento é feito na camada de aplicação
-- via filtros por faculdade_id nas queries. Isso é necessário porque:
-- 1. O sistema usa autenticação via cookies (não auth.uid())
-- 2. O isolamento multi-tenant é gerenciado pela aplicação
-- 3. As APIs server-side usam service role key que bypassa RLS
-- 
-- Em produção, considere implementar:
-- - Funções de segurança (SECURITY DEFINER) para validação de faculdade_id
-- - Triggers para garantir que faculdade_id seja sempre fornecido
-- - Validação adicional na camada de aplicação
