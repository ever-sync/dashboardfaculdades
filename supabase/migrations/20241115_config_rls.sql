-- Enable RLS on main tables
ALTER TABLE conversas_whatsapp ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_academicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_atendimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE transferencias_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_por_setor ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_por_horario ENABLE ROW LEVEL SECURITY;
ALTER TABLE metricas_demograficas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversas_whatsapp
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversas_whatsapp;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON conversas_whatsapp;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversas_whatsapp;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 013)
-- Estas políticas são redundantes, mas mantidas para compatibilidade

-- RLS Policies for prospects_academicos
DROP POLICY IF EXISTS "Users can view their own prospects" ON prospects_academicos;
DROP POLICY IF EXISTS "Users can insert their own prospects" ON prospects_academicos;
DROP POLICY IF EXISTS "Users can update their own prospects" ON prospects_academicos;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 013)

-- RLS Policies for sessoes_atendimento (se a tabela existir)
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sessoes_atendimento') THEN
        DROP POLICY IF EXISTS "Users can view their own sessions" ON sessoes_atendimento;
        DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessoes_atendimento;
        DROP POLICY IF EXISTS "Users can update their own sessions" ON sessoes_atendimento;
    END IF;
END $$;

-- RLS Policies for transferencias_setores
DROP POLICY IF EXISTS "Users can view their own transfers" ON transferencias_setores;
DROP POLICY IF EXISTS "Users can insert their own transfers" ON transferencias_setores;
DROP POLICY IF EXISTS "Users can update their own transfers" ON transferencias_setores;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 002)

-- RLS Policies for metricas_diarias
DROP POLICY IF EXISTS "Users can view their own daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Users can insert their own daily metrics" ON metricas_diarias;
DROP POLICY IF EXISTS "Users can update their own daily metrics" ON metricas_diarias;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 013)

-- RLS Policies for metricas_por_setor
DROP POLICY IF EXISTS "Users can view their own sector metrics" ON metricas_por_setor;
DROP POLICY IF EXISTS "Users can insert their own sector metrics" ON metricas_por_setor;
DROP POLICY IF EXISTS "Users can update their own sector metrics" ON metricas_por_setor;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 013)

-- RLS Policies for metricas_por_horario
DROP POLICY IF EXISTS "Users can view their own hourly metrics" ON metricas_por_horario;
DROP POLICY IF EXISTS "Users can insert their own hourly metrics" ON metricas_por_horario;
DROP POLICY IF EXISTS "Users can update their own hourly metrics" ON metricas_por_horario;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 013)

-- RLS Policies for metricas_demograficas
DROP POLICY IF EXISTS "Users can view their own demographic metrics" ON metricas_demograficas;
DROP POLICY IF EXISTS "Users can insert their own demographic metrics" ON metricas_demograficas;
DROP POLICY IF EXISTS "Users can update their own demographic metrics" ON metricas_demograficas;

-- Políticas simplificadas usando faculdade_id (já criadas na migração 013)

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create indexes for better performance (apenas se as colunas existirem)
-- Nota: Os índices principais já foram criados nas migrações anteriores
-- Estes são índices adicionais apenas se as colunas existirem

-- Índices para conversas_whatsapp (usando faculdade_id em vez de cliente_id)
CREATE INDEX IF NOT EXISTS idx_conversas_whatsapp_telefone ON conversas_whatsapp(telefone);

-- Índices para prospects_academicos (usando faculdade_id em vez de cliente_id)
CREATE INDEX IF NOT EXISTS idx_prospects_academicos_telefone ON prospects_academicos(telefone);
CREATE INDEX IF NOT EXISTS idx_prospects_academicos_status_academico ON prospects_academicos(status_academico);

-- Índices para metricas_diarias (usando faculdade_id em vez de cliente_id)
CREATE INDEX IF NOT EXISTS idx_metricas_diarias_data ON metricas_diarias(data);

-- Índices para metricas_por_setor (usando faculdade_id em vez de cliente_id)
CREATE INDEX IF NOT EXISTS idx_metricas_por_setor_data ON metricas_por_setor(data);

-- Índices para metricas_por_horario (usando faculdade_id em vez de cliente_id)
CREATE INDEX IF NOT EXISTS idx_metricas_por_horario_data ON metricas_por_horario(data);

-- Índices para metricas_demograficas (usando faculdade_id em vez de cliente_id)
CREATE INDEX IF NOT EXISTS idx_metricas_demograficas_data ON metricas_demograficas(data);