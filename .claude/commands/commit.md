---
description: Crea un commit siguiendo la especificación Conventional Commits
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*)
argument-hint: [descripción opcional del cambio]
---

## Contexto

- Estado actual: !`git status --short`
- Cambios en staging: !`git diff --cached`
- Cambios sin stage: !`git diff`
- Rama actual: !`git branch --show-current`
- Commits recientes (para seguir el estilo): !`git log --oneline -10`

## Tarea

Crea un commit que siga la especificación **Conventional Commits 1.0.0**.
Pista del usuario (opcional): $ARGUMENTS

### Formato

```
<tipo>[ámbito opcional][!]: <descripción>

[cuerpo opcional]

[pie(s) opcional(es)]
```

### Tipos permitidos

- `feat`: nueva funcionalidad (SemVer MINOR)
- `fix`: corrección de un bug (SemVer PATCH)
- `docs`: cambios solo en documentación
- `style`: formato, espacios, punto y coma (sin cambio de lógica)
- `refactor`: cambio de código que no corrige un bug ni añade funcionalidad
- `perf`: mejora de rendimiento
- `test`: añadir o corregir tests
- `build`: sistema de build o dependencias
- `ci`: configuración de integración continua
- `chore`: tareas de mantenimiento que no tocan src ni tests
- `revert`: revierte un commit anterior

### Reglas

1. Descripción en imperativo, minúscula inicial, sin punto final, máximo ~72 caracteres.
2. El ámbito (opcional) es un sustantivo entre paréntesis que indica la zona afectada, p. ej. `feat(auth): ...`.
3. Cambios incompatibles (breaking): añade `!` tras el tipo/ámbito y/o un pie `BREAKING CHANGE: <explicación>`.
4. El cuerpo explica el *qué* y el *porqué*, no el *cómo*; sepáralo con una línea en blanco.
5. Usa pies para referencias, p. ej. `Refs: #123` o `Closes: #123`.
6. Escribe el mensaje en el mismo idioma que usan los commits recientes del repositorio.

### Pasos

1. Analiza los cambios. Si no hay nada en staging, añade al stage los archivos relevantes con `git add` (nunca archivos con secretos como `.env`).
2. Si los cambios mezclan varios propósitos independientes, propón dividirlos en varios commits y hazlos por separado.
3. Elige el tipo y ámbito que mejor describan el cambio.
4. Muestra el mensaje del commit al usuario y pidele que lo confirme con la tool AskUserQuestion. Si da el OK, continua con los siguientes pasos, y si no, proponle un nuevo mensaje y vuelve a preguntarle si este nuevo le parece mejor.
5. Ejecuta `git commit` con el mensaje (usa varios `-m` o un heredoc para cuerpo y pies).
6. Muestra el resultado con `git log -1` y no hagas `git push`.
