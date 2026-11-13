# Pase a producción — sitio nuevo (`staging` → `main`) — 2026-11-13

Checklist del pase del sitio corporativo. Comparé `origin/main` (`ff5b1b3`) con `origin/staging` (`bcce31e`).

---

## 0. BLOQUEANTE: producción tiene cambios que `staging` no tiene

Desde el cutover (`e5d4ec3`), `main` sumó **13 commits** que no están en `staging`. El force-push de `staging` sobre `main` **los borra**. No hace falta mergearlos completos (`git merge` da ~30 conflictos porque `staging` reestructuró los subservicios y los legales), pero sí portar lo que todavía aplica:

| Cambio en prod | Commit | Estado en `staging` | Acción |
|---|---|---|---|
| Destinatarios de **contacto** y **servicios**: `jsoto@`, `gpoleo@` (no `eushinahua@`) | `b8681be` `917d260` `2a409ed` `2e1213b` | ❌ Tiene la lista vieja | **Portar**: copiar `recipients` de prod a `src/content/form-config/index.json`. Confirmar la lista con el cliente. |
| PDFs legales versión 2026 (privacidad, cookies, videovigilancia, formulario ARCO) | `58d88d8` | ❌ PDFs viejos | **Portar** los binarios de `public/legales/*.pdf`, y revisar que el texto de las páginas `/legales/*` (SPEC 127) coincida con la versión 2026 |
| **Política de Privacidad de Redes Sociales** (PDF nuevo + link en el footer) | `58d88d8` | ❌ No existe | **Portar**: PDF + ítem del footer (o página legal nueva) |
| Footer: Manual ARCO → PDF, Formulario ARCO → página | `ff5b1b3` | ✅ Lo resuelven las páginas `/legales/manual-derechos-arco` y `/legales/derechos-arco` | Nada |
| FAQ ocultas (`visible: false`) en services/subservicios | `1417f42` | ⚠️ `staging` reestructuró los subservicios | Revisar que no se muestren FAQ con respuestas vacías |
| Ajuste en `dynamic-forms/derechos-arco.json` y `cookie-consent` | `58d88d8` | ⚠️ | Revisar el diff y portar si aplica |
| GTM `GTM-KTV92FNF` | `2644582` | ✅ Está en `BaseLayout.astro` | Nada |
| Checkbox de consentimiento comercial | `8972740` | ✅ `infoComercial` existe | Nada |
| SGSI / ISO 27001 / certificaciones | `a460a88` `8ad2cc7` `d2e861b` | ✅ Lo reemplaza el rediseño | Revisar visualmente `/nosotros` |

Para ver cada cambio: `git show <commit> --stat` y `git diff e5d4ec3 origin/main -- <archivo>`.

## 1. PHP: ¿hay que modificar código?

**No hay que cambiar el código de ningún `.php`.** `send-email.php` y `panel-leads.php` de `staging` están listos. Lo que **sí** cambia es el **archivo de secretos del servidor**, porque el formato es otro:

| | Producción hoy (`main`) | Sitio nuevo (`staging`) |
|---|---|---|
| Archivo | `config.local.php` (opcional) | **`fiberlux-config.php` (obligatorio)** |
| Claves | `SMTP_USER`, `SMTP_PASS`, `FALLBACK_EMAIL`, `PANEL_USER`, `PANEL_PASS` (mayúsculas, contraseña en texto plano) | `smtp_host`, `smtp_port`, `smtp_user`, `smtp_pass`, `fallback_email`, `panel_user`, `panel_pass_hash`, `turnstile_secret` (minúsculas, contraseña **hasheada**) |
| Si falta | Usa credenciales escritas en el código | `send-email.php` responde **500 "Configuración no disponible"** y **ningún formulario funciona**. El panel rechaza el login. |

### Qué hacer (TI, **antes** del force-push)

1. En el docroot de producción, junto a `send-email.php`, crear `fiberlux-config.php` a partir de `public/config.example.php`:
   ```php
   <?php
   return [
     'smtp_host'        => 'smtp.office365.com',
     'smtp_port'        => 587,
     'smtp_user'        => '<cuenta SMTP actual de prod>',
     'smtp_pass'        => '<contraseña SMTP>',
     'fallback_email'   => '<correo de respaldo>',
     'panel_user'       => '<usuario del panel>',
     'panel_pass_hash'  => '<salida de scripts/reset-panel-pass.sh>',
     'turnstile_secret' => '<secret key de Turnstile>',
   ];
   ```
2. `chmod 640` y dueño = el usuario de Apache/PHP. `rsync --delete` lo respeta porque está excluido en `server-deploy.sh`.
3. `config.local.php`, si existe, lo borra el `rsync --delete` en el primer despliegue. Es normal: ya no se usa.

### ⚠️ Seguridad: rotar la contraseña SMTP

El `send-email.php` de `main` tiene **escrita en el código** la contraseña SMTP de `hola@fiberlux.pe` como fallback, y esa contraseña queda en el historial de git. Aunque el código nuevo ya no la usa, **hay que rotarla en Office 365** y poner la nueva en `fiberlux-config.php`.

### Turnstile (captcha): la site key y la secret van juntas o ninguna

