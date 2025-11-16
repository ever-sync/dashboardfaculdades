# 🔧 Configuração do Git

## 1. Configurar Identidade do Git

Antes de fazer commit, você precisa configurar seu nome e email:

```powershell
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

**Exemplo:**
```powershell
git config --global user.name "Giuliano"
git config --global user.email "giuliano@exemplo.com"
```

---

## 2. Fazer o Commit

Depois de configurar, execute:

```powershell
git commit -m "feat: Implementação completa do dashboard de faculdades

- Autenticação robusta com Supabase Auth
- CRUD completo de faculdades
- Sistema de validações robustas
- Notificações toast para feedback
- Gráficos reais no dashboard
- Dados reais nos relatórios
- Exportação de relatórios (PDF/Excel/CSV)
- Testes unitários (Jest)
- Testes E2E (Playwright)
- Documentação completa"
```

---

## 3. Configurar Remote (GitHub/GitLab/etc)

### Se você já tem um repositório criado:

```powershell
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
```

### Ou se for SSH:

```powershell
git remote add origin git@github.com:seu-usuario/seu-repositorio.git
```

---

## 4. Fazer Push

```powershell
git push -u origin main
```

Se a branch for `master` em vez de `main`:

```powershell
git push -u origin master
```

---

## 📋 Comandos Completos (Copy & Paste)

```powershell
# 1. Configurar Git (substitua pelos seus dados)
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# 2. Fazer commit
git commit -m "feat: Implementação completa do dashboard de faculdades

- Autenticação robusta com Supabase Auth
- CRUD completo de faculdades
- Sistema de validações robustas
- Notificações toast para feedback
- Gráficos reais no dashboard
- Dados reais nos relatórios
- Exportação de relatórios (PDF/Excel/CSV)
- Testes unitários (Jest)
- Testes E2E (Playwright)
- Documentação completa"

# 3. Adicionar remote (substitua pela URL do seu repositório)
git remote add origin https://github.com/seu-usuario/seu-repositorio.git

# 4. Fazer push
git push -u origin main
```

---

## 🔍 Verificar Status

```powershell
# Ver status
git status

# Ver remotes configurados
git remote -v

# Ver histórico de commits
git log --oneline
```

---

## ⚠️ Importante

- **Nunca commite** arquivos `.env` ou `.env.local` (já estão no .gitignore)
- **Nunca commite** `node_modules` (já está no .gitignore)
- Certifique-se de que as credenciais do Supabase não estão no código

---

## 🆘 Problemas Comuns

### Erro: "remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
```

### Erro: "failed to push some refs"
```powershell
git pull origin main --rebase
git push -u origin main
```

---

**Boa sorte! 🚀**

