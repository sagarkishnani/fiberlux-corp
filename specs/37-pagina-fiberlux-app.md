# SPEC 37 — Página Fiberlux App (`/fiberlux-app`)

> **Estado:** Borrador
> **Depende de:**
> - **SPEC 12** (plantilla de sub-servicio nivel-2: patrón de secciones Hero → Beneficios → Casos de uso → ¿Por qué Fiberlux? → Insights, y los componentes `Beneficios`, `CasosDeUso` que se toman como base visual).
> - **SPEC 11** (`Stats` con título override) y home (`BlogPreview`), que se reutilizan tal cual.
> - `BaseLayout` (Header + Footer + maintenance + Lenis).
>
> **Fecha:** 2026-07-14
>
> **Objetivo:** Crear la página estática `/fiberlux-app`, alimentada por una nueva colección single-doc `fiberluxApp`, que reutiliza la estructura de secciones de la plantilla de servicios **sin ningún formulario**, presentando la app móvil de Fiberlux (hero con mockup y botones de descarga, beneficios, casos de uso, cifras y blog).

---

## Alcance

**Dentro:**

- **Ruta estática `src/pages/fiberlux-app.astro`.** Hereda `BaseLayout`. Resuelve la colección `fiberluxApp` una sola vez y compone las secciones en orden. SEO/meta por página con fallback a `global.seo` (mismo patrón que `[subservicio].astro`).

- **Nueva colección single-doc `fiberluxApp`** (`tina/config.ts`): un solo documento (estilo `home`/`about`), contenido en `src/content/fiberlux-app/index.json`, con `ui.router` a `/fiberlux-app` para edición visual. Regenera el cliente Tina.

- **Secciones propias (nuevas, sin forms), en `src/components/fiberlux-app/`:**
  - **Hero `HeroFiberluxApp.astro` + `HeroFiberluxAppReact.tsx`** (patrón dual, tema oscuro con gradiente magenta). Columna izquierda: **titular** (H1 "Fiberlux App"), **descripción** ("Obtén control total de tu red desde tu celular."), **caja de bajada** editable ("Potencia tu operatividad con visibilidad 24/7…"), y **botones de descarga** App Store / Google Play (etiqueta + URL editables; URLs placeholder por ahora). Columna derecha: **mockup de la app** (imagen de celular, campo `image` editable en Tina; placeholder por ahora). **Sin breadcrumb** (no hay jerarquía padre) y **sin formulario**.
  - **"Beneficios"** — `BeneficiosApp.astro` + `BeneficiosAppReact.tsx`: grid de cards editables (ícono de set fijo enum→react-icons + texto), sembrado con las 3 líneas de la referencia. Mismo tratamiento visual que `Beneficios` de servicios.
  - **"Casos de uso"** — `CasosDeUsoApp.astro` + `CasosDeUsoAppReact.tsx`: eyebrow `[ CASOS DE USO ]` + statement en **rich-text** con marca de resaltado (palabras en énfasis magenta), sembrado con la línea de la referencia.

- **Secciones reutilizadas tal cual (sin duplicar contenido):**
  - **"¿Por qué Fiberlux?"** → `Stats` (cifras del home) con **título override** editable (`whyUsTitle`).
  - **"Insights & Novedades"** → `BlogPreview` (home).
  - Header, Footer, maintenance, Lenis vía `BaseLayout`.

- **SEO/meta editable** (`seo.metaTitle/metaDescription/ogImage`) con fallback a `global.seo`.

- **QA visual desktop + mobile** con Playwright MCP (screenshots en `.playwright-screens/`). En mobile se apila el layout en una columna (contenido del hero → mockup, luego beneficios, casos de uso, cifras, blog).

**Fuera de alcance (para otras specs):**

