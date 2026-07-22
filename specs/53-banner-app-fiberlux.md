# SPEC 53 — Banner promocional "Fiberlux App" (componente reutilizable, editable)

> **Estado:** Aprobado
> **Depende de:** SPEC 37 (colección `fiberluxApp` que se extiende), assets en `public/images/fiberlux-app/`
> **Fecha:** 2026-07-21
> **Objetivo:** Crear un componente reutilizable de banner promocional de la Fiberlux App (fondo negro con panel de degradado magenta, marco notched, teléfono `mockup.png`, texto + 3 bullets, pill "con la nueva aplicación de FIBERLUX" y badge Android/iOS con enlaces reales a las tiendas), responsive según los dos frames (desktop ancho + mobile vertical) y editable desde la colección `fiberluxApp` en Tina.

---

## Alcance

**Dentro:**

- **Par de componentes nuevos** `src/components/fiberlux-app/BannerApp.astro` + `BannerAppReact.tsx` (patrón dual del proyecto): el `.astro` resuelve `fiberluxApp` y pasa `{ query, variables, data }`; el `.tsx` renderiza y envuelve en `useTina()` para edición visual.
- **Diseño replicado de las referencias:**
  - Sección **fondo negro** (`greyscale-darkest`); **panel interior** con **degradado magenta** (negro a la izquierda → magenta) y **patrón geométrico** sutil de fondo.
  - **Marco notched** usando `sim-container.svg` (desktop) y `sim-container-mobile.svg` (mobile) alrededor del contenido.
  - **Columna de texto:** titular "Obtén **control total de tu red**" (con partes en negrita), **pill** "con la nueva aplicación de" + **logo FIBERLUX**.
  - **3 bullets** con check-circle: título en negrita + texto.
  - **Badge** "Android | iOS" (con sus glifos) + **pill blanca** "Búscanos como **Fiberlux App** y descarga la app" con el ícono de la app; **enlazan a las tiendas**.
  - **Teléfono `mockup.png`** a sangre a la derecha (desktop) / abajo (mobile).
- **Responsive:** desktop (banner horizontal ancho) y mobile (vertical), replicando los dos frames (`banner-app` y `banner-app-mobile`).
- **Editable desde Tina:** nuevo objeto `banner` en la colección `fiberluxApp` (titular, texto de la pill, `bullets[]`, texto de descarga, `androidUrl`, `iosUrl`, imagen del mockup opcional). Regenerar el cliente Tina.
- **Enlaces reales:** `androidUrl` / `iosUrl` editables; si están vacíos, el badge no enlaza (o cae a `/fiberlux-app`).

**Fuera de alcance (para futuros specs):**

- **Montar el banner en páginas** (home, soporte, etc.): el componente queda listo y reutilizable; el cliente lo inserta donde quiera. (Para el QA visual se monta temporalmente.)
- **Producir assets nuevos:** se usan `mockup.png`, `sim-container*.svg` y el logo/ícono ya disponibles.
- **Animaciones** del banner (parallax, entrada) más allá de un fade sutil opcional.
- **Cambiar la página `/fiberlux-app`** o sus otras secciones.
- **Colección nueva:** se extiende `fiberluxApp`, no se crea otra.

---

## Modelo de datos

Se extiende la colección single-doc **`fiberluxApp`** (`tina/config.ts`, path `src/content/fiberlux-app`) con un objeto **`banner`**. No hay colecciones nuevas.

### Schema (nuevo objeto en `fiberluxApp.fields`)

```js
{
  name: "banner",
  label: "Banner de descarga (app)",
  type: "object",
  fields: [
    { name: "headingLead",   label: "Titular (parte normal)", type: "string" },      // "Obtén"
    { name: "headingStrong", label: "Titular (parte negrita)", type: "string" },      // "control total de tu red"
    { name: "pillText",      label: "Texto de la pill",        type: "string" },      // "con la nueva aplicación de"
    {
      name: "bullets", label: "Bullets", type: "object", list: true,
      ui: { itemProps: (i) => ({ label: i?.title || "Bullet" }) },
      fields: [
        { name: "title", label: "Título (negrita)", type: "string" },  // "Monitoreo en tiempo real:"
        { name: "text",  label: "Texto", type: "string" },             // "Revisa el estado de tu conexión…"
      ],
    },
    { name: "downloadText", label: "Texto 'Búscanos como…'", type: "string", ui: { component: "textarea" } },
    { name: "androidUrl",   label: "URL Play Store (Android)", type: "string" },
    { name: "iosUrl",       label: "URL App Store (iOS)",      type: "string" },
    { name: "mockup",       label: "Imagen del teléfono",     type: "image" },        // default: images/fiberlux-app/mockup.png
  ],
}
```

