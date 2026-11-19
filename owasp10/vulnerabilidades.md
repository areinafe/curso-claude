# Auditoría OWASP Top 10 de Resttek

Alcance: revisión estática de `packages/api/src` y de `packages/web-shared`, `web-admin`, `web-empleados` y `web-clientes`. Solo se incluyen hallazgos verificados leyendo el código. No se ejecutó la aplicación ni `npm audit`.
Las rutas de fichero son relativas a `packages/`.

## Resumen

| # | Hallazgo | OWASP | Severidad |
| --- | --- | --- | --- |
| 1 | Secreto JWT por defecto, hardcodeado y duplicado | A02 / A07 | Crítica |
| 2 | IDOR entre restaurantes en platos, ingredientes, empleados y pedidos | A01 | Alta |
| 3 | Pedidos: rutas sin `authorize` y sin comprobar propiedad | A01 | Alta |
| 4 | Pedidos: sin validación de entrada (DoS por `quantity`, platos ajenos, precios) | A04 / A03 | Alta |
| 5 | Sin rate limiting ni protección frente a fuerza bruta | A07 | Media |
| 6 | Política de contraseñas débil y contraseñas de seed iguales al email | A07 | Media |
| 7 | CORS abierto, sin cabeceras de seguridad (helmet) | A05 | Media |
| 8 | Base de datos SQLite versionada en git, con hashes de contraseñas | A05 / A02 | Media |
| 9 | Token JWT en `localStorage` sin control de caducidad en el cliente | A07 / A02 | Media |
| 10 | Guards del frontend solo comprueban autenticación, no rol | A01 | Baja |
| 11 | Mensajes de error inconsistentes y que filtran información | A05 / A09 | Baja |
| 12 | Sin logging de seguridad ni auditoría | A09 | Media |
| 13 | Enumeración de usuarios en registro y creación de empleados | A07 | Baja |
| 14 | Payload JWT sin validar y `req.user` tipado `any`, sin revocación | A08 / A07 | Baja |
| 15 | Dependencias sin fijar ni auditar (`^`), sin lockfile revisado en CI | A06 | Informativa |

Inyección SQL (A03): **no se encontró**. Todas las consultas de `repositories/*.ts` y `SqliteEmployeeRepository.ts` usan parámetros `?`. Las únicas cadenas construidas dinámicamente (`query += ' WHERE role = ?'`) añaden fragmentos fijos. Tampoco hay `innerHTML` ni `bypassSecurityTrust*` en los frontends, así que no se detectó XSS directo.

---

## 1. Secreto JWT por defecto, hardcodeado y duplicado
- **Categoría**: A02 Cryptographic Failures (también A07)
- **Severidad**: Crítica
- **Ubicación**: `api/src/contexts/shared/infrastructure/http/middlewares.ts:4` y `api/src/contexts/employee/infrastructure/BcryptAuthService.ts:5`
- **Descripción**: ambos ficheros usan `process.env.JWT_SECRET || 'super-secret-resttek-key'`. Si la variable no está definida (no hay `.env` ni validación en arranque), el servidor arranca con un secreto público, visible en el repositorio. El valor está duplicado en dos sitios, así que pueden divergir. `dotenv` figura como dependencia pero no se importa en `server.ts`.
- **Explotación**: un atacante firma localmente `jwt.sign({id:'x', role:'admin', restaurantId:null}, 'super-secret-resttek-key')` y obtiene acceso de administrador a todos los endpoints protegidos (crear empleados, borrar platos, etc.).
- **Corrección**: leer el secreto una sola vez en un módulo de configuración y abortar el arranque si falta o es corto (menos de 32 bytes aleatorios). Cargar `dotenv` o variables del entorno. Fijar `algorithms: ['HS256']` en `jwt.verify` y añadir `issuer` y `audience`. Rotar el secreto.