- **Formularios de cualquier tipo** (esta página no los tiene: ni el form del hero ni "Déjanos tus datos").
- **Sección "Preguntas frecuentes" (FAQ)** — se decidió no incluirla.
- **Enlazar la página desde el Header/Footer/menú** (la ruta existe en `/fiberlux-app`; el linking en la navegación se maneja en un spec de navegación aparte). Se documenta como pendiente.
- **Diseñar/producir el asset del mockup del celular y los deep-links reales a las tiendas** (se dejan como imagen placeholder y URLs placeholder editables en Tina).
- **Rediseñar** Header / Footer / maintenance / `Stats` / `BlogPreview`.
- **Cifras propias** en "¿Por qué Fiberlux?" e contenido propio en "Insights & Novedades" (se reusan del home).
- **Reutilizar directamente** los componentes `Beneficios`/`CasosDeUso` de servicios (consultan la colección `subservicio`); se crean equivalentes que leen `fiberluxApp` para no tocar la plantilla de nivel-2.

---

## Modelo de datos

Introduce **una colección nueva** (`fiberluxApp`, single-doc). Reusa sin modificar: `home.stats`, `home.blogPreview`, `global.seo`.

### Colección `fiberluxApp` (`tina/config.ts`)

```js
{
  name: "fiberluxApp",
  label: "Página Fiberlux App",
  path: "src/content/fiberlux-app",
  format: "json",
  ui: {
    router: () => `/fiberlux-app`,
    allowedActions: { create: false, delete: false }, // single-doc
  },
  fields: [
    // ── Hero ──
    { name: "hero", label: "Hero", type: "object", fields: [
      { name: "heading",     label: "Titular (H1)", type: "string" },              // "Fiberlux App"
      { name: "description",  label: "Descripción", type: "string", ui: { component: "textarea" } }, // "Obtén control total de tu red desde tu celular."
      { name: "note",         label: "Bajada en contenedor", type: "string", ui: { component: "textarea" } }, // "Potencia tu operatividad con visibilidad 24/7…"
      { name: "mockup",       label: "Mockup app (imagen celular)", type: "image" }, // placeholder por ahora
      { name: "downloads",    label: "Botones de descarga", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.label || "Descarga" }) },
        fields: [
          { name: "store", label: "Tienda", type: "string", options: ["appstore", "googleplay"] },
          { name: "label", label: "Texto", type: "string" }, // "Descárgala en el App Store"
          { name: "url",   label: "URL", type: "string" },   // placeholder "#"
        ]},
    ]},

    // ── "Beneficios" ──
    { name: "beneficios", label: "Beneficios", type: "object", fields: [
      { name: "title", label: "Título de sección", type: "string" }, // "Beneficios"
      { name: "items", label: "Cards", type: "object", list: true,
        ui: { itemProps: (i) => ({ label: i?.text || "Beneficio" }) },
        fields: [
          { name: "icon", label: "Ícono", type: "string", options: [ /* set fijo, ver §3 */ ] },
          { name: "text", label: "Texto", type: "string", ui: { component: "textarea" } },
        ]},
    ]},

    // ── "Casos de uso" ──
    { name: "casosDeUso", label: "Casos de uso", type: "object", fields: [
      { name: "eyebrow",   label: "Eyebrow", type: "string" },      // "[ CASOS DE USO ]"
      { name: "statement", label: "Statement", type: "rich-text" }, // palabras resaltadas con marca de énfasis
    ]},

    // ── "¿Por qué Fiberlux?" (reusa cifras del home; solo override de título) ──
    { name: "whyUsTitle", label: "Título '¿Por qué Fiberlux?'", type: "string" },

    // ── SEO / meta (cae a global.seo si vacío) ──
    { name: "seo", label: "SEO / Meta", type: "object", fields: [
      { name: "metaTitle",       label: "Meta título", type: "string" },
      { name: "metaDescription", label: "Meta descripción", type: "string", ui: { component: "textarea" } },
      { name: "ogImage",         label: "Imagen OG", type: "image" },
    ]},
  ],
}
```

### Set fijo de íconos de "Beneficios" (enum → react-icons)

