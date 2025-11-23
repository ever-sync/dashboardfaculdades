# Isolamento de Dados - Row Level Security (RLS)

## Problema
Novos usuários estavam vendo dados de demonstração de outros usuários porque não havia isolamento adequado de dados.

## Solução
Implementamos **Row Level Security (RLS)** em todas as tabelas do banco de dados para garantir que cada usuário veja apenas seus próprios dados.

## Como Aplicar

### 1. Executar a Migração

```bash
# Via Supabase CLI (recomendado)
npx supabase db push

# OU via SQL direto no Supabase Dashboard
# Copie e cole o conteúdo de: supabase/migrations/027_complete_rls_isolation.sql
```

### 2. Verificar Políticas RLS

No Supabase Dashboard:
1. Vá em **Database** → **Tables**
2. Selecione qualquer tabela (ex: `faculdades`)
3. Clique na aba **Policies**
4. Verifique se as políticas estão ativas

### 3. Atribuir Faculdades aos Usuários

Cada faculdade precisa ter um `admin_id` associado. Para faculdades existentes sem dono:

```sql
-- Atribuir todas as faculdades ao primeiro usuário admin
UPDATE faculdades 
SET admin_id = (
  SELECT id FROM profiles 
  WHERE role = 'admin' 
  LIMIT 1
)
WHERE admin_id IS NULL;
```

### 4. Criar Novo Usuário de Teste

1. Faça logout do usuário atual
2. Crie uma nova conta
3. Faça login com a nova conta
4. Verifique que o dashboard está vazio (sem dados de outros usuários)

## Estrutura de Permissões

### Roles
- **super_admin**: Acesso total a todos os dados
- **admin**: Acesso apenas às suas próprias faculdades e dados relacionados
- **agent**: Acesso limitado (futuro)

### Políticas Implementadas

Todas as tabelas agora têm políticas RLS:
- ✅ `faculdades` - Admin vê apenas suas faculdades
- ✅ `conversas_whatsapp` - Filtra por faculdade_id
- ✅ `mensagens` - Filtra por conversa → faculdade
- ✅ `prospects` - Filtra por faculdade_id
- ✅ `metricas_diarias` - Filtra por faculdade_id
- ✅ `cursos` - Filtra por faculdade_id
- ✅ `agentes_ia` - Filtra por faculdade_id
- ✅ `base_conhecimento` - Filtra por faculdade_id
- ✅ E todas as outras tabelas...

## Funções Helper

### `user_owns_faculdade(faculdade_uuid)`
Verifica se o usuário autenticado é dono da faculdade.

### `is_super_admin()`
Verifica se o usuário autenticado é super admin.

## Troubleshooting

### Usuário não vê nenhum dado
**Causa**: O usuário não tem nenhuma faculdade associada.

**Solução**: 
1. Crie uma nova faculdade pelo dashboard
2. Ou atribua uma faculdade existente ao usuário:
```sql
UPDATE faculdades 
SET admin_id = 'USER_UUID_AQUI'
WHERE id = 'FACULDADE_UUID_AQUI';
```

### Erro "new row violates row-level security policy"
**Causa**: Tentando inserir dados sem `faculdade_id` ou com `faculdade_id` que não pertence ao usuário.

**Solução**: Sempre use o `faculdade_id` da faculdade selecionada no contexto.

## Próximos Passos

1. ✅ RLS implementado
2. ⏳ Adicionar role `agent` com permissões limitadas
3. ⏳ Implementar compartilhamento de faculdades entre usuários
4. ⏳ Adicionar auditoria de acessos
