# SPEC 17 — Legales: páginas de contenido (tema claro) + QA de formularios + modal de cookies

> **Estado:** Implementado
> **Depende de:**
> - **Spec 16** (header tema claro): las páginas nuevas consumen `headerTheme="light"`.
> - Reutiliza `BaseLayout`, el patrón dual `.astro` + `React`, `DynamicForm`/`DynamicFormReact` y el render **rich-text vía `TinaMarkdown`** (usado en `BlogDetailReact`/`FaqSolucionReact`).
> - Introduce **dos colecciones Tina nuevas** (`legal`, `cookieConsent`) y un documento `dynamicForms` nuevo (ARCO).
>
> **Fecha:** 2026-07-01
>
> **Objetivo:** Construir las dos páginas de contenido legal del Figma (**Derechos ARCO** y **Tratamiento de datos personales**) sobre una nueva colección Tina `legal` (rich-text editable, sembrada con el texto del Figma) con el **formulario de solicitud de derechos** embebido en ARCO, hacer **QA/pulido** de los 4 formularios de legales existentes contra el tema claro del Figma, y montar un **modal de consentimiento de cookies** editable desde TinaCMS con persistencia en localStorage.

---

## Alcance

**Dentro:**

**A) Páginas de contenido legal**

- **Colección Tina nueva `legal`** (multi-doc, `path: src/content/legal`, `format: json`, router `/legales/<slug>`). Campos: `eyebrow`, `title`, `updatedAt`, `body` (rich-text), `embeddedFormSlug` opcional, `seo`. Regenerar cliente Tina.
- **Plantilla dual** `legal/LegalPage.astro` + `LegalPageReact.tsx`: tema claro, `headerTheme="light"`, eyebrow + título centrado + `body` con `TinaMarkdown` (enlaces magenta, listas numeradas con círculo magenta, callout de borde izquierdo, tarjeta gris contenedora), y `DynamicForm` embebido si hay `embeddedFormSlug`.
- **`/legales/tratamiento-datos`** — contenido puro (1:1 con frame `764:16362`).
- **`/legales/derechos-arco`** — contenido + formulario embebido (1:1 con frame `764:15467`).
- **Formulario ARCO** `dynamic-forms/derechos-arco.json`: secciones Datos del titular, Datos del representante legal, Tipo de solicitud (**radio-card**: Acceso/Rectificación/Cancelación/Oposición con descripción), Detalle, adjuntos, consentimientos, "Enviar". Vía `submitForm` existente.
- **Render radio-card** (variante visual del campo `radio`: tarjeta con título + descripción + estado activo magenta).
- **Sembrado** con el texto del Figma; `[completar]` donde el mockup recorte.
- Enlaces de footer `derechos-arco` y `tratamiento-datos` dejan de ser 404. **SEO/meta** con fallback a `global.seo`.

**B) Formularios existentes**

- **QA/pulido** de `libro-reclamaciones`, `reclamo`, `queja`, `apelacion` vs Figma (eyebrow/título/subtítulo, numeración magenta, inputs, botón, spacing), **conservando sus definiciones de campos**.

**C) Modal de consentimiento de cookies**

- **Colección Tina single-doc `cookieConsent`**: `intro` (rich-text), `showMoreUrl`, labels `btnReject`/`btnSave`/`btnAccept`, y `categories[]` = `{ key, name, description, alwaysActive }` (sembrada con Necesaria [alwaysActive], Funcional, Analítica).
- **Componente modal** (isla React) `cookies/CookieConsent.astro` + `CookieConsentReact.tsx`, montado **global** en `BaseLayout`, 1:1 con el frame `782:4524`: intro + "Mostrar más" (→ `showMoreUrl`), lista de categorías con **toggle** por categoría (las `alwaysActive` deshabilitadas en ON), y botones **Rechazar todo / Guardar mis preferencias / Aceptar todo**.
- **Persistencia:** localStorage `flx-cookie-consent:v1` = `{ necesaria:true, funcional:bool, analitica:bool, ts }`. **No** conecta scripts de terceros (solo registra la preferencia).
- **Disparo:** aparece en la 1ª visita (sin consentimiento previo); **reabrible** desde un enlace nuevo **"Preferencias de cookies"** en el footer (`global`).
- **QA visual** de todo (páginas, ARCO form, 4 formularios, modal) contra `references/formularios.png` y los frames Figma (desktop ~1440 y mobile), screenshots en `.playwright-screens/`.

