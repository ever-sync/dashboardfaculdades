-- Migration: Cleanup Permissive Policies
-- Description: Drops old "permissive" policies that allowed global access, enforcing strict RLS.

-- 1. Drop policies from 013_fix_rls_policies.sql (Permissive "true" policies)
DROP POLICY IF EXISTS "rls_select_conversas_whatsapp" ON conversas_whatsapp;
DROP POLICY IF EXISTS "rls_insert_conversas_whatsapp" ON conversas_whatsapp;
DROP POLICY IF EXISTS "rls_update_conversas_whatsapp" ON conversas_whatsapp;
DROP POLICY IF EXISTS "rls_delete_conversas_whatsapp" ON conversas_whatsapp;

DROP POLICY IF EXISTS "rls_select_prospects_academicos" ON prospects_academicos;
DROP POLICY IF EXISTS "rls_insert_prospects_academicos" ON prospects_academicos;
DROP POLICY IF EXISTS "rls_update_prospects_academicos" ON prospects_academicos;
DROP POLICY IF EXISTS "rls_delete_prospects_academicos" ON prospects_academicos;

DROP POLICY IF EXISTS "rls_select_metricas_diarias" ON metricas_diarias;
DROP POLICY IF EXISTS "rls_insert_metricas_diarias" ON metricas_diarias;
DROP POLICY IF EXISTS "rls_update_metricas_diarias" ON metricas_diarias;
DROP POLICY IF EXISTS "rls_delete_metricas_diarias" ON metricas_diarias;

DROP POLICY IF EXISTS "rls_select_metricas_por_setor" ON metricas_por_setor;
DROP POLICY IF EXISTS "rls_insert_metricas_por_setor" ON metricas_por_setor;
DROP POLICY IF EXISTS "rls_update_metricas_por_setor" ON metricas_por_setor;

DROP POLICY IF EXISTS "rls_select_metricas_por_horario" ON metricas_por_horario;
DROP POLICY IF EXISTS "rls_insert_metricas_por_horario" ON metricas_por_horario;
DROP POLICY IF EXISTS "rls_update_metricas_por_horario" ON metricas_por_horario;

DROP POLICY IF EXISTS "rls_select_metricas_demograficas" ON metricas_demograficas;
DROP POLICY IF EXISTS "rls_insert_metricas_demograficas" ON metricas_demograficas;
DROP POLICY IF EXISTS "rls_update_metricas_demograficas" ON metricas_demograficas;

-- Mensagens (if exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mensagens') THEN
        DROP POLICY IF EXISTS "rls_select_mensagens" ON mensagens;
        DROP POLICY IF EXISTS "rls_insert_mensagens" ON mensagens;
        DROP POLICY IF EXISTS "rls_update_mensagens" ON mensagens;
        DROP POLICY IF EXISTS "rls_delete_mensagens" ON mensagens;
    END IF;
END $$;

-- 2. Drop policies from 003_create_faculdades_table.sql (Permissive "authenticated" policies)
DROP POLICY IF EXISTS "Permitir leitura para todos" ON faculdades;
DROP POLICY IF EXISTS "Permitir inserção para usuários autenticados" ON faculdades;
DROP POLICY IF EXISTS "Permitir atualização para usuários autenticados" ON faculdades;
DROP POLICY IF EXISTS "Permitir exclusão para usuários autenticados" ON faculdades;

-- 3. Ensure Faculdades has strict policies (Re-apply from 027/20241122 if missing, but dropping the bad ones is key)
-- The "Admin manage own faculdades" and "Super Admin full access faculdades" policies from 20241122_saas_schema.sql should already be there.
-- If not, we can re-create them here to be safe.

-- Re-enforce strict policies for Faculdades
CREATE POLICY "Strict: Admin view own faculdade" ON faculdades
FOR SELECT USING (admin_id = auth.uid());

CREATE POLICY "Strict: Admin update own faculdade" ON faculdades
FOR UPDATE USING (admin_id = auth.uid());

-- Allow Super Admin to do everything
CREATE POLICY "Strict: Super Admin all faculdades" ON faculdades
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- 4. Fix FaculdadeContext error (console error)
-- The error "Erro ao carregar faculdades" happens because the user might not have any faculdade assigned yet,
-- or the query returns empty and the code doesn't handle it gracefully?
-- Actually, with RLS, if the user has no faculdade, the query returns [], which is fine.
-- The error might be due to RLS blocking the SELECT completely if no policy matches?
-- No, "Permitir leitura para todos" was allowing it. Now it will return [] if no match.

-- Ensure authenticated users can at least SELECT from faculdades to check if they own any?
-- The "Strict: Admin view own faculdade" handles that.