Espeja el patrón de `subservicio`/`catalogo` (string `options` en Tina + `Record<string,glyph>` en el componente, `react-icons/fa6`). Set inicial alineado a las 3 líneas de la referencia: `monitoreo` (tiempo real), `sedes` (sedes operativas), `diagnostico` (diagnósticos avanzados). Fallback genérico para valores no mapeados.

### Contenido sembrado (`src/content/fiberlux-app/index.json`)

```jsonc
{
  "hero": {
    "heading": "Fiberlux App",
    "description": "Obtén control total de tu red desde tu celular.",
    "note": "Potencia tu operatividad con visibilidad 24/7 y gestión inteligente de tus servicios Fiberlux en un solo toque.",
    "mockup": "",
    "downloads": [
      { "store": "appstore",   "label": "Descárgala en el App Store", "url": "#" },
      { "store": "googleplay", "label": "Disponible en Google Play",  "url": "#" }
    ]
  },
  "beneficios": {
    "title": "Beneficios",
    "items": [
      { "icon": "monitoreo",   "text": "Monitorea el estado de todos tus servicios en tiempo real." },
      { "icon": "sedes",       "text": "Visualiza rápidamente cuántas sedes están operativas." },
      { "icon": "diagnostico", "text": "Accede a diagnósticos avanzados." }
    ]
  },
  "casosDeUso": {
    "eyebrow": "[ CASOS DE USO ]",
    "statement": { "type": "root", "children": [ /* "Para todas las empresas que deseen <em>monitorear el estado de sus servicios Fiberlux en tiempo real</em>." */ ] }
  },
  "whyUsTitle": "¿Por qué Fiberlux?",
  "seo": {
    "metaTitle": "Fiberlux App | Fiberlux Corp",
    "metaDescription": "Controla y monitorea tus servicios Fiberlux en tiempo real desde tu celular, con visibilidad 24/7 y gestión inteligente.",
    "ogImage": ""
  }
}
```

En `fiberlux-app.astro` el SEO se pasa a `BaseLayout`: `title={seo?.metaTitle || "Fiberlux App"}`, `description={seo?.metaDescription || global.seo.defaultDescription}`, `ogImage` cae a `global.seo.ogImage`.

---

## Plan de implementación

> Todo el trabajo vive en: nueva colección `fiberluxApp` (`tina/config.ts` + `src/content/fiberlux-app/index.json`), nuevos componentes en `src/components/fiberlux-app/`, y la ruta `src/pages/fiberlux-app.astro`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Crear la colección `fiberluxApp`** en `tina/config.ts` (single-doc, `ui.router`, `allowedActions` sin create/delete; campos hero/beneficios/casosDeUso/whyUsTitle/seo). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` aparece **Página Fiberlux App** con los campos nuevos.

2. **Sembrar el contenido** (`src/content/fiberlux-app/index.json`) con el copy de la referencia (titular, descripción, bajada, 3 beneficios, 1 caso de uso, botones de descarga con URL `#`, mockup vacío). *Test:* el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Hero `HeroFiberluxApp`** (patrón dual, sin form): columna izquierda (H1, descripción, caja de bajada, botones de descarga App Store/Play con ícono y URL editables); columna derecha con el `mockup` (o placeholder si vacío) sobre el gradiente magenta. Todo con `data-tina-field`. *Test:* compila; los botones enlazan a su `url`; sin breadcrumb ni form.

4. **Ruta estática** `src/pages/fiberlux-app.astro` con `BaseLayout` + `<HeroFiberluxApp>` + SEO. *Test:* `/fiberlux-app` carga el hero; el `<title>`/meta salen de `seo` (o fallback a `global.seo`).

5. **"Beneficios"** — `BeneficiosApp.astro` + `BeneficiosAppReact.tsx` con el mapa `icon→glyph` (react-icons). Grid de cards (ícono + texto). Montar bajo el hero. *Test:* render de las 3 cards editables; íconos correctos; valor no mapeado cae a fallback.

