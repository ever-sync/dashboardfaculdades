# 🔐 Como Configurar Credenciais da Evolution API Manualmente

Este documento explica como configurar as credenciais da Evolution API diretamente no banco de dados, sem usar o frontend.

---

## 📋 Pré-requisitos

- Acesso ao banco de dados Supabase
- Credenciais da Evolution API (URL e API Key)

---

## 🗄️ Configuração no Banco de Dados

As credenciais são armazenadas na tabela `configuracoes_globais`. Você pode configurá-las de duas formas:

### Opção 1: Via SQL Editor do Supabase

1. Acesse o **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Execute os seguintes comandos SQL:

```sql
-- Inserir ou atualizar URL da Evolution API
INSERT INTO public.configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES (
  'evolution_api_url',
  'https://api.eversync.com.br',  -- Substitua pela sua URL
  'URL base da Evolution API (compartilhada por todas as faculdades)',
  'texto',
  false
)
ON CONFLICT (chave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = NOW();

-- Inserir ou atualizar API Key da Evolution API
INSERT INTO public.configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES (
  'evolution_api_key',
  'sua_api_key_aqui',  -- Substitua pela sua API Key
  'Chave de autenticação da Evolution API (compartilhada por todas as faculdades)',
  'texto',
  true  -- Marcar como sensível
)
ON CONFLICT (chave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = NOW();
```

### Opção 2: Via Supabase Edge Function

Crie uma Edge Function para configurar as credenciais de forma segura:

```typescript
// supabase/functions/configurar-evolution-api/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { evolution_api_url, evolution_api_key } = await req.json()

    // Validar que as credenciais foram fornecidas
    if (!evolution_api_url || !evolution_api_key) {
      return new Response(
        JSON.stringify({ error: 'URL e API Key são obrigatórias' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Salvar URL
    const { error: urlError } = await supabaseClient
      .from('configuracoes_globais')
      .upsert({
        chave: 'evolution_api_url',
        valor: evolution_api_url,
        descricao: 'URL base da Evolution API (compartilhada por todas as faculdades)',
        tipo: 'texto',
        sensivel: false,
      }, {
        onConflict: 'chave'
      })

    if (urlError) throw urlError

    // Salvar API Key
    const { error: keyError } = await supabaseClient
      .from('configuracoes_globais')
      .upsert({
        chave: 'evolution_api_key',
        valor: evolution_api_key,
        descricao: 'Chave de autenticação da Evolution API (compartilhada por todas as faculdades)',
        tipo: 'texto',
        sensivel: true,
      }, {
        onConflict: 'chave'
      })

    if (keyError) throw keyError

    return new Response(
      JSON.stringify({ success: true, message: 'Credenciais configuradas com sucesso' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

**Para usar a Edge Function:**

```bash
# Deploy da função
supabase functions deploy configurar-evolution-api

# Chamar a função
curl -X POST \
  'https://seu-projeto.supabase.co/functions/v1/configurar-evolution-api' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "evolution_api_url": "https://api.eversync.com.br",
    "evolution_api_key": "sua_api_key_aqui"
  }'
```

---

## ✅ Verificar Configuração

Após configurar, você pode verificar se as credenciais estão corretas:

```sql
-- Verificar se as credenciais foram salvas
SELECT chave, 
       CASE 
         WHEN sensivel THEN '***' 
         ELSE valor 
       END as valor,
       descricao,
       sensivel,
       created_at,
       updated_at
FROM public.configuracoes_globais
WHERE chave IN ('evolution_api_url', 'evolution_api_key')
ORDER BY chave;
```

---

## 🔒 Segurança

- ✅ A API Key é marcada como `sensivel: true` no banco
- ✅ O frontend não exibe a API Key completa (mostra apenas `***`)
- ✅ Apenas administradores devem ter acesso ao banco de dados
- ✅ Use Edge Functions com autenticação adequada

---

## 📝 Notas Importantes

1. **Credenciais Globais**: As credenciais são compartilhadas por todas as faculdades
2. **Instâncias por Faculdade**: Cada faculdade precisa criar sua própria instância (feito pelo frontend)
3. **Atualização**: Para atualizar as credenciais, execute novamente os comandos SQL ou a Edge Function

---

## 🚀 Próximos Passos

Após configurar as credenciais:

1. Acesse o frontend: **Dashboard → Configurações**
2. Na seção **"Instância Evolution API"**, crie uma instância para cada faculdade
3. Escaneie o QR code para conectar o WhatsApp
4. Pronto! A faculdade poderá enviar e receber mensagens

---

## ❓ Problemas Comuns

### Erro: "Evolution API não configurada"
- Verifique se as credenciais foram inseridas corretamente na tabela `configuracoes_globais`
- Verifique se os nomes das chaves estão corretos: `evolution_api_url` e `evolution_api_key`

### Erro: "Não foi possível conectar com a Evolution API"
- Verifique se a URL está correta e acessível
- Verifique se a API Key está correta
- Teste a conexão diretamente com a API da Evolution

---

**Última atualização:** 2025-01-19