### Contenido sembrado (en `src/content/fiberlux-app/index.json`)

```jsonc
"banner": {
  "headingLead": "Obtén",
  "headingStrong": "control total de tu red",
  "pillText": "con la nueva aplicación de",
  "bullets": [
    { "title": "Monitoreo en tiempo real:", "text": "Revisa el estado de tu conexión y servicios al instante." },
    { "title": "Pre-diagnóstico inteligente:", "text": "Detecta incidencias antes de que afecten tu operación." },
    { "title": "Gestión de tickets 24/7:", "text": "Crea y sigue requerimientos técnicos desde tu celular." }
  ],
  "downloadText": "Búscanos como Fiberlux App y descarga la app",
  "androidUrl": "",
  "iosUrl": "",
  "mockup": "images/fiberlux-app/mockup.png"
}
```

**Assets (ya existentes en `public/images/fiberlux-app/`):**

- `mockup.png` — teléfono inclinado con la pantalla de inicio y el ícono de Fiberlux App (el del banner).
- `sim-container.svg` (desktop) / `sim-container-mobile.svg` (mobile) — el marco notched del contenido.

**Convenciones de runtime (`BannerAppReact.tsx`):**

- La imagen del mockup se resuelve con **`mediaUrl()`** (estándar del proyecto; Tina Cloud reescribe el campo `image`); default a `images/fiberlux-app/mockup.png` si el campo viene vacío.
- Los SVG del marco y el logo/ícono se sirven con ruta `BASE_URL`-aware.
- **`androidUrl`/`iosUrl`**: si están vacíos, ese enlace no se renderiza como link (o cae a `/fiberlux-app`); nunca rompe.
- El titular se compone `headingLead` (normal) + `headingStrong` (negrita); en `downloadText` el componente resalta "Fiberlux App".

---

## Plan de implementación

> El trabajo vive en `tina/config.ts` (schema), `src/content/fiberlux-app/index.json` (seed) y `src/components/fiberlux-app/BannerApp.astro` + `BannerAppReact.tsx`. Cada paso deja el sitio ejecutable (`npm run dev`). El componente **no se monta en producción** (el cliente lo inserta luego); el QA usa un montaje temporal.

1. **Extender el schema `fiberluxApp`** con el objeto `banner` (`tina/config.ts`). Regenerar el cliente Tina. *Verificación:* `/admin` → **Página Fiberlux App** → aparece el grupo **Banner** con sus campos editables.

2. **Sembrar `banner`** en `src/content/fiberlux-app/index.json`. *Verificación:* el JSON valida sin warnings de Tina.

3. **`BannerAppReact.tsx` — layout desktop** (frame `banner-app`): sección `bg-greyscale-darkest`; panel con degradado magenta (negro-izq → magenta-der) + patrón geométrico sutil; marco `sim-container.svg`; columna de texto (titular lead+strong, pill "con la nueva aplicación de", logo FIBERLUX); 3 bullets con check-circle; badge "Android | iOS" + pill blanca "Búscanos como Fiberlux App…" con ícono y enlaces (`androidUrl`/`iosUrl`); `mockup.png` a sangre a la derecha. `data-tina-field` en los textos editables. *Verificación:* en ~1440px se ve como el frame desktop.

4. **Layout mobile** (frame `banner-app-mobile`): stack vertical, marco `sim-container-mobile.svg`, texto arriba, `mockup.png` abajo a sangre; el badge/pill de descarga sobre el teléfono. *Verificación:* en ~390px se ve como el frame mobile.

5. **`BannerApp.astro`** (wrapper): resuelve `client.queries.fiberluxApp(...)` y monta `BannerAppReact` con `client:visible`, `useTina()` para edición visual. *Verificación:* editable desde `/admin`.

6. **QA visual desktop + mobile** contra los dos frames (montaje temporal en una página para screenshots con Playwright MCP; se retira antes del commit final o lo deja el cliente). Ajustar paddings, tamaños, posición del teléfono y del marco hasta coincidir. *Verificación:* `npm run build` sin errores/warnings nuevos; sin errores en consola; ambos breakpoints fieles a las referencias.

**Notas del plan:**

