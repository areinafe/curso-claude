#!/usr/bin/env bash
# PreToolUse (Read|Grep|Glob|Bash): bloquea el acceso a CONSTANTS.js
input=$(cat)
target=$(jq -r '[.tool_input.file_path, .tool_input.path, .tool_input.pattern, .tool_input.glob, .tool_input.command] | map(select(. != null)) | join(" ")' <<<"$input")
if grep -qE 'CONSTANTS\.js' <<<"$target"; then
  echo "Bloqueado: no se permite leer CONSTANTS.js" >&2
  exit 2
fi
exit 0
