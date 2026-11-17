import { test, expect } from './fixtures'

test('el fixture inicia sesión y llega al formulario de nuevo plato', async ({ dishFormPage }) => {
  await expect(dishFormPage).toHaveURL(/\/restaurants\/rest-1\/dishes\/new$/)
  await expect(dishFormPage.getByText('Nuevo plato').first()).toBeVisible()
})
