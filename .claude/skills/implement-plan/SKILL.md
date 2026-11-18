---
name: implement-plan
description: Implementa un plan de plans/ con TDD estricto, tarea a tarea, con un commit por tarea y comprobación final de los criterios de aceptación. Úsala cuando el usuario pida implementar, ejecutar o desarrollar un plan generado con plan-feature.
argument-hint: <ruta del plan, ej. plans/0-login-registro-jwt.md>
---

# implement-plan

Implementa el plan indicado por el usuario. Si no te da la ruta, pídela (o lista `plans/`).

## Pasos

### 1. Preparación

1. Lee el plan completo. Si hay **Dudas abiertas** con "Respuesta: _pendiente_" que bloqueen una tarea, pregunta al usuario antes de empezar; si no bloquean, sigue con lo asumido en "Decisiones tomadas".
2. Comprueba que el árbol de trabajo está limpio (`git status --short`). Si hay cambios sin commitear que no sean el propio plan, avisa al usuario antes de continuar.
3. Obtén el nombre de la rama de la tabla **Metadatos** del plan (campo `Rama`).
4. Prepara las ramas:
   - Si existe `development` (local o en `origin`), úsala como base.
   - Si no existe, créala a partir de `main` o, si no existe, de `master`: `git branch development main`.
   - Crea la rama del plan desde `development` y cámbiate a ella: `git switch -c <rama> development`.
   - Si la rama del plan ya existe, pregunta al usuario si continuar en ella.

### 2. Bucle por tarea (de una en una, en orden)

Para cada tarea `- [ ]` del plan, sin saltarte ni mezclar tareas:

1. **Rojo**: escribe primero el test descrito en la tarea. Ejecútalo (`npm test` o el comando del plan) y **comprueba que falla** por el motivo esperado (no por error de sintaxis o de import evitable). Si pasa a la primera, el test no vale: revísalo.
2. **Verde**: escribe el código **mínimo** para pasar el test. Vuelve a ejecutarlo y comprueba que pasa.
3. Ejecuta toda la suite de tests para confirmar que no has roto nada. Si algo falla, corrígelo antes de seguir.
4. **Marca la tarea** en el plan cambiando `- [ ]` por `- [x]`.
5. **Commit** de la tarea con el comando `/commit` (Conventional Commits). El commit incluye tests, código y el plan actualizado. Menciona el id de la tarea (ej. `T3`) en la descripción o el cuerpo. No hagas commits que dejen los tests en rojo.

Reglas del bucle:
- No escribas código de producción sin un test rojo previo.
- No avances a la tarea siguiente hasta tener el commit de la actual.
- Si una tarea resulta mayor de lo previsto o el plan es incorrecto, para y consúltalo con el usuario; si procede, anota el cambio en el plan.
- Las dependencias nuevas se instalan con `npm install` y van en el mismo commit que la tarea que las necesita.

### 3. Criterios de aceptación

Cuando todas las tareas estén hechas:

1. Ejecuta la suite completa de tests.
2. Recorre cada criterio de **Criterios de aceptación** y compruébalo de verdad (tests, ejecución de la app o revisión del código). No marques nada por suposición.
3. Marca con `- [x]` solo los que se cumplan; "Todos los tests pasan" y "Todas las tareas están marcadas" solo si es cierto.
4. Cambia el `Estado` del plan a `completado` si todos los criterios se cumplen.
5. Haz un último commit con `/commit` (ej. `docs(plans): marcar criterios de aceptación`).

### 4. Resumen final

Informa al usuario de: rama creada, tareas completadas y commits, criterios cumplidos y, si los hay, los que no se cumplen y por qué. No hagas push ni abras PR salvo que lo pida.

### 5. Aviso por Slack

Al terminar, avisa al canal `curso-claude` (ID `C0CHB9C0CGK`) con la herramienta `mcp__slack__slack_post_message` (si no está cargada, cárgala antes con ToolSearch). Mensaje corto en español con: la ruta del plan, la rama, tareas completadas sobre el total y si todos los criterios de aceptación se cumplen. Ejemplo: ` Plan implementado: plans/12-paginar-listado-vendehumos.md en la rama feat/12-paginar-listado-vendehumos (6/6 tareas, criterios de aceptación OK)`. Si la implementación se detuvo antes de terminar (duda abierta, tarea bloqueada, criterio sin cumplir), avisa igualmente indicando el motivo. Si el envío falla, no reintentes en bucle: dilo al usuario en el informe.

## Reglas

- Escribe en español.
- No inventes requisitos fuera del plan; si algo falta, pregunta o apúntalo en "Decisiones tomadas".
- No uses `--no-verify` ni reescribas el historial.
