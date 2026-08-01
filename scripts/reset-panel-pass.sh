#!/usr/bin/env bash
#
# Genera el hash bcrypt para `panel_pass_hash` de fiberlux-config.php (SPEC 86).
#
# La contraseña se pide por teclado (no queda en el historial del shell ni hay
# caracteres que escapar). Copia la línea que imprime al final en el
# fiberlux-config.php del servidor y súbelo por FTP.
#
# Requiere PHP en el PATH.

set -euo pipefail

if ! command -v php >/dev/null 2>&1; then
  echo "Error: PHP no está en el PATH. Instálalo o ejecútalo en un host con PHP." >&2
  exit 1
fi

read -rsp "Nueva contraseña del panel: " PASS
echo
if [ -z "${PASS}" ]; then
  echo "Contraseña vacía; abortando." >&2
  exit 1
fi

HASH="$(php -r 'echo password_hash($argv[1], PASSWORD_DEFAULT);' "$PASS")"

echo
echo "Pega esta línea en fiberlux-config.php (servidor):"
echo
echo "  'panel_pass_hash' => '${HASH}',"
echo
