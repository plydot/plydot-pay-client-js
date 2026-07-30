#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CREDS="${NPM_PUBLISH_ENV:-$HOME/.config/plydot/npm-publish.env}"

if [[ ! -f "$CREDS" ]]; then
  echo "Missing credentials file: $CREDS" >&2
  echo "Create it with NPM_TOKEN=npm_…" >&2
  exit 1
fi

# shellcheck disable=SC1090
source "$CREDS"

: "${NPM_TOKEN:?NPM_TOKEN required}"

cd "$ROOT"
npm test
npm run build
npm publish --access public

echo "Published. Check https://www.npmjs.com/package/@plydot/pay-client"
