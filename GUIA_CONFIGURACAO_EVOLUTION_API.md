# 🔑 Guia: Onde Configurar a API KEY da Evolution

## 📍 Opções de Configuração

Você tem **3 opções** para configurar a API KEY da Evolution API. O sistema usa a seguinte ordem de prioridade:

1. **Banco de Dados** (tabela `configuracoes_globais`) - **RECOMENDADO** ✅
2. **Variáveis de Ambiente** (`.env.local` ou Vercel)
3. **Página de Configurações** (interface do app)

---

## 🎯 Opção 1: Banco de Dados (Recomendado)

### Vantagens:
- ✅ Configuração centralizada
- ✅ Pode ser alterada sem redeploy
- ✅ Interface visual no app
- ✅ Suporte a múltiplas faculdades

### Como Configurar:

#### Método A: Via Interface do App (Em breve)
1. Acesse: `/dashboard/configuracoes`
2. Na seção "Integração WhatsApp"
3. Preencha os campos:
   - **URL da API**: `https://api.eversync.com.br` (ou sua URL)
   - **API Key**: Sua chave da Evolution API
4. Clique em "Salvar Configurações"

#### Método B: Via SQL (Direto no Supabase)
1. Acesse o Supabase Dashboard
2. Vá em **SQL Editor**
3. Execute os seguintes comandos:

```sql
-- Inserir ou atualizar URL da Evolution API
INSERT INTO configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES (
  'evolution_api_url',
  'https://api.eversync.com.br',
  'URL base da Evolution API',
  'texto',
  false
)
ON CONFLICT (chave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = NOW();

-- Inserir ou atualizar API Key da Evolution API
INSERT INTO configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES (
  'evolution_api_key',
  'SUA_API_KEY_AQUI',
  'Chave de autenticação da Evolution API',
  'texto',
  true  -- Marcar como sensível para não expor
)
ON CONFLICT (chave) 
DO UPDATE SET 
  valor = EXCLUDED.valor,
  updated_at = NOW();
```

**⚠️ IMPORTANTE**: Substitua `SUA_API_KEY_AQUI` pela sua chave real da Evolution API.

---

## 🎯 Opção 2: Variáveis de Ambiente

### Vantagens:
- ✅ Seguro (não fica no banco)
- ✅ Fácil para desenvolvimento local
- ✅ Padrão para aplicações

### Como Configurar:

#### Desenvolvimento Local (`.env.local`)

1. Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Evolution API
EVOLUTION_API_URL=https://api.eversync.com.br
EVOLUTION_API_KEY=sua_chave_aqui
EVOLUTION_API_INSTANCE=nome_da_instancia
```

2. Reinicie o servidor de desenvolvimento:
```bash
npm run dev
```

#### Produção (Vercel)

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Settings** → **Environment Variables**
4. Adicione as variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `EVOLUTION_API_URL` | `https://api.eversync.com.br` | Production, Preview, Development |
| `EVOLUTION_API_KEY` | `sua_chave_aqui` | Production, Preview, Development |
| `EVOLUTION_API_INSTANCE` | `nome_da_instancia` | Production, Preview, Development |

5. Clique em **Save**
6. Faça um novo deploy (ou aguarde o próximo)

---

## 🎯 Opção 3: Página de Configurações (Interface)

### Status: ⚠️ Em desenvolvimento

A página `/dashboard/configuracoes` tem os campos, mas ainda não salva no banco. 

**Solução temporária**: Use a Opção 1 (Banco de Dados) ou Opção 2 (Variáveis de Ambiente).

---

## 🔍 Como Verificar se Está Configurado

### 1. Verificar no Banco de Dados

Execute no Supabase SQL Editor:

```sql
SELECT chave, 
       CASE 
         WHEN sensivel THEN '***' 
         ELSE valor 
       END as valor,
       descricao
FROM configuracoes_globais
WHERE chave IN ('evolution_api_url', 'evolution_api_key')
ORDER BY chave;
```

### 2. Verificar Variáveis de Ambiente

No terminal (desenvolvimento local):
```bash
# Windows PowerShell
echo $env:EVOLUTION_API_URL
echo $env:EVOLUTION_API_KEY

# Linux/Mac
echo $EVOLUTION_API_URL
echo $EVOLUTION_API_KEY
```

### 3. Testar a API

Acesse: `/dashboard/configuracoes` e clique em "Verificar Conexão"

---

## 📋 Checklist de Configuração

- [ ] API URL configurada (banco de dados ou variável de ambiente)
- [ ] API Key configurada (banco de dados ou variável de ambiente)
- [ ] Instância criada para cada faculdade (via `/dashboard/configuracoes`)
- [ ] QR Code escaneado (se necessário)
- [ ] Status mostra "Conectado" na página de configurações

---

## 🔐 Segurança

### Boas Práticas:

1. **Nunca commite** a API Key no Git
2. **Use variáveis de ambiente** em produção
3. **Marque como sensível** no banco de dados (`sensivel: true`)
4. **Rotacione a chave** periodicamente
5. **Use permissões restritas** na Evolution API

### Onde NÃO colocar:

- ❌ No código fonte
- ❌ Em arquivos versionados (`.env` sem `.local`)
- ❌ Em mensagens de commit
- ❌ Em logs públicos

---

## 🆘 Troubleshooting

### Erro: "Evolution API não configurada"

**Causa**: Nem banco de dados nem variáveis de ambiente têm a configuração.

**Solução**: 
1. Configure via banco de dados (Opção 1) OU
2. Configure via variáveis de ambiente (Opção 2)

### Erro: "Instância não está conectada"

**Causa**: A instância foi criada mas o QR code não foi escaneado.

**Solução**:
1. Acesse `/dashboard/configuracoes`
2. Clique em "Atualizar QR Code"
3. Escaneie com o WhatsApp

### Erro: "ID de faculdade é obrigatório"

**Causa**: Tentando criar instância sem selecionar faculdade.

**Solução**:
1. Selecione uma faculdade no seletor (canto superior direito)
2. Depois configure a instância

---

## 📞 Suporte

Se tiver problemas:
1. Verifique os logs do servidor
2. Verifique as variáveis de ambiente
3. Verifique a tabela `configuracoes_globais` no Supabase
4. Teste a conexão na página de configurações

---

## 📝 Exemplo Completo

### Configuração via SQL (Recomendado):

```sql
-- 1. Configurar URL
INSERT INTO configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES ('evolution_api_url', 'https://api.eversync.com.br', 'URL da Evolution API', 'texto', false)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;

-- 2. Configurar API Key (substitua pela sua chave real)
INSERT INTO configuracoes_globais (chave, valor, descricao, tipo, sensivel)
VALUES ('evolution_api_key', '4B3598CF2AE7-414B-9D7E-A7A09CD88449', 'API Key da Evolution', 'texto', true)
ON CONFLICT (chave) DO UPDATE SET valor = EXCLUDED.valor;
```

### Configuração via `.env.local`:

```env
EVOLUTION_API_URL=https://api.eversync.com.br
EVOLUTION_API_KEY=4B3598CF2AE7-414B-9D7E-A7A09CD88449
EVOLUTION_API_INSTANCE=minha-instancia
```

---

## ✅ Resumo Rápido

**Para começar rapidamente:**

1. **Configure no banco de dados** (mais fácil):
   - Execute o SQL acima no Supabase
   - Substitua a API Key pela sua

2. **Crie a instância**:
   - Acesse `/dashboard/configuracoes`
   - Selecione uma faculdade
   - Crie a instância
   - Escaneie o QR code

3. **Pronto!** ✅

