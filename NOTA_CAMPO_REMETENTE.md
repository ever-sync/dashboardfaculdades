# ⚠️ IMPORTANTE: Campo `remetente` na Tabela `mensagens`

## Problema Identificado

No fluxo n8n, o nó **"CRIAR MSG BOT"** está usando o campo incorreto:

```json
{
  "remetente_msg": "bot"  // ❌ ERRADO
}
```

## Campo Correto

A tabela `mensagens` usa o campo **`remetente`** (sem `_msg`):

```sql
remetente VARCHAR(10) CHECK (remetente IN ('usuario', 'agente', 'bot'))
```

## Correção Necessária no n8n

No nó **"CRIAR MSG BOT"** do fluxo n8n, alterar:

### ❌ ANTES (Incorreto)
```json
{
  "fieldId": "remetente_msg",
  "fieldValue": "bot"
}
```

### ✅ DEPOIS (Correto)
```json
{
  "fieldId": "remetente",
  "fieldValue": "bot"
}
```

## Valores Válidos

O campo `remetente` aceita apenas:
- `'usuario'` - Mensagens do cliente
- `'agente'` - Mensagens do atendente humano
- `'bot'` - Mensagens da IA/automação

## Impacto

Se usar `remetente_msg`:
- ❌ Mensagem não será salva corretamente
- ❌ Mensagem não aparecerá no app
- ❌ Realtime não funcionará

Se usar `remetente`:
- ✅ Mensagem salva corretamente
- ✅ Mensagem aparece no app
- ✅ Realtime funciona perfeitamente

## Verificação

Para verificar se está correto, execute no Supabase:

```sql
SELECT id, conteudo, remetente, created_at 
FROM mensagens 
WHERE remetente = 'bot' 
ORDER BY created_at DESC 
LIMIT 10;
```

Se retornar resultados, está correto. Se não retornar nada ou mostrar NULL, o campo está incorreto.

