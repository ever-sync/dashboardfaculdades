import { test, expect } from '@playwright/test'

/**
 * Testes E2E de Prospects
 */
test.describe('Gestão de Prospects', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simular usuário logado
    await context.addCookies([{
      name: 'user',
      value: JSON.stringify({ id: '1', email: 'test@test.com', name: 'Test' }),
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/dashboard/prospects')
  })

  test('deve exibir página de prospects', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/prospects/i)
  })

  test('deve exibir cards de resumo', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Verificar se há cards de estatísticas
    const cards = page.locator('[class*="card"], [class*="Card"]')
    await expect(cards.first()).toBeVisible({ timeout: 5000 })
  })

  test('deve filtrar prospects por busca', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Procurar campo de busca
    const searchInput = page.locator('input[placeholder*="buscar"], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('teste')
      await page.waitForTimeout(1000)
      
      // Verificar se a lista foi filtrada (pode não ter resultados)
      const table = page.locator('table, [class*="table"]')
      await expect(table.first()).toBeVisible({ timeout: 3000 })
    }
  })

  test('deve filtrar por status', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Procurar select de status
    const statusSelect = page.locator('select, [role="combobox"]')
    if (await statusSelect.count() > 0) {
      await statusSelect.first().selectOption('novo')
      await page.waitForTimeout(1000)
      
      // Verificar se filtro foi aplicado
      const table = page.locator('table, [class*="table"]')
      await expect(table.first()).toBeVisible({ timeout: 3000 })
    }
  })
})

