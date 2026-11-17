import { test, expect } from '@playwright/test'

test('la pantalla de login tiene un campo de email', async ({ page }) => {
  await page.goto('/login')
  await expect(page.locator('input[type=email], input[name=email]')).toBeVisible()
})
