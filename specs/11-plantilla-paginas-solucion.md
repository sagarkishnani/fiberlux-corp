# SPEC 11 — Plantilla de páginas de solución (`/servicios/[solucion]`)

> **Estado:** Implementado
> **Depende de:**
> - SPEC 08 (colección `home.services` / `StickyCards`) y SPEC 10 (`/servicios`, formulario dinámico `servicios`, `ServiciosForm`, motor `DynamicForm` → `send-email.php`).
> - SPEC 09 (nav header con las 4 soluciones y sus sub-servicios) — esta spec activa esos enlaces de nivel-1 sin 404.
> - Reutiliza `Stats` (home) y `BlogPreview` (home).
> **Fecha:** 2026-07-01
> **Objetivo:** Construir una plantilla Astro/React única, alimentada por la colección `service` reworkeada, que renderice las 4 páginas de solución (nivel-1) en `/servicios/[solucion]` según el diseño de Conectividad Empresarial, con catálogo hover-reveal y FAQ editables en TinaCMS.

---

## Alcance

**Dentro:**

- **Ruta dinámica `src/pages/servicios/[solucion].astro`.** Hereda `BaseLayout` (Header + Footer + maintenance + Lenis). `getStaticPaths` genera una página por documento de la colección `service`. URLs objetivo (nivel-1): `/servicios/conectividad-empresarial`, `/servicios/ciberseguridad-gestionada`, `/servicios/data-center-cloud`, `/servicios/servicios-gestionados`. Esto activa los 4 enlaces de nivel-1 del nav (SPEC 09) sin 404.

- **Rework de la colección `service`** (`tina/config.ts`): reemplazar el schema legacy (`internet-dedicado`) por el schema del diseño nuevo (ver Modelo de datos). Añadir `ui.router` para editar visualmente cada página. **Eliminar** `src/content/services/internet-dedicado.json`.

- **Sembrar las 4 soluciones** en `src/content/services/*.json` (una por solución) con el contenido del diseño. Solo Conectividad Empresarial se llena 1:1 contra la referencia; las otras 3 se siembran con su copy conocido y **placeholders** donde falte (marcados como tales).

- **Secciones propias por servicio (nuevas):**
  - **Hero (patrón dual)** `HeroSolucion.astro` + `HeroSolucionReact.tsx`, tema oscuro con gradiente magenta a la derecha: breadcrumb `Servicios / <Solución>`, H1, intro, botón **"Ver soluciones"** (ancla al Catálogo). Columna derecha: **form `¿Conversamos?`** renderizando el form dinámico `servicios` (mismo motor `DynamicForm`, `formSlug="servicios"`).
  - **"El valor de la resiliencia"** — bento custom de 3 cards editables (heading + texto + imagen c/u): *El desafío*, *Nuestra solución*, *Industrias destacadas*.
  - **"Catálogo de soluciones"** — grid de cards con **hover-reveal**: en desktop, al hacer hover aparecen descripción + botón "Conocer más" con transición smooth; en mobile solo se ve ícono + título (grid 2-col con paginación). Items embebidos por servicio (íconos de set fijo react-icons); los `url` son **placeholders** que apuntarán a las futuras páginas nivel-2.
  - **"Preguntas frecuentes"** — acordeón editable por servicio (lista `{pregunta, respuesta rich-text}`), fondo claro rosado.

- **Secciones reutilizadas tal cual (sin duplicar contenido):**
  - **"¿Por qué Fiberlux?"** → componente `Stats` (cifras del home), con **título override** por servicio.
  - **"Déjanos tus datos y te contactaremos"** → `ServiciosForm` (SPEC 10, form dinámico `servicios`).
  - **"Insights & Novedades"** → `BlogPreview` (home).
  - Header, Footer, maintenance, Lenis vía `BaseLayout`.

- **Nueva franja de partners global** — objeto `partners` en la colección `global` (`{ title, eyebrow, logos[]: {image, alt, url?} }`) + componente que la renderiza ("Trabajamos con los líderes de la industria"). Editable una vez, compartida por las 4 soluciones.

- **QA visual** contra `references/conectividad-empresarial-desktop.jpg` (~1440px) y `-mobile.jpg` (~390px) con Playwright MCP (screenshots en `.playwright-screens/`).

**Fuera de alcance (para futuras specs):**

