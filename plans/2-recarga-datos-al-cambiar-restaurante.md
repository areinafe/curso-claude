# Plan: Recargar ingredientes y platos al cambiar de restaurante

## Metadatos

| Campo | Valor |
|-------|-------|
| Issue | #2 |
| Título | No cargan los datos |
| Fecha | 2026-11-17 |
| Autor | Ana Reina |
| Estado | borrador |
| Rama | fix/2-recarga-datos-restaurante |

## Objetivo y alcance

**Objetivo:** que al navegar de `/restaurants/rest-1/ingredients` a `/restaurants/rest-2/ingredients` (y lo mismo con platos) se carguen y muestren los datos del restaurante 2.

**Dentro del alcance:**
- `IngredientListComponent`, `DishListComponent` y `EmployeeListComponent` reaccionan a cambios de `restaurantId`.
- `RestaurantDashboardComponent` actualiza el nombre del restaurante al cambiar de `restaurantId` (hoy lo calcula una sola vez en `ngOnInit`).
- Los stores descartan respuestas obsoletas (carrera entre dos cargas) y vacían la lista al cambiar de restaurante.
- Preparar el runner de tests de `web-admin` (hoy no existe).

**Fuera del alcance:**
- Cambios en la API.
- Bug #3 (plan aparte, aunque toca los mismos componentes).

## Contexto

- **Causa confirmada** (reproducida el 2026-11-17 con Chrome automatizado contra la app real): al pulsar Ingredientes (o Platos) del restaurante 2 desde la lista del restaurante 1, la URL cambia a `/restaurants/rest-2/...` pero **no se lanza ninguna petición a la API** y la tabla sigue mostrando los datos del restaurante 1 (Tomate, Queso mozzarella… / Pizza Margarita, Ensalada Caprese…). Angular reutiliza la misma instancia del componente al cambiar solo el parámetro `:restaurantId`, y `ngOnInit` solo se ejecuta una vez. Ambos listados leen `this.route.parent?.snapshot.params['restaurantId']` en `ngOnInit` ([dish-list.component.ts](../packages/web-admin/src/app/features/dishes/pages/dish-list/dish-list.component.ts), [ingredient-list.component.ts](../packages/web-admin/src/app/features/ingredients/pages/ingredient-list/ingredient-list.component.ts)), por lo que nunca se recarga.
- `EmployeeListComponent` ([employee-list.component.ts](../packages/web-admin/src/app/features/employees/pages/employee-list/employee-list.component.ts)) y `RestaurantDashboardComponent` ([restaurant-dashboard.component.ts](../packages/web-admin/src/app/features/restaurants/pages/restaurant-dashboard/restaurant-dashboard.component.ts)) tienen el mismo patrón (lectura única del snapshot en `ngOnInit`); no se han reproducido en navegador, se deducen del código. El dashboard fija `restaurantName` una vez, así que mostraría el nombre del restaurante anterior.
- Los stores ([dish.store.ts](../packages/web-admin/src/app/features/dishes/store/dish.store.ts), [ingredient.store.ts](../packages/web-admin/src/app/features/ingredients/store/ingredient.store.ts)) son `providedIn: 'root'` y conservan los datos anteriores. `IngredientStore` guarda `_currentRestaurantId` pero no lo usa.
- Angular 21 zoneless, signals. `web-admin` no tiene tests ni target `test` en `angular.json`. Angular 21 soporta `@angular/build:unit-test` con Vitest.
- Convenciones: ver `docs/arquitectura/arquitectura-frontend.md`; textos en español.

## Tareas

> Cada tarea debe poder hacerse en 5-10 min e incluye el test (TDD: rojo) y el código mínimo para que pase (verde).

- [x] **T1 – Preparar runner de tests en web-admin**
  - Test: un test trivial `it('arranca el runner')` que pasa con `ng test` (`packages/web-admin/src/app/features/ingredients/store/ingredient.store.spec.ts`).
  - Código: añadir target `test` (`@angular/build:unit-test`, runner vitest) en `angular.json`, dependencias `vitest` y `jsdom`, y script `"test": "ng test --watch=false"` en `packages/web-admin/package.json`.
- [x] **T2 – IngredientStore: descartar respuesta obsoleta**
  - Test: con un `IngredientService` falso que resuelve la carga de `rest-1` después que la de `rest-2`, tras ambas el store contiene solo los de `rest-2` (`ingredient.store.spec.ts`).
  - Código: usar `_currentRestaurantId` para ignorar resultados/errores/`loading` de cargas que ya no son la actual (`ingredient.store.ts`).
