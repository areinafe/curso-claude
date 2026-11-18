#!/usr/bin/env bash
# PreToolUse (Bash): bloquea comandos que borren/destruyan vendehumos.db
cmd=$(jq -r '.tool_input.command // empty')
if grep -qE 'vendehumos\.db' <<<"$cmd" && grep -qE '(^|[^a-z])(rm|unlink|shred|truncate|mv|find .*-delete)([^a-z]|$)|>\s*\S*vendehumos\.db' <<<"$cmd"; then
  echo "Bloqueado: no se permite borrar/destruir la base de datos vendehumos.db" >&2
  exit 2
fi
exit 0
