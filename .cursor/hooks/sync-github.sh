#!/bin/bash
# Push local work when a Cursor session ends.
set -euo pipefail
cat >/dev/null

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [[ -x "$ROOT/scripts/sync-github.sh" ]]; then
  "$ROOT/scripts/sync-github.sh" || true
fi

echo '{}'
