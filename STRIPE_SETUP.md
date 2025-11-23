# Configuração do Stripe - wchat.digital

## Variáveis de Ambiente

Adicione ao seu arquivo `.env.local` ou `.env.production`:

```env
# Stripe - Obrigatórias
STRIPE_SECRET_KEY=sk_test_...  # ou sk_live_... para produção
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # ou pk_live_... para produção

# App URL
NEXT_PUBLIC_APP_URL=https://wchat.digital
```

## Configuração do Webhook no Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Developers → Webhooks**
3. Clique em **Add endpoint**
4. Configure:
   - **Endpoint URL**: `https://wchat.digital/api/stripe/webhook`
   - **Description**: Webhook para processar pagamentos e assinaturas
   - **Events to send**:
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
5. Clique em **Add endpoint**
6. Copie o **Signing secret** (começa com `whsec_`) e adicione como `STRIPE_WEBHOOK_SECRET`

## URLs de Checkout

- Plano Básico: `https://wchat.digital/checkout/basic`
- Plano Pro: `https://wchat.digital/checkout/pro`
- Sucesso: `https://wchat.digital/checkout/success`
- Cancelamento: `https://wchat.digital/checkout/cancel`

## Testando

### Modo de Teste (Desenvolvimento)
- Use chaves de teste (`sk_test_` e `pk_test_`)
- Cartão de teste: `4242 4242 4242 4242`
- Qualquer data futura e CVC válido

### Modo de Produção
- Use chaves de produção (`sk_live_` e `pk_live_`)
- Certifique-se de que o webhook está configurado com a URL de produção
- Teste com valores pequenos primeiro

## Verificação

Após configurar, teste o fluxo completo:
1. Acesse uma página de checkout
2. Complete o pagamento com cartão de teste
3. Verifique se o webhook foi processado no Dashboard do Stripe
4. Confirme que o usuário foi criado/atualizado no Supabase





