# SPEC 12 — Plantilla de páginas de sub-servicio (nivel-2, `/servicios/[solucion]/[subservicio]`)

> **Estado:** Aprobado
> **Depende de:**
> - **SPEC 11** (plantilla nivel-1 `service`, componentes `Stats` con título override, `FaqSolucion`, y las `url` placeholder del catálogo que esta spec activa sin 404).
> - **SPEC 10** (form dinámico `servicios` / `ServiciosForm`, motor `DynamicForm` → `send-email.php`).
> - Reutiliza `Stats`, `BlogPreview` (home) y `BaseLayout` (Header + Footer + maintenance + Lenis).
>
> **Fecha:** 2026-07-01
>
> **Objetivo:** Construir una plantilla Astro/React única, alimentada por una nueva colección `subservicio`, que renderice las páginas de sub-servicio (nivel-2) en `/servicios/[solucion]/[subservicio]` según el diseño de *Internet Corporativo*, sembrando los 8 sub-servicios de Conectividad Empresarial y activando sin 404 los enlaces del catálogo de SPEC 11.

---

## Alcance

**Dentro:**

- **Ruta dinámica `src/pages/servicios/[solucion]/[subservicio].astro`.** Hereda `BaseLayout`. `getStaticPaths` genera una página por documento de la colección `subservicio`, usando `{ solucion: doc.solucionSlug, subservicio: doc.slug }`. Convive con la ruta nivel-1 `[solucion].astro` (SPEC 11) sin colisión (`/servicios/x` vs `/servicios/x/y`).

- **Nueva colección `subservicio`** (`tina/config.ts`): multi-documento, con `solucionSlug` (referencia al padre) + `ui.router` para edición visual. Contenido en `src/content/subservicios/*.json`.

- **Sembrar los 8 sub-servicios de Conectividad Empresarial** (los mismos slugs que las `url` del catálogo de SPEC 11): `internet-corporativo` (lleno **1:1** contra la referencia), `internet-alta-disponibilidad`, `conectividad-satelital`, `radioenlaces-empresariales`, `transmision-de-datos-l2l`, `fibra-oscura`, `sd-wan`, `balanceo-de-enlaces` (los 7 restantes con copy conocido + **placeholders** marcados). Esto activa esos 8 enlaces del catálogo sin 404.

- **Secciones propias (nuevas):**
  - **Hero `HeroSubservicio.astro` + `HeroSubservicioReact.tsx`** (patrón dual, tema oscuro con gradiente magenta): breadcrumb de **3 niveles** `Servicios / <Solución> / <Sub-servicio>`, H1, intro, **caja de nota** editable, botón **"Solicitar cotización"** que **ancla al form inferior** ("Déjanos tus datos"). Columna derecha: form **"¿Conversamos?"** = `DynamicForm formSlug="servicios"` con **pre-selección** del servicio (ver abajo).
  - **"Beneficios"** — grid de cards editables (ícono de **set fijo** enum→react-icons + título + texto), sembrado con las 3 de la referencia.
  - **"Casos de uso"** — eyebrow `[ CASOS DE USO ]` + statement tipográfico en **rich-text** con marca de resaltado (palabras en énfasis magenta).

- **Extensión mínima de `DynamicForm`** — nuevo prop opcional `prefill` (`Record<fieldName, value>`) en `DynamicForm.astro` + `DynamicFormReact.tsx`, para pre-seleccionar el campo `servicio` (select) según la solución padre de la página. Sin `prefill`, el comportamiento actual no cambia (no afecta `/servicios` ni `/contacto`).

- **Secciones reutilizadas tal cual (sin duplicar contenido):**
  - **"¿Por qué Fiberlux?"** → `Stats` (cifras del home) con **título override** por sub-servicio (mecanismo ya existente de SPEC 11).
  - **"Déjanos tus datos y te contactaremos"** → `ServiciosForm` (form dinámico `servicios`), con `prefill` del servicio.
  - **"Insights & Novedades"** → `BlogPreview` (home).
  - **"Preguntas frecuentes"** → `FaqSolucion` (SPEC 11), alimentado por el FAQ **propio del sub-servicio** (editable en Tina).
  - Header, Footer, maintenance, Lenis vía `BaseLayout`.

