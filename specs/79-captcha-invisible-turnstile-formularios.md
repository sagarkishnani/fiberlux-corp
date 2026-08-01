# SPEC 79 — Captcha invisible (Cloudflare Turnstile) en los formularios

> **Estado:** Implementado
> **Depende de:** SPEC 65 (backend de correos + `config.local.php` + deploy), SPEC 02 (contacto), SPEC 01 (formularios legales)
> **Fecha:** 2026-07-27
> **Objetivo:** Añadir un captcha invisible (Cloudflare Turnstile) a todos los formularios que pasan por `send-email.php`, verificándolo en el servidor, para frenar spam sin fricción para el usuario legítimo.

---

## Scope

**In:**

- **Front:** cargar el script de Turnstile y obtener un token invisible (`appearance: interaction-only`) en `DynamicFormReact.tsx`; adjuntarlo al envío. Cubre los 5 formularios (todos usan `DynamicFormReact`): `reclamo`, `queja`, `apelacion`, `libro-reclamaciones`, `contacto`.
- **Transporte:** `submitForm.ts` incluye el token (`captchaToken`) en el payload JSON y en `FormData` (cuando hay archivos).
- **Backend:** `send-email.php` verifica el token contra `https://challenges.cloudflare.com/turnstile/v0/siteverify` usando la **secret key** de `config.local.php`. Si el token es inválido, falta, o la verificación no se puede completar → **rechaza con error** (no envía correo).
- **Llaves:** site key (pública) vía **env var de build** `PUBLIC_TURNSTILE_SITE_KEY`; secret key en `config.local.php` (`TURNSTILE_SECRET`) vía GitHub Secret. Documentar en `config.example.php`, `.env.example` y `CLAUDE.md`.
- **CI:** `deploy.yml` pasa `TURNSTILE_SITE_KEY` al build y escribe `TURNSTILE_SECRET` en `dist/config.local.php`.

**Out of scope:**

- El input de "suscríbete" del blog y cualquier form que **no** pase por `send-email.php`.
- reCAPTCHA v3 / hCaptcha (se eligió Turnstile).
- Rediseño visual de los formularios (el captcha es invisible; solo se añade un contenedor oculto).
- El honeypot `website` existente (se mantiene; el captcha lo complementa, no lo reemplaza).
- Rotación/gestión de las llaves de Cloudflare (registro del dominio y generación de llaves es acción del cliente).

---

## Data model

Sin cambios de schema TinaCMS. Se introducen:

**1. Env var de build (pública)** — `.env` / GitHub Secret:

```
PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...   # site key pública; Vite la inlinea en el island
```

**2. Secret en `config.local.php`** (git-ignored, generado en CI):

```php
'TURNSTILE_SECRET' => '0x4AAA...',    # secret key; se añade al array existente (spec 65)
```

`config.example.php` documenta la clave con valor dummy.

**3. Campo nuevo en el payload de envío:**

```
captchaToken: string   // token de Turnstile; en JSON y en FormData
```

El backend lo lee de `$input['captchaToken']` y lo excluye del correo/registro (como ya hace con `website`).

**4. GitHub Secrets nuevos:** `TURNSTILE_SITE_KEY` (build), `TURNSTILE_SECRET` (→ `config.local.php`).

---

## Implementation plan

1. **Front — cargar Turnstile y obtener token en `DynamicFormReact.tsx`.**
   Inyectar una sola vez el script `https://challenges.cloudflare.com/turnstile/v0/api.js` (guardado por singleton). Renderizar un widget con `sitekey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY`, `appearance: 'interaction-only'`, en un contenedor oculto; el callback guarda el token en estado. Resetear el widget tras cada envío (los tokens son de un solo uso). Si no hay site key configurada, el envío no se habilita. *Test:* al cargar un formulario, en un usuario normal no aparece ningún reto y el token se genera en background.

2. **Transporte — `submitForm.ts` envía el token.**
   Añadir `captchaToken?: string` a `SubmitOptions`; incluirlo en el body JSON y como campo en `FormData`. *Test:* el request a `send-email.php` incluye `captchaToken` en ambos modos (con y sin archivos).

3. **Backend — verificar en `send-email.php`.**
   Tras el honeypot (línea ~59), leer `$token = $input['captchaToken'] ?? ''` y el `TURNSTILE_SECRET` de `$cfg`. Hacer POST a `siteverify` (con `secret`, `response`, `remoteip`) vía cURL con timeout corto. Si la respuesta no es `success:true` → `http_response_code(400)` + `{success:false, error:'Verificación de seguridad fallida...'}` y `exit`. Si la llamada cURL falla (timeout/red) → también bloquear con error controlado. Excluir `captchaToken` del correo y del guardado (añadir a la lista junto a `formType`/`website`). *Test:* POST con token válido pasa; sin token o con token basura → 400 y no se envía correo.

