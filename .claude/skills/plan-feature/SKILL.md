---
name: plan-feature
description: Lee una issue de GitHub con gh, genera un plan de implementación en markdown con tareas separadas por aplicación (para trabajo en paralelo) y lo publica como comentario de la issue, con tareas TDD de 5-10 min, criterios de aceptación, dudas abiertas y decisiones. Úsala cuando el usuario pida planificar, diseñar o preparar la implementación de una feature o issue.
argument-hint: <num_issue> [descripción de la feature]
---

# plan-feature

Genera un plan de implementación a partir de una issue de GitHub. **No implementes código**: solo planifica.

## Pasos

1. **Obtén los datos**: número de issue (de `$ARGUMENTS` o del usuario; si falta, pídelo). Lee siempre la issue del repositorio remoto con GitHub CLI: `gh issue view <num> --comments` (añade `--repo <owner>/<repo>` si no se deduce del remoto `origin`). Usa título, cuerpo y comentarios como fuente de requisitos; una descripción adicional del usuario complementa a la issue. Si `gh` no está disponible o no está autenticado (`gh auth status`), díselo al usuario y detente.
2. **Explora el código** (`src/`, `package.json`, tests existentes, `CLAUDE.md`) para fundamentar el contexto y respetar convenciones.
3. **Lee la plantilla** `assets/plan-template.md` (junto a este SKILL.md) y úsala como formato y estructura exactos. No quites ni reordenes secciones.
4. **Borrador local**: redacta el plan en un fichero temporal (directorio scratchpad o `/tmp`), **no** en el repositorio. Nombre sugerido para la rama: `feat/<num_issue>-<breve-descripcion>` (kebab-case, minúsculas, sin tildes, 2-5 palabras).
5. **Rellena todas las secciones**:
   - **Metadatos**: issue, título, fecha de hoy, autor (`git config user.name`), estado `borrador`, rama sugerida.
   - **Objetivo y alcance**: incluye explícitamente qué queda fuera.
   - **Contexto**: estado actual del código y restricciones.
   - **Tareas**: checkboxes `- [ ]`. Cada tarea dura **5-10 min** e incluye **el test primero (TDD) + el código mínimo para pasarlo**, con rutas de archivos. Si una tarea es mayor, divídela. Ordénalas de forma que el proyecto funcione tras cada una.
     - **Sepáralas por secciones/aplicaciones** (`### API`, `### web-admin`, `### web-empleados`, `### web-clientes`, `### web-shared`, `### Documentación`…), solo las que apliquen. Cada sección debe poder implementarla un agente **en paralelo** sin tocar ficheros de otra: el código compartido (p. ej. `web-shared`) o el contrato de la API que otra sección necesite va en una sección anterior, y la dependencia se indica explícitamente (`Depende de: <sección>`). Los ids de tarea son únicos en todo el plan (T1, T2…).
     - Si cambia la API (rutas, DTOs, errores), incluye una tarea en `### Documentación` para actualizar el OpenAPI con la skill `update-openapi`.
   - **Criterios de aceptación**: checkboxes verificables; incluye siempre "todos los tests pasan" y "todas las tareas completadas".
   - **Dudas abiertas**: preguntas reales para el usuario, con "Respuesta: _pendiente_".
   - **Decisiones tomadas**: toda suposición que hayas hecho por tu cuenta, con motivo y alternativa descartada.
6. **Publica el plan como comentario de la issue**: el comentario debe empezar por la línea `<!-- resttek-plan -->` (marcador para que `implement-plan` lo localice) y contener el plan completo en markdown. Usa `gh issue comment <num> --body-file <borrador>` (con `--repo` si hace falta). Si ya existe un comentario con el marcador, pregunta si actualizarlo (`gh api -X PATCH repos/<owner>/<repo>/issues/comments/<id> -F body=@<borrador>`) o añadir uno nuevo. Anota la URL del comentario que devuelve `gh`.
7. **Resume** al usuario: URL del comentario, nº de tareas por sección, y destaca las dudas y decisiones para que las revise. No guardes el plan en el repositorio ni hagas commit.

8. **Avisa por Slack** al canal `curso-claude` (ID `C0CHB9C0CGK`) con la herramienta `mcp__slack__slack_post_message` (si no está cargada, cárgala antes con ToolSearch). Mensaje corto en español con: la URL del comentario con el plan, el número de issue, el número de tareas y cuántas dudas abiertas quedan. Ejemplo: ` Plan listo: https://github.com/<owner>/<repo>/issues/12#issuecomment-123 (issue #12, 6 tareas, 2 dudas abiertas)`. Si el envío falla, no reintentes en bucle: dilo al usuario en tu respuesta.

## Reglas

- Escribe en español.
- No inventes requisitos: lo incierto va a "Dudas abiertas"; lo que asumas, a "Decisiones tomadas".
- Toda interacción con GitHub se hace con `gh`; no uses la API web ni scraping.
- No dejes placeholders `<...>` de la plantilla sin rellenar.
