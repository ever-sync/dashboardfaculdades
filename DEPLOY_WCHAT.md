# Configuração de Deploy - wchat.digital

## Variáveis de Ambiente

Configure estas variáveis de ambiente no **Vercel** ou **Coolify**:

### 1. URL do Aplicativo
```bash
NEXT_PUBLIC_APP_URL=https://wchat.digital
```

### 2. Supabase (já tem no .env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xajorjw jjddctoslqoai.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1N... (seu anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1N... (seu service role key)
```

### 3. Evolution API
```bash
EVOLUTION_API_URL=https://sua-evolution-api.com
EVOLUTION_API_KEY=sua-chave-api
```

### 4. Stripe (se usar)
```bash
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## Webhooks que precisam ser configurados

### 1. Evolution API - Webhook de Mensagens
**URL do Webhook:** `https://wchat.digital/api/webhooks/evolution`

**O que faz:** Recebe mensagens do WhatsApp via Evolution API

**Como configurar:**
- O código já está configurado para usar `NEXT_PUBLIC_APP_URL`
- Quando criar uma instância do Evolution API, o webhook será automaticamente registrado
- Arquivos: `app/api/evolution/instance/route.ts` (linhas 917-920, 1165-1168)

### 2. Stripe - Webhook de Pagamentos (se usar)
**URL do Webhook:** `https://wchat.digital/api/stripe/webhook`

**O que faz:** Recebe notificações de pagamentos e assinaturas

**Como configurar:**
1. Vá em [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Clique em "Add endpoint"
3. URL: `https://wchat.digital/api/stripe/webhook`
4. Eventos para ouvir:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o "Signing secret" e adicione como `STRIPE_WEBHOOK_SECRET`

### 3. WhatsApp - Webhook (se usar API direta)
**URL do Webhook:** `https://wchat.digital/api/whatsapp/webhook`

**Arquivo:** `app/api/whatsapp/send/route.ts` (linha 527)

---

## Checklist de Deploy

### Vercel
- [ ] Conectar repositório GitHub
- [ ] Adicionar todas as variáveis de ambiente listadas acima
- [ ] Deploy automático configurado na branch `main`
- [ ] Domínio `wchat.digital` adicionado nas configurações do projeto
- [ ] SSL configurado automaticamente pelo Vercel

### Coolify
- [ ] Criar novo projeto
- [ ] Conectar repositório
- [ ] Adicionar variáveis de ambiente
- [ ] Configurar domínio `wchat.digital`
- [ ] Configurar SSL/HTTPS (Let's Encrypt)
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`

### Após o Deploy
- [ ] Testar login em `https://wchat.digital/login`
- [ ] Criar uma faculdade de teste
- [ ] Verificar se os webhooks estão recebendo dados (Evolution API)
- [ ] Testar criação de instância do WhatsApp
- [ ] Verificar se o isolamento de dados está funcionando

---

## Arquivos que usam NEXT_PUBLIC_APP_URL

1. **Evolution API Instance** (`app/api/evolution/instance/route.ts`)
   - Registra webhook: `https://wchat.digital/api/webhooks/evolution`
   
2. **Stripe Checkout** (`app/api/stripe/create-checkout/route.ts`)
   - Success URL: `https://wchat.digital/checkout/success`
   - Cancel URL: `https://wchat.digital/checkout/cancel`

3. **WhatsApp Send** (`app/api/whatsapp/send/route.ts`)
   - Webhook URL: `https://wchat.digital/api/whatsapp/webhook`

**✅ Todos já estão configurados para usar a variável de ambiente!** Basta definir `NEXT_PUBLIC_APP_URL=https://wchat.digital` no Vercel/Coolify.

---

## Observações Importantes

1. **CORS**: O Next.js já lida com CORS automaticamente nas rotas de API
2. **HTTPS**: Obrigatório para webhooks (Vercel e Coolify fornecem SSL grátis)
3. **Build**: O projeto está configurado para build no Vercel/Coolify (sem Docker)
4. **Logs**: Use os dashboards do Vercel/Coolify para monitorar webhooks e erros
