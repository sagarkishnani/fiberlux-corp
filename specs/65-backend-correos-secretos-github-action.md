# SPEC 65 — Backend de correos portado a corp con secretos vía GitHub Action

> **Estado:** Aprobado
> **Depende de:** SPEC 01 (formularios legales/OSIPTEL), SPEC 02 (página contacto/formulario)
> **Fecha:** 2026-07-23
> **Objetivo:** Portar el backend PHP de correos de Fiberlux Negocios (envío + panel de leads) a Fiberlux Corporativo y desplegarlo con un GitHub Action FTP que inyecta las claves desde GitHub Secrets, sin versionarlas ni subir archivos a mano.

---

## Scope

**In:**

- **`public/send-email.php`** — handler de formularios portado de negocios y adaptado a corp (branding, form types, mapas de campos).
- **`public/panel-leads.php`** — panel de leads (login, tabla, búsqueda, filtros por fecha, paginación, export CSV).
- **`public/phpmailer/`** — librería (`PHPMailer.php`, `SMTP.php`, `Exception.php`).
- **Secretos externalizados** a `config.local.php` (git-ignored) que los PHP hacen `require`; se commitea `config.example.php` con la forma y valores dummy.
- **`.github/workflows/deploy.yml`** (nuevo en corp): build Astro (con secrets de Tina) → generar `dist/config.local.php` desde GitHub Secrets → deploy FTP de `dist/` excluyendo `data/**` y `uploads/**`.
- **Alineación de form types de corp** en `getFieldRows`, `getSubjectPrefix` y prefijos de correlativo: `contacto`, `reclamo`, `queja`, `apelacion`, `libro_reclamaciones`, `servicios` (+ `arco` si corp lo usa), con los **nombres de campo reales** de corp (ej. `correo`/`comentario`, no `email`/`mensaje`).
- **`.gitignore`**: añadir `config.local.php`.

**Out of scope (futuro):**

- `panel.php` (el simple): se descarta, solo se porta `panel-leads.php`.
- Cambios al frontend de formularios (`submitForm.ts` ya apunta a `send-email.php`; se mantiene tal cual).
- El mecanismo de `form-config.json` (ya existe el endpoint `src/pages/form-config.json.ts` en corp; se reutiliza).
- Migración de submissions históricos de negocios.
- Rediseño del panel o del HTML del correo (se reusa el de negocios, solo rebranding).
- Rotación de credenciales expuestas (recomendada, pero es acción manual del cliente — ver Riesgos).

---

## Data model

**1. `config.local.php`** (git-ignored, generado en CI; devuelve un array que los PHP requieren):

```
<?php
return [
  'SMTP_USER'      => '...',   // cuenta SMTP corp (ej. contacto@fiberlux.pe)
  'SMTP_PASS'      => '...',
  'FALLBACK_EMAIL' => '...',   // destinatario si form-config.json no trae recipients
  'PANEL_USER'     => '...',   // login panel-leads.php
  'PANEL_PASS'     => '...',
];
```

`config.example.php` es idéntico con valores dummy y **sí** se versiona (documenta la forma). `SMTP_HOST`/`SMTP_PORT` (`smtp.office365.com`/`587`) quedan como defaults no sensibles dentro de `send-email.php`.

**2. GitHub Secrets requeridos** (repo corp):

```
TINA_CLIENT_ID, TINA_TOKEN          # build
FTP_HOST, FTP_USER, FTP_PASS        # deploy
SMTP_USER, SMTP_PASS, MAIL_FALLBACK # correo → config.local.php
PANEL_USER, PANEL_PASS              # panel → config.local.php
```

**3. Prefijos de correlativo (corp)** en `send-email.php`:

```
contacto → CON   reclamo → REC   queja → QUE
apelacion → APE  libro_reclamaciones → LIB   servicios → SER   (arco → ARC)
```

**4. Qué aterriza en `dist/` (raíz)** tras build + CI, y viaja por FTP:

```
send-email.php  panel-leads.php  phpmailer/  config.local.php (CI)
form-config.json (Astro)  + el sitio estático
data/  uploads/  → se crean en runtime en el server, EXCLUIDOS del sync
```

---

## Implementation plan

1. **Traer PHPMailer y los PHP base a `public/`.**
   Copiar de negocios a `public/`: `send-email.php`, `panel-leads.php` y la carpeta `phpmailer/` (`PHPMailer.php`, `SMTP.php`, `Exception.php`). Todavía con los valores de negocios. Prueba manual: `npm run build` copia los `.php` intactos a `dist/`.

2. **Externalizar secretos a `config.local.php`.**
   Refactorizar `send-email.php` y `panel-leads.php` para hacer `$cfg = require __DIR__ . '/config.local.php';` (con fallback a un array vacío si no existe) y leer `SMTP_USER/PASS`, `FALLBACK_EMAIL`, `PANEL_USER/PASS` de ahí. Quitar los secretos hardcodeados de negocios. Crear `config.example.php` (dummy, versionado) y añadir `config.local.php` a `.gitignore`. Prueba manual: con un `config.local.php` local de prueba, un POST a `send-email.php` envía correo; sin él, responde error controlado sin exponer nada.

