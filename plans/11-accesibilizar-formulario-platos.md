# Plan: Accesibilizar el formulario de platos (WCAG 2.2 AA)

## Metadatos

| Campo | Valor |
|-------|-------|
| Issue | #11 |
| Título | Accesibilizar el formulario de platos |
| Fecha | 2026-11-17 |
| Autor | Ana Reina |
| Estado | borrador |
| Rama | feat/11-accesibilizar-formulario-platos |

## Objetivo y alcance

**Objetivo:** que el formulario de creación/edición de platos de `web-admin` cumpla WCAG 2.2 AA y pueda completarse y enviarse solo con teclado, con orden de tabulación lógico y foco visible. Debe existir un vídeo grabado con Playwright que lo demuestre.

**Dentro del alcance:**
- [dish-form.component.html](../packages/web-admin/src/app/features/dishes/pages/dish-form/dish-form.component.html), `.ts` y `.css`.
- Etiquetas asociadas, encabezado semántico, botones reales, validación con mensajes de error accesibles, foco visible.
- Instalar Playwright y un script que grabe el vídeo: crear un plato con teclado (Tab, Espacio, Enter, flechas) y mostrar un error al enviar con campos sin rellenar.

**Fuera del alcance:**
- Formularios de otras entidades (restaurantes, ingredientes, empleados).
- Cambios en la API y en el resto de pantallas.
- Auditoría completa de contraste de toda la app (solo los elementos del formulario).

## Contexto

