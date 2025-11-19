# 📋 Guia de Execução de Migrações

## ❓ Preciso executar todos os SQLs manualmente?

**NÃO!** O Supabase gerencia as migrações automaticamente. Você tem 3 opções:

---

## 🎯 Opção 1: Via Supabase Dashboard (Mais Fácil)

### Passo 1: Acessar o Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto

### Passo 2: Abrir SQL Editor
1. No menu lateral, clique em **"SQL Editor"**
2. Clique em **"New query"**

### Passo 3: Executar Migrações
Você pode executar todas as migrações de uma vez ou uma por uma:

#### Executar todas de uma vez:
1. Copie o conteúdo de cada arquivo SQL na ordem:
   - `002_create_tables_pt.sql`
   - `003_create_faculdades_table.sql`
   - `004_add_metricas_tables_and_fields.sql`
   - ... (e assim por diante)
2. Cole tudo no SQL Editor
3. Clique em **"Run"**

#### Executar uma por uma (recomendado):
Execute cada arquivo na ordem numérica, um de cada vez.

---

## 🚀 Opção 2: Via Supabase CLI (Avançado)

Se você tem o Supabase CLI instalado:

### Instalar Supabase CLI no Windows:

**Opção A - Via Scoop (Recomendado):**
```powershell
# Instalar Scoop (se não tiver)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
Invoke-RestMethod -Uri https://get.scoop.sh | Invoke-Expression

# Instalar Supabase CLI
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Opção B - Via Chocolatey:**
```powershell
# Instalar Chocolatey (se não tiver)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Instalar Supabase CLI
choco install supabase
```

**Opção C - Via Winget (Windows 10/11):**
```powershell
winget install --id=Supabase.CLI
```

**Opção D - Baixar binário diretamente:**
1. Acesse: https://github.com/supabase/cli/releases
2. Baixe o arquivo `.exe` para Windows
3. Adicione ao PATH do sistema

### Usar o Supabase CLI:

```powershell
# Fazer login
supabase login

# Vincular ao projeto
supabase link --project-ref seu-project-ref

# Aplicar todas as migrações
supabase db push
```

---

## ⚠️ Opção 3: Executar Manualmente (Não Recomendado)

Se preferir executar manualmente, siga esta ordem:

### Ordem de Execução (Importante!)

1. ✅ `002_create_tables_pt.sql` - Tabelas principais
2. ✅ `003_create_faculdades_table.sql` - Tabela de faculdades
3. ✅ `004_add_metricas_tables_and_fields.sql` - Campos de métricas
4. ✅ `005_popular_metricas_diarias.sql` - Dados de exemplo (opcional)
5. ✅ `006_create_agentes_ia_table.sql` - Agentes IA
6. ✅ `007_add_prospects_columns.sql` - Campos de prospects
7. ✅ `008_add_setor_to_agentes_ia.sql` - Campo setor
8. ✅ `009_create_cursos_table.sql` - Tabela de cursos
9. ✅ `010_create_base_conhecimento_table.sql` - Base de conhecimento
10. ✅ `011_add_campos_cursos.sql` - Campos de cursos
11. ✅ `012_add_categoria_cursos.sql` - Categoria de cursos
12. ✅ `013_fix_rls_policies.sql` - Políticas RLS
13. ✅ `014_create_usuarios_table.sql` - Tabela de usuários
14. ✅ `015_create_typing_indicators.sql` - Indicadores de digitação
15. ✅ `016_add_anotacoes_to_conversas.sql` - Anotações
16. ✅ `017_add_tags_predefinidas_table.sql` - Tags predefinidas
17. ✅ `018_add_bloqueado_to_conversas.sql` - Campo bloqueado
18. ✅ `019_create_mensagens_agendadas_table.sql` - Mensagens agendadas
19. ✅ `020_add_evolution_api_to_faculdades.sql` - Evolution API
20. ✅ `021_configure_rls_isolation.sql` - Isolamento RLS
21. ✅ `022_remove_evolution_api_key_url_from_faculdades.sql` - Remover campos
22. ✅ `023_create_configuracoes_globais_table.sql` - Configurações globais
23. ✅ `024_create_crm_and_conversas_tables.sql` - Tabelas CRM
24. ✅ `025_fix_mensagens_columns.sql` - Correção de colunas
25. ⚠️ `20241115_config_rls.sql` - Configuração RLS (pode ter conflitos)

---

## ✅ Como Verificar se as Migrações Foram Aplicadas

### No Supabase Dashboard:
1. Vá em **"Database"** → **"Tables"**
2. Verifique se as tabelas existem:
   - `faculdades`
   - `conversas_whatsapp`
   - `mensagens`
   - `prospects_academicos`
   - `negociacoes`
   - `etiquetas`
   - `funis_vendas`
   - etc.

### Via SQL:
```sql
-- Ver todas as tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

---

## 🚨 Problemas Comuns

### Erro: "relation already exists"
- A tabela já foi criada. Pule essa migração ou use `DROP TABLE IF EXISTS` antes.

### Erro: "column already exists"
- A coluna já existe. A migração usa `ADD COLUMN IF NOT EXISTS`, então pode ignorar.

### Erro: "trigger already exists"
- ✅ **JÁ CORRIGIDO!** As migrações agora usam `DROP TRIGGER IF EXISTS` antes de criar.

### Erro: "policy already exists"
- A política RLS já existe. As migrações usam `DROP POLICY IF EXISTS`, então pode ignorar.

---

## 💡 Recomendação

**Use a Opção 1 (Supabase Dashboard)** - É a mais simples e você pode ver os erros em tempo real.

1. Abra o SQL Editor no Dashboard
2. Execute as migrações na ordem numérica
3. Se der erro, leia a mensagem e ajuste se necessário
4. Continue com a próxima migração

---

## 📝 Nota Importante

As migrações foram corrigidas para serem **idempotentes** (podem ser executadas múltiplas vezes sem erro). Elas usam:
- `CREATE TABLE IF NOT EXISTS`
- `ADD COLUMN IF NOT EXISTS`
- `DROP TRIGGER IF EXISTS`
- `DROP POLICY IF EXISTS`

Isso significa que você pode executar todas de uma vez sem se preocupar com duplicatas!

---

**Boa sorte! 🚀**

