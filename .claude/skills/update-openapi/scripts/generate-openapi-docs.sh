#!/usr/bin/env bash
# Valida y genera la documentación OpenAPI con Redocly.
# Uso (desde cualquier sitio): bash .claude/skills/update-openapi/scripts/generate-openapi-docs.sh [directorio_docs]
# - Lint de cada docs/api/*.openapi.yml
# - HTML por recurso en <docs>/dist/<recurso>.html
# - Spec unificado en <docs>/dist/openapi.yml
set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
DOCS="${1:-$ROOT/docs/api}"
DIST="$DOCS/dist"
REDOCLY="npx --yes @redocly/cli@latest"

shopt -s nullglob
SPECS=("$DOCS"/*.openapi.yml)
if [ ${#SPECS[@]} -eq 0 ]; then
  echo "No hay ficheros *.openapi.yml en $DOCS. Genera primero las fuentes (ver SKILL.md)." >&2
  exit 1
fi

mkdir -p "$DIST"

echo "==> Lint"
for f in "${SPECS[@]}"; do
  echo "-- $(basename "$f")"
  $REDOCLY lint "$f"
done

echo "==> HTML por recurso"
for f in "${SPECS[@]}"; do
  name="$(basename "$f" .openapi.yml)"
  $REDOCLY build-docs "$f" --output "$DIST/$name.html"
done

echo "==> Spec unificado"
if [ ${#SPECS[@]} -gt 1 ]; then
  $REDOCLY join "${SPECS[@]}" --without-x-tag-groups -o "$DIST/openapi.yml"
else
  cp "${SPECS[0]}" "$DIST/openapi.yml"
fi

# dist/ es una salida generada: no se versiona
if ! grep -qx 'docs/api/dist/' "$ROOT/.gitignore" 2>/dev/null; then
  printf '\ndocs/api/dist/\n' >> "$ROOT/.gitignore"
fi

echo "Listo: $DIST"
