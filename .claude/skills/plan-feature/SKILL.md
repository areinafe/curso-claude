---
name: plan-feature
description: Genera un plan de implementación en markdown (carpeta plans/) para una feature o issue, con tareas TDD de 5-10 min, criterios de aceptación, dudas abiertas y decisiones. Úsala cuando el usuario pida planificar, diseñar o preparar la implementación de una feature o issue.
argument-hint: <num_issue> [descripción de la feature]
---

# plan-feature

Genera un plan de implementación a partir de una feature o issue. **No implementes código**: solo planifica.

## Pasos

1. **Obtén los datos**: número de issue y descripción (de `$ARGUMENTS` o del usuario). Si falta el número de issue, pídelo. Si el issue está en GitHub y `gh` está disponible, léelo con `gh issue view <num>`.
2. **Explora el código** (`src/`, `package.json`, tests existentes, `CLAUDE.md`) para fundamentar el contexto y respetar convenciones.
3. **Lee la plantilla** `assets/plan-template.md` (junto a este SKILL.md) y úsala como formato y estructura exactos. No quites ni reordenes secciones.
4. **Nombre del fichero**: `plans/<num_issue>-<breve-descripcion>.md`
   - descripción en kebab-case, minúsculas, sin tildes ni caracteres especiales, 2-5 palabras (ej. `plans/12-listar-productos.md`).
   - Crea la carpeta `plans/` si no existe. Si el fichero ya existe, pregunta antes de sobrescribir.
5. **Rellena todas las secciones**:
   - **Metadatos**: issue, título, fecha de hoy, autor (`git config user.name`), estado `borrador`, rama sugerida.
   - **Objetivo y alcance**: incluye explícitamente qué queda fuera.
   - **Contexto**: estado actual del código y restricciones.
   - **Tareas**: checkboxes `- [ ]`. Cada tarea dura **5-10 min** e incluye **el test primero (TDD) + el código mínimo para pasarlo**, con rutas de archivos. Si una tarea es mayor, divídela. Ordénalas de forma que el proyecto funcione tras cada una.
   - **Criterios de aceptación**: checkboxes verificables; incluye siempre "todos los tests pasan" y "todas las tareas completadas".
   - **Dudas abiertas**: preguntas reales para el usuario, con "Respuesta: _pendiente_".
   - **Decisiones tomadas**: toda suposición que hayas hecho por tu cuenta, con motivo y alternativa descartada.
6. **Resume** al usuario: ruta del plan, nº de tareas, y destaca las dudas y decisiones para que las revise. No hagas commit salvo que lo pida.

7. **Avisa por Slack** al canal `curso-claude` (ID `C0CHB9C0CGK`) con la herramienta `mcp__slack__slack_post_message` (si no está cargada, cárgala antes con ToolSearch). Mensaje corto en español con: la ruta del plan, el número de issue, el número de tareas y cuántas dudas abiertas quedan. Ejemplo: ` Plan listo: plans/12-paginar-listado-vendehumos.md (issue #12, 6 tareas, 2 dudas abiertas)`. Si el envío falla, no reintentes en bucle: dilo al usuario en tu respuesta.

## Reglas

- Escribe en español.
- No inventes requisitos: lo incierto va a "Dudas abiertas"; lo que asumas, a "Decisiones tomadas".
- No dejes placeholders `<...>` de la plantilla sin rellenar.
