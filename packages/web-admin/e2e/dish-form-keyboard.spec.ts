import path from 'node:path'
import { test, expect, login, DISH_FORM_URL } from './fixtures'

const VIDEO = path.join(process.cwd(), '../../docs/a11y/formulario-platos.webm')
const PAUSA = 700

// Muestra en pantalla la tecla pulsada para que se entienda el vídeo
const MOSTRAR_TECLAS = () => {
  window.addEventListener('DOMContentLoaded', () => {
    const el = document.createElement('div')
    el.setAttribute('aria-hidden', 'true')
    el.style.cssText =
      'position:fixed;right:16px;bottom:16px;z-index:99999;padding:8px 16px;border-radius:8px;' +
      'background:#fff;color:#000;font:600 18px monospace;opacity:0;transition:opacity .15s;pointer-events:none'
    document.body.appendChild(el)
    window.addEventListener('keydown', e => {
      el.textContent = e.key === ' ' ? 'Espacio' : e.key
      el.style.opacity = '1'
      setTimeout(() => (el.style.opacity = '0'), 900)
    }, true)
  })
}

test('vídeo: crear un plato nuevo usando solo el teclado', async ({ browser }) => {
  test.setTimeout(180_000)
  // Sesión iniciada en un contexto aparte para que el vídeo empiece ya en el formulario
  const preparacion = await browser.newContext()
  await login(await preparacion.newPage())
  const estado = await preparacion.storageState()
  await preparacion.close()

  const context = await browser.newContext({
    storageState: estado,
    viewport: { width: 1280, height: 720 },
    recordVideo: { dir: 'test-results/video-teclado', size: { width: 1280, height: 720 } }
  })
  const page = await context.newPage()
  await page.addInitScript(MOSTRAR_TECLAS)
  await page.goto(DISH_FORM_URL)

  const pulsar = async (tecla: string) => {
    await page.keyboard.press(tecla)
    await page.waitForTimeout(PAUSA)
  }
  const escribir = async (texto: string) => {
    await page.keyboard.type(texto, { delay: 90 })
    await page.waitForTimeout(PAUSA)
  }
  const main = page.locator('main')

  // Punto de partida: se salta el menú lateral colocando el foco en el enlace de volver
  await main.getByRole('link', { name: 'Volver a platos' }).focus()
  await page.waitForTimeout(1200)

  // 1. Enviar con Enter sin rellenar nada: aparecen los errores
  await pulsar('Tab')
  await expect(main.getByLabel('Nombre del plato')).toBeFocused()
  await pulsar('Enter')
  await expect(main.getByRole('alert')).toContainText('2 campos con errores')
  await expect(main.getByLabel('Nombre del plato')).toBeFocused()
  await page.waitForTimeout(1800)

  // 2. Rellenar los campos con Tab, escritura, flechas y Espacio
  await escribir('Tarta de queso')
  await pulsar('Tab')
  await expect(main.getByLabel('Precio')).toBeFocused()
  await page.keyboard.press('Control+a')
  await escribir('6.5')
  await pulsar('Tab')
  await expect(main.getByLabel('Categoría')).toBeFocused()
  await pulsar('ArrowDown')
  await expect(main.getByLabel('Categoría')).toHaveValue('postre')
  await pulsar('Tab')
  await expect(main.getByLabel('Disponible')).toBeFocused()
  await pulsar('Tab')
  await expect(main.getByLabel('Descripción')).toBeFocused()
  await escribir('Tarta cremosa con base de galleta')
  await pulsar('Tab')
  await expect(main.getByLabel('Ingrediente', { exact: true })).toBeFocused()
  await pulsar('ArrowDown')
  await pulsar('Tab')
  await expect(main.getByLabel('Cantidad')).toBeFocused()
  await page.keyboard.press('Control+a')
  await escribir('2')
  await pulsar('Tab')
  const anadir = main.getByRole('button', { name: 'Añadir ingrediente' })
  await expect(anadir).toBeFocused()
  await pulsar('Space')
  await expect(main.locator('.ingredient-chip')).toHaveCount(1)
  await page.waitForTimeout(1200)

  // 3. Ir a Guardar y enviar con Enter
  await pulsar('Tab')
  await expect(main.getByRole('link', { name: 'Cancelar' })).toBeFocused()
  await pulsar('Tab')
  await expect(main.getByRole('button', { name: 'Guardar' })).toBeFocused()
  await pulsar('Enter')

  await expect(page).toHaveURL(/\/restaurants\/rest-1\/dishes$/)
  await expect(main.getByText('Tarta de queso')).toBeVisible()
  await page.waitForTimeout(2000)

  await context.close()
  await page.video()!.saveAs(VIDEO)
})