- [x] **T3 – IngredientStore: vaciar lista al cambiar de restaurante**
  - Test: al llamar `loadByRestaurant('rest-2')` tras `rest-1`, `ingredients()` es `[]` mientras carga (`ingredient.store.spec.ts`).
  - Código: `this._ingredients.set([])` si el id cambia (`ingredient.store.ts`).
- [x] **T4 – DishStore: mismas dos garantías**
  - Test: mismos dos casos que T2 y T3 para platos (`dishes/store/dish.store.spec.ts`).
  - Código: añadir `_currentRestaurantId` y la misma lógica (`dish.store.ts`).
- [x] **T5 – IngredientListComponent reacciona al cambio de ruta**
  - Test: con `TestBed` y un `ActivatedRoute` con `paramMap` observable, emitir `rest-1` y luego `rest-2` provoca dos llamadas a `loadByRestaurant` con cada id (`ingredient-list.component.spec.ts`).
  - Código: sustituir la lectura del snapshot por suscripción a los params (`toSignal`/`effect` sobre `route.parent.paramMap`) y derivar `restaurantId` de ahí (`ingredient-list.component.ts`).
- [x] **T6 – DishListComponent reacciona al cambio de ruta**
  - Test: igual que T5 para platos (`dish-list.component.spec.ts`).
  - Código: mismo cambio (`dish-list.component.ts`).
- [ ] **T7 – EmployeeStore + EmployeeListComponent**
  - Test: store: una respuesta obsoleta no pisa la actual y la lista se vacía al cambiar de restaurante (`employees/store/employee.store.spec.ts`); componente: emitir `rest-1` y luego `rest-2` llama a `loadByRestaurant` con cada id (`employee-list.component.spec.ts`).
  - Código: misma lógica que T2-T3 en `employee.store.ts` (`loadByRestaurant`) y la suscripción a params en `employee-list.component.ts`.
- [ ] **T8 – RestaurantDashboardComponent actualiza el nombre**
  - Test: emitir `rest-1` y luego `rest-2` en `paramMap` cambia `restaurantName()` de un restaurante al otro, con el `RestaurantStore` falso cargado (`restaurant-dashboard.component.spec.ts`).
  - Código: derivar `restaurantId` de `paramMap` y `restaurantName` como `computed` sobre `restaurantStore.getById` (`restaurant-dashboard.component.ts`).
- [ ] **T9 – Comprobación manual en navegador**
  - Test: con API y seed levantados, pulsar Ingredientes de rest-1 y luego de rest-2 en el menú lateral; repetir con Platos, Empleados y Dashboard. Los datos y el nombre cambian (comprobación manual documentada en el PR).
  - Código: solo ajustes si falla algo.
- [ ] **T10 – Actualizar documentación**
  - Test: `npm run test -w @resttek/web-admin` pasa en verde (comprobación del script).
  - Código: actualizar `CLAUDE.md` (la frase "No hay script de lint ni tests en los frontends" y la tabla de comandos) para reflejar que `web-admin` tiene tests (`CLAUDE.md`).

## Criterios de aceptación

- [ ] Desde ingredientes del restaurante 1, pulsar ingredientes del restaurante 2 muestra los del 2.
- [ ] Lo mismo con platos y empleados.
- [ ] El dashboard del restaurante muestra el nombre del restaurante actual al cambiar de uno a otro.
- [ ] Una respuesta lenta de un restaurante anterior no pisa los datos del actual.
- [ ] Todos los tests pasan
- [ ] Todas las tareas están marcadas

## Dudas abiertas

> Preguntas para el usuario. Responde debajo de cada una.

1. ¿Te parece bien introducir Vitest (vía `ng test`) en `web-admin`, dado que hoy no hay tests en los frontends y CLAUDE.md lo indica explícitamente?
   - Respuesta: Sí.
2. ¿Arreglamos también `employee-list` y `restaurant-dashboard`, que tienen el mismo patrón?
   - Respuesta: Sí (incluidos en T7 y T8).

## Decisiones tomadas

> Decisiones asumidas sin consultar. Corrígelas si no estás de acuerdo.

| # | Decisión | Motivo | Alternativa descartada |
|---|----------|--------|------------------------|
| D1 | Suscribirse a `paramMap` en los componentes | Cambio mínimo y local | Forzar recreación del componente con `RouteReuseStrategy` o `onSameUrlNavigation` (afecta a toda la app) |
| D2 | Proteger además los stores contra respuestas obsoletas | Evita carreras al navegar rápido | Confiar solo en el componente |
| D3 | Tras la respuesta a la duda 1, `CLAUDE.md` se actualiza al terminar para indicar que `web-admin` tiene tests (`npm run test -w @resttek/web-admin`) | Evitar documentación desfasada | Dejarlo para otro issue |