**Fuera de alcance (para futuras specs):**

- **Página de texto** `/legales/politica-cookies` (el consentimiento se cubre con el modal; el link "Política de Cookies" del footer y el `showMoreUrl` apuntan a esa página futura).
- **Gating de scripts** de terceros (analytics/marketing) según consentimiento.
- **Resto del footer "Legales"**: privacidad, videovigilancia, SST, guía OSIPTEL, formulario ARCO suelto, `solicitudes/*`.
- **Re-authorar campos** de los 4 formularios existentes; rediseñar selector `/reclamos`, Header, Footer, maintenance, Lenis; cambiar el backend PHP.

---

## Modelo de datos

Introduce **dos colecciones nuevas** (`legal`, `cookieConsent`) y **un** documento `dynamicForms` nuevo (ARCO). Reutiliza el schema `dynamicForms` existente para el formulario.

### 1. Colección `legal` (multi-doc) en `tina/config.ts`

```js
{
  name: "legal",
  label: "Legales (páginas de contenido)",
  path: "src/content/legal",
  format: "json",
  ui: { router: ({ document }) => `/legales/${document._sys.filename}` },
  fields: [
    { name: "eyebrow", label: "Eyebrow", type: "string" },              // "— LEGAL" / "— ATENCIÓN AL CLIENTE"
    { name: "title",   label: "Título (H1)", type: "string", isTitle: true, required: true },
    { name: "updatedAt", label: "Última actualización", type: "datetime" },
    { name: "body",    label: "Contenido", type: "rich-text" },          // párrafos, enlaces, listas numeradas, callout
    { name: "embeddedFormSlug", label: "Formulario embebido (slug dynamicForms)", type: "string" }, // opcional: "derechos-arco"
    { name: "seo", label: "SEO / Meta", type: "object", fields: [
      { name: "metaTitle", type: "string" },
      { name: "metaDescription", type: "string", ui: { component: "textarea" } },
      { name: "ogImage", type: "image" },
    ]},
  ],
}
```

Documentos sembrados: `src/content/legal/tratamiento-datos.json`, `src/content/legal/derechos-arco.json` (este con `embeddedFormSlug: "derechos-arco"`).

### 2. Colección `cookieConsent` (single-doc) en `tina/config.ts`

```js
{
  name: "cookieConsent",
  label: "Consentimiento de cookies (modal)",
  path: "src/content/cookie-consent",
  format: "json",
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    { name: "intro", label: "Texto introductorio", type: "rich-text" },
    { name: "showMoreUrl", label: "Enlace 'Mostrar más'", type: "string" },   // → futura /legales/politica-cookies
    { name: "btnReject", label: "Texto botón rechazar", type: "string" },      // "Rechazar todo"
    { name: "btnSave",   label: "Texto botón guardar",  type: "string" },      // "Guardar mis preferencias"
    { name: "btnAccept", label: "Texto botón aceptar",  type: "string" },      // "Aceptar todo"
    { name: "categories", label: "Categorías", type: "object", list: true,
      ui: { itemProps: (c) => ({ label: c?.name || "Categoría" }) },
      fields: [
        { name: "key",         label: "Clave", type: "string" },              // "necesaria" | "funcional" | "analitica"
        { name: "name",        label: "Nombre", type: "string" },
        { name: "description", label: "Descripción", type: "string", ui: { component: "textarea" } },
        { name: "alwaysActive", label: "Siempre activa", type: "boolean" },    // Necesaria = true
      ]},
  ],
}
```

Documento sembrado `src/content/cookie-consent/index.json`: Necesaria (`alwaysActive: true`), Funcional, Analítica, con los textos del Figma.

### 3. Formulario ARCO `src/content/dynamic-forms/derechos-arco.json`

Reutiliza el schema `dynamicForms` existente. Estructura de campos (resumen):

