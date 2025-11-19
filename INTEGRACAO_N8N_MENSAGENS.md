# 📚 Integração n8n - Mensagens IA e App

## Visão Geral

Este documento explica como configurar o fluxo n8n para integrar com o app, garantindo que:
- ✅ Mensagens da IA sejam salvas corretamente
- ✅ Mensagens apareçam no app em tempo real
- ✅ Mensagens do app sejam recebidas pelo n8n
- ✅ Histórico sincronizado entre app e n8n

---

## 🔧 Configuração no n8n

### 1. Corrigir Campo `remetente` no nó "CRIAR MSG BOT"

**⚠️ IMPORTANTE**: O n8n deve usar o campo `remetente` (não `remetente_msg`)

#### No nó "CRIAR MSG BOT" do fluxo n8n:

**❌ ANTES (Incorreto)**
```json
{
  "fieldId": "remetente_msg",
  "fieldValue": "bot"
}
```

**✅ DEPOIS (Correto)**
```json
{
  "fieldId": "remetente",
  "fieldValue": "bot"
}
```

#### Valores Válidos para `remetente`:
- `'usuario'` - Mensagens do cliente
- `'agente'` - Mensagens do atendente humano
- `'bot'` - Mensagens da IA/automação

---

### 2. Adicionar Chamada para API do App (Recomendado)

Após a IA gerar a resposta e salvar no banco, adicione um nó **HTTP Request** para notificar o app:

#### Configuração do Nó HTTP Request:

**Nome do Nó**: `Notificar App - Mensagem IA`

**Método**: `POST`

**URL**: 
```
https://seu-dominio.com/api/n8n/mensagem-ia
```

**Headers**:
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON)**:
```json
{
  "conversa_id": "={{ $('Criar historico').item.json.conversa_id }}",
  "telefone": "={{ $('Dados Unicos').item.json.chat_id }}",
  "conteudo": "={{ $('AI Agent2').item.json.output }}",
  "faculdade_id": "={{ $('Dados Unicos').item.json['id-faculdade'] }}",
  "nome_cliente": "={{ $('Dados Unicos').item.json.nome }}",
  "tipo_mensagem": "texto"
}
```

#### Exemplo Completo do Payload:

```json
{
  "conversa_id": "550e8400-e29b-41d4-a716-446655440001",
  "telefone": "5512981092776@s.whatsapp.net",
  "conteudo": "Olá! Como posso ajudar você hoje?",
  "faculdade_id": "8c38b921-071a-4663-89ec-b0215497af26",
  "nome_cliente": "João Silva",
  "tipo_mensagem": "texto"
}
```

#### Campos Obrigatórios:
- `telefone` - Telefone do cliente (com ou sem @s.whatsapp.net)
- `conteudo` - Texto da mensagem gerada pela IA

#### Campos Opcionais:
- `conversa_id` - UUID da conversa (será buscado se não fornecido)
- `faculdade_id` - UUID da faculdade (necessário se conversa_id não fornecido)
- `nome_cliente` - Nome do cliente
- `tipo_mensagem` - Tipo da mensagem: `'texto'`, `'imagem'`, `'documento'`, `'audio'`, `'video'` (padrão: `'texto'`)

---

### 3. Posicionamento no Fluxo n8n

Adicione o nó HTTP Request **após** o nó "CRIAR MSG BOT":

```
AI Agent2 → Delete Memory → CRIAR MSG BOT → [NOVO] Notificar App - Mensagem IA → Get a row1
```

**Por quê?**
- Garante que a mensagem já foi salva no banco
- Notifica o app para atualizar a interface
- Não bloqueia o fluxo se a notificação falhar

---

## 📡 Endpoint da API

### POST `/api/n8n/mensagem-ia`

Recebe notificações do n8n quando a IA responde.

#### Resposta de Sucesso (200):
```json
{
  "success": true,
  "message": "Mensagem da IA salva com sucesso",
  "mensagem_id": "550e8400-e29b-41d4-a716-446655440001",
  "conversa_id": "550e8400-e29b-41d4-a716-446655440002"
}
```

#### Resposta de Erro (400/500):
```json
{
  "error": "Mensagem de erro descritiva"
}
```

#### Códigos de Status:
- `200` - Sucesso
- `400` - Erro de validação (dados inválidos)
- `404` - Conversa não encontrada
- `500` - Erro interno do servidor

---

## 🔄 Fluxo Completo

### Mensagem do Cliente → n8n → App

1. **Cliente envia mensagem no WhatsApp**
   - Evolution API recebe mensagem
   - Envia webhook para n8n

2. **n8n processa mensagem**
   - Recebe webhook (`Webhook EVO1`)
   - Processa com IA (`AI Agent2`)
   - Gera resposta

3. **n8n salva no banco**
   - Salva em `mensagens` com `remetente='bot'` ✅
   - Salva em `chat_messages` (formato n8n)
   - Atualiza `chats`

4. **n8n notifica app** (opcional, mas recomendado)
   - Chama `/api/n8n/mensagem-ia`
   - App atualiza interface via Realtime

5. **n8n envia via WhatsApp**
   - Envia mensagem via Evolution API
   - Cliente recebe resposta

### Mensagem do App → WhatsApp → n8n

1. **Atendente digita no app**
   - App salva em `mensagens` com `remetente='agente'`
   - App envia via Evolution API (`/api/whatsapp/send`)

