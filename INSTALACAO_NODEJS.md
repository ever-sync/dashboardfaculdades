# 📦 Guia de Instalação do Node.js

O Node.js não está instalado no seu sistema. Siga este guia para instalar.

---

## 🚀 Método 1: Instalação via Site Oficial (Recomendado)

### Passo 1: Baixar o Node.js
1. Acesse: https://nodejs.org/
2. Baixe a versão **LTS** (Long Term Support) - recomendada
3. Escolha o instalador para Windows (`.msi`)

### Passo 2: Instalar
1. Execute o arquivo `.msi` baixado
2. Siga o assistente de instalação
3. **IMPORTANTE**: Marque a opção "Add to PATH" durante a instalação
4. Clique em "Install"

### Passo 3: Verificar Instalação
Abra um **novo** PowerShell e execute:
```powershell
node --version
npm --version
```

Se mostrar as versões, está instalado corretamente!

---

## 🚀 Método 2: Instalação via Chocolatey (Alternativa)

Se você tem o Chocolatey instalado:

```powershell
choco install nodejs-lts
```

---

## 🚀 Método 3: Instalação via Winget (Windows 10/11)

```powershell
winget install OpenJS.NodeJS.LTS
```

---

## ✅ Após a Instalação

### 1. Reiniciar o Terminal
**IMPORTANTE**: Feche e abra novamente o PowerShell/Terminal para que as variáveis de ambiente sejam atualizadas.

### 2. Verificar Instalação
```powershell
node --version
npm --version
```

### 3. Instalar Dependências do Projeto
```powershell
cd C:\Users\Giuliano\Documents\trae_projects\dashboardfaculdades
npm install
```

### 4. Instalar Browsers do Playwright
```powershell
npx playwright install
```

### 5. Criar Usuários no Supabase
```powershell
npx tsx scripts/create-users.ts
```

---

## 🔧 Solução de Problemas

### Se o Node.js ainda não for reconhecido após instalação:

1. **Verificar PATH:**
   - Pressione `Win + R`
   - Digite `sysdm.cpl` e pressione Enter
   - Aba "Avançado" → "Variáveis de Ambiente"
   - Em "Variáveis do sistema", encontre "Path"
   - Verifique se contém: `C:\Program Files\nodejs\`
   - Se não tiver, adicione manualmente

2. **Reiniciar o Computador:**
   - Às vezes é necessário reiniciar para atualizar o PATH

3. **Verificar Instalação:**
   ```powershell
   Get-Command node
   Get-Command npm
   ```

---

## 📋 Versões Recomendadas

- **Node.js**: 18.x ou 20.x (LTS)
- **npm**: Vem junto com o Node.js (geralmente 9.x ou 10.x)

---

## 🎯 Próximos Passos Após Instalação

1. ✅ Instalar Node.js
2. ✅ Reiniciar terminal
3. ✅ Verificar instalação (`node --version`)
4. ✅ Instalar dependências (`npm install`)
5. ✅ Instalar Playwright (`npx playwright install`)
6. ✅ Criar usuários (`npx tsx scripts/create-users.ts`)
7. ✅ Iniciar projeto (`npm run dev`)

---

## 💡 Dica

Se você usar o **Visual Studio Code**, pode instalar o Node.js diretamente pelo terminal integrado, que geralmente detecta automaticamente.

---

**Precisa de ajuda?** Verifique a documentação oficial: https://nodejs.org/

