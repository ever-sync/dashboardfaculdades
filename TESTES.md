# 🧪 Guia de Testes - Dashboard de Faculdades

Este documento descreve como testar todas as funcionalidades do sistema.

---

## 📋 Pré-requisitos

1. **Variáveis de Ambiente Configuradas**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
   ```

2. **Usuários Criados**
   Execute o script para criar usuários de teste:
   ```bash
   npx tsx scripts/create-users.ts
   ```

3. **Dependências Instaladas**
   ```bash
   npm install
   ```

---

## 🚀 Como Executar os Testes

### Testes Unitários
```bash
npm test
```

### Testes Manuais (E2E)
Siga os cenários descritos abaixo.

---

## ✅ Cenários de Teste

### 1. Autenticação

#### 1.1 Login com Credenciais Válidas
1. Acesse `/login`
2. Digite um email válido (ex: `admin@dashboardfaculdades.com`)
3. Digite a senha correspondente (ex: `Admin@123`)
4. Clique em "Entrar"
5. **Resultado Esperado**: 
   - Toast de sucesso aparece
   - Redirecionamento para `/dashboard`
   - Usuário autenticado

#### 1.2 Login com Credenciais Inválidas
1. Acesse `/login`
2. Digite email inválido ou senha incorreta
3. Clique em "Entrar"
4. **Resultado Esperado**: 
   - Toast de erro aparece
   - Mensagem de erro específica
   - Permanece na página de login

#### 1.3 Validação de Formulário
1. Acesse `/login`
2. Tente submeter com campos vazios
3. **Resultado Esperado**: 
   - Mensagens de erro nos campos
   - Toast informando erros
   - Formulário não é submetido

#### 1.4 Logout
1. Faça login
2. Clique em "Sair" no menu lateral
3. **Resultado Esperado**: 
   - Redirecionamento para `/login`
   - Cookies de autenticação limpos

---

### 2. Gestão de Faculdades

#### 2.1 Criar Nova Faculdade
1. Acesse `/dashboard/faculdades`
2. Clique em "Nova Faculdade"
3. Preencha o formulário:
   - Nome: "Faculdade Teste"
   - Email: "teste@faculdade.com"
   - Plano: "Pro"
   - Status: "Ativo"
4. Clique em "Salvar"
5. **Resultado Esperado**: 
   - Toast de sucesso
   - Modal fecha
   - Faculdade aparece na lista

#### 2.2 Editar Faculdade
1. Na lista de faculdades, clique em "Editar"
2. Modifique algum campo (ex: mudar plano para "Enterprise")
3. Clique em "Salvar"
4. **Resultado Esperado**: 
   - Toast de sucesso
   - Alterações refletidas na lista

#### 2.3 Deletar Faculdade
1. Na lista de faculdades, clique no ícone de lixeira
2. Confirme a exclusão
3. **Resultado Esperado**: 
   - Faculdade removida da lista
   - Toast de sucesso (se implementado)

#### 2.4 Validações de Formulário
1. Tente criar faculdade com:
   - Nome vazio → Deve mostrar erro
   - Email inválido → Deve mostrar erro
   - CNPJ inválido → Deve mostrar erro
   - Estado inválido → Deve mostrar erro
2. **Resultado Esperado**: 
   - Mensagens de erro específicas
   - Formulário não é submetido

---

### 3. Dashboard Principal

#### 3.1 Visualização de KPIs
1. Acesse `/dashboard`
2. Selecione uma faculdade no seletor
3. **Resultado Esperado**: 
   - Cards de KPIs exibidos:
     - Total de Conversas
     - Prospects Ativos
     - Matrículas do Mês
     - Receita do Mês
     - Taxa de Conversão
     - Taxa de Automação
     - Tempo Médio de Resposta
     - Satisfação Média

#### 3.2 Gráficos
1. No dashboard, verifique os gráficos:
   - Horários de Pico
   - Setores Mais Acionados
2. **Resultado Esperado**: 
   - Gráficos renderizados com dados reais
   - Dados atualizados ao trocar faculdade

---

### 4. Gestão de Prospects

#### 4.1 Listar Prospects
1. Acesse `/dashboard/prospects`
2. Selecione uma faculdade
3. **Resultado Esperado**: 
   - Lista de prospects exibida
   - Paginação funcionando (se houver mais de 20)

#### 4.2 Filtros
1. Use os filtros:
   - Busca por nome/email/telefone
   - Filtro por status
   - Filtro por curso
2. **Resultado Esperado**: 
   - Lista filtrada corretamente
   - Contadores atualizados

---

### 5. Conversas WhatsApp

#### 5.1 Listar Conversas
1. Acesse `/dashboard/conversas`
2. **Resultado Esperado**: 
   - Lista de conversas exibida
   - Status e badges corretos

#### 5.2 Selecionar Conversa
1. Clique em uma conversa na lista
2. **Resultado Esperado**: 
   - Área de mensagens exibida
   - Histórico carregado (se implementado)

---

### 6. Analytics

#### 6.1 Visualizar Gráficos
1. Acesse `/dashboard/analytics`
2. **Resultado Esperado**: 
   - Gráficos exibidos:
     - Conversas por Hora
     - Evolução Semanal
     - Distribuição por Setores
     - Funil de Conversão

---

### 7. Relatórios

#### 7.1 Gerar Relatório
1. Acesse `/dashboard/relatorios`
2. Selecione período (dia, semana, mês, etc.)
3. **Resultado Esperado**: 
   - Dados atualizados conforme período
   - Gráficos refletem o período selecionado

#### 7.2 Exportar Relatório
1. Clique em "Exportar"
2. Selecione formato (PDF, Excel, CSV)
3. **Resultado Esperado**: 
   - Arquivo baixado ou impresso
   - Dados corretos no arquivo

---

## 🐛 Testes de Erro

### Cenários de Erro a Testar

1. **Sem Conexão com Supabase**
   - Desconecte a internet
   - Tente fazer login
   - **Esperado**: Mensagem de erro clara

2. **Dados Inválidos na API**
   - Tente criar faculdade com CNPJ duplicado
   - **Esperado**: Mensagem de erro específica

3. **Sessão Expirada**
   - Aguarde expiração do token
   - Tente acessar dashboard
   - **Esperado**: Redirecionamento para login

---

## 📊 Checklist de Testes

### Funcionalidades Core
- [ ] Login/Logout
- [ ] CRUD de Faculdades
- [ ] Dashboard com KPIs
- [ ] Gráficos no Dashboard
- [ ] Listagem de Prospects
- [ ] Filtros de Prospects
- [ ] Listagem de Conversas
- [ ] Analytics
- [ ] Relatórios
- [ ] Exportação de Relatórios

### Validações
- [ ] Validação de email
- [ ] Validação de senha
- [ ] Validação de CNPJ
- [ ] Validação de telefone
- [ ] Validação de campos obrigatórios

### UX/UI
- [ ] Notificações Toast
- [ ] Estados de Loading
- [ ] Mensagens de Erro
- [ ] Responsividade Mobile
- [ ] Acessibilidade

### Segurança
- [ ] Proteção de rotas
- [ ] Validação de tokens
- [ ] Sanitização de inputs

---

## 🔧 Comandos Úteis

```bash
# Executar testes unitários
npm test

# Executar em modo watch
npm test -- --watch

# Criar usuários de teste
npx tsx scripts/create-users.ts

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build
```

---

## 📝 Notas

- Sempre teste com dados reais do Supabase
- Verifique logs do console para erros
- Teste em diferentes navegadores
- Teste em dispositivos móveis
- Documente bugs encontrados

---

**Última atualização**: 2024

