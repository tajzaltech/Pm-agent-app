#!/bin/zsh
# Two-way sync: pull remote updates, commit local work, push to GitHub.
set -euo pipefail

export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:$PATH"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

LOG_DIR="$HOME/Library/Logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/pm-agent-github-sync.log"

LOCKDIR="$ROOT/.git/github-sync.lock"
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  echo "$(date '+%Y-%m-%d %H:%M:%S') skip: another sync is running" >>"$LOG"
  exit 0
fi
trap 'rmdir "$LOCKDIR" 2>/dev/null || true' EXIT

git_auth() {
  git -c credential.helper= -c credential.helper='!gh auth git-credential' "$@"
}

{
  echo "==== $(date '+%Y-%m-%d %H:%M:%S %Z') ===="

  if ! command -v gh >/dev/null 2>&1; then
    echo "error: gh CLI not found on PATH"
    exit 1
  fi

  if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh is not logged in"
    exit 1
  fi

  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  git_auth fetch origin

  git add -A
  # Never commit local secrets even if ignore rules drift
  git reset --quiet -- .env .env.local .env.production .env.development 2>/dev/null || true
  git diff --cached --name-only | while IFS= read -r file; do
    case "$file" in
      .env|.env.*|*/.env|*/.env.*)
        if [[ "$file" != *.env.example ]]; then
          git reset --quiet -- "$file" || true
        fi
        ;;
    esac
  done

  if ! git diff --cached --quiet; then
    git commit -m "chore: sync local changes $(date '+%Y-%m-%d %H:%M %Z')"
  fi

  if ! git_auth pull --rebase --autostash origin "$BRANCH"; then
    echo "error: pull --rebase failed; not pushing"
    git rebase --abort 2>/dev/null || true
    exit 1
  fi

  git_auth push origin "HEAD:$BRANCH"
  echo "ok: ${BRANCH} synced with origin"
} >>"$LOG" 2>&1