## 2. IDOR entre restaurantes (control de acceso horizontal)
- **Categoría**: A01 Broken Access Control
- **Severidad**: Alta
- **Ubicación**:
  - `api/src/controllers/dish.controller.ts:14-30` y `:35-70` (create, getAll, getById, update, delete)
  - `api/src/controllers/ingredient.controller.ts:12-25` y `:32-65`
  - `api/src/contexts/employee/infrastructure/http/restaurant-employee.routes.ts:7`
  - `api/src/routes/restaurant.routes.ts:16`
  - `api/src/routes/restaurant.public.routes.ts:14`
  - `api/src/repositories/dish.repository.ts:34,61,81`
  - `api/src/repositories/ingredient.repository.ts:27,46,58`
- **Descripción**: el `restaurantId` de la URL se usa tal cual y nunca se compara con `req.user.restaurantId` del token. `authorize` solo comprueba el rol. En `getById`, `update` y `delete` el `:id` del plato o ingrediente se busca solo por `id` (`WHERE id = ?`), sin filtrar por restaurante y sin comprobar que `:restaurantId` coincida con el del recurso. `GET /restaurants/:id` devuelve cualquier restaurante a cualquier usuario autenticado, mientras que `getAll` sí filtra por `user.restaurantId`, lo que es inconsistente.
- **Explotación**: un `manager` del restaurante A hace `PUT /api/v1/restaurants/A/dishes/<idDelPlatoDeB>`, o `DELETE` sobre él, y modifica o borra platos del restaurante B. También puede hacer `GET /restaurants/B/dishes` y `POST /restaurants/B/dishes` para leer o crear platos en B. Un `cocinero` de A lee ingredientes y stock de B.
- **Corrección**: middleware `authorizeRestaurant` que exija `req.user.role === 'admin' || req.user.restaurantId === req.params.restaurantId`. En los repositorios, filtrar `WHERE id = ? AND restaurant_id = ?` en lectura, actualización y borrado. Devolver 404 si no coincide.

## 3. Pedidos: rutas sin `authorize` ni comprobación de propiedad
- **Categoría**: A01 Broken Access Control
- **Severidad**: Alta
- **Ubicación**: `api/src/routes/order.routes.ts:14-18`, `api/src/controllers/order.controller.ts:28-41, 57-68, 70-85`, `api/src/services/order.service.ts:57-84`
- **Descripción**: las cinco rutas de pedidos solo usan `authenticate`. Cualquier usuario autenticado, incluido un `cliente` autoregistrado, puede:
  - `GET /orders/active?restaurantId=X`: listar los pedidos activos de cualquier restaurante, con `clientId` y notas.
  - `GET /orders/:id`: leer cualquier pedido (los IDs son UUID, pero se filtran por la ruta anterior).
  - `PATCH /orders/:orderId/items/:itemId/status`: cambiar el estado de cualquier ítem (por ejemplo marcar `entregado` y sacarlo de la cocina). Solo hay validación de valor, no de rol ni de restaurante.
- **Explotación**: un cliente de cualquier restaurante enumera `/orders/active?restaurantId=<id público>` (los IDs salen de `/public/restaurants`), obtiene los `itemId` y sabotea la cocina de la competencia marcando todo `entregado`.
- **Corrección**: `authorize(['admin','manager','camarero','cocinero'])` en `/active` y `PATCH`. En `getById`, permitir solo al cliente propietario o al personal del mismo restaurante. Comprobar que `order.restaurantId === user.restaurantId`. Aplicar una máquina de estados (solo transiciones válidas).

## 4. Pedidos: sin validación de entrada
- **Categoría**: A04 Insecure Design (con A03 en la parte de validación)
- **Severidad**: Alta
- **Ubicación**: `api/src/services/order.service.ts:21-51`, `api/src/controllers/order.controller.ts:9-17`
- **Descripción**: `items`, `quantity`, `dishId`, `tableId` y `notes` no se validan. `quantity` se usa como cota de un bucle (`for i < item.quantity`) que inserta una fila por unidad. No hay comprobación de tipo, de límite máximo ni de que `dishId` pertenezca a `restaurantId`, ni de que el plato esté disponible. `restaurantId` tampoco se verifica. `items` no array lanza una excepción que el controlador devuelve como 400 con `error.message`.
- **Explotación**: `POST /orders` con `quantity: 100000000` bloquea el event loop y llena la base de datos (DoS). Se pueden pedir platos de otro restaurante o no disponibles. Un `quantity` negativo o decimal produce pedidos vacíos o inconsistentes.
- **Corrección**: validar con un esquema (zod o similar): `items` array de 1 a 50, `quantity` entero entre 1 y 20, strings con longitud máxima, `dishId` existente y disponible en ese `restaurantId`, `restaurantId` existente. Limitar el tamaño del body (`express.json({limit:'100kb'})`).

