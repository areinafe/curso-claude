# Plan: Página en blanco al entrar directamente en la URL de platos

## Metadatos

| Campo | Valor |
|-------|-------|
| Issue | #3 |
| Título | Página en blanco al entrar en la url de platos |
| Fecha | 2026-11-17 |
| Autor | Ana Reina |
| Estado | borrador |
| Rama | fix/3-pagina-blanco-platos |

## Objetivo y alcance

**Objetivo:** que abrir directamente `http://localhost:4200/restaurants/rest-2/dishes` (o cualquier ruta anidada, como `/new` o `/:id/edit`) cargue la aplicación en lugar de quedarse en blanco.

**Dentro del alcance:**
- Añadir `<base href="/">` a `web-admin/src/index.html`.

**Fuera del alcance:**
- Recarga de datos al cambiar de restaurante (issue #2).
- Cambios en `web-empleados` y `web-clientes`.
- Cualquier otro cambio de routing.

## Contexto

- **Causa confirmada** (reproducida el 2026-11-17 con Chrome automatizado contra la app real): [index.html](../packages/web-admin/src/index.html) no tiene `<base href="/">`. Con una URL anidada como `/restaurants/rest-2/dishes`, el navegador resuelve los recursos relativos (`styles.css`, scripts) contra `/restaurants/rest-2/`; el servidor devuelve el `index.html` (404/MIME `text/html`) y la consola muestra `Refused to apply style from 'http://localhost:4200/restaurants/rest-2/styles.css' because its MIME type ('text/html') is not a supported stylesheet MIME type`. La aplicación no arranca y el `body` queda vacío.
- **Verificación de la solución**: con `<base href="/">` añadido temporalmente (cambio revertido), la misma URL directa muestra "Platos" con sus datos. `web-empleados` ya incluye `<base href="/">` en su `index.html`.
- Funcionaba al navegar desde el menú porque el bundle ya estaba cargado (navegación del router, sin recarga).
- Por decisión del usuario, este fix se valida con verificación manual, sin test automático (`web-admin` no tiene runner de tests y no se introduce aquí).

## Tareas

> Cada tarea debe poder hacerse en 5-10 min e incluye el test (TDD: rojo) y el código mínimo para que pase (verde).

- [x] **T1 – Añadir `<base href="/">`**
  - Test: antes del cambio, reproducir el fallo abriendo directamente `http://localhost:4200/restaurants/rest-2/dishes` (página en blanco y errores de MIME en consola); es la comprobación "roja" (sin test automático, por decisión del usuario).
  - Código: añadir `<base href="/">` tras `<meta charset>` (`packages/web-admin/src/index.html`).
- [ ] **T2 – Verificación manual en navegador**
  - Test: con API y `web-admin` levantados, abrir directamente `/restaurants/rest-2/dishes`, `/restaurants/rest-2/dishes/new` y `/restaurants/rest-2/ingredients`; recargar con F5 estando en cada una. Sin errores en consola (se documenta en el PR).
  - Código: ninguno.

## Criterios de aceptación

- [ ] Entrar directamente en `/restaurants/rest-2/dishes` muestra la página de platos con sus datos.
- [ ] Lo mismo con `/restaurants/rest-2/dishes/new`, `/restaurants/rest-2/ingredients` y recargando con F5.
- [ ] No hay errores de MIME ni 404 de recursos en la consola.
- [ ] Todos los tests pasan
- [ ] Todas las tareas están marcadas

## Dudas abiertas

> Preguntas para el usuario. Responde debajo de cada una.

1. ¿Prefieres que el test de regresión sea un test de Vitest sobre `index.html` (propuesto) o basta con la verificación manual de T2?
   - Respuesta: Basta con la verificación manual.

## Decisiones tomadas

> Decisiones asumidas sin consultar. Corrígelas si no estás de acuerdo.

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| D1 | Solucionar con `<base href="/">` | Es la causa confirmada y la misma solución que `web-empleados` | Configurar `baseHref` en `angular.json`, que cambia más cosas |
| D2 | No usar Playwright ni Vitest en este plan | El usuario decidió que basta la verificación manual; Playwright queda para el #11 | Test de Vitest sobre `index.html` o test e2e de entrada directa |
| D3 | Este plan es independiente de los planes #2 y #11 | No necesita infraestructura de tests | Esperar a que exista Vitest |
