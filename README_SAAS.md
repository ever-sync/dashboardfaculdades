# Configuração SaaS

## 1. Banco de Dados
Execute o arquivo de migração `supabase/migrations/20241122_saas_schema.sql` no seu Supabase (SQL Editor) para criar as colunas e tabelas necessárias para o SaaS.

## 2. Stripe
Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Webhook
Configure o webhook no painel da Stripe para apontar para:
`https://seu-dominio.com/api/stripe/webhook`

Eventos necessários:
- `checkout.session.completed`
- `customer.subscription.updated` (opcional, para atualizações futuras)
- `customer.subscription.deleted` (opcional, para cancelamentos)

## 3. Super Admin
Para se tornar um Super Admin, edite manualmente seu usuário na tabela `profiles` e mude o campo `role` para `super_admin`.

## 4. Planos
Os planos estão definidos no código em `src/components/landing/PricingSection.tsx`. Você precisará criar os produtos correspondentes na Stripe e atualizar os links de checkout ou IDs de preço.