6. **"Casos de uso"** — `CasosDeUsoApp.astro` + `CasosDeUsoAppReact.tsx`: eyebrow + statement rich-text con la marca de resaltado renderizada (runtime de Tina). *Test:* el statement se renderiza con las palabras en énfasis; editar en Tina se refleja; render condicional si el nodo está vacío.

7. **"¿Por qué Fiberlux?"** — montar `<Stats title={whyUsTitle} />` (reuso). *Test:* barra magenta con las 4 cifras del home y el título de la página; el home sigue mostrando "Nuestra red en cifras".

8. **"Insights & Novedades"** — montar `<BlogPreview />`. *Test:* el slider de blog renderiza igual que en el home.

9. **QA visual desktop + mobile** con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar espaciados, gradiente del hero, caja de bajada, botones de descarga, grid de beneficios, statement de casos de uso, y el apilado mobile. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Orden de secciones en la página: **Hero → Beneficios → Casos de uso → ¿Por qué Fiberlux? → Insights & Novedades → Footer.** (Sin forms, sin FAQ.)
- Pasos 1–2 dejan schema y contenido listos; 3–4 levantan la página navegable; 5–8 ensamblan secciones (propias y reusadas) en el orden del diseño; 9 cierra con QA.

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] Existe la ruta `src/pages/fiberlux-app.astro` y `/fiberlux-app` renderiza, en orden: **Hero → Beneficios → Casos de uso → ¿Por qué Fiberlux? → Insights & Novedades → Footer**.
- [ ] Existe la colección single-doc `fiberluxApp` con `index.json` sembrado; en `/admin`, **Página Fiberlux App** edita el hero (H1, descripción, bajada, mockup, botones de descarga), las cards de Beneficios, el statement de Casos de uso, `whyUsTitle` y el SEO; los cambios se reflejan sin tocar código.
- [ ] El **hero** muestra H1 "Fiberlux App", la descripción, la **caja de bajada**, y los **botones de descarga** (App Store / Google Play) con su `url`; a la derecha el **mockup** (o placeholder si vacío). **No hay breadcrumb ni ningún formulario.**
- [ ] La página **no contiene ningún formulario** (ni en el hero ni sección "Déjanos tus datos").
- [ ] La sección **"Beneficios"** renderiza las 3 cards con ícono (set fijo enum→react-icons) + texto; un valor de ícono no mapeado cae a un glyph **fallback** sin romper el render.
- [ ] La sección **"Casos de uso"** renderiza el eyebrow `[ CASOS DE USO ]` y el **statement rich-text** con las palabras resaltadas en énfasis; es editable en Tina; si el nodo está vacío no rompe.
- [ ] **"¿Por qué Fiberlux?"** reusa `Stats` con las cifras del home y muestra `whyUsTitle`; el **home sigue mostrando "Nuestra red en cifras"** (override intacto).
- [ ] **"Insights & Novedades"** reusa `BlogPreview` (mismo contenido/slider que el home).
- [ ] La página define su **SEO/meta** editable (`seo.metaTitle/metaDescription/ogImage`); se emite en `<title>`, `<meta name="description">` y OG; si vacíos, caen al default de `global.seo`.
- [ ] En **desktop (~1440px)** el layout coincide con el diseño (hero de 2 columnas: contenido + mockup).
- [ ] En **mobile** el layout es el desktop **apilado en una columna** (contenido → mockup, beneficios, casos de uso, cifras, blog).
- [ ] No se modificaron `Stats`, `BlogPreview`, Header, Footer, maintenance, ni la plantilla de sub-servicio (`[subservicio].astro` y sus componentes).

---

## Decisiones

