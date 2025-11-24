-- Migration: Drop Bad Isolation Policies
-- Description: Drops permissive policies created in 021_configure_rls_isolation.sql that allowed global access.
-- These policies used "USING (faculdade_id IS NOT NULL)" which is true for all valid records, bypassing isolation.

-- 1. Conversas WhatsApp
DROP POLICY IF EXISTS "conversas_whatsapp_isolation" ON conversas_whatsapp;

-- 2. Mensagens
DROP POLICY IF EXISTS "mensagens_isolation" ON mensagens;

-- 3. Prospects Academicos
DROP POLICY IF EXISTS "prospects_academicos_isolation" ON prospects_academicos;

-- 4. Cursos
DROP POLICY IF EXISTS "cursos_isolation" ON cursos;

-- 5. Agentes IA
DROP POLICY IF EXISTS "agentes_ia_isolation" ON agentes_ia;

-- 6. Base Conhecimento
DROP POLICY IF EXISTS "base_conhecimento_isolation" ON base_conhecimento;

-- 7. Usuarios
DROP POLICY IF EXISTS "usuarios_isolation" ON usuarios;

-- 8. Mensagens Agendadas
DROP POLICY IF EXISTS "mensagens_agendadas_isolation" ON mensagens_agendadas;

-- 9. Metricas Diarias
DROP POLICY IF EXISTS "metricas_diarias_isolation" ON metricas_diarias;

-- 10. Transferencias Setores
DROP POLICY IF EXISTS "transferencias_setores_isolation" ON transferencias_setores;

-- Note: Strict policies should already be in place from migration 027 and 20241123.
-- This cleanup ensures that the strict policies are the ONLY ones active.
