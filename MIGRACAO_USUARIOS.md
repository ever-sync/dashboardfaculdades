# 🔧 Como Aplicar a Migration da Tabela `usuarios`

## Problema

O erro `Could not find the table 'public.usuarios' in the schema cache` ocorre porque a tabela `usuarios` ainda não foi criada no banco de dados Supabase.

## Solução

A migration já existe em `supabase/migrations/014_create_usuarios_table.sql`. Você precisa aplicá-la manualmente no Dashboard do Supabase.

### Opção 1: Via Dashboard do Supabase (Recomendado)

1. **Acesse o Dashboard do Supabase:**
   - Vá para: https://app.supabase.com
   - Selecione seu projeto

2. **Abra o SQL Editor:**
   - No menu lateral esquerdo, clique em **"SQL Editor"**
   - Clique em **"New query"**

3. **Execute o script:**
   - Abra o arquivo `supabase/migrations/014_create_usuarios_table.sql`
   - Copie todo o conteúdo
   - Cole no SQL Editor
   - Clique em **"Run"** ou pressione `Ctrl+Enter` (Windows/Linux) ou `Cmd+Enter` (Mac)

4. **Verifique se funcionou:**
   - Você deve ver uma mensagem de sucesso
   - A tabela `usuarios` agora estará disponível

### Opção 2: Via Script de Ajuda

Execute o script que mostra as instruções completas:

```bash
npx tsx scripts/apply-migration.ts 014_create_usuarios_table.sql
```

Este script mostrará:
- Instruções passo a passo
- O SQL completo para copiar e colar
- Link direto para o SQL Editor

### Opção 3: Via Supabase CLI (Avançado)

Se você tem o Supabase CLI instalado:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Fazer login
supabase login

# Aplicar migrations
supabase db push
```

## O que a Migration Cria

A migration `014_create_usuarios_table.sql` cria:

- ✅ Tabela `usuarios` com todos os campos necessários
- ✅ Índices para melhor performance
- ✅ Políticas RLS (Row Level Security)
- ✅ Funções auxiliares (atualizar carga de trabalho, buscar atendente disponível)
- ✅ Triggers para atualização automática
- ✅ Campo `atendente_id` na tabela `conversas_whatsapp` (se não existir)

## Verificação

Após aplicar a migration, você pode verificar se funcionou:

1. No Dashboard do Supabase, vá em **"Table Editor"**
2. Procure pela tabela `usuarios`
3. Ela deve aparecer na lista de tabelas

## Próximos Passos

Após aplicar a migration:

1. Recarregue a página de atendentes no dashboard
2. O erro não deve mais aparecer
3. Você poderá criar novos atendentes normalmente

## Problemas?

Se encontrar algum erro ao executar a migration:

- Verifique se você tem permissões de administrador no projeto Supabase
- Certifique-se de que a tabela `faculdades` já existe (a migration referencia ela)
- Verifique os logs de erro no SQL Editor do Supabase