## 5. Sin rate limiting ni protección frente a fuerza bruta
- **Categoría**: A07 Identification and Authentication Failures
- **Severidad**: Media
- **Ubicación**: `api/src/app.ts:16-17`, `api/src/contexts/employee/infrastructure/http/auth.routes.ts:6-7`
- **Descripción**: no hay `express-rate-limit` ni bloqueo de cuenta en `/auth/login` ni `/auth/register`, y tampoco ninguna dependencia para ello en `package.json`.
- **Explotación**: ataque de diccionario contra `admin@resttek.com` sin límite, o creación masiva de cuentas `cliente`. El coste de bcrypt (10 rondas) tampoco está limitado, lo que permite agotar CPU con peticiones masivas.
- **Corrección**: `express-rate-limit` (por IP y por email) en `/auth/*`, bloqueo temporal tras N fallos y CAPTCHA en el registro.

## 6. Política de contraseñas débil y credenciales de seed predecibles
- **Categoría**: A07 Identification and Authentication Failures
- **Severidad**: Media
- **Ubicación**: `web-shared/src/lib/components/register/register.component.ts:34` (solo longitud mínima de 6, en el cliente), `api/src/contexts/employee/application/RegisterClientUseCase.ts:149` y `CreateEmployeeUseCase.ts:209` (sin validación de contraseña en servidor), `api/src/scripts/seed.ts:22,51` (contraseña igual al email)
- **Descripción**: el servidor acepta cualquier contraseña, incluso `undefined` o vacía (`bcrypt.hash(undefined)` lanza un error que se devuelve como 500). La única regla (6 caracteres) está en el frontend. El seed crea el administrador con contraseña `admin@resttek.com`, y el seed es idempotente y documentado en `CLAUDE.md`. Bcrypt con 10 rondas es aceptable, pero está hardcodeado.
- **Explotación**: un despliegue donde se ejecutó `npm run seed` queda con un admin cuya contraseña es adivinable. Los usuarios pueden registrarse con `123456`.
- **Corrección**: validar la contraseña en el servidor (longitud mínima de 12, lista de contraseñas comunes, tipo string). Generar contraseñas aleatorias en el seed o leerlas de variables de entorno, y bloquear el seed cuando `NODE_ENV=production`. Subir las rondas de bcrypt a 12 o más.

## 7. CORS abierto y sin cabeceras de seguridad
- **Categoría**: A05 Security Misconfiguration
- **Severidad**: Media
- **Ubicación**: `api/src/app.ts:15`
- **Descripción**: `app.use(cors())` permite cualquier origen. No hay `helmet`, así que faltan `X-Content-Type-Options`, `Strict-Transport-Security`, etc., y Express expone `X-Powered-By: Express`. No hay forzado de HTTPS ni `trust proxy` configurado.
- **Explotación**: como la autenticación es por cabecera Bearer (no por cookie), el riesgo de CSRF es limitado. Sin embargo, cualquier web puede consumir la API desde el navegador de una víctima que tenga el token, por ejemplo tras un XSS en otro origen, y se facilita el fingerprinting.
- **Corrección**: `cors({ origin: [lista blanca de los tres frontends] })`, `helmet()`, `app.disable('x-powered-by')` y terminar TLS delante de la API.

## 8. Base de datos SQLite versionada en el repositorio
- **Categoría**: A05 Security Misconfiguration (con A02)
- **Severidad**: Media
- **Ubicación**: `packages/api/resttek.db` (listado por `git ls-files`), `.gitignore` (solo ignora `.DS_Store` y `/node_modules`)
- **Descripción**: el fichero de base de datos está en control de versiones desde el commit inicial, y `git status` lo muestra modificado, de modo que los datos reales terminan commiteados. Contiene los hashes bcrypt de los usuarios y los datos de pedidos. No hay `.env` en `.gitignore`.
- **Explotación**: cualquiera con acceso al repositorio extrae los hashes y los ataca offline. Con las contraseñas de seed (igual al email) el ataque es trivial.
- **Corrección**: `git rm --cached packages/api/resttek.db`, añadir `*.db` y `.env*` al `.gitignore`, y regenerar la base con el seed. Considerar rotar cualquier credencial real presente en el historial.

