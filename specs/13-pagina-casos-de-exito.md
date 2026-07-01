# SPEC 13 — Página "Casos de éxito" (`/casos-de-exito`)

> **Estado:** Implementado
> **Depende de:**
> - Reutiliza `BaseLayout` (Header + Footer + maintenance + Lenis).
> - Reutiliza el patrón de **hero oscuro con imagen de fondo** de SPEC 10/11 y el patrón de **carrusel drag+flechas** del `TestimonialSlider` compartido (mecánica, no su card).
> - Activa sin 404 el enlace **"Casos de éxito" → `/casos-de-exito`** que ya existe en el nav de `global`.
>
> **Fecha:** 2026-07-01
>
> **Objetivo:** Construir la ruta `/casos-de-exito` según los frames desktop y mobile de Figma — hero + un carrusel de **video-testimonios** (card de video con play → modal embebido, card de logo/cita y card de autor) — alimentado por una nueva colección `casosDeExito` editable desde TinaCMS.

---

## Alcance

**Dentro:**

- **Ruta `/casos-de-exito`.** Crear `src/pages/casos-de-exito/index.astro` que hereda `BaseLayout` y compone la página. Activa sin 404 el enlace "Casos de éxito" que ya existe en el nav de `global`.

- **Hero (patrón dual)** `src/components/casos-de-exito/HeroCasos.astro` + `HeroCasosReact.tsx`, tema oscuro con imagen de fondo (gradiente magenta), según el frame:
  - Breadcrumb `Inicio / Casos de éxito`, H1 "Casos de éxito", párrafo intro. Todo editable (`data-tina-field`).
  - Imagen de fondo del hero editable desde el CMS (con fallback).

- **Sección "Casos de éxito" (carrusel de video-testimonios)** `CasosSlider.astro` + `CasosSliderReact.tsx`:
  - Título de sección centrado ("Casos de éxito").
  - Carrusel horizontal con **flechas prev/next + drag con snap, sin autoplay** (mecánica del `TestimonialSlider` actual); slides siguientes asomando atenuados; honra `prefers-reduced-motion` en el scroll suave.
  - Cada slide = **card de video** (izquierda: poster + botón ▶ + badge "Casos de éxito con Fiberlux"), **card de logo + cita** (derecha arriba) y **card de autor** (derecha abajo: nombre + cargo en mayúsculas). En mobile se apila: video → cita → autor.
  - **Botón ▶ abre un modal/lightbox** que reproduce el video embebido: si el caso tiene URL de YouTube, `<iframe>`; si tiene mp4 auto-alojado, `<video>`. Cierre con botón, tecla `Esc` y clic en el backdrop; sin diálogos nativos del navegador.

- **Nueva colección `casosDeExito`** en `tina/config.ts` (documento único, `create/delete: false`) + `src/content/casos-de-exito/index.json`: contenido del hero (breadcrumb, H1, intro, imagen de fondo), título de la sección, y `items[]` de casos (poster, fuente de video YouTube **o** mp4, logo, cita, nombre de autor, cargo).

- **Sembrado de contenido:** el caso **"Browsi Gálvez / Cámara de Comercio e Industria de Arequipa"** 1:1 contra la referencia + 2 casos placeholder marcados (los slides atenuados del diseño).

- **SEO/meta** de la página con fallback a `global.seo` (mismo patrón que specs previas).

- **QA visual** contra `references/casos-de-exito.jpg` (desktop ~1440px) y `references/casos-de-exito-mob.jpg` (mobile) con Playwright MCP (screenshots en `.playwright-screens/`).

**Fuera de alcance (para futuras specs):**

- **Reusar o modificar el `TestimonialSlider`/`TestimonialCard` del home** — su card (foto + marco SVG, sin video) es otro diseño; solo se copia la mecánica de scroll/drag, no el componente.
- **Página de detalle por caso** (`/casos-de-exito/[slug]`) — el diseño solo tiene la landing con carrusel.
- **Filtros/categorías** de casos (por industria, solución, etc.).
- **Consentimiento de cookies del embed de YouTube** (banner/privacy-mode) más allá de usar `youtube-nocookie` si aplica.
- **Rediseñar** Header / Footer / maintenance / Lenis.
- **Autoplay del carrusel** (se descartó en Fase 2).

