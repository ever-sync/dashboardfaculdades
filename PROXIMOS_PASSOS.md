# ✅ Próximos Passos - Após Instalação

Você já instalou o Node.js e as dependências! Agora siga estes passos:

---

## 🔒 1. Corrigir Vulnerabilidades (Opcional mas Recomendado)

```powershell
npm audit fix
```

Se houver vulnerabilidades que não podem ser corrigidas automaticamente, você pode ver detalhes com:
```powershell
npm audit
```

---

## 🌐 2. Instalar Browsers do Playwright (Para Testes E2E)

```powershell
npx playwright install
```

Isso instalará os browsers necessários para os testes E2E (Chrome, Firefox, Safari).

---

## 👥 3. Criar Usuários no Supabase Auth

**IMPORTANTE**: Antes de executar, certifique-se de ter configurado as variáveis de ambiente!

### 3.1 Criar arquivo `.env.local`

Crie um arquivo `.env.local` na raiz do projeto com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
```

### 3.2 Executar script de criação de usuários

```powershell
npx tsx scripts/create-users.ts
```

Isso criará 3 usuários de teste:
- `admin@dashboardfaculdades.com` / `Admin@123`
- `gestor@dashboardfaculdades.com` / `Gestor@123`
- `analista@dashboardfaculdades.com` / `Analista@123`

---

## 🚀 4. Iniciar o Projeto

```powershell
npm run dev
```

O servidor iniciará em: **http://localhost:3000**

---

## 🧪 5. Executar Testes (Opcional)

### Testes Unitários
```powershell
npm test
```

### Testes E2E
```powershell
npm run test:e2e
```

### Testes E2E com Interface Gráfica
```powershell
npm run test:e2e:ui
```

---

## 📋 Checklist Completo

- [x] ✅ Node.js instalado
- [x] ✅ Dependências instaladas (`npm install`)
- [ ] ⏳ Corrigir vulnerabilidades (`npm audit fix`)
- [ ] ⏳ Instalar Playwright (`npx playwright install`)
- [ ] ⏳ Configurar variáveis de ambiente (`.env.local`)
- [ ] ⏳ Criar usuários (`npx tsx scripts/create-users.ts`)
- [ ] ⏳ Iniciar projeto (`npm run dev`)
- [ ] ⏳ Testar login no navegador
- [ ] ⏳ Executar testes

---

## ⚠️ Notas Importantes

1. **Variáveis de Ambiente**: Sem o `.env.local` configurado, o projeto não funcionará corretamente
2. **Supabase**: Você precisa ter um projeto Supabase criado e as credenciais
3. **Primeira Execução**: O primeiro `npm run dev` pode demorar um pouco para compilar

---

## 🆘 Problemas Comuns

### Erro ao executar `npx tsx`
→ Verifique se as variáveis de ambiente estão configuradas
→ Verifique se o Supabase está acessível

### Erro ao iniciar o servidor
→ Verifique se a porta 3000 está livre
→ Verifique se todas as dependências foram instaladas

### Erro de autenticação
→ Verifique se os usuários foram criados no Supabase
→ Verifique as credenciais no `.env.local`

---

## 📚 Documentação

- `QUICK_START.md` - Guia rápido
- `TESTES.md` - Como testar o sistema
- `IMPLEMENTACOES.md` - Detalhes das funcionalidades

---

**Boa sorte! 🚀**