- **Las páginas de sub-servicio (nivel-2)** `/servicios/<solucion>/<subservicio>` (~35 rutas). Esta spec solo hace nivel-1; el Catálogo enlaza a ellas con URLs placeholder.
- **Colección/datos propios de sub-servicios.** El catálogo se embebe en cada solución como placeholder; cuando lleguen las páginas nivel-2, su fuente de datos se define en otra spec.
- **Editar las cifras de "¿Por qué Fiberlux?" por servicio** (se reusan del home; cambiarlas se hace en el home).
- **Editar "Insights & Novedades"** (reusa `BlogPreview` del home).
- **Rediseñar** Header / Footer / maintenance / form `servicios` / `Stats` / `BlogPreview`.
- **Visual 3D** en el hero (el hero de solución lleva form a la derecha, no 3D).
- **Testimonios** en estas páginas (el diseño no los incluye).

---

## Modelo de datos

Introduce **dos cambios de schema** (rework de `service` + nuevo `partners` en `global`) y **contenido sembrado** para 4 soluciones. Reusa sin modificar: `home.services`, `home.stats`, `home.blogPreview`, `servicios` (colección) y `dynamic-forms/servicios.json`.

### 1. Colección `service` reworkeada (`tina/config.ts`)

Reemplaza el schema legacy. Multi-documento (una por solución), con `ui.router` para edición visual.

```js
{
  name: "service",
  label: "Servicios (soluciones)",
  path: "src/content/services",
  format: "json",
  ui: {
    router: ({ document }) => `/servicios/${document._sys.filename}`,
    filename: { slugify: (v) => (v?.slug || "").toLowerCase() },
  },
  fields: [
    { name: "title", label: "Nombre de la solución", type: "string", required: true, isTitle: true }, // "Conectividad Empresarial"
    { name: "slug",  label: "URL slug", type: "string", required: true }, // "conectividad-empresarial"

    // ── Hero (form ¿Conversamos? = DynamicForm servicios, no se modela aquí) ──
    { name: "hero", label: "Hero", type: "object", fields: [
      { name: "heading",  label: "Título (H1)", type: "string", ui: { component: "textarea" } },
      { name: "intro",    label: "Párrafo intro", type: "string", ui: { component: "textarea" } },
      { name: "ctaLabel", label: "Texto botón (ancla al catálogo)", type: "string" }, // "Ver soluciones"
      { name: "formTitle", label: "Título del form del hero", type: "string" },        // "¿Conversamos?"
    ]},

    // ── "El valor de la resiliencia" (bento 3 cards) ──
    { name: "valor", label: "El valor de la resiliencia", type: "object", fields: [
      { name: "title", label: "Título de sección", type: "string" },
      { name: "cards", label: "Cards", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.heading || "Card" }), min: 3, max: 3 },
        fields: [
          { name: "heading", label: "Título", type: "string" },
          { name: "text",    label: "Texto", type: "string", ui: { component: "textarea" } },
          { name: "image",   label: "Imagen/gráfico", type: "image" },
        ]},
    ]},

    // ── "Catálogo de soluciones" (hover-reveal; items placeholder → nivel-2) ──
    { name: "catalogo", label: "Catálogo de soluciones", type: "object", fields: [
      { name: "title", label: "Título de sección", type: "string" }, // "Catálogo de soluciones"
      { name: "items", label: "Items", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.title || "Item" }) },
        fields: [
          { name: "icon", label: "Ícono", type: "string", options: [ /* set fijo, ver §4 */ ] },
          { name: "title", label: "Título", type: "string" },
          { name: "description", label: "Descripción (se revela en hover)", type: "string", ui: { component: "textarea" } },
          { name: "buttonLabel", label: "Texto del botón", type: "string" }, // "Conocer más"
          { name: "url", label: "URL (placeholder → nivel-2)", type: "string" },
        ]},
    ]},

    // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
    { name: "whyUsTitle", label: "Título '¿Por qué Fiberlux?'", type: "string" },

    // ── "Preguntas frecuentes" (acordeón, respuesta rich-text) ──
    { name: "faq", label: "Preguntas frecuentes", type: "object", fields: [
      { name: "title", label: "Título de sección", type: "string" },
      { name: "items", label: "Preguntas", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.question || "Pregunta" }) },
        fields: [
          { name: "question", label: "Pregunta", type: "string" },
          { name: "answer",   label: "Respuesta", type: "rich-text" },
        ]},
    ]},

    // ── SEO / meta (por servicio; cae a global.seo si vacío) ──
    { name: "seo", label: "SEO / Meta", type: "object", fields: [
      { name: "metaTitle",       label: "Meta título", type: "string" },
      { name: "metaDescription", label: "Meta descripción", type: "string", ui: { component: "textarea" } },
      { name: "ogImage",         label: "Imagen OG", type: "image" },
    ]},
  ],
}
```