---

## Modelo de datos

Introduce **una colección nueva** (`casosDeExito`, documento único). No reutiliza `home.testimonials` (diseño distinto). El poster es siempre una imagen subida (sirve tanto para YouTube como para mp4).

### 1. Colección `casosDeExito` en `tina/config.ts` (documento único)

```js
{
  name: "casosDeExito",
  label: "Casos de éxito (página)",
  path: "src/content/casos-de-exito",
  format: "json",
  ui: { allowedActions: { create: false, delete: false } },
  fields: [
    // ── Hero ──
    { name: "breadcrumb", label: "Breadcrumb", type: "string" },          // "Casos de éxito"
    { name: "heading",    label: "Título (H1)", type: "string" },          // "Casos de éxito"
    { name: "intro",      label: "Párrafo intro", type: "string", ui: { component: "textarea" } },
    { name: "heroImage",  label: "Imagen de fondo del hero", type: "image" },

    // ── Sección carrusel ──
    { name: "sectionTitle", label: "Título de la sección", type: "string" }, // "Casos de éxito"
    { name: "items", label: "Casos", type: "object", list: true,
      ui: { itemProps: (i) => ({ label: i?.author || "Caso de éxito" }) },
      fields: [
        { name: "poster",     label: "Poster del video (imagen)", type: "image" },
        { name: "youtubeUrl", label: "URL de YouTube (opcional)", type: "string" },     // si está, se embebe iframe
        { name: "videoFile",  label: "Video mp4 auto-alojado (opcional)", type: "image" }, // media de Tina; si no hay youtubeUrl, se usa <video>
        { name: "logo",       label: "Logo del cliente", type: "image" },
        { name: "quote",      label: "Cita / testimonio", type: "string", ui: { component: "textarea" } },
        { name: "author",     label: "Nombre del autor", type: "string" },  // "Browsi Gálvez"
        { name: "role",       label: "Cargo (mayúsculas)", type: "string" }, // "Gerente general de Cámara de Comercio e Industria"
        { name: "badge",      label: "Texto del badge", type: "string" },    // "Casos de éxito con Fiberlux"
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

**Regla de reproducción del modal:** por caso, `youtubeUrl` tiene prioridad → `<iframe>` embebido; si está vacío y hay `videoFile` → `<video controls>` auto-alojado; si no hay ninguno, la card muestra el poster sin botón ▶ (o ▶ deshabilitado).

### 2. Contenido sembrado `src/content/casos-de-exito/index.json`

```jsonc
{
  "breadcrumb": "Casos de éxito",
  "heading": "Casos de éxito",
  "intro": "Descubre cómo hemos ayudado a nuestros clientes cubriendo sus necesidades en conectividad, seguridad y comunicación a través de soluciones de Transformación Digital.",
  "heroImage": "/uploads/casos-hero.jpg",
  "sectionTitle": "Casos de éxito",
  "items": [
    {
      "poster": "/uploads/casos/browsi-galvez-poster.jpg",
      "youtubeUrl": "",                                  // placeholder: pega la URL real del video
      "videoFile": "",
      "logo": "/uploads/casos/camara-arequipa-logo.png",
      "quote": "La pandemia nos trajo un cambio en la forma de trabajar y las reuniones virtuales se volvieron esenciales. Fiberlux ha sido un pilar en esa transición y en fortalecer nuestro vínculo con los empresarios arequipeños.",
      "author": "Browsi Gálvez",
      "role": "Gerente general de Cámara de Comercio e Industria",
      "badge": "Casos de éxito con Fiberlux"
    }
    // + 2 casos placeholder (poster/logo/quote/author marcados como pendientes)
  ],
  "seo": {
    "metaTitle": "Casos de éxito | Fiberlux Corp",
    "metaDescription": "Conoce cómo empresas líderes potencian su conectividad, seguridad y comunicación con las soluciones de Fiberlux.",
    "ogImage": ""
  }
}
```

En `index.astro` el SEO se pasa a `BaseLayout`: `title={seo?.metaTitle || heading}`, `description={seo?.metaDescription || global.seo.defaultDescription}`, `ogImage` cae a `global.seo.ogImage`.

**Notas del modelo:**

- **`videoFile` con `type: "image"`** — en Tina el campo `image` es el picker de media y acepta subir mp4; la etiqueta ("Video mp4 auto-alojado") y su descripción lo aclaran. El render valida la extensión antes de usar `<video>`.
- Los **assets** (`heroImage`, `poster`, `logo`) van a `public/uploads/`. El sembrado deja rutas placeholder; los reales se suben en el CMS.

---

## Plan de implementación

> Todo el trabajo vive en: nueva colección `casosDeExito` (`tina/config.ts` + `src/content/casos-de-exito/index.json`), nuevos componentes en `src/components/casos-de-exito/`, y la página `src/pages/casos-de-exito/index.astro`. Cada paso deja el proyecto ejecutable (`npm run dev` / `npm run build`) y es commiteable por separado.

1. **Crear la colección `casosDeExito`** en `tina/config.ts` (documento único, `create/delete: false`) con los campos del Modelo de datos (hero + `sectionTitle` + `items[]` + `seo`). Regenerar el cliente Tina. *Test:* `npm run dev` levanta sin errores; en `/admin` aparece **Casos de éxito (página)** con todos los campos editables.

2. **Sembrar `src/content/casos-de-exito/index.json`** con el hero + el caso "Browsi Gálvez" 1:1 + 2 casos placeholder marcados. *Test:* el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Hero (patrón dual)** — `HeroCasos.astro` (resuelve `casosDeExito` vía `client`, pasa `{query, variables, data}`) + `HeroCasosReact.tsx` (envuelve en `useTina`; breadcrumb + H1 + intro + imagen de fondo, con `data-tina-field`). *Test:* compila; aún no enlazado a la ruta.

4. **Ruta `/casos-de-exito`** — `src/pages/casos-de-exito/index.astro` con `BaseLayout` + `<HeroCasos />` + SEO. *Test:* `/casos-de-exito` carga con el hero oscuro (breadcrumb, H1, intro, fondo); el enlace "Casos de éxito" del header ya no da 404.

5. **Card de video-testimonio + modal** — dentro de `CasosSliderReact.tsx` (o un `CasoCard.tsx` auxiliar): maqueta la card (video izquierda con poster + ▶ + badge, cita derecha-arriba con logo + ícono de comillas, autor derecha-abajo) y el **modal** (iframe YouTube o `<video>` mp4 según el caso; cierre con botón, `Esc` y backdrop; foco atrapado; sin diálogos nativos). *Test:* con un caso de prueba, ▶ abre el modal con el video correcto y cierra por las 3 vías; `Esc` funciona; no hay scroll-lock roto.

6. **Carrusel `CasosSlider`** — `CasosSlider.astro` + `CasosSliderReact.tsx`: título de sección + carrusel drag+snap con flechas prev/next (mecánica del `TestimonialSlider`), slides asomando atenuados, honra `prefers-reduced-motion`. Renderiza los `items` con la card del paso 5. Montar bajo el hero en `index.astro`. *Test:* se ven las cards; flechas y drag navegan; el estado disabled de las flechas es correcto en extremos; mobile apila video → cita → autor.

7. **QA visual desktop + mobile.** Comparar `/casos-de-exito` contra `references/casos-de-exito.jpg` (~1440px) y `references/casos-de-exito-mob.jpg` con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar hero (gradiente/fondo, espaciados), grid de la card (video + cita + autor), badge, botón ▶, flechas y el apilado mobile hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Pasos 1–2 dejan schema y contenido listos; 3–4 levantan la página navegable con el hero; 5–6 construyen la card, el modal y el carrusel; 7 cierra con QA.
- Orden de secciones en la página: **Hero → Casos de éxito (carrusel) → Footer.**
- Los casos placeholder se sirven de la misma card; su QA fino queda para cuando su copy/video estén completos (Browsi Gálvez es la referencia de validación).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] La ruta `/casos-de-exito` carga y renderiza, en orden: **hero**, **sección "Casos de éxito" (carrusel)** y el **Footer** existente.
- [ ] El enlace **"Casos de éxito"** del header navega a `/casos-de-exito` sin 404.
- [ ] El hero muestra breadcrumb `Inicio / Casos de éxito`, el H1 "Casos de éxito", el párrafo intro y la **imagen de fondo** editable (con fallback si está vacía).
- [ ] En `/admin` existe la colección **Casos de éxito (página)** con el hero (breadcrumb, H1, intro, imagen), el título de sección, la lista de **casos** (poster, YouTube/mp4, logo, cita, autor, cargo, badge) y el bloque **SEO**; editar cualquiera se refleja en la página sin tocar código.
- [ ] Cada slide renderiza la **card de video** (poster + botón ▶ + badge "Casos de éxito con Fiberlux"), la **card de logo + cita** y la **card de autor** (nombre + cargo en mayúsculas).
- [ ] El botón **▶ abre un modal** que reproduce el video: `<iframe>` si el caso tiene `youtubeUrl`, `<video>` si tiene mp4 auto-alojado; el modal cierra con **botón, tecla `Esc` y clic en el backdrop**; no dispara diálogos nativos del navegador.
- [ ] Un caso **sin `youtubeUrl` ni `videoFile`** no rompe el render: muestra el poster con el ▶ deshabilitado (o sin ▶).
- [ ] El carrusel navega con **flechas prev/next y drag con snap**; **no** hace autoplay; las flechas quedan **deshabilitadas** en los extremos; el drag no dispara un clic falso al soltar.
- [ ] El carrusel honra **`prefers-reduced-motion`** (sin scroll animado brusco).
- [ ] En **mobile** cada caso se **apila** en una columna: video → cita → autor, con las flechas debajo (según `references/casos-de-exito-mob.jpg`).
- [ ] La página define **SEO/meta** editable (`seo.metaTitle/metaDescription/ogImage`) emitido en `<title>`, `<meta name="description">` y OG; si vacíos, cae al default de `global.seo`.
- [ ] En **desktop (~1440px)** el layout coincide con `references/casos-de-exito.jpg`.
- [ ] No se modificaron `TestimonialSlider`, `TestimonialCard`, Header, Footer, maintenance ni otras páginas.

---

## Decisiones

- **Sí:** **página nueva `/casos-de-exito`** con `BaseLayout`, activando el enlace del nav que hoy da 404. El editor lo eligió; el header ya apunta ahí.
- **Sí:** **componente y colección propios** (`CasosSlider` + `casosDeExito`), **no** reusar `TestimonialSlider`/`home.testimonials`. El diseño es un video-testimonio (video + logo/cita + autor), distinto de la card actual (foto + marco SVG, sin video); mezclarlos acoplaría dos páginas y dos diseños. Se copia solo la **mecánica** de drag/scroll, no el componente.
- **Sí:** **modal/lightbox embebido** para reproducir el video (Fase 2). Mantiene al usuario en el sitio; estándar para casos de éxito en video. Descartado abrir en pestaña nueva (saca al usuario) y reproductor inline (complica el layout del carrusel).
- **Sí:** **soportar YouTube _o_ mp4 auto-alojado por caso** (Fase 2), con `youtubeUrl` como prioridad y `videoFile` como fallback. Da flexibilidad sin forzar una sola fuente; el modal decide el elemento (`iframe` vs `video`).
- **Sí:** **poster subido por caso** (imagen), no derivado de YouTube. Sirve igual para mp4, garantiza el thumbnail del diseño y evita depender del formato de miniatura de YouTube.
- **Sí:** **colección single-doc con `items[]`** (Fase 2), patrón de la página `servicios`. El contenido es una sola landing con una lista corta de casos; multi-doc añadiría overhead sin necesidad (no hay rutas de detalle).
- **Sí:** **carrusel manual (flechas + drag, sin autoplay)** (Fase 2). El diseño muestra navegación manual; evita mover video-cards automáticamente y respeta mejor `prefers-reduced-motion`.
- **Sí:** **sembrar 1 caso real (Browsi Gálvez) + 2 placeholder**. Valida la card 1:1 contra la única referencia visual sin bloquear en copy/video inexistentes; los placeholders reproducen los slides atenuados del diseño.
- **No:** **página de detalle por caso, filtros/categorías**. El diseño no los incluye; irían en su propia spec.
- **No:** **banner de consentimiento de cookies del embed**. Fuera de alcance; se puede usar `youtube-nocookie` como mitigación mínima sin construir un gestor de consentimiento.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El **modal de video** dispara un diálogo nativo o rompe el scroll-lock del body (queda bloqueado al cerrar). | Modal con overlay propio (no `alert/confirm`); bloquear/restaurar `overflow` del body en open/close; cierre por botón, `Esc` y backdrop; QA de apertura/cierre repetida. |
| El **drag del carrusel** dispara un clic falso que abre el modal al soltar. | Reusar el guard `hasDragged` del `TestimonialSlider` (umbral de px + `onClickCapture` que cancela el clic tras arrastrar). Test explícito en el criterio de aceptación. |
| **`videoFile` con `type: "image"`** confunde al editor (etiqueta "image" para subir un mp4). | Etiqueta y descripción claras en Tina ("Video mp4 auto-alojado"); documentar en la nota del campo; el render valida la extensión antes de usar `<video>`. |
| Un caso **sin video** (placeholder) renderiza un ▶ que abre un modal vacío. | Render condicional: sin `youtubeUrl` ni `videoFile`, ▶ deshabilitado o ausente; criterio de aceptación explícito. |
| El **embed de YouTube** setea cookies de terceros sin consentimiento. | Usar `youtube-nocookie.com` como mitigación mínima; el gestor de consentimiento completo queda fuera de alcance (documentado). |
| Nuevas **clases Tailwind** (gradiente del hero, atenuado de slides, badge) fallan en dev por staleness del JIT (memoria del proyecto). | Usar tokens/clases existentes de `global.css` o estilos inline; reiniciar el dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |
| El **carrusel** con cards anchas (video + cita + autor) desborda u obliga scroll horizontal de página en breakpoints intermedios. | Contenedor con `overflow-x` propio del carrusel (no del body); QA en ~768px además de desktop/mobile. |
| Las **rutas de assets placeholder** del sembrado quedan en 404 hasta que se suban los reales. | Documentar que poster/logo/heroImage reales se suben en el CMS; fallback visual (fondo sólido / sin logo) para no romper el layout. |

---

## Qué **NO** entra en este spec

- Reusar o modificar el `TestimonialSlider`/`TestimonialCard` del home (solo se copia la mecánica de scroll/drag).
- Página de detalle por caso (`/casos-de-exito/[slug]`) y filtros/categorías.
- Gestor de consentimiento de cookies para el embed de YouTube (más allá de `youtube-nocookie`).
- Autoplay del carrusel.
- Rediseñar Header / Footer / maintenance / Lenis.

Cada uno de estos, si aterriza, va en su propio spec.

---

## Notas de implementación (2026-07-01)

Implementado en la rama `spec-13-pagina-casos-de-exito`. Verificación funcional y visual con el dev server en modo local + Playwright MCP (desktop 1440px y mobile 400px), screenshots en `.playwright-screens/`.

- **`npm run build` completo:** el paso `tinacms build` requiere credenciales de TinaCloud (`clientId`/`token`), no disponibles en modo local — misma limitación de entorno que todas las specs previas; corre en el entorno de deploy. La verificación local se hizo vía dev server (todas las rutas responden 200, sin regresiones) y compilación del grafo de componentes.
- **SEO `ogImage`:** `BaseLayout` hoy solo emite `<title>` y `<meta name="description">`; **no** emite etiquetas Open Graph. El campo `seo.ogImage` queda modelado y editable pero no se renderiza, porque cablear OG en `BaseLayout` está fuera del alcance de esta spec ("no rediseñar BaseLayout"). Pendiente para una spec de SEO transversal.
- **Assets:** el contenido se sembró con `poster`/`logo`/`heroImage` vacíos (fallbacks: hero magenta de servicios, panel oscuro en la card). Los reales se suben desde el CMS. El caso "Browsi Gálvez" quedó sin `youtubeUrl` (se pega la URL real en el CMS); el modal se validó en QA con una URL temporal y luego se revirtió.
