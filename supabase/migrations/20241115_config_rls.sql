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
CREATE POLICY "Users can view their own conversations" ON conversas_whatsapp
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own conversations" ON conversas_whatsapp
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own conversations" ON conversas_whatsapp
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for prospects_academicos
CREATE POLICY "Users can view their own prospects" ON prospects_academicos
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own prospects" ON prospects_academicos
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own prospects" ON prospects_academicos
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for sessoes_atendimento
CREATE POLICY "Users can view their own sessions" ON sessoes_atendimento
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own sessions" ON sessoes_atendimento
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own sessions" ON sessoes_atendimento
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for transferencias_setores
CREATE POLICY "Users can view their own transfers" ON transferencias_setores
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own transfers" ON transferencias_setores
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own transfers" ON transferencias_setores
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for metricas_diarias
CREATE POLICY "Users can view their own daily metrics" ON metricas_diarias
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own daily metrics" ON metricas_diarias
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own daily metrics" ON metricas_diarias
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for metricas_por_setor
CREATE POLICY "Users can view their own sector metrics" ON metricas_por_setor
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own sector metrics" ON metricas_por_setor
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own sector metrics" ON metricas_por_setor
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for metricas_por_horario
CREATE POLICY "Users can view their own hourly metrics" ON metricas_por_horario
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own hourly metrics" ON metricas_por_horario
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own hourly metrics" ON metricas_por_horario
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- RLS Policies for metricas_demograficas
CREATE POLICY "Users can view their own demographic metrics" ON metricas_demograficas
    FOR SELECT
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own demographic metrics" ON metricas_demograficas
    FOR INSERT
    WITH CHECK (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

CREATE POLICY "Users can update their own demographic metrics" ON metricas_demograficas
    FOR UPDATE
    USING (
        cliente_id = (
            SELECT id FROM auth.users WHERE auth.uid() = auth.uid()
        )
    );

-- Grant permissions to anon and authenticated roles
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO anon;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO anon;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO anon;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Create indexes for better performance
CREATE INDEX idx_conversas_whatsapp_cliente_id ON conversas_whatsapp(cliente_id);
CREATE INDEX idx_conversas_whatsapp_telefone ON conversas_whatsapp(telefone);
CREATE INDEX idx_conversas_whatsapp_data_hora ON conversas_whatsapp(data_hora);
CREATE INDEX idx_conversas_whatsapp_active ON conversas_whatsapp(active);

CREATE INDEX idx_prospects_academicos_cliente_id ON prospects_academicos(cliente_id);
CREATE INDEX idx_prospects_academicos_telefone ON prospects_academicos(telefone);
CREATE INDEX idx_prospects_academicos_status ON prospects_academicos(status);
CREATE INDEX idx_prospects_academicos_etapa_funil ON prospects_academicos(etapa_funil);

CREATE INDEX idx_sessoes_atendimento_cliente_id ON sessoes_atendimento(cliente_id);
CREATE INDEX idx_sessoes_atendimento_telefone ON sessoes_atendimento(telefone);
CREATE INDEX idx_sessoes_atendimento_status ON sessoes_atendimento(status);

CREATE INDEX idx_transferencias_setores_cliente_id ON transferencias_setores(cliente_id);
CREATE INDEX idx_transferencias_setores_telefone ON transferencias_setores(telefone);
CREATE INDEX idx_transferencias_setores_status ON transferencias_setores(status);

CREATE INDEX idx_metricas_diarias_cliente_id ON metricas_diarias(cliente_id);
CREATE INDEX idx_metricas_diarias_data ON metricas_diarias(data);

CREATE INDEX idx_metricas_por_setor_cliente_id ON metricas_por_setor(cliente_id);
CREATE INDEX idx_metricas_por_setor_data ON metricas_por_setor(data);

CREATE INDEX idx_metricas_por_horario_cliente_id ON metricas_por_horario(cliente_id);
CREATE INDEX idx_metricas_por_horario_data ON metricas_por_horario(data);

CREATE INDEX idx_metricas_demograficas_cliente_id ON metricas_demograficas(cliente_id);
CREATE INDEX idx_metricas_demograficas_data ON metricas_demograficas(data);