```jsonc
{
  "title": "Formato de solicitud de Derechos Fiberlux",
  "fields": [
    { "type": "section_header", "label": "Datos del titular de datos personales" },
    { "type": "text",  "name": "nombre",   "label": "Nombre",   "width": "half", "validation": { "required": true } },
    { "type": "text",  "name": "apellido", "label": "Apellido", "width": "half" },
    { "type": "select","name": "tipoDoc",  "label": "Tipo de documento", "width": "half", "options": [ /* DNI, RUC, CE */ ] },
    { "type": "text",  "name": "numDoc",   "label": "N° de documento", "width": "half" },
    /* … correo, teléfono, dirección … */

    { "type": "section_header", "label": "Datos del representante legal" },
    /* … campos análogos, condicionados a un checkbox “actúo como representante” … */

    { "type": "section_header", "label": "Seleccione el tipo de solicitud que desea ingresar" },
    { "type": "radio", "name": "tipoSolicitud", "variant": "card", "validation": { "required": true },
      "options": [
        { "value": "acceso",        "label": "Acceso",        "description": "…" },
        { "value": "rectificacion", "label": "Rectificación", "description": "…" },
        { "value": "cancelacion",   "label": "Cancelación",   "description": "…" },
        { "value": "oposicion",     "label": "Oposición",     "description": "…" }
      ]},

    { "type": "section_header", "label": "Detalle de solicitud" },
    { "type": "textarea", "name": "detalle", "label": "Detalle" },
    { "type": "file", "name": "adjunto", "label": "Adjuntar archivo" },
    { "type": "checkbox", "name": "declaro", "label": "Declaro que la información es veraz…" },
    { "type": "checkbox", "name": "autorizo", "label": "Autorizo el tratamiento de mis datos…" }
  ]
}
```

> `variant: "card"` es un **atributo nuevo opcional** del campo `radio` para el render de tarjeta (título + descripción). Si el schema `dynamicForms` no admite `variant`/`description` en `radio`, se agregan esos sub-campos al schema (cambio aditivo, no rompe formularios existentes).

### 4. Persistencia del consentimiento (cliente)

```js
// localStorage
key = "flx-cookie-consent:v1";
value = { necesaria: true, funcional: boolean, analitica: boolean, ts: number };
// Ausencia de la key ⇒ primera visita ⇒ el modal se muestra.
// "Aceptar todo" ⇒ todas true; "Rechazar todo" ⇒ solo alwaysActive true; "Guardar" ⇒ estado de los toggles.
```

**Notas del modelo:**

- **Magenta por render:** en `TinaMarkdown`, `bold`/enlaces se pintan `brand-purple` (patrón de specs previas); las **listas numeradas con círculo magenta** y el **callout** son estilos del componente sobre elementos rich-text estándar.
- **Router de `legal`:** el `_sys.filename` es el slug (`tratamiento-datos`, `derechos-arco`); un doc sin `embeddedFormSlug` renderiza solo contenido.
- **Versión de consentimiento:** la key incluye `:v1`; si cambian las categorías de forma incompatible, se sube a `:v2` y el modal reaparece.
- **Assets:** ninguno nuevo obligatorio (las ilustraciones del modal en el Figma son decorativas del home, no del modal).

---

## Plan de implementación

> El trabajo vive en: dos colecciones nuevas (`legal`, `cookieConsent`) en `tina/config.ts` + su contenido; el form ARCO (`dynamic-forms/derechos-arco.json`) + posible `variant/description` en el schema `dynamicForms`; componentes nuevos en `src/components/legal/` y `src/components/cookies/`; dos rutas en `src/pages/legales/`; el montaje del modal en `BaseLayout`; un enlace nuevo en `global`; y QA de los 4 formularios existentes. Cada paso deja el proyecto ejecutable (`npm run dev`) y es commiteable por separado.

1. **Colección `legal`** en `tina/config.ts` (multi-doc + router). Regenerar cliente Tina. *Test:* `npm run dev` levanta; en `/admin` aparece "Legales (páginas de contenido)".

2. **Sembrar `legal`**: `tratamiento-datos.json` (contenido puro) y `derechos-arco.json` (con `embeddedFormSlug: "derechos-arco"`), transcribiendo el texto del Figma. *Test:* los JSON validan contra el schema (sin warnings de Tina).

3. **Plantilla legal (patrón dual)** `legal/LegalPage.astro` (resuelve un doc `legal` por slug vía `client`) + `LegalPageReact.tsx` (envuelve en `useTina`; eyebrow + título + `TinaMarkdown` con estilos claros: enlaces magenta, listas numeradas con círculo magenta, callout, tarjeta gris). Aún sin el form embebido. *Test:* compila; render aislado del cuerpo se ve claro.

