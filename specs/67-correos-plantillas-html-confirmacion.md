# SPEC 67 — Plantillas HTML de correos (confirmación al cliente + logo)

> **Estado:** Aprobado
> **Depende de:** SPEC 65 (backend de correos)
> **Fecha:** 2026-07-25
> **Objetivo:** Rediseñar el correo de confirmación al cliente con la plantilla rica para contacto y soluciones, agregar el logo a la confirmación de reclamos/legales y al correo interno de la empresa, y resolver las imágenes de `public/mail` por URL absoluta derivada del host.

---

## Scope

**In:**

- **Base de assets en runtime** en `send-email.php`: `$assetBase = esquema://host + dirname(SCRIPT_NAME) + "/mail"` (apunta a `/mail` en prod y `/staging/mail` en staging, sin hardcodear dominio).
- **Confirmación al cliente por grupos:**
  - **Grupo A (`contacto`, `servicios`)**: plantilla rica de `Downloads/index (1).html`, con imágenes desde `$assetBase` y `[Nombre]` reemplazado por el nombre del lead.
  - **Grupo B (`reclamo`, `queja`, `apelacion`, `libro_reclamaciones`, `derechos-arco`)**: el HTML de confirmación actual, reemplazando el texto "Fiberlux" del header negro por `logoFiberlux-blanco.png`.
- **Correo interno a la empresa** (`buildEmailBody`): reemplazar el texto "Fiberlux" del header por `logoFiberlux-blanco.png`.
- **AltBody (texto plano)** coherente por grupo.

**Out of scope (futuro):**

- Destinatarios/recipients (`form-config`) y el panel de leads.
- Nuevas imágenes o branding fuera de `public/mail`.
- Traducciones/i18n de los correos.
- Cambiar cuándo se envía la confirmación (sigue siendo: solo si hay email válido).

---

## Data model

**1. Grupos de `formType`** (en `send-email.php`):

```
Grupo A (plantilla rica):  contacto, servicios
Grupo B (simple + logo):   reclamo, queja, apelacion, libro_reclamaciones, derechos-arco
```

**2. Base de assets (runtime):**

```php
$proto = $_SERVER['HTTP_X_FORWARDED_PROTO']
      ?? ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http');
$host  = $_SERVER['HTTP_HOST'] ?? '';
$dir   = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
$assetBase = "$proto://$host$dir/mail";   // ej: https://fiberlux.pe/mail  ó  https://fiberlux.pe/staging/mail
```

**3. Nombre del lead** (para "Hola [Nombre]"):

```
$leadName = trim( nombre + (apellido | apellidos) )   // servicios usa "apellidos"
            → si vacío: nombreCompleto
            → si vacío: "" (el saludo queda "Hola")
```

**4. Assets usados de `public/mail`:**

```
Grupo A: logoFiberlux-blanco.png, header-contact-mail.png, logoFiberlux-full.png,
         {linkedin,facebook,youtube,instagram}-blanco.png y -gris.png
Grupo B + interno: logoFiberlux-blanco.png
```

**5. Asuntos:**

```
Grupo A: "Gracias por contactarnos — Fiberlux"
Grupo B: "Recibimos tu mensaje [<correlativo>] — Fiberlux"   (actual, sin cambios)
```

---

## Implementation plan

1. **Calcular `$assetBase` y pasarlo a los builders.**
   Al inicio de `send-email.php` (antes del envío), computar `$assetBase` según el Data model (con soporte `X-Forwarded-Proto`). Ajustar las firmas de `buildEmailBody()` y de las funciones de confirmación para recibir `$assetBase` (o exponerlo por `global`). Prueba manual: `var_dump($assetBase)` da la URL correcta en prod y en staging.

2. **Logo en el correo interno (`buildEmailBody`).**
   Reemplazar el `<h1>Fiberlux</h1>` del header negro por `<img src="$assetBase/logoFiberlux-blanco.png" alt="Fiberlux" width="141" style="display:block;height:auto;">`, manteniendo el `typeName` debajo. Prueba manual: el correo a la empresa muestra el logo, no el texto.

