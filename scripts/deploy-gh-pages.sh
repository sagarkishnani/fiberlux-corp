#!/usr/bin/env bash
set -euo pipefail

# Deploy manual a GitHub Pages:
# construye el sitio localmente y publica el contenido de dist/ en la rama gh-pages.
# GitHub Pages sirve esa rama como estático (sin Jekyll gracias a .nojekyll).

BRANCH="gh-pages"
REMOTE_URL="$(git config --get remote.origin.url)"
SRC_SHA="$(git rev-parse --short HEAD)"

echo "▶ Construyendo el sitio (tinacms build && astro build)..."
npm run build

echo "▶ Deshabilitando Jekyll (.nojekyll)..."
touch dist/.nojekyll

echo "▶ Publicando dist/ en la rama '$BRANCH'..."
pushd dist >/dev/null
rm -rf .git
git init -q
git checkout -q -b "$BRANCH"
git add -A
git commit -qm "Deploy desde $SRC_SHA — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
git push -f "$REMOTE_URL" "$BRANCH"
rm -rf .git
popd >/dev/null

echo "✔ Listo. GitHub Pages servirá la rama '$BRANCH' en unos minutos."
echo "  URL: https://sagarkishnani.github.io/fiberlux-corp/"
