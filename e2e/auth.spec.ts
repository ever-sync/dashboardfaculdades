import { test, expect } from '@playwright/test'

/**
 * Testes E2E de Autenticação
 */
test.describe('Autenticação', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('deve exibir página de login', async ({ page }) => {
    await expect(page).toHaveTitle(/WhatsApp Analytics Dashboard/)
    await expect(page.locator('h1')).toContainText('WhatsApp Analytics')
  })

  test('deve validar formulário de login', async ({ page }) => {
    // Tentar submeter sem preencher
    await page.click('button[type="submit"]')
    
    // Verificar mensagens de erro
    await expect(page.locator('input[type="email"]')).toBeFocused()
  })

  test('deve mostrar erro com credenciais inválidas', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Aguardar toast de erro (pode levar um tempo)
    await page.waitForTimeout(1000)
    
    // Verificar se há mensagem de erro (toast ou no formulário)
    const errorMessage = page.locator('text=/erro|inválid|credencial/i')
    await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })
  })

  test('deve fazer login com credenciais válidas (demo)', async ({ page }) => {
    // Usar credenciais demo se disponíveis
    await page.fill('input[type="email"]', 'admin@unifatecie.com.br')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    
    // Aguardar redirecionamento
    await page.waitForURL('/dashboard', { timeout: 10000 })
    
    // Verificar se está no dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('deve redirecionar para dashboard se já estiver logado', async ({ page, context }) => {
    // Simular cookie de usuário logado
    await context.addCookies([{
      name: 'user',
      value: JSON.stringify({ id: '1', email: 'test@test.com', name: 'Test' }),
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/login')
    
    // Deve redirecionar para dashboard
    await page.waitForURL('/dashboard', { timeout: 5000 })
  })
})

