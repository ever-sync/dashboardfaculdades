# Configuração SaaS

## 1. Banco de Dados
Execute o arquivo de migração `supabase/migrations/20241122_saas_schema.sql` no seu Supabase (SQL Editor) para criar as colunas e tabelas necessárias para o SaaS.

## 2. Stripe

### Variáveis de Ambiente
Adicione as seguintes variáveis ao seu arquivo `.env.local`:

```env
# Stripe - Obrigatórias
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe - Opcionais (se você criar produtos/preços na Stripe)
STRIPE_PRICE_ID_BASIC=price_your_basic_price_id
STRIPE_PRICE_ID_PRO=price_your_pro_price_id

# App URL (para redirecionamentos do Stripe)
# Para desenvolvimento local use: http://localhost:3000
# Para produção use: https://wchat.digital
NEXT_PUBLIC_APP_URL=https://wchat.digital
```

### Configuração no Painel Stripe

1. **Criar Conta Stripe**: Acesse [stripe.com](https://stripe.com) e crie uma conta
2. **Obter Chaves API**: 
   - Acesse o Dashboard → Developers → API keys
   - Copie a **Secret Key** (começa com `sk_test_` para teste ou `sk_live_` para produção)
   - Copie a **Publishable Key** (começa com `pk_test_` para teste ou `pk_live_` para produção)

3. **Configurar Webhook**:
   - Acesse Developers → Webhooks
   - Clique em "Add endpoint"
   - URL: `https://wchat.digital/api/stripe/webhook`
   - Eventos a selecionar:
     - `checkout.session.completed` (obrigatório)
     - `customer.subscription.updated` (recomendado)
     - `customer.subscription.deleted` (recomendado)
   - Copie o **Signing secret** (começa com `whsec_`) e adicione como `STRIPE_WEBHOOK_SECRET`

4. **Criar Produtos e Preços (Opcional)**:
   - Se quiser usar Price IDs ao invés de criar preços dinamicamente:
   - Acesse Products → Add product
   - Crie produtos para "Básico" (R$ 497/mês) e "Pro" (R$ 997/mês)
   - Configure como assinatura recorrente mensal
   - Copie os Price IDs e adicione nas variáveis de ambiente

### Rotas e Páginas Criadas

- **API Route**: `/api/stripe/create-checkout` - Cria sessões de checkout
- **Webhook**: `/api/stripe/webhook` - Processa eventos do Stripe
- **Páginas de Checkout**:
  - `/checkout/basic` - Checkout do plano Básico
  - `/checkout/pro` - Checkout do plano Pro
  - `/checkout/success` - Página de sucesso após pagamento
  - `/checkout/cancel` - Página de cancelamento

### Funcionalidades Implementadas

✅ Criação de sessões de checkout do Stripe
✅ Processamento de webhooks (checkout, atualização e cancelamento de assinaturas)
✅ Criação automática de usuários quando necessário
✅ Atualização de perfis com informações de assinatura
✅ Páginas de checkout responsivas
✅ Suporte a Price IDs ou criação dinâmica de preços

## 3. Super Admin
Para se tornar um Super Admin, edite manualmente seu usuário na tabela `profiles` e mude o campo `role` para `super_admin`.

## 4. Planos
Os planos estão definidos no código em `src/components/landing/PricingSection.tsx` e configurados em `src/lib/stripe.ts`. Os valores padrão são:
- **Básico**: R$ 497/mês
- **Pro**: R$ 997/mês

## 5. Testando a Integração

### Modo de Teste
1. Use as chaves de teste (`sk_test_` e `pk_test_`)
2. Use cartões de teste do Stripe:
   - Sucesso: `4242 4242 4242 4242`
   - Qualquer data futura e CVC
   - Qualquer CEP

### Verificar Webhook
- Use o Stripe CLI para testar webhooks localmente:
  ```bash
  stripe listen --forward-to localhost:3000/api/stripe/webhook
  ```
- Ou use o modo de teste no painel do Stripe para enviar eventos de teste