- **SEO/meta por sub-servicio** con fallback a `global.seo` (mismo patrón que SPEC 11).

- **QA visual** contra `references/internet-corporativo.jpg` (~1440px) con Playwright MCP (screenshots en `.playwright-screens/`). En mobile se apila el layout desktop en una columna.

**Fuera de alcance (para futuras specs):**

- **Los sub-servicios de las otras 3 soluciones** (Ciberseguridad, Data Center/Cloud, Servicios Gestionados) — sus catálogos siguen con `url` placeholder hasta que se siembren.
- **Referencia mobile dedicada** de nivel-2 (no existe screenshot mobile; el mobile es el desktop apilado).
- **Rediseñar** Header / Footer / maintenance / `Stats` / `BlogPreview` / `ServiciosForm` / el motor `DynamicForm` (salvo el prop `prefill` aditivo).
- **Editar las cifras de "¿Por qué Fiberlux?"** o el contenido de "Insights & Novedades" por sub-servicio (se reusan del home).
- **Visual 3D** en el hero (lleva form a la derecha, no 3D).
- **Franja Partners, "El valor de la resiliencia" y "Catálogo de soluciones"** (son de nivel-1; el diseño nivel-2 no los incluye).

---

## Modelo de datos

Introduce **una colección nueva** (`subservicio`) y **una extensión aditiva** al motor de formularios (`prefill`). Reusa sin modificar: `home.stats`, `home.blogPreview`, la colección `servicios` y `dynamic-forms/servicios.json`, `global.seo`.

### 1. Colección `subservicio` (`tina/config.ts`)

```js
{
  name: "subservicio",
  label: "Sub-servicios (nivel 2)",
  path: "src/content/subservicios",
  format: "json",
  ui: {
    router: ({ document }) =>
      `/servicios/${document.solucionSlug}/${document._sys.filename}`,
    filename: { slugify: (v) => (v?.slug || "").toLowerCase() },
  },
  fields: [
    { name: "title", label: "Nombre del sub-servicio", type: "string", required: true, isTitle: true }, // "Internet Corporativo"
    { name: "slug",  label: "URL slug", type: "string", required: true },        // "internet-corporativo"
    { name: "solucionSlug", label: "Solución padre (slug)", type: "string", required: true,
      options: ["conectividad-empresarial","ciberseguridad-gestionada","data-center-cloud","servicios-gestionados"] },
    { name: "solucionTitle", label: "Solución padre (nombre para breadcrumb)", type: "string" }, // "Conectividad Empresarial"

    // ── Hero ──
    { name: "hero", label: "Hero", type: "object", fields: [
      { name: "heading",  label: "Título (H1)", type: "string", ui: { component: "textarea" } },
      { name: "intro",    label: "Párrafo intro", type: "string", ui: { component: "textarea" } },
      { name: "note",     label: "Caja de nota", type: "string", ui: { component: "textarea" } }, // "Ideal si tu red compartida colapsa…"
      { name: "ctaLabel", label: "Texto botón (ancla al form inferior)", type: "string" },        // "Solicitar cotización"
      { name: "formTitle", label: "Título del form del hero", type: "string" },                   // "¿Conversamos?"
    ]},

    // ── "Beneficios" (cards ícono + título + texto) ──
    { name: "beneficios", label: "Beneficios", type: "object", fields: [
      { name: "title", label: "Título de sección", type: "string" }, // "Beneficios"
      { name: "items", label: "Cards", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.title || "Beneficio" }) },
        fields: [
          { name: "icon",  label: "Ícono", type: "string", options: [ /* set fijo, ver §3 */ ] },
          { name: "title", label: "Título", type: "string" },
          { name: "text",  label: "Texto", type: "string", ui: { component: "textarea" } },
        ]},
    ]},

    // ── "Casos de uso" (statement rich-text con resaltado) ──
    { name: "casosDeUso", label: "Casos de uso", type: "object", fields: [
      { name: "eyebrow",   label: "Eyebrow", type: "string" },       // "[ CASOS DE USO ]"
      { name: "statement", label: "Statement", type: "rich-text" },  // palabras resaltadas con marca de énfasis
    ]},

    // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
    { name: "whyUsTitle", label: "Título '¿Por qué Fiberlux?'", type: "string" },

    // ── "Preguntas frecuentes" (propio del sub-servicio) ──
    { name: "faq", label: "Preguntas frecuentes", type: "object", fields: [
      { name: "title", label: "Título de sección", type: "string" },
      { name: "items", label: "Preguntas", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.question || "Pregunta" }) },
        fields: [
          { name: "question", label: "Pregunta", type: "string" },
          { name: "answer",   label: "Respuesta", type: "rich-text" },
        ]},
    ]},

    // ── SEO / meta (cae a global.seo si vacío) ──
    { name: "seo", label: "SEO / Meta", type: "object", fields: [
      { name: "metaTitle",       label: "Meta título", type: "string" },
      { name: "metaDescription", label: "Meta descripción", type: "string", ui: { component: "textarea" } },
      { name: "ogImage",         label: "Imagen OG", type: "image" },
    ]},
  ],
}
```