> **Nota:** las secciones "Déjanos tus datos" (`ServiciosForm`) e "Insights & Novedades" (`BlogPreview`) **no se modelan aquí**: se montan reusando sus fuentes existentes (colección `servicios` y `home.blogPreview`).

### 2. Nuevo `partners` en la colección `global`

```js
// dentro de global.fields, junto a nav/footer/seo:
{ name: "partners", label: "Partners tecnológicos", type: "object", fields: [
  { name: "title", label: "Título", type: "string" },   // "Trabajamos con los líderes de la industria"
  { name: "eyebrow", label: "Eyebrow", type: "string" }, // "[ PARTNERS TECNOLÓGICOS ]"
  { name: "logos", label: "Logos", type: "object", list: true,
    ui: { itemProps: (i) => ({ label: i?.alt || "Logo" }) },
    fields: [
      { name: "image", label: "Logo", type: "image" },
      { name: "alt",   label: "Alt / Nombre", type: "string" },
      { name: "url",   label: "Enlace (opcional)", type: "string" },
    ]},
]}
```

### 3. Contenido sembrado (`src/content/services/*.json`)

Cuatro archivos: `conectividad-empresarial.json` (lleno 1:1 contra la referencia), `ciberseguridad-gestionada.json`, `data-center-cloud.json`, `servicios-gestionados.json` (copy conocido + placeholders). Ejemplo abreviado de Conectividad:

```jsonc
{
  "title": "Conectividad Empresarial",
  "slug": "conectividad-empresarial",
  "hero": {
    "heading": "Conectividad diseñada para operaciones que no pueden detenerse",
    "intro": "Asegura la disponibilidad, resiliencia y el rendimiento de tu infraestructura multisede con enlaces de alta capacidad respaldados por nuestro NOC 24/7.",
    "ctaLabel": "Ver soluciones",
    "formTitle": "¿Conversamos?"
  },
  "valor": {
    "title": "El valor de la resiliencia",
    "cards": [
      { "heading": "El desafío", "text": "Un corte de internet paraliza la facturación, detiene operaciones industriales y bloquea transacciones.", "image": "/uploads/servicios/valor-desafio.svg" },
      { "heading": "Nuestra solución", "text": "Integramos internet empresarial, transmisión de datos multisede, fibra oscura y SD-WAN respaldados por fibra óptica, enlaces satelitales, microondas o LTE — con monitoreo y atención proactiva desde nuestro NOC 24/7.", "image": "/uploads/servicios/valor-solucion.svg" },
      { "heading": "Industrias destacadas", "text": "Aplicable a empresas de todos los tamaños que requieren conectividad confiable para soportar operaciones críticas, múltiples sedes o servicios digitales.", "image": "/uploads/servicios/valor-industrias.svg" }
    ]
  },
  "catalogo": {
    "title": "Catálogo de soluciones",
    "items": [
      { "icon": "internet", "title": "Internet Corporativo", "description": "Enlace de fibra óptica 100% simétrico, exclusivo y sin compartición, con ancho de banda garantizado.", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/internet-corporativo" },
      { "icon": "disponibilidad", "title": "Internet Corporativo de Alta Disponibilidad", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/internet-alta-disponibilidad" },
      { "icon": "satelital", "title": "Conectividad satelital", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/conectividad-satelital" },
      { "icon": "radioenlace", "title": "Radioenlaces Empresariales", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/radioenlaces-empresariales" },
      { "icon": "transmision", "title": "Transmisión de datos (Lan To Lan – L2L)", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/transmision-de-datos-l2l" },
      { "icon": "fibra-oscura", "title": "Fibra Oscura", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/fibra-oscura" },
      { "icon": "sd-wan", "title": "SD-WAN", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/sd-wan" },
      { "icon": "balanceo", "title": "Balanceo de enlaces", "description": "", "buttonLabel": "Conocer más", "url": "/servicios/conectividad-empresarial/balanceo-de-enlaces" }
    ]
  },
  "whyUsTitle": "¿Por qué Fiberlux?",
  "faq": {
    "title": "Preguntas frecuentes",
    "items": [
      { "question": "¿Qué planes de internet hogar ofrece Fiberlux?", "answer": { "type": "root", "children": [] } },
      { "question": "¿Qué significa \"velocidad simétrica\"?", "answer": { "type": "root", "children": [] } },
      { "question": "¿Cómo verifico si Fiberlux tiene cobertura en mi zona?", "answer": { "type": "root", "children": [] } },
      { "question": "¿Cuánto demora la instalación y cuál es su costo?", "answer": { "type": "root", "children": [] } },
      { "question": "¿Qué equipos instalan en mi casa?", "answer": { "type": "root", "children": [] } },
      { "question": "¿Cuánto tiempo dura el contrato?", "answer": { "type": "root", "children": [] } }
    ]
  },
  "seo": {
    "metaTitle": "Conectividad Empresarial | Fiberlux Corp",
    "metaDescription": "Internet dedicado, SD-WAN, fibra oscura y enlaces satelitales respaldados por el NOC 24/7 de Fiberlux. Conectividad resiliente para operaciones críticas.",
    "ogImage": ""
  }
}
```

