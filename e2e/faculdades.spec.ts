import { test, expect } from '@playwright/test'

/**
 * Testes E2E de Gestão de Faculdades
 */
test.describe('Gestão de Faculdades', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simular usuário logado
    await context.addCookies([{
      name: 'user',
      value: JSON.stringify({ id: '1', email: 'test@test.com', name: 'Test' }),
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/dashboard/faculdades')
  })

  test('deve exibir página de faculdades', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/faculdades/i)
  })

  test('deve abrir modal ao clicar em Nova Faculdade', async ({ page }) => {
    await page.click('button:has-text("Nova Faculdade"), button:has-text("Adicionar")')
    
    // Aguardar modal aparecer
    await page.waitForSelector('form, [role="dialog"]', { timeout: 5000 })
    
    // Verificar se há campo de nome
    await expect(page.locator('input, label:has-text("Nome")')).toBeVisible()
  })

  test('deve validar formulário de faculdade', async ({ page }) => {
    await page.click('button:has-text("Nova Faculdade"), button:has-text("Adicionar")')
    await page.waitForSelector('form', { timeout: 5000 })
    
    // Tentar salvar sem preencher nome
    await page.click('button[type="submit"]:has-text("Salvar")')
    
    // Verificar mensagem de erro
    await page.waitForTimeout(500)
    const errorMessage = page.locator('text=/obrigatório|erro/i')
    await expect(errorMessage.first()).toBeVisible({ timeout: 3000 })
  })

  test('deve validar email inválido', async ({ page }) => {
    await page.click('button:has-text("Nova Faculdade"), button:has-text("Adicionar")')
    await page.waitForSelector('form', { timeout: 5000 })
    
    // Preencher nome
    await page.fill('input[placeholder*="nome"], label:has-text("Nome") + input, input[type="text"]', 'Faculdade Teste')
    
    // Preencher email inválido
    const emailInput = page.locator('input[type="email"]')
    if (await emailInput.count() > 0) {
      await emailInput.fill('email-invalido')
      await page.click('button[type="submit"]:has-text("Salvar")')
      
      // Verificar erro de email
      await page.waitForTimeout(500)
      const errorMessage = page.locator('text=/email|inválido/i')
      await expect(errorMessage.first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('deve fechar modal ao clicar em Cancelar', async ({ page }) => {
    await page.click('button:has-text("Nova Faculdade"), button:has-text("Adicionar")')
    await page.waitForSelector('form', { timeout: 5000 })
    
    await page.click('button:has-text("Cancelar")')
    
    // Modal deve desaparecer
    await page.waitForTimeout(500)
    const modal = page.locator('form, [role="dialog"]')
    await expect(modal).not.toBeVisible({ timeout: 2000 })
  })
})

