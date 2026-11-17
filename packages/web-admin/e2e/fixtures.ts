import { test as base, type Page } from '@playwright/test'

export const DISH_FORM_URL = '/restaurants/rest-1/dishes/new'

export async function login(page: Page, email = 'admin@resttek.com'): Promise<void> {
  await page.goto('/login')
  await page.locator('input[type=email], input[name=email]').fill(email)
  await page.locator('input[type=password]').fill(email)
  await page.keyboard.press('Enter')
  await page.waitForURL(/\/dashboard$/)
}

export const test = base.extend<{ dishFormPage: Page }>({
  dishFormPage: async ({ page }, use) => {
    await login(page)
    await page.goto(DISH_FORM_URL)
    await use(page)
  }
})

export { expect } from '@playwright/test'
