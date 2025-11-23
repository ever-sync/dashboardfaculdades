# Onde os Dados do Cliente são Salvos Após Contratar um Plano

## 📊 Tabela Principal: `profiles`

Após um cliente contratar um plano através do Stripe, **todos os dados são salvos na tabela `profiles`** do Supabase.

## 🔄 Fluxo Completo

### 1. Cliente Completa o Pagamento no Stripe
- Cliente acessa `/checkout/basic` ou `/checkout/pro`
- Completa o pagamento no Stripe Checkout
- Stripe envia webhook `checkout.session.completed`

### 2. Webhook Processa os Dados
O webhook (`app/api/stripe/webhook/route.ts`) executa automaticamente:

```96:109:app/api/stripe/webhook/route.ts
                        const { error: profileError } = await supabase
                            .from('profiles')
                            .upsert({
                                id: userId,
                                email: email,
                                nome: name || email.split('@')[0],
                                role: 'admin',
                                plano: plan,
                                stripe_customer_id: customerId,
                                stripe_subscription_id: subscription.id,
                                status: 'ativo'
                            }, {
                                onConflict: 'id'
                            })
```

### 3. Dados Salvos na Tabela `profiles`

A tabela `profiles` armazena:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID do usuário (vinculado ao `auth.users`) |
| `email` | TEXT | Email do cliente |
| `nome` | TEXT | Nome do cliente |
| `role` | ENUM | Papel: `super_admin`, `admin`, `agent` |
| `plano` | ENUM | Plano contratado: `basic`, `pro`, `enterprise` |
| `stripe_customer_id` | TEXT | ID do cliente no Stripe |
| `stripe_subscription_id` | TEXT | ID da assinatura no Stripe |
| `status` | TEXT | Status: `ativo`, `inativo`, `cancelado` |

## 📋 Estrutura da Tabela `profiles`

A tabela `profiles` é criada/atualizada pela migração `20241122_saas_schema.sql`:

```14:20:supabase/migrations/20241122_saas_schema.sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS plano subscription_plan DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';
```

## 🔐 Relação com `auth.users`

A tabela `profiles` está vinculada à tabela `auth.users` do Supabase:
- O `id` em `profiles` é a mesma UUID do `auth.users`
- Se o usuário não existir, ele é criado automaticamente no `auth.users` primeiro
- Depois o perfil é criado/atualizado na tabela `profiles`

## 📝 Exemplo de Dados Salvos

Quando um cliente contrata o plano "Pro", os dados salvos são:

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "cliente@exemplo.com",
  "nome": "João Silva",
  "role": "admin",
  "plano": "pro",
  "stripe_customer_id": "cus_xxxxxxxxxxxxx",
  "stripe_subscription_id": "sub_xxxxxxxxxxxxx",
  "status": "ativo"
}
```

## 🔄 Atualizações Automáticas

O webhook também atualiza a tabela `profiles` quando:

1. **Assinatura Atualizada** (`customer.subscription.updated`):
   - Atualiza o `status` e `stripe_subscription_id`

2. **Assinatura Cancelada** (`customer.subscription.deleted`):
   - Define `status` como `cancelado`
   - Reverte `plano` para `basic`

## 🔍 Como Consultar os Dados

### Via SQL no Supabase:
```sql
SELECT * FROM profiles 
WHERE plano = 'pro' 
AND status = 'ativo';
```

### Via API/Cliente:
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*')
  .eq('plano', 'pro')
  .eq('status', 'ativo')
```

## ⚠️ Importante

- A tabela `profiles` é a **única tabela** que armazena dados de assinatura
- Os dados do Stripe (customer_id, subscription_id) são salvos para referência
- O `role` é sempre definido como `admin` para novos clientes
- O `status` é atualizado automaticamente conforme eventos do Stripe

