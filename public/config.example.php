<?php
/**
 * Plantilla de configuración de secretos del backend de correos.
 *
 * NO edites este archivo con valores reales ni lo renombres en el repo.
 * En producción, el GitHub Action genera `config.local.php` (git-ignored)
 * a partir de los GitHub Secrets, con esta misma forma. `send-email.php` y
 * `panel-leads.php` hacen `require` de `config.local.php`.
 *
 * Para probar en local: copia este archivo a `config.local.php` y rellena.
 */
return [
  'SMTP_USER'      => 'contacto@fiberlux.pe', // cuenta SMTP Office 365 corp
  'SMTP_PASS'      => 'CHANGE_ME',
  'FALLBACK_EMAIL' => 'destino@fiberlux.pe',  // usado si form-config.json no trae recipients
  'PANEL_USER'     => 'admin',                // login de panel-leads.php
  'PANEL_PASS'     => 'CHANGE_ME',
  'TURNSTILE_SECRET' => 'CHANGE_ME',          // secret key de Cloudflare Turnstile (SPEC 79)
];