3. **Rebranding a corp.**
   Reemplazar "Fiberlux Negocios" → "Fiberlux" en asuntos, from-name, cuerpo del correo, título/logo del panel y del correo de confirmación. Logo `/images/logo/fiberlux.svg`; dominio del footer del correo al de corp. Prueba manual: el correo y el panel no dicen "Negocios".

4. **Alinear form types y mapas de campos a corp.**
   Ajustar `getFieldRows`, `getSubjectPrefix` y los prefijos de correlativo a los form types de corp, cotejando los nombres de campo reales en `src/content/dynamic-forms/*.json` (ej. `contacto` usa `correo`/`comentario`; añadir `servicios`; revisar `arco`; quitar `hero_contacto`). Prueba manual: enviar cada form type y verificar que sus campos salen poblados (no en blanco) en el correo.

5. **Crear `.github/workflows/deploy.yml`.**
   En push a `main`: `checkout` → `setup-node@20` → `npm ci` → `npm run build` (env `TINA_CLIENT_ID`, `TINA_TOKEN`) → step que **escribe `dist/config.local.php`** desde los secrets SMTP/panel → `SamKirkland/FTP-Deploy-Action` sube `dist/` a `server-dir` (secrets `FTP_*`) con `exclude: **/data/** **/uploads/**`. Prueba manual: correr el workflow y confirmar que sube el sitio + PHP + `config.local.php`, y que `data/`/`uploads/` del server siguen intactos.

6. **Documentar secrets y `server-dir`.**
   Anotar en `README.md`/`CLAUDE.md` la lista de GitHub Secrets requeridos y el `server-dir` de FTP a configurar. Prueba manual: un tercero puede desplegar solo definiendo los secrets.

---

## Acceptance criteria

- [ ] `grep` en el repo no encuentra la contraseña SMTP ni la del panel en ningún archivo versionado.
- [ ] `config.local.php` está en `.gitignore` y no versionado; `config.example.php` sí está versionado con placeholders.
- [ ] Con un `config.local.php` de prueba, un POST a `send-email.php` envía correo al `recipient` de `form-config.json` (y copia de confirmación al lead).
- [ ] El correo y el panel usan branding corp (no aparece "Negocios") y el logo de corp.
- [ ] Cada form type de corp (`contacto`, `reclamo`, `queja`, `apelacion`, `libro_reclamaciones`, `servicios`) genera correo con sus campos reales poblados (`correo`/`comentario`, etc.).
- [ ] `panel-leads.php` exige login con `PANEL_USER`/`PANEL_PASS` (de `config.local.php`), y lista, busca, pagina y exporta CSV los submissions.
- [ ] El workflow corre en push a `main`: build ok, genera `dist/config.local.php` desde secrets y sube `dist/` por FTP.
- [ ] El deploy FTP no borra `data/**` ni `uploads/**` del servidor.
- [ ] `npm run build` compila sin errores y los `.php` de `public/` llegan a `dist/` intactos.

---

## Decisions

- **Sí:** secretos en `config.local.php` generado en CI; los PHP hacen `require`. Nada sensible en el repo y no se edita PHP en cada deploy.
- **No:** reemplazo de placeholders con `sed` (frágil: un token sin sustituir rompe el envío).
- **No:** `getenv()` (un hosting FTP/compartido normalmente no expone variables de entorno al PHP).
- **Sí:** PHP + `phpmailer/` en `public/`, para que Astro los copie a `dist/` y viajen en el mismo deploy FTP.
- **Sí:** excluir `data/**` y `uploads/**` del sync FTP, para no perder submissions ni adjuntos generados en runtime.
- **Sí:** solo `panel-leads.php` (superset con búsqueda/paginación/CSV); se descarta `panel.php`.
- **Sí:** reusar el HTML del correo y del panel de negocios, solo rebranding; sin rediseño.
- **No:** portar `hero_contacto` (corp no lo tiene); los mapas se alinean a los form types reales de corp.
- **Nota de seguridad:** las credenciales de negocios (SMTP y panel) se compartieron en claro; se recomienda rotarlas antes de reusarlas.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El primer deploy FTP (sin state file previo) podría borrar archivos preexistentes del `server-dir` | Definir bien `server-dir`, mantener `exclude` de `data/**` y `uploads/**`, y hacer backup del server antes del primer run. |
| Los nombres de campo de corp difieren de negocios (`correo` vs `email`, `comentario` vs `mensaje`) → correos con campos vacíos | El paso 4 coteja contra `src/content/dynamic-forms/*.json`; hay criterio de aceptación por form type. |
| `config.local.php` no generado (secret faltante) | Los PHP caen a defaults vacíos y el envío responde error controlado; se documentan los secrets requeridos (paso 6). |
| El hosting de corp no ejecuta PHP → los `.php` se servirían como estático | Requiere hosting con PHP (asumido, igual que negocios); confirmar con el proveedor. |
| Credenciales expuestas en claro (SMTP `V9#…`, panel `fiberlux2026`) | Rotarlas antes de poblar los GitHub Secrets de corp. |

---

## Lo que **no** está en este spec

- `panel.php` (el panel simple).
- Cambios al frontend de formularios (`submitForm.ts` se mantiene).
- Migración de submissions históricos de negocios.
- Rediseño del panel o del HTML del correo.
- Rotación de credenciales (recomendada; es acción manual del cliente).