- **Sí:** **colección nueva single-doc `fiberluxApp`** (estilo `home`/`about`), no un documento en `subservicio`. Es una página única; el modelo de sub-servicio arrastra campos de formulario, breadcrumb y `solucionSlug` que no aplican. Mantiene el schema de nivel-2 limpio.
- **Sí:** **componentes propios** (`HeroFiberluxApp`, `BeneficiosApp`, `CasosDeUsoApp`) que leen `fiberluxApp`, en vez de reusar los de servicios (que consultan la colección `subservicio`). Evita acoplar y no arriesga la plantilla de sub-servicio ya implementada; el tratamiento visual se replica.
- **Sí:** **reusar** `Stats` (con título override) y `BlogPreview`. Fuente única de contenido; la página muestra las mismas cifras/blog que el home.
- **Sí:** **hero con mockup del celular** en la columna derecha (en lugar del form). Coherente con "control total de tu red desde tu celular"; campo de imagen editable con placeholder hasta tener el asset final.
- **Sí:** **botones de descarga App Store / Google Play** como CTA del hero (en lugar de "Solicitar cotización"). Es el llamado a la acción natural para una app; `url` editable con placeholder `#` hasta tener los enlaces reales.
- **No:** **sin FAQ** ni ninguna sección de formulario. La referencia no las incluye y el pedido es explícito ("sin forms").
- **Sí:** **"Beneficios" con íconos de set fijo** (enum → glyph react-icons), espejando `subservicio`/`catalogo`; fallback para valores no mapeados.
- **Sí:** **"Casos de uso" en rich-text** con marca de resaltado, para que el editor controle qué palabras van en énfasis magenta (mismo criterio que nivel-2).
- **Pendiente (fuera de alcance):** **linkear `/fiberlux-app` en Header/Footer**. La ruta existe y es navegable directamente; el enlace en la navegación se define en un spec de navegación aparte.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Reusar el patrón visual de servicios pero **sin la columna del form** deja el hero desbalanceado en desktop. | El mockup del celular ocupa la columna derecha; si el asset aún no existe, usar un placeholder con proporción de celular para validar el layout. QA visual tras el paso 3. |
| El **mockup vacío** (placeholder) renderiza un hueco o rompe el layout hasta subir el asset real. | Render condicional con placeholder de dimensiones fijas cuando `mockup` está vacío; documentar que debe subirse antes de publicar. |
| Las **URLs de descarga** quedan en `#` y se publican sin enlaces reales. | Marcar `url` como placeholder; criterio de completar antes de publicar; los botones siguen visibles y editables en Tina. |
| El **rich-text** de "Casos de uso" vacío (`{type:"root",children:[]}`) renderiza hueco o warning. | Render condicional (no pintar cuerpo si el nodo está vacío); QA con y sin contenido. |
| La **marca de resaltado** del statement no existe como estilo en el runtime rich-text de Tina y no se pinta en magenta. | Usar una marca soportada mapeada a la clase de énfasis en el render; QA visual. |
| Reusar `Stats`/`BlogPreview` **acopla** la página al contenido del home: editarlos allí cambia también esta página. | Decisión consciente (fuente única) registrada en Decisiones; si deben divergir, se separa en otra spec. |
| Nuevas **clases Tailwind** (gradiente magenta del hero, caja de bajada) fallan en dev por staleness del JIT (memoria del proyecto). | Reusar clases/tokens existentes del hero de servicios; reiniciar el dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |

---

## Qué **NO** entra en este spec

- Cualquier **formulario** en la página (ni hero ni "Déjanos tus datos").
- Sección **FAQ / Preguntas frecuentes**.
- **Enlazar** `/fiberlux-app` en Header / Footer / menú de navegación.
- **Producir** el asset final del mockup del celular y los **deep-links reales** a las tiendas (quedan como placeholders editables).
- **Rediseñar** Header / Footer / maintenance / `Stats` / `BlogPreview`.
- **Cifras/blog propios** por página (se reusan del home).
- **Modificar** la plantilla de sub-servicio (`[subservicio].astro` y sus componentes).

Cada uno de estos, si aterriza, va en su propio spec.
