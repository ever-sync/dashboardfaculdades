-- ========================================
-- ADICIONAR NOVAS COLUNAS - prospects_academicos
-- ========================================

ALTER TABLE prospects_academicos

-- Tipo de prospect
ADD COLUMN IF NOT EXISTS tipo_prospect VARCHAR CHECK (tipo_prospect IN ('aluno', 'nao_aluno', 'ex_aluno')),

-- Dados pessoais completos
ADD COLUMN IF NOT EXISTS nome_completo VARCHAR,
ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),  -- 000.000.000-00
ADD COLUMN IF NOT EXISTS data_nascimento DATE,

-- Já existe email, só garantir
-- ADD COLUMN IF NOT EXISTS email VARCHAR,  -- JÁ EXISTE

-- Já existe telefone como whatsapp
-- ADD COLUMN IF NOT EXISTS whatsapp VARCHAR,  -- JÁ EXISTE (usar 'telefone')

-- Endereço completo
ADD COLUMN IF NOT EXISTS cep VARCHAR(9),  -- 00000-000
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS numero VARCHAR,
ADD COLUMN IF NOT EXISTS complemento VARCHAR,
ADD COLUMN IF NOT EXISTS bairro VARCHAR,
ADD COLUMN IF NOT EXISTS municipio VARCHAR,

-- Já existe cidade e estado
-- ADD COLUMN IF NOT EXISTS cidade VARCHAR,  -- JÁ EXISTE
-- ADD COLUMN IF NOT EXISTS estado VARCHAR,  -- JÁ EXISTE

-- Curso pretendido
ADD COLUMN IF NOT EXISTS curso_pretendido VARCHAR,

-- Data de pagamento
ADD COLUMN IF NOT EXISTS data_pagamento INTEGER CHECK (data_pagamento IN (5, 7, 10));

-- ========================================
-- CRIAR ÍNDICES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_prospects_cpf 
ON prospects_academicos(cpf);

CREATE INDEX IF NOT EXISTS idx_prospects_tipo 
ON prospects_academicos(tipo_prospect);

CREATE INDEX IF NOT EXISTS idx_prospects_data_nascimento 
ON prospects_academicos(data_nascimento);

CREATE INDEX IF NOT EXISTS idx_prospects_cep 
ON prospects_academicos(cep);

-- ========================================
-- CONSTRAINT: CPF único
-- ========================================

-- Remover índice se já existir e criar novamente
DROP INDEX IF EXISTS prospects_cpf_unique;

CREATE UNIQUE INDEX prospects_cpf_unique 
ON prospects_academicos(cpf) 
WHERE cpf IS NOT NULL;

-- ========================================
-- VALIDAR
-- ========================================

SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'prospects_academicos'
  AND column_name IN (
      'tipo_prospect',
      'nome_completo',
      'cpf',
      'data_nascimento',
      'email',
      'telefone',
      'cep',
      'endereco',
      'numero',
      'complemento',
      'bairro',
      'municipio',
      'cidade',
      'estado',
      'curso_pretendido',
      'data_pagamento'
  )
ORDER BY column_name;