En `[solucion].astro` el SEO se pasa a `BaseLayout`: `title={seo?.metaTitle || title}` y `description={seo?.metaDescription || global.seo.defaultDescription}`; la `ogImage` cae a `global.seo.ogImage`.

### 4. Set fijo de íconos del catálogo (enum → react-icons)

Espeja el patrón de `rubros` (string `options` en Tina + un `Record<string,glyph>` en el componente React, `react-icons/fa6`). Set inicial cubriendo los sub-servicios de las 4 soluciones, p. ej.: `internet`, `disponibilidad`, `satelital`, `radioenlace`, `transmision`, `fibra-oscura`, `sd-wan`, `balanceo`, `firewall`, `vpn`, `edr`, `correo`, `mfa`, `ztna`, `waf`, `ddos`, `soc`, `pentesting`, `cloud`, `backup`, `storage`, `mesa-ayuda`, `wifi`, `videovigilancia` (+ fallback genérico). El set final se ajusta en implementación; cada `value` mapea a un glyph.

---

## Plan de implementación

> Todo el trabajo vive en: rework de `service` + nuevo `partners` en `global` (`tina/config.ts`), contenido sembrado (`src/content/services/*.json`, `src/content/global/index.json`), nuevos componentes en `src/components/servicios/`, un componente de partners en `src/components/shared/`, y la ruta `src/pages/servicios/[solucion].astro`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Rework de la colección `service`** en `tina/config.ts` con el schema nuevo (hero, valor, catalogo, whyUsTitle, faq, seo) + `ui.router`. Añadir `partners` a `global`. Regenerar el cliente Tina. **Eliminar** `src/content/services/internet-dedicado.json`. *Test:* `npm run dev` levanta sin errores; en `/admin` aparece **Servicios (soluciones)** con los campos nuevos y **Global** muestra Partners.

2. **Sembrar las 4 soluciones** (`src/content/services/{conectividad-empresarial,ciberseguridad-gestionada,data-center-cloud,servicios-gestionados}.json`) — Conectividad 1:1 contra la referencia; las otras 3 con copy conocido + placeholders. Sembrar `global.partners` (título, eyebrow, logos). *Test:* los JSON validan contra el schema (sin warnings de Tina en consola).

3. **Franja de partners** `src/components/shared/Partners.astro` + `PartnersReact.tsx` (resuelve `global`, `useTina`, render de eyebrow + título + logos en escala de grises). *Test:* el componente compila aislado.

4. **Hero (patrón dual)** `src/components/servicios/HeroSolucion.astro` + `HeroSolucionReact.tsx`: columna izquierda (breadcrumb `Servicios / <título>`, H1, intro, botón "Ver soluciones" con ancla al catálogo); columna derecha con el form `¿Conversamos?` = `<DynamicForm formSlug="servicios" />` sobre el gradiente magenta. Todo con `data-tina-field`. *Test:* compila; el botón ancla resuelve al `id` del catálogo.

5. **Ruta dinámica** `src/pages/servicios/[solucion].astro` con `getStaticPaths` sobre la colección `service` + `BaseLayout` + `<HeroSolucion>`. *Test:* `/servicios/conectividad-empresarial` carga el hero (y las otras 3 slugs), los enlaces nivel-1 del nav ya no dan 404.

