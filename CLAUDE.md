# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma

Toda la comunicación con el usuario y toda la documentación (CLAUDE.md, `docs/`, README, comentarios, mensajes de commit y descripciones de PR) deben estar **en español**.

## Proyecto

Resttek: plataforma de gestión de restaurantes. Monorepo con npm workspaces (`packages/*`): una API Node.js, tres aplicaciones Angular 21 y una librería Angular compartida. El código, la documentación, los términos de dominio y los textos de la interfaz están en español. La documentación detallada está en `docs/arquitectura/` (general, api, frontend) y `docs/dominio/` (glosario, modelo-datos). Conviene leer la parte relevante antes de cualquier cambio no trivial, porque documenta muchas inconsistencias que existen a propósito.

| Paquete | Qué es | Puerto |
| --- | --- | --- |
| `api` (`@resttek/api`) | Express 5 + TypeScript (ESM), SQLite con `sqlite3`, JWT + bcrypt | 3000 |
| `web-admin` | Panel de administración (admin y gerentes) | 4200 |
| `web-empleados` | App de empleados: cocina, barra y salón | 4201 |
| `web-clientes` | App de pedidos para clientes | 4202 |
| `web-shared` | Librería compartida: store/servicio/guard de auth, interceptores, componentes de login y registro, token `API_URL` | — |

## Comandos

Todos desde la raíz del repo (Node 22+, npm 10+):

```bash
npm install              # instala y enlaza todos los workspaces
npm run seed             # carga datos de prueba en SQLite (idempotente, INSERT OR IGNORE)
npm run dev:api          # tsx watch, http://localhost:3000 (GET /health)
npm run dev:admin        # ng serve con proxy /api -> :3000
npm run dev:empleados
npm run dev:clientes
npm test                 # vitest run en packages/api
```

Ejecutar un solo test o filtrar (desde `packages/api`):

```bash
npx vitest run src/services/order.service.test.ts
npx vitest run -t "nombre del test"
npm run test:watch
```

Build de un frontend: `npm run build -w @resttek/web-admin` (igual para las otras apps). No hay script de lint ni tests en los frontends.

Credenciales de prueba tras el seed (la contraseña es el propio email): `admin@resttek.com`, `gerente1@resttek.com` (rol `manager`), `cocinero1@resttek.com`, `camarero1@resttek.com`, `cliente1@resttek.com`.

## Arquitectura de la API (`packages/api/src`)

Conviven dos estilos; hay que saber en cuál se está trabajando:

- **Hexagonal + DDD, solo en `employee`** (`contexts/employee/{domain,application,infrastructure}`): entidad `Employee` (constructor privado + factory `create()`, solo getters), value objects `Role` y `Email` (este último en `contexts/shared`), casos de uso con un único `execute()` e interfaces con prefijo `I` (`IEmployeeRepository`, `IAuthService`). El cableado de dependencias está en `infrastructure/http/dependencies.ts`. La autenticación (login y registro) vive aquí.
- **Por capas, en restaurant / dish / ingredient / order**: `models/` (interfaces planas + validadores `normalizeX()`) → `repositories/` (interfaz sin prefijo `I` + implementación `Sqlite*` en el mismo fichero) → `services/` (servicio con varios métodos; aquí va la validación) → `controllers/` → `routes/` (las dependencias se componen dentro del propio fichero de rutas).

Detalles clave:
- ESM con `module: nodenext`: los imports relativos y con alias **llevan extensión `.js`**. Los alias (`@config`, `@errors`, `@shared`, `@employee`, `@models`, `@repositories`, `@services`, `@controllers`, `@routes`, `@scripts`) se definen en `tsconfig.json`; los resuelve tsx en ejecución y `vite-tsconfig-paths` en los tests.
- Todas las rutas se montan en `app.ts` bajo `/api/v1`. Los routers anidados (`/restaurants/:restaurantId/...`) necesitan `Router({ mergeParams: true })`.
- Auth: `authenticate` / `authorize(roles)` en `contexts/shared/infrastructure/http/middlewares.ts`. Roles: `admin`, `manager`, `camarero`, `cocinero`, `cliente`. Variable de entorno `JWT_SECRET` (con valor por defecto en el código).
- Errores: heredan de `AppError` en `errors/DomainErrors.ts`; el `errorHandler` asigna el código HTTP por nombre de clase (lista de `*NotFoundError` → 404, `InvalidCredentialsError` → 401, cualquier otro `AppError` → 400). Un nuevo error 404 debe añadirse a esa lista. Excepción: `OrderController` gestiona sus errores él mismo en lugar de llamar a `next(error)`.
- BD: instancia única `dbConfig` (`config/database.ts`) con API de promesas (`run`/`all`/`get`). Las tablas se crean en `initialize()` con `CREATE TABLE IF NOT EXISTS` (no hay herramienta de migraciones). Usa `:memory:` si `NODE_ENV=test`; si no, `packages/api/resttek.db`. El paso de snake_case a camelCase se hace con alias en el SQL.
- Pedidos: al crear un pedido, un ítem con `quantity: N` se guarda como N filas de `order_items` con cantidad 1 (para seguir el estado de cada unidad). Flujo de estados: `pendiente → preparando → listo → entregado`.
- Los tests son unitarios y conviven con el código (`*.test.ts`), con dobles escritos a mano en `repositories/mocks/` y `contexts/employee/application/mocks/`. No hay tests de integración HTTP (supertest está instalado pero no se usa).

## Arquitectura de los frontends

- Angular 21: standalone components, signals, zoneless (sin `zone.js`), guards e interceptores funcionales, rutas con lazy loading.
- `web-admin` / `web-empleados`: `features/<feature>/{models,pages,services,store}` + `<feature>.routes.ts`. Los componentes hablan con un **Store** de signals (`providedIn: 'root'`, signals privadas expuestas con `asReadonly()`, trío `loading`/`error`/datos, HTTP mediante `firstValueFrom`). Los servicios construyen las URLs con `environment.apiUrl`. El `OrderStore` de `web-empleados` hace polling cada 30 s; el filtrado del menú por rol está en su `ShellComponent`.
- `web-clientes`: estructura distinta. Modelos, servicios y store centralizados en `core/`; las features son componentes sueltos que inyectan los servicios y usan `.subscribe()` directamente. El único store es `CartStore` (local, sin HTTP). Los servicios inyectan el token `API_URL`. El componente raíz se llama `App` (`app.ts`).
- `web-shared` se consume desde el código fuente (`main: src/index.ts`): hay que exportar lo nuevo en `src/index.ts` y reiniciar el servidor de desarrollo del frontend para ver los cambios.
- Estilos: el `src/styles.css` de cada app es una copia del design system (modo oscuro); `web-shared/src/lib/styles/base.css` no se importa en ningún sitio. Los cambios de estilo comunes hay que replicarlos en las tres apps.
- Los frontends acceden siempre a la API a través del proxy de desarrollo (`/api` → `localhost:3000`); `apiUrl` vale `/api/v1`.
