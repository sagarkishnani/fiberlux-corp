<?php
/**
 * Plantilla de `fiberlux-config.php` — secretos del backend PHP (SPEC 85).
 *
 * En producción se sube por FTP como `fiberlux-config.php`, FUERA del repo y
 * de `dist/`, junto a `send-email.php`. `send-email.php` y `panel-leads.php`
 * hacen `require` de ese archivo. NUNCA se versiona con valores reales.
 *
 * Para probar en local: copia este archivo a `public/fiberlux-config.php` y rellena.
 */
return [
  'smtp_host'        => 'smtp.office365.com',  // no sensible
  'smtp_port'        => 587,                   // no sensible
  'smtp_user'        => 'contacto@fiberlux.pe',
  'smtp_pass'        => 'CAMBIAR',
  'fallback_email'   => 'destino@fiberlux.pe', // usado si form-config.json no trae recipients
  'panel_user'       => 'admin',               // login de panel-leads.php (SPEC 86)
  'panel_pass_hash'  => 'CAMBIAR',             // password_hash('<pass>', PASSWORD_DEFAULT) (SPEC 86)
  'turnstile_secret' => 'CAMBIAR',             // secret key de Cloudflare Turnstile (SPEC 79)
];