2. **App sincroniza com n8n**
   - Atualiza `chats`
   - Salva em `chat_messages` com `bot_message`

3. **Mensagem aparece no WhatsApp**
   - Cliente recebe mensagem

4. **n8n recebe confirmação** (via webhook Evolution)
   - Atualiza histórico automaticamente

---

## 📊 Estrutura de Dados

### Tabela `mensagens` (App)

```sql
CREATE TABLE mensagens (
    id UUID PRIMARY KEY,
    conversa_id UUID NOT NULL,
    conteudo TEXT NOT NULL,
    remetente VARCHAR(10) CHECK (remetente IN ('usuario', 'agente', 'bot')),
    tipo_mensagem VARCHAR(20) DEFAULT 'texto',
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    lida BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Campos Importantes**:
- `remetente='bot'` - Mensagens da IA
- `remetente='agente'` - Mensagens do atendente
- `remetente='usuario'` - Mensagens do cliente

### Tabela `chat_messages` (n8n)

```sql
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY,
    phone VARCHAR(255) NOT NULL, -- Formato: 5512981092776@s.whatsapp.net
    nomewpp VARCHAR(255),
    user_message TEXT, -- Mensagem do cliente (NULL para mensagens do bot/app)
    bot_message TEXT,  -- Mensagem da IA ou atendente
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Formato**:
- `user_message` - Mensagem do cliente (preenchido quando cliente envia)
- `bot_message` - Mensagem da IA ou atendente (preenchido quando IA/app responde)

### Tabela `chats` (n8n)

```sql
CREATE TABLE chats (
    phone VARCHAR(255) PRIMARY KEY, -- Formato: 5512981092776@s.whatsapp.net
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔍 Troubleshooting

### Mensagem da IA não aparece no app

1. **Verificar campo `remetente`**
   ```sql
   SELECT id, conteudo, remetente, created_at 
   FROM mensagens 
   WHERE remetente = 'bot' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```
   - Se retornar vazio, o campo está incorreto
   - Se retornar dados, verificar Realtime

2. **Verificar Realtime no Supabase**
   - Ir em Settings → API
   - Verificar se Realtime está habilitado
   - Verificar RLS (Row Level Security) permite leitura

3. **Verificar `conversa_id`**
   - Certificar que `conversa_id` está correto
   - Verificar se conversa existe

### Erro ao chamar `/api/n8n/mensagem-ia`

1. **Erro 400 - Validação**
   - Verificar se `telefone` e `conteudo` estão preenchidos
   - Verificar formato do UUID (se fornecido)

2. **Erro 404 - Conversa não encontrada**
   - Verificar se `conversa_id` existe
   - Ou fornecer `faculdade_id` para criar conversa

3. **Erro 500 - Erro interno**
   - Verificar logs do servidor
   - Verificar conexão com Supabase

### Sincronização com tabelas n8n não funciona

- As tabelas `chats` e `chat_messages` são opcionais
- Se não existirem, o sistema continua funcionando
- Apenas logs de aviso serão gerados
- Não bloqueia o envio/recebimento de mensagens

---

## ✅ Checklist de Configuração

- [ ] Corrigir campo `remetente` no nó "CRIAR MSG BOT" (não usar `remetente_msg`)
- [ ] Adicionar nó HTTP Request para notificar app
- [ ] Configurar URL do endpoint (`/api/n8n/mensagem-ia`)
- [ ] Configurar payload com campos corretos
- [ ] Testar envio de mensagem da IA
- [ ] Verificar se mensagem aparece no app em tempo real
- [ ] Verificar sincronização com tabelas `chat_messages` e `chats`

---

## 📝 Exemplos de Uso

### Exemplo 1: Notificação Simples

```json
{
  "telefone": "5512981092776@s.whatsapp.net",
  "conteudo": "Olá! Como posso ajudar?"
}
```

### Exemplo 2: Notificação Completa

```json
{
  "conversa_id": "550e8400-e29b-41d4-a716-446655440001",
  "telefone": "5512981092776@s.whatsapp.net",
  "conteudo": "Perfeito! Vou te ajudar com isso.",
  "faculdade_id": "8c38b921-071a-4663-89ec-b0215497af26",
  "nome_cliente": "João Silva",
  "tipo_mensagem": "texto"
}
```

### Exemplo 3: Criar Conversa Automaticamente

```json
{
  "telefone": "5512981092776",
  "conteudo": "Bem-vindo! Como posso ajudar?",
  "faculdade_id": "8c38b921-071a-4663-89ec-b0215497af26",
  "nome_cliente": "Maria Santos"
}
```

---

## 🔗 Referências

- [NOTA_CAMPO_REMETENTE.md](./NOTA_CAMPO_REMETENTE.md) - Informações sobre campo `remetente`
- [VERIFICACAO_REALTIME.md](./VERIFICACAO_REALTIME.md) - Verificação de Realtime
- [INTEGRACAO_N8N_IMPLEMENTADA.md](./INTEGRACAO_N8N_IMPLEMENTADA.md) - Integração anterior

---

## 📞 Suporte

Se tiver problemas:
1. Verificar logs do n8n
2. Verificar logs do app (console do navegador)
3. Verificar logs do Supabase
4. Consultar documentação acima

