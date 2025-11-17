# Mudanças no Banco de Dados - Mensagens e Métricas

## Resumo das Alterações

Este documento descreve as mudanças realizadas no banco de dados para suportar o envio/recebimento de mensagens e o sistema de métricas diárias.

## 📋 Migrações Criadas

### 1. `004_add_metricas_tables_and_fields.sql`
- **Nova Tabela:** `codigos_atendimento` - Códigos especiais para controle de IA (#PAUSAR, #ATIVAR, #TRANS, #HUMANO)
- **Nova Tabela:** `metricas_demograficas` - Métricas por cidade e estado
- **Nova Tabela:** `metricas_por_setor` - Métricas por setor/departamento
- **Nova Tabela:** `metricas_por_horario` - Métricas por hora do dia

### 2. Campos Adicionados nas Tabelas Existentes

#### `conversas_whatsapp`
- `status_conversa` - Status da conversa ('ativa', 'pendente', 'encerrada')
- `prospect_id` - Referência ao prospect relacionado
- `duracao_segundos` - Duração da conversa em segundos
- `setor` - Setor responsável (sincronizado com `departamento`)
- `avaliacao_nota` - Nota de avaliação (0-5)

#### `prospects_academicos`
- `cidade` - Cidade do prospect
- `estado` - Estado do prospect

#### `metricas_diarias`
- `total_mensagens` - Total de mensagens (soma de enviadas + recebidas)
- `prospects_novos` - Novos prospects do dia
- `tempo_medio_resposta` - Tempo médio de resposta (compatível com `tempo_medio_primeira_resposta_segundos`)

## 📊 Estrutura das Novas Tabelas

### `codigos_atendimento`
```sql
- id (UUID, PK)
- nome (VARCHAR, UNIQUE) - Ex: '#PAUSAR', '#ATIVAR'
- descricao (TEXT)
- ativo (BOOLEAN)
- acao (VARCHAR) - 'pausar_ia', 'ativar_ia', 'transferir', 'solicitar_humano'
```

### `metricas_demograficas`
```sql
- id (UUID, PK)
- faculdade_id (UUID, FK)
- data (DATE)
- cidade (VARCHAR)
- estado (VARCHAR)
- total_prospects (INTEGER)
- total_matriculas (INTEGER)
- receita_estimada (DECIMAL)
UNIQUE(faculdade_id, data, cidade, estado)
```

### `metricas_por_setor`
```sql
- id (UUID, PK)
- faculdade_id (UUID, FK)
- data (DATE)
- setor (VARCHAR)
- total_atendimentos (INTEGER)
- atendimentos_finalizados (INTEGER)
- tempo_medio_atendimento (INTEGER)
- avaliacoes_positivas (INTEGER)
UNIQUE(faculdade_id, data, setor)
```

### `metricas_por_horario`
```sql
- id (UUID, PK)
- faculdade_id (UUID, FK)
- data (DATE)
- hora (INTEGER, 0-23)
- total_mensagens (INTEGER)
- total_conversas (INTEGER)
UNIQUE(faculdade_id, data, hora)
```

## 🔄 Script de Popularização

### `005_popular_metricas_diarias.sql` / `scripts/popular_metricas_diarias.sql`

Script para ser executado diariamente que:
1. Insere códigos de atendimento (setup inicial)
2. Popula métricas demográficas por cidade/estado
3. Popula métricas diárias gerais
4. Popula métricas por horário
5. Popula métricas por setor

**Observações importantes:**
- O script usa `ON CONFLICT` para atualizar registros existentes
- Calcula `mensagens_enviadas` e `mensagens_recebidas` baseado no campo `remetente` da tabela `mensagens`
- Usa `status_academico` (não `status`) na tabela `prospects_academicos`
- Sincroniza campos compatíveis (ex: `status_conversa` com `status`)

## 📝 Atualizações nos Tipos TypeScript

### `src/types/supabase.ts`

Atualizado com:
- Novos campos em `ConversaWhatsApp`
- Novos campos em `Prospect` (incluindo `cidade`, `estado`, `curso`, `turno`)
- Novos campos em `MetricaDiaria`
- Novas interfaces: `CodigoAtendimento`, `MetricaDemografica`, `MetricaPorSetor`, `MetricaPorHorario`

## ⚠️ Notas Importantes

1. **Compatibilidade:** Os scripts foram ajustados para funcionar com a estrutura existente
2. **Sincronização:** Campos antigos e novos são sincronizados automaticamente (ex: `status` e `status_conversa`)
3. **Mensagens Enviadas/Recebidas:** Calculadas automaticamente baseado no campo `remetente`:
   - Enviadas: `remetente IN ('agente', 'bot')`
   - Recebidas: `remetente = 'usuario'`
4. **Constraint UNIQUE:** Ajustada para suportar registros sem `departamento`

## 🚀 Como Aplicar

1. Execute a migração `004_add_metricas_tables_and_fields.sql` uma vez
2. Execute o script `005_popular_metricas_diarias.sql` diariamente (ou configure um cron job)
3. Atualize as interfaces TypeScript conforme necessário

## 📌 Próximos Passos

- Configurar agendamento para execução diária do script de métricas
- Criar visualizações no dashboard para as novas métricas
- Implementar triggers para atualização automática de métricas

