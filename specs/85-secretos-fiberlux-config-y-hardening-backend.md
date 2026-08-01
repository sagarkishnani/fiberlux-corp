# SPEC 85 — Secretos en `fiberlux-config.php` y hardening del backend PHP

> **Estado:** Implementado
> **Depende de:** SPEC 65 (backend de correos actual — la reemplaza), y condiciona a SPEC 79 (captcha)
> **Fecha:** 2026-08-01
> **Objetivo:** Homologar el manejo de secretos de corp con negocios — pasar de `config.local.php` inyectado por CI a `fiberlux-config.php` subido por FTP — y cerrar las fugas de datos: credenciales hardcodeadas en `send-email.php` y acceso HTTP directo a `data/` y `uploads/`.

> **Homologación:** porta la SPEC 02 de `fiberlux-negocios`. **Cambia el mecanismo de secretos que hoy usa corp (SPEC 65).** Decisión del cliente: tener ambos proyectos con la misma forma de configuración para que los cambios sean paralelos.

---

## Por qué existe esta spec

Corp tiene hoy tres problemas:

1. **Credenciales hardcodeadas en código versionado.** `send-email.php` usa fallbacks literales cuando `config.local.php` falta:

   ```php
   $SMTP_USER     = $cfg['SMTP_USER'] ?? 'hola@fiberlux.pe';
   $SMTP_PASS     = $cfg['SMTP_PASS'] ?? 'HoFi032026MKT!*';   // ← contraseña real en git
   $FALLBACK_EMAIL = $cfg['FALLBACK_EMAIL'] ?? 'sagarkishnani67@gmail.com';  // ← correo personal
   ```

   Están en el repo, en el historial y en cada `dist/`.

2. **`data/` y `uploads/` accesibles por HTTP.** No hay `.htaccess` que los proteja. `data/submissions/CON-000001.json` se descarga directo; los correlativos son secuenciales y sus prefijos predecibles (`CON-`, `SER-`, `REC-`, `APE-`, `QUE-`, `ARC-`, `LIB-`), así que se enumeran en bucle. Igual con `uploads/<correlativo>/<archivo>`, donde los formularios legales guardan documentos de identidad. Es una fuga independiente del panel (SPEC 86).

3. **Dos mecanismos de config distintos entre corp y negocios.** Corp inyecta `config.local.php` por GitHub Actions; negocios sube `fiberlux-config.php` por FTP. Mantener dos formas duplica el trabajo de cualquier cambio de backend.

---

## Alcance

**Entra:**

- Sustituir la lectura de `config.local.php` por `fiberlux-config.php`, un archivo que vive en el servidor **fuera del repo y fuera de `dist/`**, subido por FTP una sola vez.
- Eliminar de `send-email.php` **todos** los fallbacks hardcodeados; si el config falta, responder 500 sin intentar enviar.
- `config.example.php` en el repo con la nueva forma (solo placeholders) como plantilla versionada.
- `.gitignore`: bloquear `fiberlux-config.php` y `public/fiberlux-config.php`.
- Bloquear el acceso HTTP a `data/` y `uploads/` con un `.htaccess` por directorio (`public/data/.htaccess`, `public/uploads/.htaccess`).
- `.github/workflows/deploy.yml`: **eliminar** el step "Generate config.local.php from secrets". (No se excluye `data/**`/`uploads/**`: corp usa `delete_remote_files:false`, que ya conserva los leads runtime; los `.htaccess` viajan en `dist/` y se despliegan solos — decisión de implementación distinta a negocios.)
- Definir en `fiberlux-config.php` las claves de panel (`panel_user`, `panel_pass_hash`) que consumirá la SPEC 86 y `turnstile_secret` que consumirá la SPEC 79 re-adaptada.
- Rotar la contraseña SMTP en Office 365.

**Fuera de alcance (para futuras specs):**