### 2. Extensión `prefill` en `DynamicForm`

`DynamicForm.astro` acepta un prop opcional `prefill?: Record<string, string>` y lo pasa a `DynamicFormReact.tsx`, que lo usa como **valor inicial** de los campos coincidentes (aquí: `{ servicio: "conectividad-empresarial" }`). Sin `prefill`, el estado inicial es el actual (vacío/placeholder). El select sigue siendo editable por el usuario.

### 3. Set fijo de íconos de "Beneficios" (enum → react-icons)

Espeja el patrón de `catalogo`/`rubros` (string `options` en Tina + `Record<string,glyph>` en el componente, `react-icons/fa6`). Set inicial para los beneficios de la referencia: `velocidad`, `simetria`, `soporte` (+ los que hagan falta al sembrar los otros 7 sub-servicios; fallback genérico para valores no mapeados).

### 4. Contenido sembrado (`src/content/subservicios/*.json`)

Ocho archivos. `internet-corporativo.json` lleno **1:1** contra la referencia; los otros 7 con copy conocido + placeholders. Ejemplo abreviado de Internet Corporativo:

```jsonc
{
  "title": "Internet Corporativo",
  "slug": "internet-corporativo",
  "solucionSlug": "conectividad-empresarial",
  "solucionTitle": "Conectividad Empresarial",
  "hero": {
    "heading": "Internet Corporativo",
    "intro": "Enlace de fibra óptica 100% simétrico, exclusivo y sin compartición con otros usuarios, con ancho de banda garantizado.",
    "note": "Ideal si tu red compartida colapsa en horas pico, asfixiando tus sistemas de gestión y subida de archivos a la nube.",
    "ctaLabel": "Solicitar cotización",
    "formTitle": "¿Conversamos?"
  },
  "beneficios": {
    "title": "Beneficios",
    "items": [
      { "icon": "velocidad", "title": "Velocidad constante garantizada", "text": "Ancho de banda dedicado en cualquier horario, sin caídas por saturación de red compartida." },
      { "icon": "simetria", "title": "Carga y descarga simétrica", "text": "Ideal para videollamadas fluidas y subida de bases de datos, con el mismo ancho en ambas direcciones." },
      { "icon": "soporte", "title": "Soporte de alta prioridad", "text": "Resolución inmediata ante incidencias con SLA dedicado y atención preferente 24/7." }
    ]
  },
  "casosDeUso": {
    "eyebrow": "[ CASOS DE USO ]",
    "statement": { "type": "root", "children": [ /* "Cualquier empresa … donde <em>cada minuto de desconexión</em> signifique pérdida de dinero…" */ ] }
  },
  "whyUsTitle": "¿Por qué Fiberlux?",
  "faq": { "title": "Preguntas frecuentes", "items": [ /* preguntas de la referencia */ ] },
  "seo": {
    "metaTitle": "Internet Corporativo | Fiberlux Corp",
    "metaDescription": "Fibra óptica 100% simétrica, dedicada y sin compartición, con ancho de banda garantizado y soporte 24/7.",
    "ogImage": ""
  }
}
```