## 9. Token en `localStorage` y sesión sin control de caducidad
- **Categoría**: A07 / A02
- **Severidad**: Media
- **Ubicación**: `web-shared/src/lib/auth/auth.store.ts:6-9,18-19`, `:14`, `web-shared/src/lib/http/auth.interceptor.ts`, `error.interceptor.ts:38`
- **Descripción**: el JWT y el objeto de usuario se guardan en `localStorage`, accesible desde cualquier JavaScript del origen. `isAuthenticated` es solo `token !== null`: no se comprueba `exp` y no se valida el JSON de `auth_user` (el `JSON.parse` sin try/catch rompe la app si se corrompe). El interceptor adjunta el token a todas las peticiones, sea cual sea el destino. El token dura 8 horas, sin refresh ni revocación, y el logout solo borra el almacenamiento local.
- **Explotación**: cualquier XSS futuro, o una dependencia npm comprometida, exfiltra el token con `localStorage.getItem('auth_token')`, que sigue válido hasta 8 h. Un token robado no se puede invalidar.
- **Corrección**: preferiblemente cookie `HttpOnly; Secure; SameSite=Strict` con tokens de acceso de corta duración más refresh con rotación. Si se mantiene `localStorage`, reducir el `exp`, comprobarlo en el cliente, y limitar el interceptor a `API_URL`. Añadir una CSP estricta.

## 10. Guards del frontend sin comprobación de rol
- **Categoría**: A01 Broken Access Control
- **Severidad**: Baja (el control real está en la API)
- **Ubicación**: `web-shared/src/lib/auth/auth.guard.ts:5-11`, `web-admin/src/app/app.routes.ts:12`
- **Descripción**: `authGuard` solo exige haber iniciado sesión. En `web-admin` no se verifica que el rol sea `admin` o `manager`, así que un `cliente` autenticado accede a las pantallas del panel (la API le devolverá 403 en la mayoría, pero no en todas, ver hallazgos 2 y 3). El filtrado del menú por rol en `web-empleados` es solo cosmético.
- **Explotación**: un cliente entra en `web-admin` con su token y usa las pantallas contra los endpoints que no tienen `authorize`.
- **Corrección**: guard por rol (`data: { roles: [...] }`) como defensa en profundidad, manteniendo la autorización real en la API.

## 11. Errores inconsistentes y que filtran información
- **Categoría**: A05 Security Misconfiguration (con A09)
- **Severidad**: Baja
- **Ubicación**: `api/src/controllers/order.controller.ts:20-24, 79-80`, `api/src/contexts/shared/infrastructure/http/errorHandler.ts:4-33`, `api/src/contexts/employee/domain/value-objects/Role.ts:17`, `api/src/errors/DomainErrors.ts` (`DatabaseNotInitializedError`)
- **Descripción**:
  - `OrderController.createOrder` devuelve `error.message` de cualquier `Error` (incluidos errores de SQLite como violaciones de FK) con 400.
  - `updateItemStatus` devuelve 400 para `OrderNotFoundError`.
  - `errorHandler` devuelve `err.name` (nombre de clase interna) en las respuestas.
  - `OrderNotFoundError` no está en `NOT_FOUND_ERRORS`.
  - Los mensajes de rol inválido enumeran los roles válidos.
  - `express.json()` sin gestión de errores: un JSON malformado pasa al `errorHandler` y devuelve 500 en lugar de 400.
  - Todo `Error` no `AppError` se convierte en 500 sin registrarse.
- **Explotación**: se obtiene información de esquema y de lógica interna a partir de los mensajes, y se facilita la enumeración de recursos.
- **Corrección**: mensajes genéricos al cliente, detalle solo en logs, un único `errorHandler` y registro del `OrderNotFoundError` como 404.

