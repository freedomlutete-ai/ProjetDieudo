#!/bin/bash
# Prépare les sessions cloud : dépendances du Reel + Playwright pour le skill webapp-testing.
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Dépendances du Reel Remotion
npm install --prefix reel-vrai-ou-bidon --no-audit --no-fund

# Playwright (Python) pour le skill webapp-testing.
# La version est fixée à 1.56.0 pour correspondre au Chromium préinstallé
# dans /opt/pw-browsers (chromium-1194). Une version plus récente cherche une
# autre révision du navigateur et échoue au lancement.
if ! python3 -c "import playwright" 2>/dev/null; then
  pip install --quiet "playwright==1.56.0"
fi
