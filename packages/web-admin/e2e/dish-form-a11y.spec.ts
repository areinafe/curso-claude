import { test, expect } from './fixtures'

test('el fixture inicia sesión y llega al formulario de nuevo plato', async ({ dishFormPage }) => {
  await expect(dishFormPage).toHaveURL(/\/restaurants\/rest-1\/dishes\/new$/)
  await expect(dishFormPage.getByText('Nuevo plato').first()).toBeVisible()
})

test('cada control muestra un foco visible de al menos 2px al tabular', async ({ dishFormPage: page }) => {
  await page.getByRole('link', { name: 'Volver a platos' }).focus()
  const main = page.locator('main')
  const controles = [
    { nombre: 'Nombre del plato', loc: main.getByLabel('Nombre del plato') },
    { nombre: 'Precio', loc: main.getByLabel('Precio') },
    { nombre: 'Categoría', loc: main.getByLabel('Categoría') },
    { nombre: 'Disponible', loc: main.getByLabel('Disponible') },
    { nombre: 'Descripción', loc: main.getByLabel('Descripción') },
    { nombre: 'Ingrediente', loc: main.getByLabel('Ingrediente', { exact: true }) },
    { nombre: 'Cantidad', loc: main.getByLabel('Cantidad') },
    { nombre: 'Añadir ingrediente', loc: main.getByRole('button', { name: 'Añadir ingrediente' }) },
    { nombre: 'Cancelar', loc: main.getByRole('link', { name: 'Cancelar' }) },
    { nombre: 'Guardar', loc: main.getByRole('button', { name: 'Guardar' }) }
  ]
  const foco = () => page.evaluate(() => {
    const el = document.activeElement as HTMLElement
    const estilo = getComputedStyle(el)
    return { outlineStyle: estilo.outlineStyle, outlineWidth: parseFloat(estilo.outlineWidth) }
  })

  expect((await foco()).outlineStyle).not.toBe('none')
  for (const { nombre, loc } of controles) {
    await page.keyboard.press('Tab')
    await expect(loc, `foco en ${nombre}`).toBeFocused()
    const { outlineStyle, outlineWidth } = await foco()
    expect(outlineStyle, `outline-style en ${nombre}`).not.toBe('none')
    expect(outlineWidth, `outline-width en ${nombre}`).toBeGreaterThanOrEqual(2)
  }
})

test('el orden de tabulación sigue el orden visual y no hay tabindex positivos', async ({ dishFormPage: page }) => {
  expect(await page.locator('main [tabindex]').evaluateAll(els => els.filter(e => Number(e.getAttribute('tabindex')) > 0).length)).toBe(0)

  await page.getByRole('link', { name: 'Volver a platos' }).focus()
  const orden: string[] = []
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab')
    orden.push(await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      return el.id || el.getAttribute('aria-label') || el.textContent?.trim() || el.tagName
    }))
  }
  expect(orden).toEqual([
    'dish-name', 'dish-price', 'dish-category', 'dish-available', 'dish-description',
    'new-ingredient-id', 'new-ingredient-qty', 'Añadir ingrediente', 'Cancelar', 'Guardar'
  ])

  await page.keyboard.press('Shift+Tab')
  await expect(page.locator('main').getByRole('link', { name: 'Cancelar' })).toBeFocused()
})
