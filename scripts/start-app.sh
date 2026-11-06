#!/usr/bin/env bash
# Production entry for Cursor Live Apps and other hosts that run `npm start`.
# Demo data is a local SQLite file. No secrets are required.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f data/platform.db ]]; then
  if [[ ! -x node_modules/.bin/tsx ]]; then
    echo "start-app: tsx is missing, so demo SQLite was not seeded." >&2
    echo "start-app: install dependencies (including tsx) and restart." >&2
  else
    echo "start-app: creating demo SQLite at data/platform.db"
    node_modules/.bin/tsx lib/db/init-db.ts
    node_modules/.bin/tsx lib/db/seed.ts
  fi
fi

PORT="${PORT:-3000}"
exec node_modules/.bin/next start -H 0.0.0.0 -p "$PORT"