- El bypass de autenticación del panel y su hash (SPEC 86).
- La zona horaria de los leads (SPEC 87).
- Re-adaptar el captcha a `fiberlux-config.php` (ver "Relación con SPEC 79"; se hace al reaplicar spec 79).
- Versionar el `.htaccess` de la raíz del servidor (sigue gestionado a mano allí, junto con WordPress).
- Mover `data/submissions/` a una base de datos.

---

## Modelo de datos

### `fiberlux-config.php` — en el servidor, protegido, no versionado

Ruta en el servidor: junto a `send-email.php` (raíz web servida, o `/staging/` mientras convive con WordPress). Forma (claves en minúscula, homologadas con negocios):

```php
<?php
return [
  'smtp_host'       => 'smtp.office365.com',
  'smtp_port'       => 587,
  'smtp_user'       => 'contacto@fiberlux.pe',
  'smtp_pass'       => '<<contraseña rotada>>',
  'fallback_email'  => 'destino@fiberlux.pe',
  'panel_user'      => 'admin',              // lo consume la SPEC 86
  'panel_pass_hash' => '<<hash bcrypt>>',    // lo consume la SPEC 86
  'turnstile_secret'=> '<<secret de cloudflare>>',  // lo consume la SPEC 79 re-adaptada
];
```

Doble protección en el servidor:

1. Es un `.php` que solo hace `return [...]`: una petición directa lo ejecuta y devuelve vacío; las credenciales no se emiten mientras PHP funcione.
2. Un bloque `<Files "fiberlux-config.php">` con `Require all denied` en el `.htaccess` del servidor, para el caso de que PHP dejara de ejecutarse. Se añade a mano una vez.

### Cómo lo lee `send-email.php`

Reemplaza las líneas 9-24. Si el archivo falta, responde 500 en vez de degradar a credenciales vacías o hardcodeadas:

```php
$CONFIG_PATH = __DIR__ . '/fiberlux-config.php';
if (!file_exists($CONFIG_PATH)) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Configuración no disponible.']);
    exit;
}
$cfg = require $CONFIG_PATH;

$SMTP_HOST     = $cfg['smtp_host'] ?? 'smtp.office365.com';
$SMTP_PORT     = $cfg['smtp_port'] ?? 587;
$SMTP_USER     = $cfg['smtp_user'];      // sin fallback literal
$SMTP_PASS     = $cfg['smtp_pass'];      // sin fallback literal
$FALLBACK_EMAIL = $cfg['fallback_email'];
```

### `config.example.php` — plantilla versionada

Copia exacta de la forma anterior con los valores en `'CAMBIAR'`. Único archivo de configuración que entra en git.

### `.htaccess` de bloqueo — dos archivos nuevos

`public/data/.htaccess` y `public/uploads/.htaccess`, mismo contenido (cubre Apache 2.4 y 2.2):

```apache
<IfModule mod_authz_core.c>
    Require all denied
</IfModule>
<IfModule !mod_authz_core.c>
    Order allow,deny
    Deny from all
</IfModule>
```

No afecta a `send-email.php`, que escribe por sistema de archivos, ni al panel, que solo muestra nombre y tamaño de los adjuntos.

---

## Relación con SPEC 65 (a la que reemplaza)

SPEC 65 dejó el backend leyendo `config.local.php`, generado en CI desde GitHub Secrets (`SMTP_USER`, `SMTP_PASS`, `MAIL_FALLBACK`, `PANEL_USER`, `PANEL_PASS`). Esta spec **retira ese mecanismo**: el config pasa a subirse por FTP a mano. Esos GitHub Secrets quedan sin uso (se pueden borrar del repo tras el cutover). El step de generación en `deploy.yml` se elimina.

## Relación con SPEC 79 (captcha — a re-adaptar)

La SPEC 79 (captcha, aún en rama `spec-79`, sin mergear) leía `TURNSTILE_SECRET` de `config.local.php` y lo inyectaba por CI. Al reaplicarla **después** de esta spec:

- `send-email.php` leerá `$cfg['turnstile_secret']` (minúscula) de `fiberlux-config.php`, no `config.local.php`.
- Se elimina de `deploy.yml` la escritura de `TURNSTILE_SECRET` (ya no se genera config en CI).
- `PUBLIC_TURNSTILE_SITE_KEY` **se mantiene** como env var pública de build (Vite la inlinea); no es un secreto de servidor, así que no va en `fiberlux-config.php`.

Esta reconciliación queda anotada aquí y se ejecuta al reaplicar spec 79.

> **Nota de implementación:** al implementar esta spec, el captcha (SPEC 79) **ya estaba mergeado en `main`**, no en una rama aparte. Por eso la reconciliación se aplicó **dentro de este spec**: `send-email.php` ya lee `$cfg['turnstile_secret']` y `deploy.yml` ya no inyecta `TURNSTILE_SECRET`. `PUBLIC_TURNSTILE_SITE_KEY` se mantiene en el build.

---

## Plan de implementación

Cada paso deja el sitio desplegable y es commiteable por separado.

1. **Añadir `config.example.php`** con la nueva forma (placeholders) y **actualizar `.gitignore`** con `fiberlux-config.php` y `public/fiberlux-config.php`. (Se puede dejar la entrada de `config.local.php` durante la transición.)

2. **Modificar `public/send-email.php`** para leer `$cfg` de `fiberlux-config.php`, con fail-500 si falta y **sin ningún fallback literal**. Verificación: `grep -n "HoFi032026\|sagarkishnani67\|SMTP_PASS'.*=>" public/send-email.php` no encuentra credenciales.

3. **Crear `public/data/.htaccess` y `public/uploads/.htaccess`.** Verificación: `npm run build` los coloca en `dist/data/` y `dist/uploads/`.

4. **Endurecer `deploy.yml`:** eliminar el step "Generate config.local.php from secrets". Se mantiene `PUBLIC_TURNSTILE_SITE_KEY` (pública) y `delete_remote_files:false`. **No** se excluye `data/**`/`uploads/**`: con `delete_remote_files:false` los leads runtime ya se conservan, y los dos `.htaccess` de bloqueo se despliegan solos desde `dist/` (decisión de corp, distinta a negocios).

5. **Paso manual en el servidor (FTP), no automatizable.** Ver "Pasos FTP" abajo.

6. **Desplegar y verificar** un envío real en producción/staging y el bloqueo HTTP de `data/` y `uploads/` con `curl -I`.

### Pasos FTP (manuales, una sola vez)

1. **Rotar** la contraseña SMTP en Office 365.
2. **Subir** `fiberlux-config.php` a la raíz web (junto a `send-email.php`), con la contraseña rotada, `panel_user`/`panel_pass_hash` (SPEC 86) y `turnstile_secret` (SPEC 79). **Nunca** se versiona ni entra en `dist/`.
3. **Añadir** el bloque `<Files "fiberlux-config.php"> Require all denied </Files>` al `.htaccess` del servidor.
4. *(Ya **no** hace falta subir los `.htaccess` a mano: viajan en `dist/` y se despliegan solos. Tras el primer deploy quedan en `data/` y `uploads/` del servidor. Verifica con `curl` que devuelven 403.)*

---

## Criterios de aceptación

