#!/usr/bin/env bash
# Builds downloads/laurin-helfer.zip with the laurin-helfer/ folder at the ZIP root,
# as required by the Claude Desktop skill upload.
set -euo pipefail

readonly SKILL="laurin-helfer"
readonly MAX_DESCRIPTION_CHARS=200
readonly ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly SKILL_MD="$ROOT/skills/$SKILL/SKILL.md"
readonly OUT="$ROOT/downloads/$SKILL.zip"

if [[ ! -f "$SKILL_MD" ]]; then
  echo "error: missing $SKILL_MD" >&2
  exit 1
fi

# Claude Desktop rejects skills whose description exceeds 200 characters.
description="$(sed -n 's/^description: //p' "$SKILL_MD" | head -n 1)"
chars="$(printf '%s' "$description" | LC_ALL=en_US.UTF-8 wc -m | tr -d ' ')"
if [[ -z "$description" ]]; then
  echo "error: no description in $SKILL_MD" >&2
  exit 1
fi
if (( chars > MAX_DESCRIPTION_CHARS )); then
  echo "error: description has $chars characters (max $MAX_DESCRIPTION_CHARS)" >&2
  exit 1
fi

mkdir -p "$ROOT/downloads"
rm -f "$OUT"
(cd "$ROOT/skills" && zip -r -q -X "$OUT" "$SKILL" -x '*.DS_Store' -x '*/.*')

echo "built $OUT (description: $chars chars)"
unzip -l "$OUT"