6. **"El valor de la resiliencia"** — `ValorSolucion.astro` + `ValorSolucionReact.tsx`, bento de 3 cards (heading + texto + imagen) según el layout asimétrico de la referencia. Montar bajo el hero. *Test:* render de las 3 cards editables.

7. **"Catálogo de soluciones"** — `CatalogoSoluciones.astro` + `CatalogoSolucionesReact.tsx` con el mapa `icon→glyph` (react-icons). **Hover-reveal** en desktop (descripción + botón "Conocer más" aparecen con transición smooth; honra `prefers-reduced-motion`); en mobile solo ícono + título (grid 2-col con paginación). Montar la franja de partners (paso 3) **encima** del catálogo. *Test:* en desktop el hover revela descripción+botón suave; en mobile solo se ve ícono+título; el botón enlaza a la url placeholder.

8. **"¿Por qué Fiberlux?"** — montar `<Stats />` (home) con `title={whyUsTitle}` (extender `Stats` para aceptar un título override sin romper el home). *Test:* aparece la barra magenta con las 4 cifras del home y el título del servicio; el home sigue mostrando "Nuestra red en cifras".

9. **"Déjanos tus datos" + "Insights & Novedades"** — montar `<ServiciosForm />` (SPEC 10) y `<BlogPreview />` (home) en orden. *Test:* el form dispara `POST` a `send-email.php` con `formType: "servicios"`; el slider de blog renderiza.

10. **"Preguntas frecuentes"** — `FaqSolucion.astro` + `FaqSolucionReact.tsx`, acordeón sobre fondo claro rosado, respuesta rich-text (renderizada con el runtime de Tina), expand/collapse accesible (teclado + `aria-expanded`), honra `prefers-reduced-motion`. *Test:* abrir/cerrar preguntas funciona; el rich-text se renderiza; editar en el CMS se refleja.

11. **QA visual desktop + mobile.** Comparar `/servicios/conectividad-empresarial` contra `references/conectividad-empresarial-desktop.jpg` (~1440px) y `-mobile.jpg` (~390px) con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar espaciados, gradientes, grid del catálogo, hover, y el apilado mobile hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Pasos 1–2 dejan schema+contenido listos; 3–5 levantan la página navegable; 6–10 ensamblan secciones (propias y reusadas) en el orden del diseño; 11 cierra con QA.
- Orden de secciones en la página: **Hero → El valor de la resiliencia → Partners → Catálogo de soluciones → ¿Por qué Fiberlux? → Déjanos tus datos → Insights & Novedades → Preguntas frecuentes → Footer.**
- Las otras 3 soluciones se sirven de la misma plantilla; su QA fino puede quedar para cuando su copy esté completo (Conectividad es la referencia de validación).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] Existe la ruta `src/pages/servicios/[solucion].astro` y genera las 4 páginas: `/servicios/conectividad-empresarial`, `/servicios/ciberseguridad-gestionada`, `/servicios/data-center-cloud`, `/servicios/servicios-gestionados`, sin 404 desde el nav.
- [ ] `/servicios/conectividad-empresarial` renderiza, en orden: **Hero → El valor de la resiliencia → Partners → Catálogo de soluciones → ¿Por qué Fiberlux? → Déjanos tus datos → Insights & Novedades → Preguntas frecuentes → Footer**.
- [ ] La colección `service` fue reworkeada al schema nuevo; `src/content/services/internet-dedicado.json` **ya no existe**; hay 4 JSON de solución sembrados.
- [ ] En `/admin`, **Servicios (soluciones)** edita hero (H1, intro, texto botón, título del form), las 3 cards de "El valor de la resiliencia", los items del catálogo, `whyUsTitle` y las preguntas frecuentes; los cambios se reflejan en la página sin tocar código.
- [ ] El **hero** muestra breadcrumb `Servicios / Conectividad Empresarial`, H1, intro, botón "Ver soluciones", y a la derecha el form **"¿Conversamos?"** renderizado por `DynamicForm formSlug="servicios"` (mismos 8 campos que el form inferior).
- [ ] El botón **"Ver soluciones"** ancla a la sección **Catálogo de soluciones** en la misma página.
- [ ] En el **Catálogo de soluciones (desktop)**, cada card muestra ícono + título; al hacer **hover** aparecen la descripción y el botón "Conocer más" con una transición **smooth**; el botón enlaza a la `url` del item.
- [ ] En el **Catálogo (mobile)**, cada card muestra **solo ícono + título** (sin descripción ni botón), en grid de 2 columnas con paginación.
- [ ] El hover-reveal y el acordeón **honran `prefers-reduced-motion`** (sin animación cuando está activo).
- [ ] Los íconos del catálogo usan el **set fijo** (enum → glyph react-icons); un valor no mapeado cae a un glyph fallback sin romper el render.
- [ ] La franja **Partners** ("Trabajamos con los líderes de la industria") se renderiza desde `global.partners` y es la **misma** en las 4 soluciones; editarla en el CMS actualiza todas.
- [ ] **"¿Por qué Fiberlux?"** reusa el componente `Stats` con las cifras del home y muestra el título `whyUsTitle`; el **home sigue mostrando "Nuestra red en cifras"** (no se rompió el override).
- [ ] **"Déjanos tus datos y te contactaremos"** reusa `ServiciosForm`; enviarlo dispara `POST` a `send-email.php` con `formType: "servicios"`; con requeridos vacíos muestra validación y no envía.
- [ ] **"Insights & Novedades"** reusa `BlogPreview` (mismo contenido/slider que el home).
- [ ] **"Preguntas frecuentes"** renderiza el acordeón por servicio; cada respuesta es **rich-text** editable en Tina; expand/collapse funciona con mouse y teclado (`aria-expanded`).
- [ ] Cada solución define su **SEO/meta** editable en Tina (`seo.metaTitle`, `seo.metaDescription`, `seo.ogImage`); la página los emite en `<title>`, `<meta name="description">` y OG.
- [ ] Si un campo SEO del servicio está vacío, **cae al default** correspondiente de `global.seo` (`defaultDescription` / `ogImage`) sin romper el render.
- [ ] Editar el SEO de un servicio en el CMS se refleja en el `<head>` de esa página sin tocar código.
- [ ] En **desktop (~1440px)** el layout de Conectividad coincide con `references/conectividad-empresarial-desktop.jpg`.
- [ ] En **mobile (~390px)** el layout coincide con `references/conectividad-empresarial-mobile.jpg` (secciones apiladas, catálogo 2-col solo ícono+título).
- [ ] No se modificaron el motor `DynamicForm`, el form `servicios`, `BlogPreview`, Header, Footer ni maintenance (salvo el override de título en `Stats` y el nuevo `partners` en `global`).