4. **Llaves y ejemplos.**
   Añadir `TURNSTILE_SECRET` a `config.example.php` (dummy) y a la forma del array. Añadir `PUBLIC_TURNSTILE_SITE_KEY=` a `.env.example`. *Test:* `grep` no encuentra la secret real versionada; los ejemplos existen.

5. **CI — `deploy.yml`.**
   Pasar `PUBLIC_TURNSTILE_SITE_KEY: ${{ secrets.TURNSTILE_SITE_KEY }}` al step de build, y añadir `'TURNSTILE_SECRET' => '${{ secrets.TURNSTILE_SECRET }}'` al `config.local.php` generado. *Test:* el deploy produce un build con la site key embebida y un `config.local.php` con la secret.

6. **Docs — `CLAUDE.md`.**
   Documentar los 2 secrets nuevos (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET`) y la env var pública. *Test:* la sección de deployment lista las llaves de Turnstile.

---

## Acceptance criteria

- [x] Los 5 formularios (`reclamo`, `queja`, `apelacion`, `libro-reclamaciones`, `contacto`) envían correctamente con un usuario legítimo, sin mostrar ningún reto visible. *(Implementado con `interaction-only`; QA E2E final requiere el backend PHP desplegado + llaves reales de Cloudflare.)*
- [x] Un POST a `send-email.php` sin `captchaToken` o con un token inválido responde error y **no** envía correo. *(Vía `verifyTurnstile`, fail-closed; activo cuando `TURNSTILE_SECRET` está configurada.)*
- [x] Si `siteverify` de Cloudflare no responde (timeout/red), el envío se bloquea con error controlado. *(cURL/stream con timeout → `false` → 400.)*
- [x] `captchaToken` no aparece en el cuerpo del correo ni en el submission guardado. *(Se hace `unset($input['captchaToken'])` y se excluye en `saveSubmission`.)*
- [x] La secret key no está en ningún archivo versionado; `config.example.php` y `.env.example` documentan las llaves con placeholders. *(`.env.example` está en `.gitignore`; se actualizó localmente. Doc versionada en `config.example.php` + `CLAUDE.md`.)*
- [x] El build inlinea `PUBLIC_TURNSTILE_SITE_KEY`; el workflow escribe `TURNSTILE_SECRET` en `dist/config.local.php`. *(Verificado: site key inlineada en `dist/_astro/DynamicFormReact.*.js`; `deploy.yml` actualizado.)*
- [x] `npm run build` compila sin errores. *(`astro build` OK — 116 páginas; `tinacms build` solo se bloqueó por el dev server activo, no por código.)*

---

## Decisions

- **Sí: Cloudflare Turnstile**, `appearance: interaction-only` — la opción de menor fricción (invisible para usuarios legítimos, sin badge ni puzzles), gratis y sin dependencia de Google.
- **No: reCAPTCHA v3** (badge flotante permanente + manejo de umbral de score) ni **hCaptcha**.
- **Sí: bloquear con error** ante token inválido **o** verificación no completable (elección del cliente) — prioriza seguridad sobre disponibilidad.
- **Sí:** site key pública por `PUBLIC_` env var (Vite la inlinea); secret en `config.local.php` vía GitHub Secret (mismo patrón que spec 65).
- **Sí:** se mantiene el honeypot `website`; el captcha es una segunda capa.
- **No:** proteger el input del blog ni otros forms fuera de `send-email.php` (otro spec si aplica).

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Cloudflare caído → **todos** los forms bloqueados (por la decisión "bloquear con error") | Aceptado; si molesta, se puede cambiar a fail-open en un cambio de una línea. Monitorear. |
| Falta `PUBLIC_TURNSTILE_SITE_KEY` en build → el widget no genera token → forms bloqueados | Documentar el secret (paso 6); considerar un aviso claro en el form si la site key falta. |
| `interaction-only` muestra un reto a usuarios sospechosos | Es el comportamiento deseado (solo ante señales de bot); no afecta al usuario normal. |
| Site key embebida en build estático → cambiarla exige rebuild/redeploy | Documentado; es inherente al SSG. |
| El hosting PHP sin cURL o sin salida a internet no puede llamar a `siteverify` | Confirmar cURL + egress en el hosting; fallback de error controlado ya cubre el caso. |

---

## Lo que **no** está en este spec

- El input de suscripción del blog y forms fuera de `send-email.php`.
- reCAPTCHA v3 / hCaptcha.
- Rediseño visual de los formularios.
- Gestión/rotación de las llaves de Cloudflare (acción del cliente).