- [x] La contraseña SMTP antigua no aparece en `send-email.php` ni en el árbol de trabajo. *(Verificado por grep.)*
- [x] `config.example.php` está versionado y solo contiene placeholders. *(Nueva forma `fiberlux-config.php`, valores `CAMBIAR`.)*
- [x] `git check-ignore fiberlux-config.php public/fiberlux-config.php` marca ambos como ignorados. *(Verificado.)*
- [x] `npm run build` termina sin errores y `dist/` contiene `send-email.php`, `phpmailer/` y los dos `.htaccess` de bloqueo. *(Verificado: 116 páginas, archivos presentes en `dist/`.)*
- [x] `deploy.yml` ya no genera `config.local.php` ni maneja credenciales (mantiene la site key pública y `delete_remote_files:false`). *(Sin exclude — decisión de corp.)*
- [ ] Con `fiberlux-config.php` ausente, `POST /send-email.php` responde 500 y no envía correo. *(Lógica implementada; requiere servidor PHP para probar.)*
- [ ] Con `fiberlux-config.php` presente, `/contacto` en producción devuelve `success:true` con correlativo y el correo llega. *(QA en vivo tras subir el config.)*
- [ ] `curl -s https://fiberlux.pe/fiberlux-config.php` no devuelve credenciales (403 o respuesta vacía). *(Requiere el `<Files>` en el `.htaccess` del servidor.)*
- [ ] `curl -sI https://fiberlux.pe/data/submissions/<correlativo>.json` devuelve 403. *(Tras desplegar el `.htaccess`.)*
- [ ] `curl -sI https://fiberlux.pe/uploads/<correlativo>/<archivo>` devuelve 403. *(Tras desplegar el `.htaccess`.)*
- [ ] Tras el bloqueo, un envío con adjunto sigue guardando el archivo y el correo llega con el adjunto. *(QA en vivo.)*
- [ ] Tras desplegar, `data/submissions/` y `uploads/` conservan sus archivos previos. *(Garantizado por `delete_remote_files:false`; verificar en vivo.)*

---

## Decisiones

- **Sí (cliente):** `fiberlux-config.php` por FTP, homologado con negocios, aunque corp ya tenía CI (SPEC 65). Prioriza que ambos proyectos se toquen igual.
- **Sí:** fail-500 si falta el config, en vez de degradar a valores vacíos o hardcodeados. Un form que dice "enviado" sin enviar es peor que uno que falla visible.
- **Sí:** quitar los fallbacks literales de `send-email.php`. Son una fuga real (contraseña + correo personal en git).
- **Sí:** `.htaccess` por directorio en `data/` y `uploads/`. **No se excluye del deploy** (a diferencia de negocios): corp usa `delete_remote_files:false`, que ya conserva los leads runtime, así que los `.htaccess` se despliegan solos desde `dist/` y no hay paso manual. Decidido en implementación con el cliente.
- **Sí:** `panel_pass_hash` y `turnstile_secret` ya en el config aunque sus specs (86/79) los consuman después. Evita tocar el archivo del servidor tres veces.
- **No:** seguir con GitHub Secrets + CI (SPEC 65). Descartado por decisión de homologación del cliente.
- **No:** versionar el `.htaccess` de la raíz. Arriesga las reglas de WordPress/staging por nada que esta spec necesite.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Los datos han estado accesibles por HTTP un tiempo indeterminado; el bloqueo no es retroactivo. | Fuera del alcance técnico. Anotado por si procede notificar según Ley 29733; los logs del hosting dirían si hubo descargas. |
| Entre eliminar la generación de config en CI y subir `fiberlux-config.php`, los forms no envían. | El cutover (pasos FTP) se hace y verifica de inmediato. Los envíos se siguen guardando en `data/` aunque el correo falle. |
| El deploy pasa a gestionar `send-email.php`: un build roto tumba el envío. | El paso 6 verifica un envío real; ante fallo, se restaura por FTP desde el commit anterior. |
| El captcha (SPEC 79) quedó apuntando a `config.local.php`. | Reconciliación documentada arriba; se aplica al reaplicar spec 79. |
| El hosting podría no honrar `.htaccess` por directorio si `AllowOverride` está restringido. | El paso 6 lo comprueba con `curl`. Si no aplica, mover `data/`/`uploads/` fuera de la raíz web (otra spec). |
| Si PHP dejara de ejecutarse, `fiberlux-config.php` se serviría como texto. | El bloque `<Files>` lo bloquea con independencia de PHP; un fallo de PHP tumbaría el sitio entero y no pasaría desapercibido. |

---

## Lo que **no** entra en esta spec

- El bypass de autenticación del panel ni su hash (SPEC 86).
- La zona horaria de los leads (SPEC 87).
- Re-adaptar el captcha (se hace al reaplicar SPEC 79).
- Versionar el `.htaccess` de la raíz.
- Migrar `data/submissions/` a base de datos.
