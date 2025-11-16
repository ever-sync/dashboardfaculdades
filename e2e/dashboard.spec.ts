import { test, expect } from '@playwright/test'

/**
 * Testes E2E do Dashboard
 */
test.describe('Dashboard', () => {
  test.beforeEach(async ({ page, context }) => {
    // Simular usuário logado
    await context.addCookies([{
      name: 'user',
      value: JSON.stringify({ id: '1', email: 'test@test.com', name: 'Test' }),
      domain: 'localhost',
      path: '/',
    }])
    
    await page.goto('/dashboard')
  })

  test('deve exibir dashboard principal', async ({ page }) => {
    await expect(page.locator('h1, h2')).toContainText(/dashboard|visão geral/i)
  })

  test('deve exibir cards de KPIs', async ({ page }) => {
    // Aguardar carregamento
    await page.waitForTimeout(2000)
    
    // Verificar se há cards de estatísticas
    const statsCards = page.locator('[class*="card"], [class*="Card"]')
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 })
  })

  test('deve exibir gráficos', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Verificar se há gráficos (SVG do Recharts)
    const charts = page.locator('svg')
    await expect(charts.first()).toBeVisible({ timeout: 10000 })
  })

  test('deve navegar para página de faculdades', async ({ page }) => {
    await page.click('a[href="/dashboard/faculdades"], text=/faculdades/i')
    await page.waitForURL('/dashboard/faculdades', { timeout: 5000 })
    await expect(page).toHaveURL(/\/dashboard\/faculdades/)
  })

  test('deve navegar para página de prospects', async ({ page }) => {
    await page.click('a[href="/dashboard/prospects"], text=/prospects/i')
    await page.waitForURL('/dashboard/prospects', { timeout: 5000 })
    await expect(page).toHaveURL(/\/dashboard\/prospects/)
  })
})