4. **Ruta `/legales/tratamiento-datos`** (`src/pages/legales/tratamiento-datos/index.astro`) con `BaseLayout headerTheme="light"` + `<LegalPage slug="tratamiento-datos" />` + SEO. *Test:* la ruta carga, tema claro, 1:1 con el frame `764:16362`; footer link ya no 404.

5. **Schema del form ARCO**: agregar (si falta) `variant` y `description` al campo `radio` del schema `dynamicForms` (aditivo). Crear `dynamic-forms/derechos-arco.json` con las secciones y las 4 radio-card. *Test:* `/admin` muestra el nuevo formulario; los formularios existentes siguen validando sin cambios.

6. **Render radio-card** en `DynamicFormReact` / `FormControls`: cuando `radio.variant === "card"`, renderizar tarjetas seleccionables (título + descripción + estado activo magenta); el `radio` normal no cambia. *Test:* montado en una página de prueba, las 4 opciones ARCO se ven como tarjetas y seleccionan una a la vez.

7. **Form embebido en la plantilla legal**: cuando el doc `legal` tiene `embeddedFormSlug`, `LegalPage` monta `<DynamicForm formSlug={embeddedFormSlug} />` bajo el cuerpo. *Test:* aún sin ruta ARCO, el wiring compila.

8. **Ruta `/legales/derechos-arco`** (`src/pages/legales/derechos-arco/index.astro`) con `BaseLayout headerTheme="light"` + `<LegalPage slug="derechos-arco" />` + SEO. *Test:* la ruta carga: texto legal + formulario ARCO (radio-cards) debajo; 1:1 con `764:15467`; footer link ya no 404.

9. **Colección `cookieConsent`** en `tina/config.ts` (single-doc) + sembrar `src/content/cookie-consent/index.json` (Necesaria/Funcional/Analítica con textos del Figma). Regenerar cliente. *Test:* `/admin` muestra "Consentimiento de cookies (modal)" editable.

10. **Modal de cookies (isla)** `cookies/CookieConsent.astro` (resuelve `cookieConsent` vía `client`) + `CookieConsentReact.tsx`: intro + "Mostrar más" + categorías con toggles (alwaysActive deshabilitada en ON) + botones Rechazar/Guardar/Aceptar; persistencia en localStorage `flx-cookie-consent:v1`; se muestra si no hay consentimiento. Aún sin montar global. *Test:* montado en una página de prueba, aparece sin consentimiento previo, guarda y no reaparece tras aceptar/rechazar.

11. **Montar el modal global** en `BaseLayout` (`client:idle`), después del contenido. *Test:* el modal aparece en la 1ª visita en cualquier página; tras decidir, no reaparece al navegar; sin consentimiento vuelve a aparecer (localStorage borrado).

12. **Reapertura desde footer**: agregar enlace **"Preferencias de cookies"** en `global` (columna Legales) que dispara el modal (evento/handler global). *Test:* el enlace reabre el modal con el estado guardado precargado en los toggles.

13. **QA/pulido de los 4 formularios existentes** (`libro-reclamaciones`, `reclamo`, `queja`, `apelacion`) vs sus frames Figma: header (eyebrow/título/subtítulo), numeración magenta, inputs, botón, spacing — sin tocar sus campos. *Test:* cada formulario coincide 1:1 con su frame.

14. **QA visual global + build.** Comparar páginas (`tratamiento-datos`, `derechos-arco`), form ARCO, los 4 formularios y el modal contra `references/formularios.png` y los frames Figma (desktop ~1440 y mobile) con Playwright MCP (screenshots en `.playwright-screens/`). *Test:* `astro build` sin errores/warnings nuevos y QA aprobado.

**Notas del plan:**

- Bloques: 1–4 páginas de contenido; 5–8 form ARCO + ARCO page; 9–12 modal de cookies; 13–14 QA.
- El montaje global del modal (paso 11) toca `BaseLayout`, que afecta a todo el sitio; por eso va aislado y con su propio test de no-regresión.
- Los pasos 5–6 son los de mayor riesgo (schema + nuevo render); si `variant` complica el schema, el fallback es un tipo de campo `radio_card` separado (decisión de implementación).