- El formulario actual usa `div` en lugar de `label` (`fake-label`), de `h1` (`fake-title`) y de `button` (`div.btn`, `div.chip-remove`), por lo que no son enfocables ni operables con teclado. No hay `<form>`, ni `id`/`for`, ni validación (el envío sin datos llega a la API).
- Criterios WCAG 2.2 AA relevantes: 1.3.1 (información y relaciones), 2.1.1 (teclado), 2.4.3 (orden del foco), 2.4.7 y 2.4.11 (foco visible/no oculto), 3.3.1 (identificación de errores), 3.3.2 (etiquetas), 4.1.2 (nombre, rol, valor), 4.1.3 (mensajes de estado), 1.4.3 (contraste).
- Estilos: el `styles.css` de cada app es copia del design system; aquí solo se cambia el CSS del componente (el foco visible no se añade de forma global).
- `web-admin` no tiene tests (el plan #2 T1 prepara Vitest). Playwright no está instalado.
- Para grabar el vídeo hace falta API (3000) y `web-admin` (4200) levantados, con seed (`admin@resttek.com`, la contraseña es el propio email).

## Tareas

> Cada tarea debe poder hacerse en 5-10 min e incluye el test (TDD: rojo) y el código mínimo para que pase (verde).

- [x] **T1 – Instalar y configurar Playwright**
  - Test: `e2e/smoke.spec.ts` abre `http://localhost:4200/login` y comprueba que hay un campo de email (rojo si no hay config) (`packages/web-admin/e2e/smoke.spec.ts`).
  - Código: añadir `@playwright/test` como devDependency, `playwright.config.ts` con `use.video: 'on'`, `baseURL` y script `"e2e"` en `packages/web-admin/package.json`; instalar chromium.
- [x] **T2 – Helper de login y ruta del formulario**
  - Test: `e2e/helpers.spec.ts`/fixture que inicia sesión como admin y llega a `/restaurants/rest-1/dishes/new` (`e2e/fixtures.ts`).
  - Código: fixture `loggedInPage` reutilizable.
- [x] **T3 – Etiquetas asociadas a cada control**
  - Test: Vitest + `TestBed`: `getByLabel`-equivalente — cada `input/select/textarea` tiene un `label[for]` con su `id` y el texto correcto (`dish-form.component.spec.ts`).
  - Código: sustituir `div.fake-label` por `<label for>` y añadir `id`s (`dish-form.component.html`).
- [x] **T4 – Encabezados y estructura**
  - Test: existe un único `h1` con el título de página y un `h2` "Ingredientes del plato" (`dish-form.component.spec.ts`).
  - Código: `fake-title` → `h1`, `fake-subtitle` → `h2`; el enlace de volver con `aria-label="Volver a platos"`; `lucide-icon` decorativos con `aria-hidden` (`dish-form.component.html`).
- [x] **T5 – Botones reales operables con teclado**
  - Test: "Guardar", "Cancelar" (enlace), "Añadir ingrediente" y "Quitar <ingrediente>" son `button`/`a` con nombre accesible; pulsar Enter/Espacio sobre "Añadir" añade el ingrediente (`dish-form.component.spec.ts`).
  - Código: `div.btn` → `<button type="button">`, `chip-remove` → `<button aria-label="Quitar …">`, botones solo con icono con `aria-label` (`dish-form.component.html`).
- [x] **T6 – Envolver en `<form>` y enviar con Enter**
  - Test: disparar `submit` del `form` llama a `onSubmit`; Guardar es `type="submit"` (`dish-form.component.spec.ts`).
  - Código: `<form (ngSubmit)="onSubmit()" novalidate>`; los botones que no envían llevan `type="button"` (`dish-form.component.html`/`.ts`).
- [x] **T7 – Validación de campos obligatorios**
  - Test: enviar con nombre vacío y precio 0 no llama al store y deja `errors` con `name` y `price` (`dish-form.component.spec.ts`).
  - Código: método `validate()` y señal `fieldErrors`; `onSubmit` aborta si hay errores (`dish-form.component.ts`).
- [x] **T8 – Errores accesibles (3.3.1, 3.3.3, 4.1.3)**
  - Test: tras un envío inválido, cada campo erróneo tiene `aria-invalid="true"` y `aria-describedby` apuntando a un mensaje visible; hay un resumen con `role="alert"` y el foco pasa al primer campo con error (`dish-form.component.spec.ts`).
  - Código: mensajes `<p id="name-error">`, resumen de errores, `focus()` al primer inválido; `alert-error` de la API con `role="alert"` (`dish-form.component.html`/`.ts`).
- [x] **T9 – Campos obligatorios indicados y autocompletado**
  - Test: `name` y `price` tienen `required` y `aria-required`, y la etiqueta indica "(obligatorio)"; `price` con `min`, `step` e `inputmode` correctos (`dish-form.component.spec.ts`).
  - Código: atributos y texto en etiquetas (`dish-form.component.html`).
- [x] **T10 – Foco visible y contraste (solo este formulario)**
  - Test: Playwright comprueba que al tabular a cada control `:focus-visible` tiene `outline` ≠ `none` y ≥ 2px, y que no queda tapado por elementos fijos (`e2e/dish-form-a11y.spec.ts`).
  - Código: regla `:focus-visible` acotada al formulario en `dish-form.component.css` (sin tocar `styles.css` global), con contraste ≥ 3:1 (2.4.7, 2.4.11, 1.4.11).
- [x] **T11 – Orden de tabulación lógico**
  - Test: Playwright con Tab recorre en orden: volver → nombre → precio → categoría → disponible → descripción → selector ingrediente → cantidad → añadir → cancelar → guardar (`e2e/dish-form-a11y.spec.ts`).
  - Código: ajustar DOM si el orden difiere; sin `tabindex` positivos (`dish-form.component.html`).
  - Nota: el test pasó a la primera sin cambios de código, porque el orden del DOM ya era lógico tras T3–T6; queda como test de regresión.
- [x] **T12 – Revisión automática con axe**
  - Test: `@axe-core/playwright` sobre el formulario vacío y con errores no devuelve violaciones WCAG 2.2 AA (`e2e/dish-form-a11y.spec.ts`).
  - Código: corregir lo que reporte (`dish-form.component.*`).
- [x] **T13 – Vídeo de uso con teclado**
  - Test: `e2e/dish-form-keyboard.spec.ts` solo con `page.keyboard` (Tab, Shift+Tab, Espacio, Enter, flechas), sin clics: (1) abre el formulario, (2) pulsa Enter con campos vacíos y se ven los errores, (3) rellena nombre, precio, categoría, disponible y descripción, añade un ingrediente, (4) envía con Enter y comprueba que el plato aparece en la lista.
  - Código: configuración para guardar el vídeo en `docs/a11y/formulario-platos.webm` (copia desde `test-results` tras el test) y pausas breves (`slowMo`) para que se lea bien.
- [x] **T14 – Documentar**
  - Test: comprobar que el enlace del vídeo existe (revisión manual).
  - Código: nota en `docs/arquitectura/arquitectura-frontend.md` sobre cómo ejecutar `npm run e2e -w @resttek/web-admin` y dónde queda el vídeo.

## Criterios de aceptación

- [ ] El formulario se completa y se envía solo con teclado, con foco siempre visible y orden lógico.
- [ ] Cada campo tiene etiqueta asociada y los errores se anuncian y asocian al campo (`aria-invalid`, `aria-describedby`, `role="alert"`).
- [ ] Enviar sin rellenar los campos obligatorios muestra errores y no llama a la API.
- [ ] axe no reporta violaciones WCAG 2.2 AA en el formulario.
- [ ] Existe un vídeo con Playwright (`docs/a11y/formulario-platos.webm`) que muestra el uso con teclado (Tab, Espacio, Enter…) para crear un plato nuevo y un error por enviar con campos sin rellenar.
- [ ] Todos los tests pasan
- [ ] Todas las tareas están marcadas

## Dudas abiertas

> Preguntas para el usuario. Responde debajo de cada una.

1. ¿Qué campos son obligatorios y con qué reglas? Propongo: nombre obligatorio y precio > 0 (la API ya valida algo similar).
   - Respuesta: Los propuestos (nombre obligatorio, precio > 0).
2. ¿Dónde guardamos el vídeo y se versiona en git? Propongo `docs/a11y/formulario-platos.webm`.
   - Respuesta: Ok.
3. ¿Aceptas añadir `@playwright/test` y `@axe-core/playwright` como devDependencies de `web-admin`?
   - Respuesta: Sí.
4. ¿La accesibilidad se limita a este formulario o hay que extender los estilos de foco a toda la app?
   - Respuesta: Solo a este formulario.

## Decisiones tomadas

> Decisiones asumidas sin consultar. Corrígelas si no estás de acuerdo.

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| D1 | Validación en cliente al enviar (no al salir de cada campo) | Evita mensajes prematuros; el vídeo muestra el error al enviar | Validar con `blur` en cada campo |
| D2 | Mantener `ngModel` (template-driven) | Cambio mínimo, coherente con el resto de la app | Migrar a formularios reactivos |
| D3 | Pruebas unitarias con Vitest y e2e con Playwright | Playwright es necesario para el vídeo; Vitest viene con `ng test` | Solo tests e2e |
| D4 | El foco visible se define solo en `dish-form.component.css` | El usuario limitó la accesibilidad a este formulario | Estilo global en `styles.css` replicado en las tres apps |
| D5 | Playwright vive en `packages/web-admin/e2e` | Cerca de la app que prueba | Paquete raíz separado |
