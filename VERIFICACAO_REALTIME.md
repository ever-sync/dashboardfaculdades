# ✅ Verificação: Mensagens com remetente='bot' em Tempo Real

## Status: ✅ Configurado Corretamente

O sistema está configurado para exibir mensagens com `remetente='bot'` em tempo real no app.

## Como Funciona

### 1. Hook useMensagens
**Arquivo**: `src/hooks/useMensagens.ts`

- ✅ Busca **todas** as mensagens da conversa (sem filtrar por remetente)
- ✅ Inclui mensagens com `remetente='bot'`
- ✅ Ordena por `timestamp` ou `created_at`

```typescript
// Linha 40-44
let { data, error: dataError } = await supabase
  .from('mensagens')
  .select('*')
  .eq('conversa_id', conversaId)
  .order('timestamp', { ascending: true })
```

### 2. Realtime Subscription
**Arquivo**: `src/hooks/useMensagens.ts` (linhas 345-369)

- ✅ Escuta **todas** as mudanças na tabela `mensagens`
- ✅ Filtra por `conversa_id` apenas
- ✅ Não filtra por `remetente`
- ✅ Atualiza automaticamente quando nova mensagem é inserida

```typescript
const channel = supabase
  .channel(`mensagens:${conversaId}`)
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'mensagens',
      filter: `conversa_id=eq.${conversaId}`, // Apenas filtra por conversa
    },
    (payload) => {
      fetchMensagens() // Recarrega todas as mensagens
    }
  )
  .subscribe()
```

### 3. Interface do App
**Arquivo**: `app/dashboard/conversas/page.tsx`

- ✅ Exibe mensagens com `remetente='bot'`
- ✅ Identifica visualmente mensagens da IA
- ✅ Mostra ícone/estilo diferente para mensagens de bot

## Fluxo Completo

1. **n8n gera resposta da IA**
   - Salva em `mensagens` com `remetente='bot'`
   - Chama `/api/n8n/mensagem-ia` (opcional, para garantir sincronização)

2. **Supabase Realtime detecta mudança**
   - Evento `INSERT` na tabela `mensagens`
   - Filtra por `conversa_id`

3. **Hook useMensagens recebe notificação**
   - Chama `fetchMensagens()`
   - Recarrega todas as mensagens da conversa

4. **Interface atualiza automaticamente**
   - Nova mensagem aparece na tela
   - Sem necessidade de recarregar página

## Teste Manual

Para testar se está funcionando:

1. Abra uma conversa no app
2. No n8n, faça a IA responder (ou chame `/api/n8n/mensagem-ia` diretamente)
3. A mensagem deve aparecer automaticamente na interface
4. Não é necessário recarregar a página

## Possíveis Problemas

### Mensagem não aparece
- ❌ Verificar se campo é `remetente` (não `remetente_msg`)
- ❌ Verificar se `remetente='bot'` (não outro valor)
- ❌ Verificar se `conversa_id` está correto
- ❌ Verificar se Realtime está habilitado no Supabase

### Realtime não funciona
- Verificar configuração do Supabase
- Verificar se RLS (Row Level Security) permite leitura
- Verificar conexão WebSocket no navegador

## Conclusão

✅ **Sistema está pronto para exibir mensagens da IA em tempo real**

Apenas certifique-se de que:
1. n8n usa campo `remetente` (não `remetente_msg`)
2. n8n salva com `remetente='bot'`
3. Realtime está habilitado no Supabase