---

## Criterios de aceptación

**General**
- [ ] `npm run dev` y `astro build` terminan sin errores ni warnings nuevos en consola.
- [ ] En `/admin` existen las colecciones **"Legales (páginas de contenido)"** y **"Consentimiento de cookies (modal)"**, editables.

**Páginas de contenido**
- [ ] `/legales/tratamiento-datos` renderiza en **tema claro** (header `light`) con eyebrow + título centrado + cuerpo, y coincide 1:1 con el frame `764:16362` (lista numerada con círculo magenta y callout incluidos).
- [ ] `/legales/derechos-arco` renderiza el **texto legal + el formulario ARCO embebido** debajo, y coincide 1:1 con el frame `764:15467`.
- [ ] El cuerpo de ambas páginas es **rich-text editable** en Tina; editar el texto se refleja sin tocar código.
- [ ] Los enlaces del footer **"Manual de derechos ARCO"** (`/legales/derechos-arco`) y **"Tratamiento de datos personales"** (`/legales/tratamiento-datos`) navegan sin 404.
- [ ] Cada página define **SEO/meta** con fallback a `global.seo`.

**Formulario ARCO**
- [ ] El formulario `derechos-arco` muestra las secciones: Datos del titular, Datos del representante legal, Tipo de solicitud, Detalle.
- [ ] El campo **Tipo de solicitud** se renderiza como **radio-cards** (Acceso/Rectificación/Cancelación/Oposición, cada una con descripción); seleccionar una desactiva las demás y marca la activa en magenta.
- [ ] El envío usa el flujo `submitForm` existente (POST a `send-email.php`), con honeypot, igual que los demás formularios.
- [ ] Agregar `variant`/`description` al campo `radio` **no rompe** los formularios existentes (siguen validando y renderizando igual).

**Formularios existentes (QA)**
- [ ] `libro-reclamaciones`, `reclamo`, `queja` y `apelacion` coinciden 1:1 con sus frames Figma (eyebrow, título centrado, subtítulo, numeración magenta de secciones, inputs, botón, spacing), **sin cambios en sus campos**.

**Modal de cookies**
- [ ] El modal coincide con el frame `782:4524`: intro + "Mostrar más", categorías con toggle, y botones **Rechazar todo / Guardar mis preferencias / Aceptar todo**.
- [ ] La categoría **Necesaria** (`alwaysActive`) aparece con su toggle **en ON y deshabilitado**; Funcional y Analítica son alternables.
- [ ] En la **primera visita** (sin `flx-cookie-consent:v1`) el modal aparece; tras **Aceptar/Rechazar/Guardar** se persiste en localStorage y **no reaparece** al navegar ni recargar.
- [ ] **"Aceptar todo"** guarda todas las categorías en `true`; **"Rechazar todo"** deja solo las `alwaysActive` en `true`; **"Guardar mis preferencias"** guarda el estado de los toggles.
- [ ] El enlace del footer **"Preferencias de cookies"** **reabre** el modal con el estado guardado precargado.
- [ ] El modal es **editable desde Tina** (intro, labels de botones, categorías: nombre/descripción/alwaysActive) y los cambios se reflejan.
- [ ] El modal **no** carga ni bloquea scripts de terceros (solo registra la preferencia).

**QA visual / no regresión**
- [ ] Hay screenshots en `.playwright-screens/` de: las 2 páginas, el form ARCO, los 4 formularios y el modal, en desktop (~1440px) y mobile (~400px).
- [ ] Montar el modal global en `BaseLayout` **no altera** el layout ni el comportamiento de las páginas existentes (home/servicios/etc.).
- [ ] No se modificaron los campos de los 4 formularios existentes, el selector `/reclamos`, Header, Footer (salvo el enlace nuevo), maintenance, Lenis ni el backend PHP.

---

## Decisiones