- Pasos 1–2 habilitan el dato; 3–5 construyen el componente; 6 cierra QA.
- El componente queda **reutilizable y sin montar**; el cliente lo inserta donde quiera (o pide el montaje en otra spec).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] Existen `src/components/fiberlux-app/BannerApp.astro` y `BannerAppReact.tsx`.
- [ ] En `/admin` → **Página Fiberlux App** → **Banner**: son editables titular (lead + negrita), texto de la pill, los **3 bullets** (título + texto), texto de descarga, **URL Android**, **URL iOS** e imagen del teléfono.
- [ ] El banner tiene **fondo negro** con **panel de degradado magenta** y patrón geométrico sutil, dentro de un **marco notched** (SVG).
- [ ] Muestra el titular "Obtén **control total de tu red**", la **pill** "con la nueva aplicación de" y el **logo FIBERLUX**.
- [ ] Muestra los **3 bullets** con check-circle (título en negrita + texto).
- [ ] Muestra el **badge Android/iOS** y la **pill blanca** "Búscanos como **Fiberlux App** y descarga la app" con el ícono de la app.
- [ ] Los badges/enlaces usan **`androidUrl`/`iosUrl`**; con URL cargada abren la tienda; **vacíos no rompen** (sin link o a `/fiberlux-app`).
- [ ] El **teléfono** (`mockup.png`, vía `mediaUrl`) aparece a la derecha en desktop y abajo en mobile, a sangre.
- [ ] En **desktop (~1440px)** el banner coincide con el frame `banner-app`; en **mobile (~390px)** con `banner-app-mobile`.
- [ ] La imagen del teléfono **no da 404 en producción** (se sirve con `mediaUrl`).
- [ ] El componente es **reutilizable** y no se montó en ninguna página de producción en esta spec.

---

## Decisiones tomadas y descartadas

- **Sí:** componente **reutilizable** (par `.astro` + `.tsx`), sin montar. Confirmado por el cliente; lo inserta donde quiera.
- **Sí:** contenido **editable desde Tina**, extendiendo la colección **`fiberluxApp`** con un objeto `banner`. Confirmado; consistente con el sitio CMS-driven y con el resto de la app.
- **No:** contenido hardcodeado. Descartado por la respuesta del cliente.
- **No:** colección nueva para el banner. El dato pertenece a "Fiberlux App"; extender `fiberluxApp` evita otra colección/query.
- **Sí:** **enlaces reales** de tienda vía `androidUrl`/`iosUrl` editables. Confirmado; se cargan cuando el cliente tenga las URLs; vacíos no rompen.
- **Sí:** reusar `mockup.png` (teléfono del banner) y `sim-container*.svg` (marco). Ya existen y coinciden con las referencias.
- **Sí:** **`mediaUrl()`** para la imagen del teléfono. Evita el 404 de Tina Cloud en producción (lección de specs previas).
- **Sí:** titular partido en `headingLead` + `headingStrong` para respetar la negrita del diseño siendo editable.
- **Sí:** dos layouts (desktop ancho / mobile vertical) según los dos frames provistos.
- **Definición semi-rápida:** Modelo de datos, Plan, Criterios, Decisiones y Riesgos se redactaron asumiendo defaults razonables (a pedido del cliente: "asume el resto y guarda"), tras cerrar las 3 decisiones clave por preguntas.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El **marco notched** (SVG `sim-container`) no calza con el contenido a distintos anchos. | Usarlo como fondo/borde escalable (`preserveAspectRatio` o `border-image`); QA de ajuste; si no calza, degradar a un borde CSS con esquinas/corte equivalente. |
| El **teléfono `mockup.png`** (imagen fija) se ve pixelado o se corta mal a sangre. | Posicionar con `object-fit`/overflow controlado; si hace falta más resolución, se pide un asset mayor (fuera de alcance). |
| El **degradado + patrón geométrico** no reproduce fielmente el fondo del Figma. | Aproximar con CSS (degradado + un SVG de patrón sutil); afinar en QA; es best-effort visual editable después. |
| La imagen del mockup **404 en producción** por la reescritura de Tina Cloud. | Servir con `mediaUrl()` (estándar del proyecto). |
| El banner **desborda** o genera scroll horizontal en mobile. | `overflow-hidden` en la sección + tamaños/posiciones acotadas; QA a ~390px. |
| `androidUrl`/`iosUrl` **vacíos** dejan un enlace roto. | Render condicional: sin URL, el badge no enlaza (o cae a `/fiberlux-app`). |

---

## Qué **NO** entra en este spec

- Montar el banner en páginas (lo hace el cliente).
- Producir assets nuevos (teléfono, patrón, ícono) — se usan los existentes.
- Animaciones/parallax del banner.
- Cambios en la página `/fiberlux-app` o sus otras secciones.
- Una colección nueva (se extiende `fiberluxApp`).

Cada uno de estos, si aterriza, va en su propio spec.
