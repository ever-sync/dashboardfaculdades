-- ============================================================================
-- RBAC (Role-Based Access Control) Database Schema
-- ============================================================================
-- This migration creates the necessary tables for implementing role-based
-- access control in the dashboard application.
-- ============================================================================

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(100) NOT NULL UNIQUE,
  descricao TEXT,
  recurso VARCHAR(100) NOT NULL, -- e.g., 'conversas', 'prospects', 'relatorios'
  acao VARCHAR(50) NOT NULL, -- e.g., 'read', 'write', 'delete', 'export'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create role_permissions junction table (many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Create user_roles junction table (many-to-many)
-- Users can have different roles in different faculdades
CREATE TABLE IF NOT EXISTS user_roles (
  user_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  faculdade_id UUID REFERENCES faculdades(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id, faculdade_id)
);

-- ============================================================================
-- Insert Default Roles
-- ============================================================================

INSERT INTO roles (nome, descricao) VALUES
  ('admin', 'Administrador com acesso total ao sistema'),
  ('gerente', 'Gerente com acesso a relatórios, configurações e gestão de equipe'),
  ('atendente', 'Atendente com acesso a conversas e prospects'),
  ('visualizador', 'Apenas visualização de dados, sem permissões de edição')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================================
-- Insert Default Permissions
-- ============================================================================

INSERT INTO permissions (nome, descricao, recurso, acao) VALUES
  -- Conversas permissions
  ('conversas.read', 'Visualizar conversas', 'conversas', 'read'),
  ('conversas.write', 'Criar e editar conversas', 'conversas', 'write'),
  ('conversas.delete', 'Deletar conversas', 'conversas', 'delete'),
  ('conversas.export', 'Exportar conversas', 'conversas', 'export'),
  ('conversas.assign', 'Atribuir conversas a atendentes', 'conversas', 'assign'),
  ('conversas.transfer', 'Transferir conversas entre atendentes', 'conversas', 'transfer'),
  
  -- Prospects permissions
  ('prospects.read', 'Visualizar prospects', 'prospects', 'read'),
  ('prospects.write', 'Criar e editar prospects', 'prospects', 'write'),
  ('prospects.delete', 'Deletar prospects', 'prospects', 'delete'),
  ('prospects.export', 'Exportar prospects', 'prospects', 'export'),
  
  -- Relatórios permissions
  ('relatorios.read', 'Visualizar relatórios', 'relatorios', 'read'),
  ('relatorios.export', 'Exportar relatórios', 'relatorios', 'export'),
  
  -- Faculdades permissions
  ('faculdades.read', 'Visualizar faculdades', 'faculdades', 'read'),
  ('faculdades.write', 'Criar e editar faculdades', 'faculdades', 'write'),
  ('faculdades.delete', 'Deletar faculdades', 'faculdades', 'delete'),
  ('faculdades.manage', 'Gerenciar configurações de faculdades', 'faculdades', 'manage'),
  
  -- Usuários permissions
  ('usuarios.read', 'Visualizar usuários', 'usuarios', 'read'),
  ('usuarios.write', 'Criar e editar usuários', 'usuarios', 'write'),
  ('usuarios.delete', 'Deletar usuários', 'usuarios', 'delete'),
  ('usuarios.manage', 'Gerenciar permissões de usuários', 'usuarios', 'manage'),
  
  -- Configurações permissions
  ('configuracoes.read', 'Visualizar configurações', 'configuracoes', 'read'),
  ('configuracoes.write', 'Editar configurações', 'configuracoes', 'write'),
  
  -- WhatsApp/Evolution API permissions
  ('whatsapp.read', 'Visualizar configurações do WhatsApp', 'whatsapp', 'read'),
  ('whatsapp.write', 'Configurar instâncias do WhatsApp', 'whatsapp', 'write'),
  ('whatsapp.send', 'Enviar mensagens via WhatsApp', 'whatsapp', 'send'),
  
  -- Disparo em massa permissions
  ('disparo.read', 'Visualizar campanhas de disparo', 'disparo', 'read'),
  ('disparo.write', 'Criar e editar campanhas de disparo', 'disparo', 'write'),
  ('disparo.send', 'Enviar disparos em massa', 'disparo', 'send')
ON CONFLICT (nome) DO NOTHING;

-- ============================================================================
-- Assign Permissions to Roles
-- ============================================================================

-- Admin role: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE nome = 'admin'),
  id
FROM permissions
ON CONFLICT DO NOTHING;

-- Gerente role: read/write/export for most resources, no delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE nome = 'gerente'),
  id
FROM permissions
WHERE acao IN ('read', 'write', 'export', 'assign', 'transfer', 'send', 'manage')
  AND nome NOT LIKE '%.delete'
ON CONFLICT DO NOTHING;

-- Atendente role: read/write conversas and prospects, read relatorios
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE nome = 'atendente'),
  id
FROM permissions
WHERE 
  (recurso IN ('conversas', 'prospects') AND acao IN ('read', 'write', 'assign'))
  OR (recurso = 'relatorios' AND acao = 'read')
  OR (recurso = 'whatsapp' AND acao IN ('read', 'send'))
ON CONFLICT DO NOTHING;

-- Visualizador role: only read permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 
  (SELECT id FROM roles WHERE nome = 'visualizador'),
  id
FROM permissions
WHERE acao = 'read'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_faculdade_id ON user_roles(faculdade_id);
CREATE INDEX IF NOT EXISTS idx_permissions_recurso_acao ON permissions(recurso, acao);

-- ============================================================================
-- Create Helper Functions
-- ============================================================================

-- Function to check if a user has a specific permission in a faculdade
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_name VARCHAR,
  p_faculdade_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND ur.faculdade_id = p_faculdade_id
      AND p.nome = p_permission_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all permissions for a user in a faculdade
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_faculdade_id UUID
)
RETURNS TABLE(permission_name VARCHAR, recurso VARCHAR, acao VARCHAR) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.nome, p.recurso, p.acao
  FROM user_roles ur
  JOIN role_permissions rp ON ur.role_id = rp.role_id
  JOIN permissions p ON rp.permission_id = p.id
  WHERE ur.user_id = p_user_id
    AND ur.faculdade_id = p_faculdade_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Policies for roles table (only admins can modify)
CREATE POLICY "Anyone can view roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Only admins can insert roles" ON roles FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.nome = 'usuarios.manage'
  )
);

-- Policies for permissions table (read-only for most users)
CREATE POLICY "Anyone can view permissions" ON permissions FOR SELECT USING (true);

-- Policies for user_roles table
CREATE POLICY "Users can view their own roles" ON user_roles FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.nome = 'usuarios.manage'
  )
);

CREATE POLICY "Only admins can manage user roles" ON user_roles FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = auth.uid()
      AND p.nome = 'usuarios.manage'
  )
);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE roles IS 'Defines user roles in the system';
COMMENT ON TABLE permissions IS 'Defines granular permissions for resources and actions';
COMMENT ON TABLE role_permissions IS 'Maps permissions to roles (many-to-many)';
COMMENT ON TABLE user_roles IS 'Assigns roles to users per faculdade (many-to-many)';

COMMENT ON FUNCTION user_has_permission IS 'Checks if a user has a specific permission in a faculdade';
COMMENT ON FUNCTION get_user_permissions IS 'Returns all permissions for a user in a faculdade';