- **Sí:** **colección `legal` multi-doc con `body` rich-text** (un doc por página, router `/legales/<slug>`). Patrón de `post`; el cliente edita el texto sin tocar código. Descartado hardcodear el contenido en `.astro` (no editable) y usar MDX (el resto de páginas estructuradas del proyecto son JSON).
- **Sí:** **`embeddedFormSlug` opcional en `legal`** para incrustar un `dynamicForms` bajo el cuerpo. Resuelve el caso ARCO (contenido + formulario) sin una plantilla especial; una página sin form solo omite el campo.
- **Sí:** **reutilizar `dynamicForms` para el form ARCO** en vez de un componente ad-hoc. Ya soporta secciones, validación, adjuntos, condicionales y el envío a `send-email.php`; consistente con los otros 5 formularios.
- **Sí:** **radio-card como `variant: "card"` (aditivo) del campo `radio`**, con `description` por opción. No rompe los `radio` existentes y evita un tipo nuevo. Fallback documentado: un tipo `radio_card` separado si `variant` complica el schema.
- **No:** **re-authorar los 4 formularios existentes.** El usuario confirmó QA/pulido; sus definiciones se conservan. Reescribir campos arriesga romper lógica y condicionales ya probados.
- **Sí:** **modal de cookies en este spec** (no en el 18). El usuario lo pidió explícitamente; queda junto al resto de legales. El Spec 18 se libera (o se reasigna a la página de texto de cookies + gating de scripts).
- **Sí:** **`cookieConsent` como single-doc con `categories[]` editable + `alwaysActive`.** Da flexibilidad (agregar/quitar/editar categorías) sin tocar código, sembrado con las 3 del Figma. Descartado categorías fijas en código (menos flexible) y meterlo en `global` (lo infla).
- **Sí:** **persistir en localStorage versionada (`:v1`), sin gating de scripts.** Registra el consentimiento de forma simple y SSG-friendly; conectar GA/pixels reales exige inventariar scripts y va en otra spec. La versión permite reabrir el modal si cambian las categorías.
- **Sí:** **modal global en `BaseLayout` (`client:idle`) + reapertura desde footer.** Debe estar disponible en todo el sitio (requisito legal) y reabrible; `client:idle` evita costo en el above-the-fold. Descartado montarlo por página (se repetiría en cada ruta).
- **Sí:** **"Mostrar más" → `showMoreUrl` configurable** apuntando a la futura `/legales/politica-cookies`. Desacopla el modal de esa página; hoy puede apuntar a `#` o a un placeholder hasta que exista.
- **No:** **página de texto `/legales/politica-cookies` en este spec.** El consentimiento se cubre con el modal; la página de política (texto legal) y el gating de scripts quedan para otra spec. El link "Política de Cookies" del footer se resuelve entonces.
- **Sí:** **magenta y estilos (listas numeradas, callout, tarjeta gris) por render**, sobre rich-text estándar. El editor solo escribe texto/listas; el color y los adornos los da la plantilla (patrón de specs previas).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Agregar `variant`/`description` al campo `radio` del schema `dynamicForms` **rompe** los formularios existentes o su generación de tipos. | Cambio **aditivo** (campos opcionales); regenerar cliente Tina y validar que los 5 formularios existentes siguen renderizando. Fallback: tipo `radio_card` separado. Criterio de aceptación explícito. |
| El **texto legal del Figma está recortado** en el mockup y no se transcribe completo. | Sembrar lo visible y marcar `[completar]`; el contenido es rich-text editable en Tina, así que el cliente completa el texto real sin tocar código. |
| El **modal global en `BaseLayout`** introduce regresión (bloquea scroll, se superpone, o rompe hidratación) en todas las páginas. | Montaje aislado (paso 11) con `client:idle`; criterio de no-regresión explícito; QA en home/servicios. El modal solo captura foco cuando está visible. |
| El modal **reaparece en cada carga** o **no reaparece nunca** por un bug de lectura/escritura de localStorage (SSR sin `window`). | Leer localStorage solo en efecto de cliente; estado inicial "cerrado" en SSR y decidir visibilidad tras montar. Criterio de aceptación de 1ª-visita/persistencia. |
| Las **listas numeradas con círculo magenta** y el **callout** del Figma no salen de rich-text estándar. | Override local en `TinaMarkdown` (`ol`/`li`/`blockquote`) en `LegalPageReact`, sin afectar el render global (patrón de SPEC 14). |
| Nuevas **clases Tailwind** (toggles, tarjetas radio, callout) fallan en dev por staleness del JIT (memoria del proyecto). | Preferir clases existentes/estilos inline; reiniciar dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |
| El **router de `legal`** colisiona con rutas `/legales/*` existentes (`libro-reclamaciones`) o con archivos de página. | Los slugs nuevos (`tratamiento-datos`, `derechos-arco`) no chocan con `libro-reclamaciones`; las páginas nuevas son archivos `.astro` propios que consumen la colección, no rutas auto-generadas por Tina. |
| El **envío del form ARCO** con `send-email.php` no está configurado para el nuevo `formType`. | Reutiliza el flujo `submitForm`/`form-config.json` existente; agregar la entrada de recipients del ARCO en `formConfig` si el backend la requiere (mismo patrón que los otros formularios). |