3. **Confirmación Grupo B (simple + logo).**
   Crear `buildConfirmSimple($leadName, $correlativo, $assetBase)` a partir del HTML de confirmación actual, cambiando el texto "Fiberlux" del header negro por `logoFiberlux-blanco.png`. Mantener correlativo, mensaje de 24 h y footer. Prueba manual: enviar un `reclamo` → la confirmación llega con el logo.

4. **Confirmación Grupo A (plantilla rica).**
   Crear `buildConfirmRich($leadName, $assetBase)` con la plantilla de `Downloads/index (1).html`: reemplazar todas las URLs de imagen (`huancayo.isp…`) por `$assetBase/<archivo>.png`, y `Hola [Nombre]` por `Hola <nombre>` (o `Hola` si no hay). Prueba manual: enviar `contacto` y `servicios` → la confirmación llega con la plantilla rica y las imágenes de `/mail` cargan.

5. **Selección por grupo + asunto + AltBody.**
   En el bloque de confirmación, elegir plantilla y asunto según el grupo del `formType` (A → rica + "Gracias por contactarnos"; B → simple + "Recibimos tu mensaje [correlativo]"). Actualizar el `AltBody` de cada grupo (texto plano corto). Mantener el envío silencioso ante fallos. Prueba manual: cada form type usa la plantilla/asunto correcto; sin email válido, no se envía confirmación y el flujo no rompe.

---

## Acceptance criteria

- [ ] `contacto` y `servicios` → confirmación con la **plantilla rica**; las imágenes cargan desde `/mail` (prod) o `/staging/mail` (staging).
- [ ] El saludo de la plantilla rica muestra el nombre del lead; sin nombre, queda "Hola" sin romper el HTML.
- [ ] `reclamo`, `queja`, `apelacion`, `libro_reclamaciones`, `derechos-arco` → confirmación con el **logo blanco** en el header negro (no el texto).
- [ ] El correo **interno a la empresa** muestra el logo blanco en el header (no el texto "Fiberlux").
- [ ] Todas las imágenes de los correos usan URL absoluta correcta según el ambiente (derivada del host).
- [ ] La confirmación se sigue enviando solo si hay email válido; si falla, no rompe el flujo (silencioso, como hoy).
- [ ] El asunto es "Gracias por contactarnos — Fiberlux" para el Grupo A y "Recibimos tu mensaje [correlativo] — Fiberlux" para el Grupo B.
- [ ] `npm run build` compila y los `.php`/`public/mail` llegan a `dist/` intactos.

---

## Decisions

- **Sí:** confirmación al cliente en dos grupos — plantilla rica (contacto/soluciones) vs simple con logo (reclamos/legales) — según indicación del cliente.
- **Sí:** el logo también va en el correo interno de la empresa.
- **Sí:** `$assetBase` derivado del host en runtime (auto prod/staging), no hardcodear dominio ni usar las URLs de WordPress.
- **Sí:** logo `logoFiberlux-blanco.png` sobre el header negro (Grupo B e interno).
- **Sí:** nombre = `nombre` + `apellido`/`apellidos`, con fallback a `nombreCompleto` y luego vacío.
- **Sí:** `header-contact-mail.png` se reutiliza igual para `servicios` (soluciones), no se crea una imagen aparte.
- **No:** cambiar recipients, panel, ni cuándo se dispara la confirmación.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Detección de HTTPS falla tras proxy → imágenes con esquema equivocado | Usar `HTTP_X_FORWARDED_PROTO` con fallback a `HTTPS`/`http`. |
| El cliente de correo bloquea imágenes remotas | El correo sigue legible (texto + `alt`); la plantilla no depende de imágenes para el mensaje. |
| Un `formType` nuevo no cae en ningún grupo | Default a Grupo B (simple + logo) para no quedar sin confirmación. |
| Las imágenes no existen aún en el server (deploy) | `public/mail` viaja en `dist/` con el deploy; verificar que las rutas `/mail/*.png` respondan. |

---

## Lo que **no** está en este spec

- Destinatarios/recipients (`form-config`) y panel de leads.
- Imágenes/branding fuera de `public/mail`.
- i18n de los correos.
- Cambiar la lógica de cuándo se envía la confirmación.

Cada uno, si aterriza, va en su propio spec.