En `[subservicio].astro` el SEO se pasa a `BaseLayout`: `title={seo?.metaTitle || title}`, `description={seo?.metaDescription || global.seo.defaultDescription}`, `ogImage` cae a `global.seo.ogImage`.

---

## Plan de implementación

> Todo el trabajo vive en: nueva colección `subservicio` (`tina/config.ts` + `src/content/subservicios/*.json`), extensión `prefill` del motor `DynamicForm`, nuevos componentes en `src/components/servicios/`, y la ruta `src/pages/servicios/[solucion]/[subservicio].astro`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Crear la colección `subservicio`** en `tina/config.ts` (multi-doc, `ui.router`, campos hero/beneficios/casosDeUso/whyUsTitle/faq/seo + `solucionSlug`/`solucionTitle`). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` aparece **Sub-servicios (nivel 2)** con los campos nuevos.

2. **Sembrar los 8 sub-servicios de Conectividad** (`src/content/subservicios/*.json`) — `internet-corporativo` 1:1 contra la referencia; los otros 7 con copy conocido + placeholders. Los `slug` coinciden con las `url` del catálogo de SPEC 11. *Test:* los JSON validan contra el schema (sin warnings de Tina en consola).

3. **Extender `DynamicForm` con `prefill`** (`DynamicForm.astro` + `DynamicFormReact.tsx`): prop opcional `prefill?: Record<string,string>` usado como valor inicial de los campos coincidentes. *Test:* `/servicios` y `/contacto` siguen igual (sin `prefill`); pasar `prefill={{servicio:"conectividad-empresarial"}}` pre-selecciona el select.

4. **Hero `HeroSubservicio`** (patrón dual): columna izquierda (breadcrumb 3-niveles `Servicios / <solucionTitle> / <title>`, H1, intro, caja de nota, botón "Solicitar cotización" con ancla al form inferior); columna derecha con `<DynamicForm formSlug="servicios" prefill={{servicio: solucionSlug}} />` sobre el gradiente magenta. Todo con `data-tina-field`. *Test:* compila; el botón resuelve al `id` del form inferior; el breadcrumb enlaza `Servicios`→`/servicios` y `<solucionTitle>`→`/servicios/<solucionSlug>`.

5. **Ruta dinámica** `src/pages/servicios/[solucion]/[subservicio].astro` con `getStaticPaths` sobre la colección `subservicio` (`{ solucion: doc.solucionSlug, subservicio: doc.slug }`) + `BaseLayout` + `<HeroSubservicio>`. *Test:* `/servicios/conectividad-empresarial/internet-corporativo` carga el hero (y las otras 7 slugs); los 8 enlaces del catálogo de SPEC 11 ya no dan 404; la ruta nivel-1 `[solucion].astro` sigue funcionando.

6. **"Beneficios"** — `Beneficios.astro` + `BeneficiosReact.tsx` con el mapa `icon→glyph` (react-icons). Grid de cards (ícono + título + texto) según la referencia. Montar bajo el hero. *Test:* render de las 3 cards editables; íconos correctos; valor no mapeado cae a fallback.

7. **"Casos de uso"** — `CasosDeUso.astro` + `CasosDeUsoReact.tsx`: eyebrow + statement rich-text con la marca de resaltado renderizada (runtime de Tina). *Test:* el statement se renderiza con las palabras en énfasis; editar en Tina se refleja.

8. **"¿Por qué Fiberlux?"** — montar `<Stats title={whyUsTitle} />` (reuso SPEC 11). *Test:* barra magenta con las 4 cifras del home y el título del sub-servicio; el home no cambia.

9. **"Déjanos tus datos" + "Insights & Novedades"** — montar `<ServiciosForm prefill={{servicio: solucionSlug}} />` y `<BlogPreview />` en orden. El botón "Solicitar cotización" del hero ancla al form. *Test:* el select arranca con la solución padre pre-seleccionada; enviar dispara `POST` a `send-email.php` con `formType: "servicios"`; el slider de blog renderiza.

10. **"Preguntas frecuentes"** — montar `<FaqSolucion>` (SPEC 11) alimentado por `faq` del sub-servicio. *Test:* abrir/cerrar funciona (mouse + teclado, `aria-expanded`); el rich-text se renderiza; honra `prefers-reduced-motion`.

11. **QA visual desktop + mobile.** Comparar `/servicios/conectividad-empresarial/internet-corporativo` contra `references/internet-corporativo.jpg` (~1440px) con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar espaciados, gradiente del hero, caja de nota, grid de beneficios, statement de casos de uso, y el apilado mobile hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Pasos 1–3 dejan schema, contenido y el `prefill` listos; 4–5 levantan la página navegable; 6–10 ensamblan secciones (propias y reusadas) en el orden del diseño; 11 cierra con QA.
- Orden de secciones en la página: **Hero → Beneficios → Casos de uso → ¿Por qué Fiberlux? → Déjanos tus datos → Insights & Novedades → Preguntas frecuentes → Footer.**
- Los otros 7 sub-servicios se sirven de la misma plantilla; su QA fino queda para cuando su copy esté completo (Internet Corporativo es la referencia de validación).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] Existe la ruta `src/pages/servicios/[solucion]/[subservicio].astro` y genera las 8 páginas de Conectividad: `/servicios/conectividad-empresarial/{internet-corporativo, internet-alta-disponibilidad, conectividad-satelital, radioenlaces-empresariales, transmision-de-datos-l2l, fibra-oscura, sd-wan, balanceo-de-enlaces}`.
- [ ] Los **8 enlaces del catálogo** de la página nivel-1 `/servicios/conectividad-empresarial` (SPEC 11) ya **no dan 404**.
- [ ] La ruta nivel-1 `[solucion].astro` sigue funcionando (no hay colisión de rutas).
- [ ] `/servicios/conectividad-empresarial/internet-corporativo` renderiza, en orden: **Hero → Beneficios → Casos de uso → ¿Por qué Fiberlux? → Déjanos tus datos → Insights & Novedades → Preguntas frecuentes → Footer**.
- [ ] Existe la colección `subservicio` con 8 JSON sembrados; en `/admin`, **Sub-servicios (nivel 2)** edita hero (H1, intro, nota, texto botón, título del form), las cards de Beneficios, el statement de Casos de uso, `whyUsTitle` y las Preguntas frecuentes; los cambios se reflejan sin tocar código.
- [ ] El **hero** muestra breadcrumb de 3 niveles `Servicios / Conectividad Empresarial / Internet Corporativo` (con `Servicios`→`/servicios` y `Conectividad Empresarial`→`/servicios/conectividad-empresarial` enlazados), H1, intro, **caja de nota**, botón "Solicitar cotización", y a la derecha el form **"¿Conversamos?"** (`DynamicForm formSlug="servicios"`).
- [ ] El botón **"Solicitar cotización"** ancla a la sección **"Déjanos tus datos"** de la misma página.
- [ ] La sección **"Beneficios"** renderiza las cards con ícono (set fijo enum→react-icons) + título + texto; un valor de ícono no mapeado cae a un glyph **fallback** sin romper el render.
- [ ] La sección **"Casos de uso"** renderiza el eyebrow `[ CASOS DE USO ]` y el **statement rich-text** con las palabras resaltadas en énfasis; es editable en Tina.
- [ ] **"¿Por qué Fiberlux?"** reusa `Stats` con las cifras del home y muestra `whyUsTitle`; el **home sigue mostrando "Nuestra red en cifras"** (override intacto).
- [ ] En ambos formularios (hero y "Déjanos tus datos"), el select **"Servicio de interés"** arranca **pre-seleccionado** con la solución padre (`conectividad-empresarial`) vía `prefill`, y sigue siendo editable por el usuario.
- [ ] El prop `prefill` es **aditivo**: `/servicios` y `/contacto` no cambian su comportamiento (select arranca vacío/placeholder como hoy).
- [ ] Enviar "Déjanos tus datos" dispara `POST` a **`send-email.php`** con `formType: "servicios"`; con requeridos vacíos muestra validación y no envía.
- [ ] **"Insights & Novedades"** reusa `BlogPreview` (mismo contenido/slider que el home).
- [ ] **"Preguntas frecuentes"** reusa `FaqSolucion` alimentado por el `faq` **propio del sub-servicio**; cada respuesta es rich-text editable; expand/collapse funciona con mouse y teclado (`aria-expanded`); honra `prefers-reduced-motion`.
- [ ] Cada sub-servicio define su **SEO/meta** editable (`seo.metaTitle/metaDescription/ogImage`); la página los emite en `<title>`, `<meta name="description">` y OG; si vacíos, caen al default de `global.seo`.
- [ ] En **desktop (~1440px)** el layout de Internet Corporativo coincide con `references/internet-corporativo.jpg`.
- [ ] En **mobile** el layout es el desktop **apilado en una columna** (hero → form, beneficios, casos de uso, etc.).
- [ ] No se modificaron `Stats`, `BlogPreview`, `FaqSolucion`, Header, Footer, maintenance ni la definición del form `servicios` (salvo el prop aditivo `prefill` en `DynamicForm`).

---

## Decisiones

- **Sí:** una **plantilla única** (`[solucion]/[subservicio].astro` + `getStaticPaths`) para todos los sub-servicios, alimentada por la colección `subservicio`. Evita páginas hardcodeadas; el editor crea/edita sub-servicios desde el CMS. Internet Corporativo es la referencia de validación visual.
- **Sí:** **colección nueva `subservicio`** (multi-doc) con `solucionSlug`, no embeber en `service` ni extender `service` con un discriminador. Mantiene el schema de nivel-1 limpio, permite routing y edición individual por sub-servicio, y calza con las `url` anidadas placeholder de SPEC 11.
- **No:** derivar los sub-servicios del catálogo embebido de nivel-1. El catálogo de SPEC 11 solo tiene título/ícono/url; el nivel-2 necesita su propio contenido rico (hero, beneficios, casos de uso, FAQ, SEO).
- **Sí:** **ruta anidada** `/servicios/[solucion]/[subservicio]` que coincide con las `url` del catálogo de SPEC 11, activándolas sin 404. Convive con `[solucion].astro` sin colisión.
- **Sí:** sembrar **solo los 8 sub-servicios de Conectividad** en esta spec (Internet Corporativo 1:1; los 7 restantes con placeholders). Valida la plantilla contra la única referencia visual existente sin bloquear en copy inexistente de las otras 3 soluciones.
- **Sí:** **hero propio `HeroSubservicio`**, no extender `HeroSolucion` (SPEC 11). Las diferencias (breadcrumb 3-niveles, caja de nota, botón que ancla al form inferior en vez de al catálogo) justifican un componente separado que no arriesga el nivel-1 ya implementado.
- **Sí:** **"Casos de uso" en rich-text** con marca de resaltado. El editor necesita controlar qué palabras van en énfasis magenta; un string + lista de frases sería frágil (coincidencia de texto).
- **Sí:** **"Beneficios" con íconos de set fijo** (enum → glyph react-icons), espejando `catalogo`/`rubros`. Garantiza consistencia visual y evita subir SVGs sueltos; fallback para valores no mapeados.
- **Sí:** **FAQ propio por sub-servicio** (no heredar del padre ni global). Cada sub-servicio puede tener preguntas distintas; se reusa el componente `FaqSolucion` pero con su propia fuente de datos.
- **Sí:** **reusar** `Stats` (con título override), `BlogPreview`, `ServiciosForm` y `FaqSolucion`. Fuente única de contenido; el diseño nivel-2 muestra las mismas cifras/blog que el home y el mismo motor de FAQ/form que nivel-1.
- **Sí:** **pre-seleccionar el servicio** en ambos formularios vía un prop `prefill` **aditivo** en `DynamicForm`. Coincide con la referencia (select con la solución padre elegida) y mejora la UX; el prop opcional no altera `/servicios` ni `/contacto`.
- **No:** duplicar el motor de formularios ni crear un form `servicios` alterno para pre-seleccionar. Extender `DynamicForm` con un prop opcional es menos invasivo y mantiene un solo motor.
- **Sí:** **botón "Solicitar cotización" ancla al form inferior** de la misma página (no navega a `/contacto`). Mantiene al usuario en el flujo del sub-servicio, mismo criterio que el CTA de `/servicios` (SPEC 10).
- **No:** franja Partners, "El valor de la resiliencia" ni "Catálogo de soluciones" en nivel-2. El diseño de Internet Corporativo no los incluye; son secciones propias del nivel-1.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La ruta anidada `[solucion]/[subservicio].astro` **colisiona** o confunde a `getStaticPaths` con la ruta nivel-1 `[solucion].astro`. | Astro distingue `/servicios/x` de `/servicios/x/y` por profundidad; verificar que ambas generan sus páginas y que ningún `slug` de sub-servicio pisa un slug de solución. QA de las dos capas tras el paso 5. |
| Los **`slug` sembrados** no coinciden exactamente con las `url` del catálogo de SPEC 11 → los enlaces siguen en 404. | Copiar los 8 slugs literalmente de las `url` del catálogo de Conectividad; criterio de aceptación explícito de que los 8 enlaces resuelven. |
| La extensión **`prefill`** de `DynamicForm` rompe el estado inicial de `/servicios` o `/contacto` (regresión en formularios existentes). | `prefill` es opcional y solo aplica a campos coincidentes; sin el prop, el estado inicial actual no cambia. QA de `/servicios` y `/contacto` tras el paso 3. |
| El **`solucionTitle`** del breadcrumb queda desincronizado con el `title` real de la solución padre (colección `service`) si el editor lo cambia en un lado. | Sembrarlo consistente; documentar que es un campo de display. Alternativa futura: resolverlo desde `service` por `solucionSlug` en vez de duplicarlo (fuera de alcance). |
| El **rich-text** de "Casos de uso" o de FAQ vacío (`{type:"root",children:[]}` sembrado) renderiza hueco o warning si el runtime de Tina no lo maneja. | Render condicional (no pintar cuerpo si el nodo está vacío); QA con y sin contenido. |
| La **marca de resaltado** del statement no existe como estilo en el runtime rich-text de Tina y no se pinta en magenta. | Usar una marca soportada (p. ej. bold/highlight) mapeada a la clase de énfasis en el render; QA visual contra la referencia. |
| Nuevas **clases Tailwind** (gradiente magenta del hero, caja de nota, énfasis del statement) fallan en dev por staleness del JIT (memoria del proyecto). | Usar tokens/clases existentes de `global.css` o estilos inline; reiniciar el dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |
| El botón **"Solicitar cotización"** ancla a un `id` tapado por el header sticky. | `id` único en el form inferior con `scroll-margin-top` suficiente. |
| Sembrar **7 sub-servicios con placeholders** puede dejar páginas incompletas en producción si se publican tal cual. | Internet Corporativo se llena 1:1; los otros 7 quedan marcados como placeholder en su copy; documentar que deben completarse antes de enlazarlos públicamente. |
| Reusar `Stats`/`BlogPreview`/`ServiciosForm` **acopla** el nivel-2 al contenido del home/servicios: editarlos allí cambia todas las páginas de sub-servicio. | Decisión consciente (fuente única) registrada en Decisiones; si deben divergir, se separa en otra spec. |

---

## Qué **NO** entra en este spec

- Los sub-servicios de las otras 3 soluciones (Ciberseguridad, Data Center/Cloud, Servicios Gestionados) y su siembra de contenido.
- Referencia/maquetación mobile dedicada de nivel-2 (el mobile es el desktop apilado).
- Rediseñar Header / Footer / maintenance / `Stats` / `BlogPreview` / `ServiciosForm` / el motor `DynamicForm` (salvo el prop aditivo `prefill`).
- Cifras propias por sub-servicio en "¿Por qué Fiberlux?" e "Insights & Novedades" (se reusan del home).
- Visual 3D en el hero.
- Franja Partners, "El valor de la resiliencia" y "Catálogo de soluciones" (secciones de nivel-1).

Cada uno de estos, si aterriza, va en su propio spec.
