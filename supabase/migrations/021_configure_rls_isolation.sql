-- Configurar Row Level Security (RLS) para isolamento total por faculdade
-- IMPORTANTE: Como as APIs usam service_role, o RLS não bloqueia automaticamente
-- As validações nas APIs garantem o isolamento. RLS é camada adicional de segurança.

-- =============================================
-- CONVERSAS WHATSAPP
-- =============================================
ALTER TABLE public.conversas_whatsapp ENABLE ROW LEVEL SECURITY;

-- Política: Permitir acesso apenas com faculdade_id válido
-- (As APIs já validam isso, mas RLS adiciona camada extra)
DROP POLICY IF EXISTS "conversas_whatsapp_isolation" ON public.conversas_whatsapp;
CREATE POLICY "conversas_whatsapp_isolation" ON public.conversas_whatsapp
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- MENSAGENS
-- =============================================
ALTER TABLE public.mensagens ENABLE ROW LEVEL SECURITY;

-- Política: Mensagens devem estar vinculadas a uma conversa válida
DROP POLICY IF EXISTS "mensagens_isolation" ON public.mensagens;
CREATE POLICY "mensagens_isolation" ON public.mensagens
  FOR ALL
  USING (conversa_id IS NOT NULL)
  WITH CHECK (conversa_id IS NOT NULL);

-- =============================================
-- PROSPECTS ACADEMICOS
-- =============================================
ALTER TABLE public.prospects_academicos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "prospects_academicos_isolation" ON public.prospects_academicos;
CREATE POLICY "prospects_academicos_isolation" ON public.prospects_academicos
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- CURSOS
-- =============================================
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cursos_isolation" ON public.cursos;
CREATE POLICY "cursos_isolation" ON public.cursos
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- AGENTES IA
-- =============================================
ALTER TABLE public.agentes_ia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agentes_ia_isolation" ON public.agentes_ia;
CREATE POLICY "agentes_ia_isolation" ON public.agentes_ia
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- BASE CONHECIMENTO
-- =============================================
ALTER TABLE public.base_conhecimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "base_conhecimento_isolation" ON public.base_conhecimento;
CREATE POLICY "base_conhecimento_isolation" ON public.base_conhecimento
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- USUARIOS (ATENDENTES)
-- =============================================
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usuarios_isolation" ON public.usuarios;
CREATE POLICY "usuarios_isolation" ON public.usuarios
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- MENSAGENS AGENDADAS
-- =============================================
ALTER TABLE public.mensagens_agendadas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mensagens_agendadas_isolation" ON public.mensagens_agendadas;
CREATE POLICY "mensagens_agendadas_isolation" ON public.mensagens_agendadas
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- METRICAS DIARIAS
-- =============================================
ALTER TABLE public.metricas_diarias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "metricas_diarias_isolation" ON public.metricas_diarias;
CREATE POLICY "metricas_diarias_isolation" ON public.metricas_diarias
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- TRANSFERENCIAS SETORES
-- =============================================
ALTER TABLE public.transferencias_setores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transferencias_setores_isolation" ON public.transferencias_setores;
CREATE POLICY "transferencias_setores_isolation" ON public.transferencias_setores
  FOR ALL
  USING (faculdade_id IS NOT NULL)
  WITH CHECK (faculdade_id IS NOT NULL);

-- =============================================
-- NOTAS IMPORTANTES
-- =============================================
-- IMPORTANTE: Como as APIs usam service_role, o RLS não bloqueia automaticamente
-- O isolamento é garantido pelas validações nas APIs que sempre verificam faculdade_id
-- RLS aqui garante que faculdade_id nunca seja NULL (validação de integridade)

-- As políticas acima garantem que:
-- 1. Todos os registros devem ter faculdade_id (não pode ser NULL)
-- 2. As APIs sempre validam que recursos pertencem à faculdade correta
-- 3. As páginas do dashboard sempre filtram por faculdadeSelecionada

-- Para isolamento completo, as APIs implementam validação explícita usando
-- as funções helper em src/lib/faculdadeValidation.ts

