#!/usr/bin/env bash
#
# Fiberlux — despliegue por PULL desde el servidor propio.
#
# El servidor consulta la rama cada minuto (cron + flock). Si hay un commit nuevo
# —venga de un push tuyo o de un guardado en TinaCMS— reconstruye y publica.
# No requiere puertos entrantes ni credenciales FTP en GitHub.
#
# IMPORTANTE: cron NO debe llamar a este archivo dentro del repo. `git reset --hard`
# lo reescribe en caliente y bash, que lee el script por partes, se rompe.
# Copiar a /opt/fiberlux/deploy.sh y apuntar cron ahí.
#
set -euo pipefail

# ─── Configuración (ajustar a las rutas reales del servidor) ───
BRANCH="${DEPLOY_BRANCH:-staging}"
REPO_DIR="${REPO_DIR:-/opt/fiberlux/app}"
DOCROOT="${DOCROOT:-/var/www/fiberlux.pe/staging}"
ENV_FILE="${ENV_FILE:-/opt/fiberlux/deploy.env}"
LOG_FILE="${LOG_FILE:-/var/log/fiberlux-deploy.log}"
LOCK_STAMP="/opt/fiberlux/.last-lock"

# FORCE=1 reconstruye y publica aunque no haya commits nuevos. Necesario en la
# primera corrida (tras el clone, HEAD ya es igual a origin/BRANCH) y útil para
# republicar tras tocar deploy.env o vaciar el docroot.
FORCE="${FORCE:-0}"

exec >>"$LOG_FILE" 2>&1
echo "── $(date '+%F %T')  check ${BRANCH} ──"

cd "$REPO_DIR"

# 1. ¿Hay commits nuevos en la rama?
git fetch --quiet origin "$BRANCH"
LOCAL_SHA="$(git rev-parse HEAD)"
REMOTE_SHA="$(git rev-parse "origin/${BRANCH}")"
if [ "$LOCAL_SHA" = "$REMOTE_SHA" ] && [ "$FORCE" != "1" ]; then
  echo "   sin cambios (${LOCAL_SHA:0:7})"
  exit 0
fi
if [ "$LOCAL_SHA" = "$REMOTE_SHA" ]; then
  echo "   FORCE=1 — republicando ${REMOTE_SHA:0:7}"
else
  echo "   nuevo commit ${REMOTE_SHA:0:7} — desplegando"
fi

# 2. Sincronizar. `reset --hard`, no `pull`: el build escribe en archivos versionados
#    (tina/__generated__/) y un pull fallaría por árbol sucio.
git reset --hard "origin/${BRANCH}"

# 3. Variables de build (fuera del repo, nunca versionadas).
set -a; . "$ENV_FILE"; set +a

# 4. Dependencias: solo si cambió el lockfile o no existe node_modules.
if [ ! -d node_modules ] || ! cmp -s package-lock.json "$LOCK_STAMP"; then
  echo "   npm ci"
  npm ci
  cp package-lock.json "$LOCK_STAMP"
fi

# 5. Build (tinacms build && astro build).
npm run build

# 6. Publicar. Los --include ANTES de los --exclude: el orden manda en rsync.
#    Lo excluido queda además protegido de --delete.
#      · data/**, uploads/**      → submissions, counter.json y adjuntos de runtime
#      · fiberlux-config.php      → secretos SMTP, subidos a mano, nunca en dist/
#    Sus .htaccess sí se sincronizan (viajan en dist/ y son los que bloquean el acceso).
rsync -a --delete \
  --include='/data/.htaccess'    --exclude='/data/**' \
  --include='/uploads/.htaccess' --exclude='/uploads/**' \
  --exclude='/fiberlux-config.php' \
  ./dist/ "${DOCROOT}/"

echo "── OK $(date '+%F %T')  publicado ${REMOTE_SHA:0:7} ──"
