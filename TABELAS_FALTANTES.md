# Tabelas do Banco de Dados - Status

## ✅ Tabelas que JÁ EXISTEM (com migrações criadas)

1. **faculdades** - Migração: `003_create_faculdades_table.sql`
2. **conversas_whatsapp** - Migração: `002_create_tables_pt.sql`
3. **mensagens** - Migração: `002_create_tables_pt.sql`
4. **prospects_academicos** - Migração: `002_create_tables_pt.sql`
5. **metricas_diarias** - Migração: `002_create_tables_pt.sql`
6. **transferencias_setores** - Migração: `002_create_tables_pt.sql`
7. **usuarios** - Migração: `014_create_usuarios_table.sql`
8. **agentes_ia** - Migração: `006_create_agentes_ia_table_complete.sql`
9. **cursos** - Migração: `009_create_cursos_table.sql`
10. **base_conhecimento** - Migração: `010_create_base_conhecimento_table.sql`
11. **mensagens_agendadas** - Migração: `019_create_mensagens_agendadas_table.sql`
12. **configuracoes_globais** - Migração: `023_create_configuracoes_globais_table.sql`
13. **etiquetas** - Migração: `024_create_crm_and_conversas_tables.sql`
14. **configuracoes_conversas** - Migração: `024_create_crm_and_conversas_tables.sql`
15. **funis_vendas** - Migração: `024_create_crm_and_conversas_tables.sql`
16. **contatos** - Migração: `024_create_crm_and_conversas_tables.sql`
17. **empresas** - Migração: `024_create_crm_and_conversas_tables.sql`
18. **negociacoes** - Migração: `024_create_crm_and_conversas_tables.sql`
19. **tarefas** - Migração: `024_create_crm_and_conversas_tables.sql`
20. **typing_indicators** - Migração: `015_create_typing_indicators.sql`

## ⚠️ Tabelas que PODEM NÃO EXISTIR (migrações criadas mas podem não ter sido executadas)

### 1. **typing_indicators**
- **Migração:** `015_create_typing_indicators.sql`
- **Status:** Migração existe, mas erros 404 indicam que pode não ter sido executada
- **Uso:** Sistema de indicadores de digitação em tempo real
- **Função RPC:** `atualizar_typing_indicator` (também precisa ser criada)

### 2. **configuracoes_conversas**
- **Migração:** `024_create_crm_and_conversas_tables.sql`
- **Status:** Migração existe, mas erros 404 indicam que pode não ter sido executada
- **Uso:** Configurações de conversas por faculdade (página de Ajustes)

## 🔴 Tabelas OPCIONAIS (referenciadas no código mas não críticas)

### 1. **chats**
- **Status:** Não há migração criada
- **Uso:** Integração opcional com n8n (sistema externo)
- **Impacto:** Baixo - código já trata a ausência com try/catch
- **Localização:** `app/api/whatsapp/send/route.ts`, `app/api/n8n/mensagem-ia/route.ts`

### 2. **chat_messages**
- **Status:** Não há migração criada
- **Uso:** Integração opcional com n8n (sistema externo)
- **Impacto:** Baixo - código já trata a ausência com try/catch
- **Localização:** `app/api/whatsapp/send/route.ts`, `app/api/n8n/mensagem-ia/route.ts`

## 📋 Colunas que PODEM FALTAR em tabelas existentes

### Tabela: **mensagens**
- **Coluna `timestamp`**: 
  - ✅ Definida na migração `002_create_tables_pt.sql` (linha 46)
  - ⚠️ Erros indicam que pode não existir no banco atual
  - **Solução:** Verificar se a migração foi executada ou adicionar coluna manualmente

- **Coluna `lida`**: 
  - ✅ Definida na migração `002_create_tables_pt.sql` (linha 47)
  - ⚠️ Erros indicam que pode não existir no banco atual
  - **Solução:** Verificar se a migração foi executada ou adicionar coluna manualmente

## 🎯 AÇÕES RECOMENDADAS

### Prioridade ALTA:
1. **Executar migração `015_create_typing_indicators.sql`** para criar:
   - Tabela `typing_indicators`
   - Função RPC `atualizar_typing_indicator`
   - Função `limpar_typing_expirados`

2. **Executar migração `024_create_crm_and_conversas_tables.sql`** para criar:
   - Tabela `configuracoes_conversas`
   - Todas as tabelas do CRM (se ainda não foram criadas)

3. **Executar migração `025_fix_mensagens_columns.sql`** para adicionar:
   - Coluna `timestamp` na tabela `mensagens` (se não existir)
   - Coluna `lida` na tabela `mensagens` (se não existir)
   - Índice para `timestamp`
   
   **OU executar manualmente:**
   ```sql
   -- Verificar se existem
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'mensagens' 
   AND column_name IN ('timestamp', 'lida');
   
   -- Se não existirem, adicionar:
   ALTER TABLE mensagens 
   ADD COLUMN IF NOT EXISTS timestamp TIMESTAMPTZ DEFAULT NOW();
   
   ALTER TABLE mensagens 
   ADD COLUMN IF NOT EXISTS lida BOOLEAN DEFAULT FALSE;
   ```

### Prioridade BAIXA (Opcional):
4. **Criar tabelas para integração n8n** (se necessário):
   - `chats`
   - `chat_messages`
   - Estas são opcionais e o código funciona sem elas

## 📝 NOTA IMPORTANTE

As migrações estão criadas, mas podem não ter sido executadas no banco de dados. Verifique:
1. Se as migrações foram aplicadas no Supabase
2. Se há algum erro ao executar as migrações
3. Se as políticas RLS foram configuradas corretamente