## 12. Sin logging de seguridad ni auditoría
- **Categoría**: A09 Security Logging and Monitoring Failures
- **Severidad**: Media
- **Ubicación**: `api/src/app.ts` (sin middleware de logging), `api/src/contexts/shared/infrastructure/http/errorHandler.ts:32`, `middlewares.ts:11-30`
- **Descripción**: no existe logger (`morgan`, `pino`) ni ningún `console` en el código de peticiones (solo en `server.ts` y el seed). No se registran logins fallidos, 401/403, creaciones de empleados, cambios de estado ni los errores 500, que además se descartan sin trazas.
- **Explotación**: un ataque de fuerza bruta o una escalada de privilegios no deja rastro ni permite alertar o investigar.
- **Corrección**: logger estructurado con ID de petición, y eventos de auditoría para autenticación, autorización denegada y operaciones administrativas (sin registrar contraseñas ni tokens). Registrar el stack de los errores 500 en servidor.

## 13. Enumeración de usuarios
- **Categoría**: A07 Identification and Authentication Failures
- **Severidad**: Baja
- **Ubicación**: `api/src/contexts/employee/application/RegisterClientUseCase.ts:144-147`, `CreateEmployeeUseCase.ts:204-207`
- **Descripción**: el registro público responde con `DuplicatedEmailError` ("Email is already in use", 400) cuando el correo existe. El login sí devuelve el mismo error para usuario y contraseña incorrectos, pero tiene un tiempo de respuesta distinto: si el email no existe no se ejecuta bcrypt (`LoginUseCase.ts:84-91`).
- **Explotación**: un atacante comprueba qué correos (clientes y personal) están registrados, por el mensaje del registro o por la diferencia de tiempo del login.
- **Corrección**: respuesta genérica en el registro (flujo con verificación por correo) y comparación bcrypt contra un hash falso cuando el usuario no existe.

## 14. Payload del JWT sin validar y sin revocación
- **Categoría**: A08 Software and Data Integrity Failures (con A07)
- **Severidad**: Baja
- **Ubicación**: `api/src/contexts/shared/infrastructure/http/middlewares.ts:7-9,25-26`, `BcryptAuthService.ts:50-52`
- **Descripción**: `req.user` es `any` y se rellena con el payload del token sin validar su forma. El rol y el `restaurantId` se confían del token durante 8 horas sin consultar la base de datos, así que si se despide a un empleado o se cambia su rol, el token antiguo mantiene los privilegios. `jwt.verify` no restringe algoritmos.
- **Explotación**: un empleado dado de baja conserva acceso total hasta 8 horas. Combinado con el hallazgo 1, el atacante controla cualquier campo del payload.
- **Corrección**: validar el payload, reducir la caducidad, usar refresh tokens revocables o comprobar el estado del usuario en cada petición sensible, y tipar `req.user`.

## 15. Gestión de dependencias
- **Categoría**: A06 Vulnerable and Outdated Components
- **Severidad**: Informativa (no se pudo verificar CVEs sin ejecutar `npm audit`)
- **Ubicación**: `api/package.json:10-17`, `package.json` raíz
- **Descripción**: todas las dependencias usan rangos `^` y no hay evidencia de `npm audit`, Dependabot o escaneo en CI. `supertest`, `dotenv` y otras están instaladas pero sin uso real para el fin previsto (`dotenv` no se carga). Faltan además dependencias de seguridad (`helmet`, `express-rate-limit`, librería de validación).
- **Corrección**: ejecutar `npm audit` en CI, activar Dependabot o Renovate, usar `npm ci` con el lockfile, y añadir las dependencias de seguridad.

---

## Priorización recomendada
1. Eliminar el secreto por defecto (hallazgo 1) y sacar `resttek.db` del repositorio (8).
2. Cerrar los fallos de control de acceso en pedidos y entre restaurantes (2, 3).
3. Validar la entrada de pedidos y de contraseñas (4, 6).
4. Añadir rate limiting, helmet, CORS restringido y logging (5, 7, 12).
5. Endurecer el manejo de tokens y los guards del frontend (9, 10, 14).
