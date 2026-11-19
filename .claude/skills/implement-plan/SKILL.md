---
name: implement-plan
description: Implementa con TDD el plan publicado en el comentario de una issue de GitHub (leído con gh), usando un worktree por agente y un worktree principal donde se reúne todo, y deja la PR lista para revisión. Úsala cuando el usuario pida implementar, ejecutar o desarrollar un plan generado con plan-feature.
argument-hint: <num_issue o URL del comentario con el plan>
---

# implement-plan

Implementa el plan que está en un comentario de una issue de GitHub. Necesitas el **número de issue** (o la URL del comentario): si el usuario no lo da, pídelo.

## Pasos

### 1. Preparación

1. **Obtén el plan con `gh`**: `gh issue view <num> --comments --json comments` (con `--repo` si hace falta) y localiza el comentario cuyo cuerpo empieza por `<!-- resttek-plan -->`. Si hay varios, usa el último o el que indique el usuario; si no hay ninguno, avisa de que primero hay que ejecutar `plan-feature`. Guarda su `id`/URL y el cuerpo en un fichero local `plans/<num>-<breve-descripcion>.md` (dentro del worktree principal, ver abajo) para ir marcando tareas.
2. Lee el plan completo. Si hay **Dudas abiertas** con "Respuesta: _pendiente_" que bloqueen una tarea, pregunta al usuario antes de empezar; si no bloquean, sigue con lo asumido en "Decisiones tomadas".
3. Comprueba que el árbol de trabajo está limpio (`git status --short`). Si hay cambios sin commitear, avisa al usuario antes de continuar.
4. Obtén la rama de la tabla **Metadatos** (campo `Rama`) y la base: `development` si existe (local o en `origin`); si no, créala desde `main` o `master` (`git branch development main`).
5. **Worktree principal**: crea uno para la rama del plan, fuera del directorio de trabajo actual:
   `git worktree add ../<repo>-worktrees/<rama-con-guiones> -b <rama> development`.
   Si la rama ya existe, pregunta al usuario si continuar en ella. Aquí se integrará todo.
6. **Reparto del trabajo**: el plan separa las tareas por secciones/aplicaciones. Respeta las líneas `Depende de:`.
   - Si el plan tiene **una sola sección** (o el trabajo es secuencial), no hay agentes: implementa directamente en el worktree principal.
   - Si tiene **varias secciones**, lanza **un agente por sección** (herramienta `Agent`, en un mismo mensaje las que sean independientes) y crea **un worktree por agente**, partiendo de la rama del plan:
     `git worktree add ../<repo>-worktrees/<rama-con-guiones>-<seccion> -b <rama>-<seccion> <rama>`.
     Las secciones con dependencias se lanzan cuando las que preceden estén integradas en el worktree principal (y crea su worktree desde la rama del plan ya actualizada).
   - Cada agente recibe en su prompt: ruta absoluta de su worktree (debe trabajar solo ahí), sus tareas del plan, el contenido de este bucle (sección 2), la prohibición de tocar ficheros de otras secciones y la de hacer push. Los agentes **no marcan** el plan compartido; devuelven la lista de tareas completadas y los commits.
   - Cada worktree necesita `npm install` (o enlazar `node_modules`) antes de ejecutar tests.

### 2. Bucle por tarea (de una en una, en orden, dentro del worktree de cada sección)

Para cada tarea `- [ ]` de la sección, sin saltarte ni mezclar tareas:

1. **Rojo**: escribe primero el test descrito en la tarea. Ejecútalo (`npm test` o el comando del plan) y **comprueba que falla** por el motivo esperado (no por error de sintaxis o de import evitable). Si pasa a la primera, el test no vale: revísalo.
2. **Verde**: escribe el código **mínimo** para pasar el test. Vuelve a ejecutarlo y comprueba que pasa.
3. Ejecuta toda la suite de tests del paquete para confirmar que no has roto nada.
4. **Marca la tarea** `- [x]` en el plan (en el worktree donde trabajas; si hay agentes, lo hace el agente principal al integrar).
5. **Commit** de la tarea con `/commit` (Conventional Commits), mencionando el id (ej. `T3`). No hagas commits que dejen los tests en rojo.

Reglas del bucle:
- No escribas código de producción sin un test rojo previo.
- No avances a la tarea siguiente hasta tener el commit de la actual.
- Si una tarea resulta mayor de lo previsto o el plan es incorrecto, para y consúltalo con el usuario.
- Las dependencias nuevas se instalan con `npm install` y van en el mismo commit que la tarea que las necesita.
- Si la API cambia, actualiza el OpenAPI con la skill `update-openapi` (normalmente hay una tarea para ello).

### 3. Integración en el worktree principal

1. Con varios agentes: cuando terminen, fusiona cada rama de sección en la rama del plan, desde el worktree principal: `git merge --no-ff <rama>-<seccion>`. Resuelve conflictos con cuidado (no deberían existir si las secciones no comparten ficheros; `package-lock.json` se regenera con `npm install`).
2. Marca en el plan las tareas completadas y haz commit con `/commit`.
3. Ejecuta la suite completa de tests (y los builds de los frontends afectados) en el worktree principal.
4. Elimina los worktrees de los agentes y sus ramas ya fusionadas: `git worktree remove <ruta>` y `git branch -d <rama>-<seccion>`.

### 4. Criterios de aceptación y PR

1. Recorre cada criterio de **Criterios de aceptación** y compruébalo de verdad (tests, ejecución de la app o revisión del código). No marques nada por suposición.
2. Marca con `- [x]` solo los que se cumplan; cambia `Estado` a `completado` si se cumplen todos. Commit con `/commit`.
3. Actualiza el comentario de la issue con el plan marcado: `gh api -X PATCH repos/<owner>/<repo>/issues/comments/<id> -F body=@plans/<fichero>.md`. Después, el fichero `plans/...` no debe quedar en el repositorio: elimínalo antes del commit final si no estaba versionado en la rama base (no lo incluyas en la PR).
4. **Deja la PR lista para revisión**: `git push -u origin <rama>` y `gh pr create --base development --head <rama>` (no borrador) con título en Conventional Commits, descripción en español (resumen, tareas por sección, criterios cumplidos o no, cómo probar), `Closes #<num>` y la línea de atribución de PR indicada por el entorno. Si algún criterio no se cumple, dilo en la descripción.

### 5. Resumen final

Informa al usuario de: URL de la PR, rama, worktrees usados (y cuáles quedan), tareas completadas por sección y criterios cumplidos o no. El worktree principal se deja en pie para posibles correcciones de la revisión.

### 5. Aviso por Slack

Al terminar, avisa al canal `curso-claude` (ID `C0CHB9C0CGK`) con la herramienta `mcp__slack__slack_post_message` (si no está cargada, cárgala antes con ToolSearch). Mensaje corto en español con: el número de issue, la URL de la PR, tareas completadas sobre el total y si todos los criterios de aceptación se cumplen. Ejemplo: ` Plan implementado (issue #12): <URL de la PR> (6/6 tareas, criterios de aceptación OK)`. Si la implementación se detuvo antes de terminar (duda abierta, tarea bloqueada, criterio sin cumplir), avisa igualmente indicando el motivo. Si el envío falla, no reintentes en bucle: dilo al usuario en el informe.

## Reglas

- Escribe en español.
- No inventes requisitos fuera del plan; si algo falta, pregunta o apúntalo en "Decisiones tomadas".
- No uses `--no-verify` ni reescribas el historial.
- Toda interacción con GitHub se hace con `gh`.
