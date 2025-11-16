# ⚡ Quick Start - Início Rápido

Guia rápido para começar a usar o projeto.

---

## ⚠️ Pré-requisitos

### 1. Instalar Node.js

**O Node.js não está instalado no seu sistema!**

📥 **Baixe e instale:**
- Acesse: https://nodejs.org/
- Baixe a versão **LTS** (recomendada)
- Execute o instalador
- ✅ Marque "Add to PATH" durante a instalação
- Reinicie o terminal após instalar

📖 **Guia completo:** Veja `INSTALACAO_NODEJS.md`

---

## 🚀 Passos Rápidos

### 1. Verificar Node.js
```powershell
node --version
npm --version
```
Se mostrar versões, está OK! ✅

### 2. Instalar Dependências
```powershell
npm install
```

### 3. Configurar Variáveis de Ambiente
Crie o arquivo `.env.local` na raiz do projeto:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 4. Instalar Browsers do Playwright (para testes)
```powershell
npx playwright install
```

### 5. Criar Usuários de Teste
```powershell
npx tsx scripts/create-users.ts
```

### 6. Iniciar o Projeto
```powershell
npm run dev
```

### 7. Acessar
Abra o navegador em: http://localhost:3000

---

## 🧪 Executar Testes

```powershell
# Testes unitários
npm test

# Testes E2E
npm run test:e2e
```

---

## 📚 Documentação Completa

- `INSTALACAO_NODEJS.md` - Como instalar Node.js
- `TESTES.md` - Guia de testes
- `README_TESTES.md` - Como executar testes
- `IMPLEMENTACOES.md` - Detalhes das implementações

---

## ❓ Problemas?

### Node.js não encontrado
→ Veja `INSTALACAO_NODEJS.md`

### Erro ao instalar dependências
→ Verifique se o Node.js está instalado corretamente
→ Tente: `npm cache clean --force`

### Erro de variáveis de ambiente
→ Verifique se o arquivo `.env.local` existe
→ Verifique se as variáveis estão corretas

---

**Boa sorte! 🚀**

