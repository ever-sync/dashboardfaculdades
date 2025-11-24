-- Script to assign a faculty to the test user
-- Run this in Supabase SQL Editor

-- This will create a new faculty for admin@unifatecie.com.br
INSERT INTO faculdades (nome, admin_id, plano, status)
SELECT 
  'Minha Faculdade Teste' as nome,
  id as admin_id,
  'basico' as plano,
  'ativo' as status
FROM auth.users 
WHERE email = 'admin@unifatecie.com.br'
RETURNING *;
