---
name: update-openapi
description: Actualiza la documentación OpenAPI de la API (docs/api/) con Redocly cada vez que se modifica la API (rutas, DTOs, validaciones, errores). Si no hay documentación previa, la genera. Úsala tras cambiar controladores, rutas o modelos de packages/api, o cuando el usuario pida documentar la API.
---

# update-openapi

Mantiene la documentación OpenAPI 3 de `packages/api` sincronizada con el código. Fuentes en `docs/api/*.openapi.yml` (un fichero por recurso) y salida generada con **Redocly**.

## Pasos

1. **Detecta qué cambió**: `git diff --name-only <base>...HEAD -- packages/api/src` (o los ficheros que te indique el usuario). Mira rutas (`routes/`, `contexts/*/infrastructure/http/`), controladores, modelos/validadores y `errors/DomainErrors.ts` + `errorHandler` (códigos HTTP).
2. **¿Hay documentación previa?** Mira `docs/api/*.openapi.yml`.
   - **Sí**: edita solo los ficheros de los recursos afectados (paths, schemas, parámetros, respuestas y códigos de error). Si añades un recurso, crea `docs/api/<recurso>.openapi.yml` siguiendo el estilo de los existentes (`servers`, `tags`, `securitySchemes bearerAuth`, `components`).
   - **No**: aprovecha el cambio para generarla. Recorre **todas** las rutas montadas en `packages/api/src/app.ts` bajo `/api/v1` y crea un fichero por recurso (restaurants, dishes, ingredients, orders, employees/auth…). Documenta la realidad del código, incluidas las inconsistencias (como hacen los ficheros existentes en su `description`), sin corregirlas.
3. **Verifica contra el código**, no de memoria: método, ruta, parámetros, roles (`authorize([...])` → `security` y descripción), cuerpos, validaciones, códigos de respuesta según `errorHandler` (`*NotFoundError` → 404, `InvalidCredentialsError` → 401, otro `AppError` → 400; `OrderController` gestiona los suyos).
4. **Ejecuta el script**: `bash .claude/skills/update-openapi/scripts/generate-openapi-docs.sh` (desde la raíz del repo). Hace lint de cada `docs/api/*.openapi.yml` con `@redocly/cli`, y genera `docs/api/dist/<recurso>.html` (docs HTML) y `docs/api/dist/openapi.yml` (spec unificado, vía `redocly join`). Corrige los errores de lint antes de seguir; los warnings relevantes, también.
5. **Commit** (con `/commit`, tipo `docs(api)`) con las fuentes `.openapi.yml`. `docs/api/dist/` se genera: no se versiona (el script añade la entrada a `.gitignore` si falta).
6. Informa de qué ficheros se actualizaron o crearon y del resultado del lint.

## Reglas

- Escribe en español (descripciones y resúmenes).
- La fuente de verdad es el código; no documentes endpoints que no existan.
- No modifiques código de `packages/api` desde esta skill.
