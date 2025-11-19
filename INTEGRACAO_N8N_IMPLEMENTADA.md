# Integração App com n8n/Evolution API - Implementação Completa

## Resumo

A integração foi implementada com sucesso! Agora o app pode enviar mensagens para o WhatsApp através da Evolution API, e as mensagens são sincronizadas com as tabelas do n8n para manter histórico unificado.

## O que foi implementado

### 1. Hook useMensagens Atualizado
**Arquivo**: `src/hooks/useMensagens.ts`

- ✅ Adicionado estado `isSending` para feedback visual
- ✅ Integração com `/api/whatsapp/send` após salvar mensagem no banco
- ✅ Tratamento de erros: mensagem é salva mesmo se envio via WhatsApp falhar
- ✅ Envio apenas para mensagens de agente (não para mensagens do cliente)

### 2. API /api/whatsapp/send Melhorada
**Arquivo**: `app/api/whatsapp/send/route.ts`

- ✅ Sincronização com tabela `chats` (formato n8n)
- ✅ Sincronização com tabela `chat_messages` (formato n8n)
- ✅ Normalização de telefone para diferentes formatos:
  - Evolution API: apenas números (ex: `5512981092776`)
  - Tabelas n8n: com sufixo (ex: `5512981092776@s.whatsapp.net`)
- ✅ Tratamento de erros: sincronização não falha o envio se tabelas não existirem

### 3. Interface de Usuário Atualizada
**Arquivo**: `app/dashboard/conversas/page.tsx`

- ✅ Botão de enviar desabilitado durante envio (`isSending`)
- ✅ Indicador visual de carregamento (spinner) durante envio
- ✅ Tratamento de erros melhorado (não mostra alert se mensagem foi salva)

## Fluxo Completo

1. **Atendente digita mensagem no app**
   - Mensagem aparece na interface imediatamente

2. **App salva mensagem no Supabase**
   - Tabela: `mensagens`
   - Atualiza: `conversas_whatsapp.ultima_mensagem`

3. **App chama API `/api/whatsapp/send`**
   - API busca telefone de `conversas_whatsapp`
   - API envia via Evolution API
   - API sincroniza com tabelas do n8n:
     - `chats` (atualiza `updated_at`)
     - `chat_messages` (salva mensagem do atendente)

4. **Mensagem aparece no WhatsApp do cliente**
   - Enviada via Evolution API

5. **n8n recebe confirmação** (via webhook do Evolution)
   - Atualiza histórico automaticamente

## Estrutura de Dados

### Tabela `chats` (n8n)
```sql
- phone: VARCHAR (formato: 5512981092776@s.whatsapp.net)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Tabela `chat_messages` (n8n)
```sql
- phone: VARCHAR (formato: 5512981092776@s.whatsapp.net)
- nomewpp: VARCHAR (nome do cliente)
- user_message: TEXT (mensagem do cliente - NULL para mensagens do app)
- bot_message: TEXT (mensagem do atendente/bot)
- created_at: TIMESTAMP
```

### Tabela `mensagens` (app)
```sql
- conversa_id: UUID
- conteudo: TEXT
- remetente: VARCHAR ('usuario', 'agente', 'bot')
- tipo_mensagem: VARCHAR
- timestamp: TIMESTAMP
- lida: BOOLEAN
```

## Variáveis de Ambiente Necessárias

```env
# Evolution API
EVOLUTION_API_URL=https://api.eversync.com.br
EVOLUTION_API_KEY=sua_chave_aqui
EVOLUTION_API_INSTANCE=EverSync

# Provedor (opcional, padrão: evolution)
WHATSAPP_PROVIDER=evolution
```

## Como Usar

1. **Configurar variáveis de ambiente** no `.env.local` ou no Vercel
2. **Enviar mensagem pelo app**:
   - Abra uma conversa
   - Digite a mensagem
   - Clique em "Enviar" ou pressione Enter
   - O botão mostrará um spinner durante o envio

3. **Verificar envio**:
   - Mensagem aparece no app imediatamente
   - Mensagem é enviada para o WhatsApp via Evolution API
   - Mensagem aparece no histórico do n8n (tabelas `chats` e `chat_messages`)

## Tratamento de Erros

- ✅ Se Evolution API falhar: mensagem permanece salva no banco
- ✅ Se tabelas do n8n não existirem: envio continua normalmente (apenas log de aviso)
- ✅ Se conversa não for encontrada: retorna erro 404
- ✅ Validação de dados: schema Zod valida entrada

## Notas Importantes

1. **Formato de Telefone**: O app normaliza automaticamente para os formatos corretos
2. **Sincronização Opcional**: A sincronização com n8n não bloqueia o envio se falhar
3. **Histórico Unificado**: Mensagens do app aparecem no histórico do n8n
4. **Apenas Agentes**: Apenas mensagens com `remetente='agente'` são enviadas via WhatsApp

## Próximos Passos (Opcional)

- [ ] Adicionar retry automático para envios falhados
- [ ] Adicionar fila de mensagens pendentes
- [ ] Adicionar notificações de erro para o usuário
- [ ] Adicionar suporte para mídia (imagens, documentos, etc.)

