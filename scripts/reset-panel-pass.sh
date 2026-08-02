#!/usr/bin/env bash
#
# Genera el hash bcrypt para `panel_pass_hash` de fiberlux-config.php (SPEC 86).
#
# La contraseña se pide por teclado (no queda en el historial del shell ni hay
# caracteres que escapar). Copia la línea que imprime al final en el
# fiberlux-config.php del servidor y súbelo por FTP.
#
# Usa PHP si está disponible; si no, cae a `htpasswd` (bcrypt, viene con macOS y
# Apache). Ambos producen un hash $2y$ válido para password_verify().

set -euo pipefail

if command -v php >/dev/null 2>&1; then
  read -rsp "Nueva contraseña del panel: " PASS
  echo
  if [ -z "${PASS}" ]; then
    echo "Contraseña vacía; abortando." >&2
    exit 1
  fi
  HASH="$(php -r 'echo password_hash($argv[1], PASSWORD_DEFAULT);' "$PASS")"
elif command -v htpasswd >/dev/null 2>&1; then
  echo "PHP no encontrado; usando htpasswd (bcrypt)." >&2
  # htpasswd pide la contraseña dos veces (oculta) y emite ':$2y$...'; se quita el ':'.
  HASH="$(htpasswd -nBC 10 "" | tr -d ':\n')"
  if [ -z "${HASH}" ]; then
    echo "No se generó el hash; abortando." >&2
    exit 1
  fi
else
  echo "Error: necesitas 'php' o 'htpasswd' en el PATH." >&2
  exit 1
fi

echo
echo "Pega esta línea en fiberlux-config.php (servidor):"
echo
echo "  'panel_pass_hash' => '${HASH}',"
echo