| `PUBLIC_TURNSTILE_SITE_KEY` en `deploy.env` | `turnstile_secret` en `fiberlux-config.php` | Resultado |
|---|---|---|
| ✅ | ✅ | Correcto: captcha activo |
| ✅ | vacío | Funciona sin verificar (sin protección) |
| vacío | ✅ | **Todos los envíos se rechazan** ("Verificación de seguridad fallida") |
| vacío | vacío | Funciona sin captcha |

El widget de Cloudflare ya incluye `fiberlux.pe` como dominio.

### Leads a Odoo (`flx_leads_web`)

`send-email.php` carga `/var/www/fiberlux-persistent/flx_leads_api.php` (ruta absoluta) para contacto y servicios. Si el archivo no existe, se salta sin dar error, **pero entonces no llegan leads a Odoo**. TI tiene que confirmar que ese archivo exista y sea legible por PHP en el servidor de producción.

### Otros puntos del servidor

- PHP ≥ 7.4 (arrow functions `fn`), con `curl` (Turnstile; si falta, usa `file_get_contents` con `allow_url_fopen`).
- `data/` y `uploads/` deben poder ser escritos por PHP. El panel crea además `data/deleted/` y `data/deleted.log` (papelera, SPEC 86).
- Apache con `AllowOverride` que permita los `.htaccess` nuevos de `data/` y `uploads/`, que bloquean el acceso web a los leads. Verificar después del pase: `curl -I https://fiberlux.pe/data/counter.json` → **403**.
- `data/counter.json` y `data/submissions/` se conservan y mantienen el formato, así que los correlativos siguen la numeración actual.

## 2. TinaCloud

- `deploy.env` del servidor ya debe tener `TINA_BRANCH=main` y el script `DEPLOY_BRANCH=main`. Deben coincidir.
- El índice de TinaCloud de `main` tiene el **schema viejo**. Después del force-push, TinaCloud reindexa `main`. **Hasta que termine, el build del servidor falla** (en ese tiempo el sitio viejo sigue arriba).
- Verificar el índice: `POST https://content.tinajs.io/1.6/content/<clientId>/github/main` con una query a `popup` (colección que solo existe en el schema nuevo).
- `.env` local: volver a `TINA_BRANCH=main` cuando `staging` = `main`.

## 3. ⚠️ El script de despliegue no reintenta un build fallido

`server-deploy.sh` hace `git reset --hard` **antes** del build. Si el primer build falla (por ejemplo, porque TinaCloud todavía no reindexó), en la siguiente corrida `HEAD == origin/main` y se registra "sin cambios": **no vuelve a intentar**. Después de confirmar el reindex hay que relanzar a mano:

```bash
sudo -u <usuario-deploy> FORCE=1 DEPLOY_BRANCH=main DOCROOT=<docroot-prod> /opt/fiberlux/deploy.sh
tail -f /var/log/fiberlux-deploy.log   # esperar "publicado <sha>"
```

## 4. Orden del pase

1. [ ] Portar a `staging` los cambios de prod de la sección 0 (destinatarios, PDFs 2026, política de redes sociales) y hacer push.
2. [ ] Build local verde con `TINA_BRANCH=staging`.
3. [ ] TI: crear `fiberlux-config.php` en el docroot de prod (sección 1). Confirmar el archivo de Odoo, `PUBLIC_TURNSTILE_SITE_KEY` en `deploy.env`, y rotar la contraseña SMTP.
4. [ ] Avisar al cliente que **no edite en Tina** durante el pase. Un guardado en `main` justo antes del force-push se perdería.
5. [ ] `git fetch && git push --force-with-lease=main:origin/main origin/staging:main` (protege contra un commit de Tina que llegue en el medio).
6. [ ] Esperar el reindex de TinaCloud para `main` y verificarlo (sección 2).
7. [ ] Si el primer build falló, relanzar con `FORCE=1` (sección 3) y esperar `publicado <sha>` en el log.
8. [ ] `.env` local → `TINA_BRANCH=main`.

**Rollback:** `git push --force origin ff5b1b3:main` (el `main` actual) y, si hace falta, relanzar con `FORCE=1`. El servidor publica ese commit en el siguiente poll. Para el rollback, `fiberlux-config.php` no molesta, pero el código viejo necesita sus credenciales: dejar también `config.local.php` o aceptar que vuelva a usar el fallback escrito en el código.

## 5. Smoke test después del pase

- [ ] Home, `/nosotros`, `/soluciones/*`, `/blog`, `/contacto`, `/en/` cargan sin 404.
- [ ] `/form-config.json` muestra los destinatarios correctos.
- [ ] Enviar **contacto** con un correo propio: llega el aviso al equipo, llega la confirmación completa con imágenes (`/mail/*.png`) y aparece el lead en Odoo.
- [ ] Enviar **reclamo** de prueba: llega el aviso y la confirmación simple con correlativo `REC-…` que continúa la numeración.
- [ ] `/panel-leads.php`: el login funciona con la contraseña nueva y se ven los leads históricos.
- [ ] `curl -I https://fiberlux.pe/data/counter.json` → 403. `curl -I https://fiberlux.pe/fiberlux-config.php` → 200 con cuerpo vacío (PHP lo ejecuta, no muestra el código).
- [ ] GTM dispara (Tag Assistant). El pop-up y el banner de cookies se ven.
- [ ] `/admin` abre Tina contra `main` y se ven la colección `popup` y los campos `_en`.