---

## Decisiones

- **Sí:** una **plantilla única** (`[solucion].astro` + `getStaticPaths`) para las 4 soluciones, alimentada por la colección `service`. Evita 4 páginas hardcodeadas; el editor crea/edita soluciones desde el CMS. Conectividad es la referencia de validación visual.
- **Sí:** **reworkear** la colección `service` legacy (borrar `internet-dedicado.json`) en vez de crear una colección nueva. El schema viejo no calza con el diseño y no está en uso (sin ruta); mantener dos colecciones invitaría a divergencia.
- **No:** extender `service` conservando los campos legacy. Habría un schema inflado con campos muertos (`features`, `expandableServices`, `experts`, `checklist`) que confundirían al editor.
- **Sí:** **catálogo como lista embebida** en cada solución, con `url` **placeholder** hacia las futuras páginas nivel-2. El usuario lo pidió explícito ("por ahora placeholders, serán nivel-2 próximamente"); no bloquea esta spec en datos que aún no existen.
- **No:** derivar el catálogo de documentos hijo nivel-2 **ahora**. Las páginas y datos nivel-2 están fuera de alcance; cuando lleguen, su fuente única se decide en su propia spec (posible migración del catálogo embebido).
- **Sí:** **hover-reveal** en el catálogo desktop (descripción + botón aparecen suave al hover) y **solo ícono+título** en mobile. Coincide con la referencia y con lo pedido; honra `prefers-reduced-motion`.
- **Sí:** **íconos de set fijo** (enum → glyph react-icons) para el catálogo, espejando `rubros`. Garantiza consistencia visual y evita subir SVGs sueltos; fallback para valores no mapeados.
- **Sí:** **reusar** `Stats` (cifras del home), `BlogPreview` y `ServiciosForm`. Fuente única de contenido; el diseño muestra las mismas cifras/blog que el home. `Stats` solo gana un **título override** para "¿Por qué Fiberlux?".
- **No:** cifras propias por servicio. Duplicaría el contenido del home con riesgo de divergencia; si un servicio debe mostrar otras métricas, va en otra spec.
- **Sí:** **mismo form `servicios`** (SPEC 10) en el hero ("¿Conversamos?") y en el bloque inferior ("Déjanos tus datos"). Un solo motor/definición; el editor ajusta campos y destinatarios en un lugar.
- **Sí:** **"El valor de la resiliencia" como sección custom** de 3 cards editables (con imagen), no reusar `StickyCards`. El layout asimétrico (desafío/solución/industrias) no calza con el sticky-stacking del home.
- **Sí:** **FAQ rich-text por servicio** (acordeón). El editor necesita negritas/listas/enlaces en respuestas; per-servicio porque cada solución tiene preguntas distintas.
- **Sí:** **partners global** (`global.partners`), no per-servicio. Los mismos logos aparecen en todas las soluciones; editarlos una vez evita repetir.
- **Sí:** **SEO/meta por servicio** con fallback a `global.seo`. Cada solución necesita su `<title>`/descripción/OG para posicionamiento; el fallback evita huecos si el editor no llena todo.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El **rework de `service`** rompe el cliente Tina o deja el JSON legacy huérfano (build roto por schema mismatch). | Borrar `internet-dedicado.json` en el mismo paso del rework; regenerar el cliente (`tinacms build`); verificar `npm run dev` y `/admin` antes de seguir. |
| El **título override** de `Stats` para "¿Por qué Fiberlux?" rompe el home ("Nuestra red en cifras") si se cambia la fuente en vez de solo el prop. | Extender `Stats`/`StatsReact` con un prop `title` **opcional** que cae al de `home.stats`; QA de que el home no cambia. |
| Reusar `ServiciosForm`/`Stats`/`BlogPreview` **acopla** la página de solución al contenido del home/servicios: editarlos allí cambia las 4 soluciones. | Decisión consciente (fuente única) registrada en Decisiones; si deben divergir, se separa en otra spec. |
| El **hover-reveal** deja las cards inaccesibles por teclado o mal en dispositivos táctiles híbridos (laptop touch). | Revelar también con `:focus-within`; en mobile/touch mostrar solo ícono+título (sin depender del hover); honrar `prefers-reduced-motion`. |
| Las **`url` placeholder** del catálogo apuntan a páginas nivel-2 inexistentes → 404 si el usuario hace clic. | Documentar que son placeholders hasta la spec nivel-2; opción de dejar el botón sin `href` funcional (o `#`) hasta que existan las rutas. QA no cuenta el 404 como fallo de esta spec. |
| El **rich-text** de FAQ vacío (`{type:"root",children:[]}` sembrado) puede renderizar hueco o warning si el runtime de Tina no lo maneja. | Render condicional (no pintar cuerpo si el nodo está vacío); el editor llena el copy real; QA del acordeón con y sin respuesta. |
| Nuevas **clases Tailwind** (gradiente magenta del hero, fondo rosado del FAQ, transición del hover) fallan en dev por staleness del JIT (memoria del proyecto). | Usar tokens/clases existentes de `global.css` o estilos inline; reiniciar el dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |
| El **botón "Ver soluciones"** ancla a un `id` tapado por el header sticky. | `id` único en el catálogo (p. ej. `#catalogo`) con `scroll-margin-top` suficiente. |
| El **grid asimétrico** de "El valor de la resiliencia" o el sticky del catálogo se rompen en breakpoints intermedios (tablet). | QA en desktop (~1440px) y mobile (~390px) por convención; revisar el rango intermedio; apilar en una columna donde el layout de 2-col no calce. |
| Sembrar **4 soluciones** con placeholders puede dejar páginas incompletas en producción si se publican tal cual. | Conectividad se llena 1:1; las otras 3 quedan marcadas como placeholder en su copy; documentar que deben completarse antes de enlazarlas públicamente. |

---

## Qué **NO** entra en este spec

- Las páginas de sub-servicio (nivel-2) `/servicios/<solucion>/<subservicio>` y su fuente de datos (el catálogo enlaza con URLs placeholder).
- Cifras propias por servicio en "¿Por qué Fiberlux?" (se reusan del home).
- Editar "Insights & Novedades" por servicio (reusa `BlogPreview` del home).
- Rediseñar Header / Footer / maintenance / form `servicios` / `Stats` / `BlogPreview`.
- Visual 3D en el hero.
- Sección de testimonios en estas páginas.

Cada uno de estos, si aterriza, va en su propio spec.
