#!/bin/bash
# Pull remote updates when a Cursor session starts.
set -euo pipefail
cat >/dev/null

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  git -c credential.helper= -c credential.helper='!gh auth git-credential' \
    pull --rebase --autostash origin "$BRANCH" >/dev/null 2>&1 || true
fi

echo '{}'