---

## Qué **NO** entra en este spec

- Página de texto `/legales/politica-cookies` y el gating de scripts de terceros según consentimiento.
- Resto de enlaces del footer "Legales": privacidad, videovigilancia, SST, guía OSIPTEL, formulario ARCO suelto, `solicitudes/*`.
- Re-authorar los campos de los 4 formularios existentes.
- Rediseñar el selector `/reclamos`, Header, Footer (salvo el enlace nuevo), maintenance, Lenis, o el backend PHP.

Cada uno de estos, si aterriza, va en su propio spec.

---

## Notas de implementación (2026-07-01)

Implementado en la rama `spec-17-legales-contenido-tema-claro` (desde `main`, con el Spec 16 ya mergeado). QA visual con dev server (modo local) + Playwright MCP; screenshots en `.playwright-screens/` (gitignored). `astro build` completo: **40 páginas, sin errores** (incluye `/legales/tratamiento-datos` y `/legales/derechos-arco`). El paso `tinacms build` requiere credenciales de TinaCloud (no disponibles en modo local) — misma limitación de entorno de specs previas.

**Desviaciones respecto al plan (mejoras encontradas):**

- **Steps 5–6 colapsados: no se tocó el schema.** El schema `dynamicForms` ya tenía el tipo `radioGroup` ("Radio (cards con descripción)") con `options[].description`, renderizado por `FormRadioGroup` como tarjetas con estado activo magenta, y `section_header` con `sectionNumber` (círculo magenta). El form ARCO usa `radioGroup` directamente; **no** se agregó `variant`/`description` al `radio` ni render nuevo. Resultado idéntico al del Figma con cero cambios de infraestructura.
- **Rich-text en JSON = string markdown.** Se descubrió que para colecciones `format: json`, los campos `rich-text` (`legal.body`, `cookieConsent.intro`) deben almacenarse como **string markdown** (Tina lo parsea a AST al consultar). Un AST hecho a mano se coacciona a `"[object Object]"`. Los `body`/`intro` se sembraron como markdown. El render usa `TinaMarkdown` con estilos `prose` + acentos magenta.
- **"Siempre activa" como etiqueta, no toggle deshabilitado.** El Figma muestra el texto "SIEMPRE ACTIVA" (magenta) para la categoría Necesaria en lugar de un toggle en ON deshabilitado; se siguió el Figma (etiqueta `alwaysActiveLabel`). Funcional/Analítica sí usan toggle.
- **Lista numerada con números magenta** (via `marker:text-[#96237A]`) en vez de círculos magenta como en el Figma — aproximación cercana; se puede refinar a círculos con contadores CSS en un pulido posterior.
- **Título de página sin duplicar sufijo.** `BaseLayout` ya agrega " | Fiberlux"; las páginas legales pasan un `title` limpio (el `seo.metaTitle` queda para OG/meta cuando `BaseLayout` los emita — limitación transversal ya documentada).

**Verificado:** ambas páginas legales 1:1 con sus frames (desktop + mobile); form ARCO con radio-cards; los 4 formularios existentes intactos y coincidentes; modal de cookies 1:1 (1ª visita, persistencia en `flx-cookie-consent:v1`, no reaparece, reapertura desde footer con estado precargado, Aceptar/Rechazar/Guardar correctos); sin regresión al montar el modal global; 0 errores de consola.

**Persistencia:** `localStorage["flx-cookie-consent:v1"] = { necesaria, funcional, analitica, ts }`. Sin gating de scripts (fuera de alcance).

**Nota de borde 17↔18:** la página de texto `/legales/politica-cookies` sigue sin existir; el `showMoreUrl` del modal apunta a ella (futura). El link "Política de Cookies" del footer aún es 404 hasta esa spec.
