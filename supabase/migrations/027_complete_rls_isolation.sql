-- Migration: Complete RLS Isolation for Multi-Tenant System
-- Based on actual existing tables in the database

-- Enable RLS on all existing tables
ALTER TABLE agentes_ia ENABLE ROW LEVEL SECURITY;
ALTER TABLE base_conhecimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE codigos_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes_globais ENABLE ROW LEVEL SECURITY;
ALTER TABLE contatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE faculdades ENABLE ROW LEVEL SECURITY;
ALTER TABLE funis_vendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_agendadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_demograficas ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_por_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_por_setor ENABLE ROW LEVEL SECURITY;
ALTER TABLE negociacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags_predefinidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE typing_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users access own faculdade data" ON agentes_ia;
DROP POLICY IF EXISTS "Users access own faculdade data" ON metricas_diarias;
DROP POLICY IF EXISTS "Users access own faculdade data" ON metricas_por_horario;
DROP POLICY IF EXISTS "Users access own faculdade data" ON metricas_por_setor;
DROP POLICY IF EXISTS "Users access own faculdade data" ON negociacoes;
DROP POLICY IF EXISTS "Users access own faculdade data" ON prospects_academicos;
DROP POLICY IF EXISTS "Users access own faculdade data" ON sessoes_atendimento;
DROP POLICY IF EXISTS "Users access own faculdade data" ON tags_predefinidas;
DROP POLICY IF EXISTS "Users access own faculdade data" ON tarefas;
DROP POLICY IF EXISTS "Users access own faculdade data" ON transferencias_setores;
DROP POLICY IF EXISTS "Users access own faculdade data" ON typing_indicators;
DROP POLICY IF EXISTS "Users access own faculdade data" ON usuarios;

-- Create helper function to check if user owns a faculdade
CREATE OR REPLACE FUNCTION user_owns_faculdade(faculdade_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM faculdades 
    WHERE id = faculdade_uuid 
    AND admin_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to check if user is super admin
-- Since profiles table doesn't exist, we'll just return false for now
-- You can update this later when you have a proper user roles system
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- TODO: Implement proper super admin check when profiles/roles table exists
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AGENTES_IA
CREATE POLICY "Users access own faculdade agentes" ON agentes_ia
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- BASE_CONHECIMENTO
CREATE POLICY "Users access own faculdade base_conhecimento" ON base_conhecimento
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- CODIGOS_ATENDIMENTO
CREATE POLICY "Users access own faculdade codigos" ON codigos_atendimento
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- CONTATOS
CREATE POLICY "Users access own faculdade contatos" ON contatos
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- CONVERSAS_WHATSAPP
CREATE POLICY "Users access own faculdade conversas" ON conversas_whatsapp
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- CURSOS
CREATE POLICY "Users access own faculdade cursos" ON cursos
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- EMPRESAS
CREATE POLICY "Users access own faculdade empresas" ON empresas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- ETIQUETAS
CREATE POLICY "Users access own faculdade etiquetas" ON etiquetas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- FUNIS_VENDAS
CREATE POLICY "Users access own faculdade funis" ON funis_vendas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- MENSAGENS
CREATE POLICY "Users access own faculdade mensagens" ON mensagens
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversas_whatsapp 
    WHERE conversas_whatsapp.id = mensagens.conversa_id 
    AND user_owns_faculdade(conversas_whatsapp.faculdade_id)
  ) OR is_super_admin()
);

-- MENSAGENS_AGENDADAS
CREATE POLICY "Users access own faculdade mensagens_agendadas" ON mensagens_agendadas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- METRICAS_DEMOGRAFICAS
CREATE POLICY "Users access own faculdade metricas_demograficas" ON metricas_demograficas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- METRICAS_DIARIAS
CREATE POLICY "Users access own faculdade metricas_diarias" ON metricas_diarias
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- METRICAS_POR_HORARIO
CREATE POLICY "Users access own faculdade metricas_horario" ON metricas_por_horario
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- METRICAS_POR_SETOR
CREATE POLICY "Users access own faculdade metricas_setor" ON metricas_por_setor
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- NEGOCIACOES
CREATE POLICY "Users access own faculdade negociacoes" ON negociacoes
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- PROSPECTS_ACADEMICOS
CREATE POLICY "Users access own faculdade prospects" ON prospects_academicos
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- SESSOES_ATENDIMENTO
CREATE POLICY "Users access own faculdade sessoes" ON sessoes_atendimento
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- TAGS_PREDEFINIDAS
CREATE POLICY "Users access own faculdade tags" ON tags_predefinidas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- TAREFAS
CREATE POLICY "Users access own faculdade tarefas" ON tarefas
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- TRANSFERENCIAS_SETORES
CREATE POLICY "Users access own faculdade transferencias" ON transferencias_setores
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- TYPING_INDICATORS
CREATE POLICY "Users access own faculdade typing" ON typing_indicators
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM conversas_whatsapp 
    WHERE conversas_whatsapp.id = typing_indicators.conversa_id 
    AND user_owns_faculdade(conversas_whatsapp.faculdade_id)
  ) OR is_super_admin()
);

-- USUARIOS
CREATE POLICY "Users access own faculdade usuarios" ON usuarios
FOR ALL USING (user_owns_faculdade(faculdade_id) OR is_super_admin());

-- Add admin_id column to faculdades if it doesn't exist
ALTER TABLE faculdades ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES auth.users(id);

-- Update existing faculdades to have admin_id if null
-- Assign to the first user in the system
UPDATE faculdades 
SET admin_id = (
  SELECT id FROM auth.users 
  ORDER BY created_at ASC
  LIMIT 1
)
WHERE admin_id IS NULL;

-- Make admin_id NOT NULL after setting values (only if there are users)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    ALTER TABLE faculdades ALTER COLUMN admin_id SET NOT NULL;
  END IF;
END $$;
