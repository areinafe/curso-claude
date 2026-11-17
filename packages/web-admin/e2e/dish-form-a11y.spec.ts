import AxeBuilder from '@axe-core/playwright'
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

const ETIQUETAS_WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const analizar = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(() => {
    const el = document.querySelector('main .fade-in')
    return !!el && getComputedStyle(el).opacity === '1' && document.getAnimations().every(a => a.playState !== 'running' || a.effect?.getComputedTiming().iterations === Infinity)
  })
  // Espera a que terminen las animaciones (fade-in) para que axe calcule bien los contrastes
  await page.evaluate(() => Promise.all(document.getAnimations().filter(a => a.effect?.getComputedTiming().iterations !== Infinity).map(a => a.finished.catch(() => undefined))))
  return new AxeBuilder({ page }).include('main').withTags(ETIQUETAS_WCAG).analyze()
}
const resumen = (v: { id: string; nodes: { target: unknown }[] }[]) => v.map(x => `${x.id}: ${x.nodes.map(n => String(n.target)).join(' | ')}`)

test('axe no encuentra violaciones WCAG 2.2 AA en el formulario vacío', async ({ dishFormPage: page }) => {
  const { violations } = await analizar(page)
  expect(resumen(violations)).toEqual([])
})

test('axe no encuentra violaciones WCAG 2.2 AA con errores de validación', async ({ dishFormPage: page }) => {
  await page.getByRole('button', { name: 'Guardar' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  const { violations } = await analizar(page)
  expect(resumen(violations)).toEqual([])
})
