# 🧪 Guia Completo de Testes

Este guia explica como executar todos os tipos de testes no projeto.

---

## 📦 Instalação

### 1. Instalar Dependências
```bash
npm install
```

### 2. Instalar Browsers do Playwright
```bash
npx playwright install
```

### 3. Criar Usuários de Teste
```bash
npx tsx scripts/create-users.ts
```

---

## 🧪 Testes Unitários (Jest)

### Executar Todos os Testes
```bash
npm test
```

### Executar em Modo Watch
```bash
npm run test:watch
```

### Executar Teste Específico
```bash
npm test validations
```

### Cobertura Atual
- ✅ Validações de formulário
- ✅ Validação de email
- ✅ Validação de senha
- ✅ Validação de CNPJ
- ✅ Validação de telefone
- ✅ Validação de estado
- ✅ Validação de campos obrigatórios

---

## 🎭 Testes E2E (Playwright)

### Executar Todos os Testes E2E
```bash
npm run test:e2e
```

### Executar com Interface Gráfica
```bash
npm run test:e2e:ui
```

### Executar em Modo Headed (Ver o Browser)
```bash
npm run test:e2e:headed
```

### Executar Teste Específico
```bash
npx playwright test auth
npx playwright test dashboard
npx playwright test faculdades
```

### Ver Relatório HTML
```bash
npx playwright show-report
```

### Testes E2E Disponíveis

#### 1. Autenticação (`e2e/auth.spec.ts`)
- ✅ Exibição da página de login
- ✅ Validação de formulário
- ✅ Erro com credenciais inválidas
- ✅ Login com credenciais válidas
- ✅ Redirecionamento se já logado

#### 2. Dashboard (`e2e/dashboard.spec.ts`)
- ✅ Exibição do dashboard
- ✅ Cards de KPIs
- ✅ Gráficos
- ✅ Navegação entre páginas

#### 3. Faculdades (`e2e/faculdades.spec.ts`)
- ✅ Exibição da página
- ✅ Abertura de modal
- ✅ Validação de formulário
- ✅ Validação de email
- ✅ Fechamento de modal

#### 4. Prospects (`e2e/prospects.spec.ts`)
- ✅ Exibição da página
- ✅ Cards de resumo
- ✅ Filtros de busca
- ✅ Filtro por status

---

## 📋 Testes Manuais (E2E Manual)

Para testes manuais detalhados, consulte o arquivo `TESTES.md`.

### Checklist Rápido

#### Autenticação
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas
- [ ] Validação de formulário
- [ ] Logout

#### Faculdades
- [ ] Criar faculdade
- [ ] Editar faculdade
- [ ] Deletar faculdade
- [ ] Validações de formulário

#### Dashboard
- [ ] Visualizar KPIs
- [ ] Visualizar gráficos
- [ ] Selecionar faculdade

#### Prospects
- [ ] Listar prospects
- [ ] Filtrar prospects
- [ ] Paginação

#### Conversas
- [ ] Listar conversas
- [ ] Selecionar conversa

#### Analytics
- [ ] Visualizar gráficos
- [ ] Filtrar por período

#### Relatórios
- [ ] Gerar relatório
- [ ] Exportar relatório

---

## 🔧 Configuração

### Variáveis de Ambiente
Certifique-se de ter configurado:
```env
NEXT_PUBLIC_SUPABASE_URL=sua_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave
SUPABASE_SERVICE_ROLE_KEY=sua_service_key
```

### Configuração do Playwright
O arquivo `playwright.config.ts` está configurado para:
- Executar em 3 browsers (Chrome, Firefox, Safari)
- Usar `http://localhost:3000` como base URL
- Iniciar servidor automaticamente
- Gerar screenshots em caso de falha
- Gerar trace em caso de retry

---

## 🐛 Debugging

### Debug de Testes E2E
```bash
# Executar com debug
npx playwright test --debug

# Executar teste específico com debug
npx playwright test auth --debug
```

### Ver Screenshots de Falhas
```bash
npx playwright show-report
```

### Ver Traces
```bash
npx playwright show-trace trace.zip
```

---

## 📊 Cobertura de Testes

### Testes Unitários
- **Cobertura**: Funções de validação
- **Status**: ✅ Implementado

### Testes E2E
- **Cobertura**: Fluxos principais
- **Status**: ✅ Implementado
- **Browsers**: Chrome, Firefox, Safari

### Testes Manuais
- **Cobertura**: Todas as funcionalidades
- **Status**: ✅ Documentado em `TESTES.md`

---

## 🚀 CI/CD

### GitHub Actions (Exemplo)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm test
      - run: npm run test:e2e
```

---

## 📝 Notas

- Os testes E2E assumem que o servidor está rodando em `localhost:3000`
- Os testes usam cookies mockados para simular autenticação
- Para testes com dados reais, configure o Supabase corretamente
- Alguns testes podem precisar de ajustes dependendo da estrutura do HTML

---

## 🔗 Links Úteis

- [Documentação do Jest](https://jestjs.io/)
- [Documentação do Playwright](https://playwright.dev/)
- [Guia de Testes Manual](./TESTES.md)

---

**Última atualização**: 2024

