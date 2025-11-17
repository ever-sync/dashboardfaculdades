-- ========================================
-- MIGRAÇÃO: Adicionar campo setor em agentes_ia
-- Data: 2024-11-XX
-- Descrição: Adiciona campo setor para categorizar agentes por departamento
-- ========================================

-- Adicionar campo setor
ALTER TABLE agentes_ia
ADD COLUMN IF NOT EXISTS setor VARCHAR(100) CHECK (setor IN ('Suporte', 'Vendas', 'Atendimento'));

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_agentes_setor ON agentes_ia(setor);

-- Atualizar constraint UNIQUE para incluir setor (se necessário)
-- Permite múltiplos agentes com mesmo nome mas de setores diferentes na mesma faculdade
ALTER TABLE agentes_ia
DROP CONSTRAINT IF EXISTS nome_faculdade_unique;

CREATE UNIQUE INDEX IF NOT EXISTS agentes_nome_faculdade_setor_unique 
ON agentes_ia(faculdade_id, nome, COALESCE(setor, ''));

