# SPEC 15 — Blog: poblado de contenido, portadas desde Figma y QA visual

> **Estado:** Implementado
> **Depende de:**
> - Reutiliza la colección `post` y su schema (`tina/config.ts`), sin cambios de estructura.
> - Reutiliza los componentes del blog: `BlogGrid` / `BlogGridCard` (listado), `BlogHero` / `BlogCard` (carrusel del hero), `BlogPreview` / `BlogPreviewReact` (Insights del home), `BlogDetailReact` (detalle).
> - QA visual contra `references/blog-desktop.jpg` y `references/blog-mobile.jpg` con Playwright MCP (screenshots en `.playwright-screens/`).
> - Extracción de assets del Figma vía Figma MCP (frame Insights `1574-8819`).
>
> **Fecha:** 2026-07-01
>
> **Objetivo:** Sembrar ~9 posts nuevos en español (total 12) con portadas reales extraídas del Figma repartidas cíclicamente, y hacer QA visual de las tarjetas en las cuatro superficies que las renderizan (listado `/blog`, hero-carrusel, Insights del home y detalle) contra las referencias desktop/mobile, ajustando estilos de las tarjetas donde no calcen — sin rediseñar layout ni tocar el schema.

---

## Alcance

**Dentro:**

- **Sembrar ~9 posts nuevos** en `src/content/blog/` (MDX), para un total de **12**. Copy real en español, temas Fiberlux (conectividad empresarial, ciberseguridad, cloud, data center, telefonía IP/MVNO, redes, ISPs). Cada post con frontmatter completo: `title`, `excerpt`, `coverImage`, `date`, `readTime`, `tags` (solo de la lista del schema), `featured`, y `body` con 2–4 secciones.

- **Distribución de datos para que el grid se vea variado:** títulos, fechas (repartidas en varios meses), `readTime` y `tags` distintos entre posts; **3–4 posts marcados `featured: true`** para poblar el carrusel del hero y el de Insights del home.

- **Extraer el set de portadas del Figma** (frame Insights `1574-8819`): las ilustraciones `Guide`, `Cloud`, `AiCover` (AI), `5G` y la foto Unsplash. Guardarlas en `public/images/blog/` y asignarlas **cíclicamente** a los 12 posts (`coverImage`), de modo que ninguna tarjeta contigua repita portada.

- **QA visual + ajustes** en las 4 superficies que renderizan tarjetas, contra las referencias:
  - **Listado `/blog`** — `BlogGrid` + `BlogGridCard` (grid 3 col, pills de tag, título, meta readTime/fecha, separador, paginación, filtros) vs `references/blog-desktop.jpg` y `blog-mobile.jpg`.
  - **Hero-carrusel de `/blog`** — `BlogHero` + `BlogCard` (tarjeta ancha destacada, breadcrumb, flechas).
  - **Insights del home** — `BlogPreview` / `BlogPreviewReact` vs el frame `1574-8819`.
  - **Detalle** — `BlogDetailReact` (portada, cuerpo, posts relacionados renderizan con las nuevas portadas/tags).

- **Ajustes de estilo permitidos** (latitud confirmada): padding, tamaños de fuente, colores/estilo de pills, orden y color de la meta, `aspect-ratio` de la imagen, espaciados del grid — para calzar con el Figma. Sin rediseñar la estructura.

- **Screenshots de QA** en `.playwright-screens/` (desktop ~1440px y mobile ~400px) como evidencia antes/después de los ajustes.

**Fuera de alcance (para futuras specs):**

- **Cambiar el schema `post`** o la colección (no se agregan/renombran campos; autor, categorías nuevas, etc. van en otra spec).
- **Rediseñar la estructura** de `BlogGrid` / `BlogHero` / `BlogPreview` / detalle, cambiar el patrón dual `.astro` + `React`, o tocar Header/Footer/maintenance/Lenis.
- **Nuevas etiquetas** fuera de la lista actual del schema.
- **Redacción SEO por post** (meta OG por artículo); se mantiene el fallback actual.
- **Funcionalidad nueva** del listado (búsqueda por texto, orden configurable, posts por página, tags dinámicos desde CMS).
- **Reemplazar `cellphone.png`** o migrar las portadas a assets subidos desde el CMS: se dejan como archivos en `public/images/blog/`.
- **Traducir/reescribir** los 3 posts existentes (se conservan; a lo sumo se les reasigna `coverImage` para variar el grid).

---

## Modelo de datos

**Esta feature no introduce estructuras de datos nuevas.** Reutiliza el schema `post` (`tina/config.ts`, `src/content/blog/*.mdx`) tal cual. Lo que cambia es **contenido** (más documentos) y **assets** (portadas). Se documenta la forma concreta de lo sembrado.

### 1. Frontmatter de cada post (schema `post` existente)

```yaml
---
title: 'string'            # título del artículo
excerpt: 'string'          # 1–2 frases; se usa como description del detalle
coverImage: /images/blog/<archivo>   # portada extraída del Figma (ver §3)
date: 2026-MM-DDT00:00:00.000Z        # repartidas en varios meses
readTime: 'N min'          # variado entre posts
tags: [ ... ]              # SOLO de la lista del schema (ver abajo)
featured: true | false     # 3–4 en true para los carruseles
---
# body: MDX con 2–4 secciones (## H2 + párrafos + alguna lista)
```

**Tags permitidos** (los del schema, no se agregan nuevos): `Redes`, `Big data`, `Centro de datos`, `Ciberseguridad`, `Cloud`, `Conectividad`, `Internet`, `ISPs`, `SaaS`.

### 2. Inventario de los 12 posts (3 actuales + ~9 nuevos)

- **Actuales (3):** `ciberseguridad-tendencias-2025`, `mvno-guide-businesses`, `telefonia-ip-comunicacion`. Se conservan; solo se les puede reasignar `coverImage` para variar el grid.
- **Nuevos (~9)** — un `.mdx` por post, slug kebab-case, ejemplos de temática:
  - `sd-wan-conectividad-empresarial` — Conectividad, Redes
  - `data-center-continuidad-negocio` — Centro de datos, Cloud
  - `cloud-hibrido-empresas-peru` — Cloud, Conectividad
  - `zero-trust-seguridad-corporativa` — Ciberseguridad, Redes
  - `fibra-oscura-vs-fibra-iluminada` — Conectividad, Internet
  - `sla-internet-dedicado-empresas` — Internet, ISPs
  - `big-data-decisiones-empresariales` — Big data, SaaS
  - `respaldo-enlaces-redundancia` — Redes, Conectividad
  - `saas-productividad-equipos` — SaaS, Cloud

> Títulos y cuerpos finales se redactan en implementación; la tabla fija tema, slug y tags para que el grid tenga variedad real.

### 3. Assets de portada y asignación cíclica

Archivos extraídos del Figma (frame `1574-8819`) a `public/images/blog/`:

```
/images/blog/cover-guide.svg      # ilustración "Guide"
/images/blog/cover-cloud.svg      # ilustración "Cloud"
/images/blog/cover-ai.svg         # ilustración "AiCover"
/images/blog/cover-5g.svg         # ilustración "5G"
/images/blog/cover-photo.jpg      # foto Unsplash (Da Nang)
```

- **Ilustraciones → SVG** (nítidas y livianas); la **foto → JPG**. Formato final según lo que exporte el Figma MCP (`download_assets`); si un SVG sale demasiado pesado o no renderiza limpio, se exporta ese como PNG.
- **Asignación cíclica:** recorrer los 12 posts asignando `cover-guide → cover-cloud → cover-ai → cover-5g → cover-photo → (repite)`, verificando que **dos tarjetas contiguas en el grid no repitan** portada.
- `cellphone.png` se conserva en disco; deja de ser la portada por defecto de todos (se reasignan).

**Convenciones:**

- Origen de assets: `public/images/blog/` (convención existente); rutas absolutas desde `/`.
- Fechas en ISO con `T00:00:00.000Z` (igual que los posts actuales); ordenadas para que el grid y el carrusel muestren mezcla de portadas.

---

## Plan de implementación

> Todo el trabajo vive en: nuevos `.mdx` en `src/content/blog/`, assets en `public/images/blog/`, reasignación de `coverImage` en los 3 posts actuales, y ajustes de estilo acotados en `BlogGridCard` / `BlogGrid` / `BlogHero` / `BlogCard` / `BlogPreviewReact` / `BlogDetailReact`. Cada paso deja el proyecto ejecutable (`npm run dev`) y es commiteable por separado.

1. **Extraer las portadas del Figma.** Con Figma MCP (`download_assets` sobre los nodos de portada del frame `1574-8819`: `Guide`, `Cloud`, `AiCover`, `5G` y la foto), guardar en `public/images/blog/` como `cover-guide.svg`, `cover-cloud.svg`, `cover-ai.svg`, `cover-5g.svg`, `cover-photo.jpg`. *Test:* los 5 archivos existen y abren; cada uno se ve nítido en el navegador (`/images/blog/cover-*.svg`).

2. **Sembrar los ~9 posts nuevos** en `src/content/blog/` (uno por slug del inventario), con frontmatter completo (title, excerpt, coverImage cíclico, date repartida, readTime variado, tags del schema, featured en 3–4) y cuerpo MDX de 2–4 secciones. *Test:* `npm run dev` levanta sin warnings de Tina; `/blog` muestra 12 tarjetas (9 en página 1 + 3 en página 2) con portadas variadas y sin repetición contigua.

3. **Reasignar `coverImage` de los 3 posts actuales** a portadas del set nuevo para completar el patrón cíclico. *Test:* ninguna tarjeta del grid usa ya `cellphone.png`; el grid alterna portadas.

4. **QA visual del listado `/blog` (desktop + mobile).** Screenshots con Playwright MCP a `.playwright-screens/`; comparar `BlogGridCard`/`BlogGrid` (pills, título, meta, separador, `aspect-ratio`, gaps, filtros, paginación) contra `references/blog-desktop.jpg` y `blog-mobile.jpg`. Aplicar solo ajustes de estilo permitidos hasta calzar. *Test:* screenshot antes/después guardado; el grid coincide con la referencia en ambos breakpoints.

5. **QA visual del hero-carrusel de `/blog`.** Revisar `BlogHero` + `BlogCard` (tarjeta ancha destacada, breadcrumb, flechas, sangrado a la derecha) con los nuevos posts `featured`. Ajustes de estilo si hace falta. *Test:* el carrusel muestra los destacados con sus portadas; coincide con la zona superior de `blog-desktop.jpg` / `blog-mobile.jpg`.

6. **QA visual de Insights del home.** Revisar `BlogPreview` / `BlogPreviewReact` contra el frame `1574-8819` (tarjeta grande + lista lateral, tag, readTime, fecha). Ajustes de estilo acotados si difiere. *Test:* la sección Insights del home usa las nuevas portadas y coincide con el frame.

7. **QA visual del detalle.** Abrir 2–3 posts (`/blog/<slug>`): portada, cuerpo MDX y **posts relacionados** (que ahora tienen variedad de tags y portadas). *Test:* el detalle renderiza portada + cuerpo; el bloque de relacionados muestra 3 posts con portadas distintas y tags coherentes.

8. **Cierre y build.** Correr `astro build` desde la raíz; revisar consola sin errores/warnings nuevos. *Test:* build termina; las 12 rutas `/blog/<slug>` se generan estáticas.

**Notas del plan:**

- Pasos 1–3 dejan el contenido y assets listos (el grueso del pedido); 4–7 son el QA por superficie; 8 cierra.
- Los ajustes de estilo se mantienen acotados a lo listado en el Alcance; si el QA revela algo estructural, se anota como hallazgo para otra spec en vez de rediseñar aquí.
- El QA aprovecha que las 4 superficies leen de la misma colección `post`, así que el sembrado (pasos 2–3) las alimenta a todas antes del QA.

---

## Criterios de aceptación

- [ ] `npm run dev` y `astro build` terminan sin errores ni warnings nuevos en consola.
- [ ] Existen **12 posts** en `src/content/blog/` (3 actuales + ~9 nuevos), cada uno con frontmatter válido: `title`, `excerpt`, `coverImage`, `date`, `readTime`, `tags`, `featured` y `body`.
- [ ] Todos los `tags` usados pertenecen a la lista del schema (`Redes`, `Big data`, `Centro de datos`, `Ciberseguridad`, `Cloud`, `Conectividad`, `Internet`, `ISPs`, `SaaS`); no se agregó ninguno nuevo.
- [ ] El cuerpo de cada post nuevo está en **español** y tiene **2–4 secciones** (H2 + párrafos, alguna lista).
- [ ] Existen los 5 assets de portada en `public/images/blog/` (`cover-guide`, `cover-cloud`, `cover-ai`, `cover-5g`, `cover-photo`), extraídos del Figma, y cada uno se ve nítido.
- [ ] Cada post tiene `coverImage` asignada del set nuevo; **ninguna tarjeta del grid usa ya `cellphone.png`**.
- [ ] En el grid de `/blog`, **dos tarjetas contiguas no repiten** la misma portada.
- [ ] `/blog` muestra **9 tarjetas en la página 1** y las restantes en la **página 2**; la paginación navega entre ambas.
- [ ] Los filtros por tag funcionan: al elegir un tag, el grid muestra solo posts con ese tag; los tags visibles cubren la variedad sembrada.
- [ ] **3–4 posts** tienen `featured: true` y aparecen en el **carrusel del hero de `/blog`** y en el **carrusel Insights del home**.
- [ ] `BlogGridCard` coincide con `references/blog-desktop.jpg` y `blog-mobile.jpg` en pills de tag, título (truncado), meta (readTime + fecha), separador y `aspect-ratio` de la imagen.
- [ ] El **hero-carrusel de `/blog`** (tarjeta ancha, breadcrumb, flechas) coincide con la zona superior de las referencias en desktop y mobile.
- [ ] La sección **Insights del home** coincide con el frame Figma `1574-8819` (tarjeta grande + lista lateral, tag, readTime, fecha) usando las nuevas portadas.
- [ ] El **detalle** de un post renderiza portada + cuerpo, y el bloque de **posts relacionados** muestra 3 posts con portadas distintas y tags coherentes.
- [ ] Hay screenshots de QA en `.playwright-screens/` para desktop (~1440px) y mobile (~400px) del listado y del home.
- [ ] No se modificó el schema `post`, el patrón dual `.astro` + `React`, ni Header/Footer/maintenance/Lenis.

---

## Decisiones

- **Sí:** **sembrar 12 posts** (3 + ~9). Llena la página 1 del grid (9) y arranca la paginación (página 2), que es justo lo que el usuario pidió: "más items para visualizar mejor". Descartado 9 (no ejercita paginación) y 18 (más copy que redactar/mantener sin aportar QA extra).
- **Sí:** **copy real en español, temática Fiberlux** (conectividad, ciberseguridad, cloud, data center, MVNO/IP, redes, ISPs). Coherente con los 3 posts actuales y con la marca. Descartado reusar los títulos en inglés del Figma (OSS/BSS, 5G rollouts, AI agents): son mockup genérico, no el dominio de Fiberlux.
- **Sí:** **extraer el set de portadas del Figma** (`Guide`, `Cloud`, `AiCover`, `5G`, foto) y **repartir cíclico**. Da variedad visual real al grid con assets ya diseñados, sin inventar imágenes. Descartada una sola imagen de malla morada (todas las tarjetas iguales, se ve pobre) y un mix con fotos nuevas (más decisiones sin necesidad).
- **Sí:** **ilustraciones como SVG, foto como JPG.** SVG es nítido y liviano para las ilustraciones; la foto va en raster. Fallback a PNG si un SVG no exporta limpio.
- **Sí:** **assets en `public/images/blog/`** (convención existente, junto a `cellphone.png`), rutas absolutas. Descartado subirlas por el CMS ahora: son assets de diseño fijos, no contenido que el editor cambie seguido.
- **Sí:** **reasignar `coverImage` de los 3 posts actuales** para completar el patrón cíclico. Evita que `cellphone.png` rompa la variedad del grid. No se reescribe su cuerpo ni sus tags.
- **Sí:** **QA en las 4 superficies que renderizan tarjetas** (listado, hero-carrusel, Insights del home, detalle). El usuario las marcó todas; y como leen de la misma colección `post`, el sembrado las alimenta a la vez.
- **Sí:** **latitud de ajustes de estilo acotada** (padding, tipografía, pills, meta, aspect-ratio, gaps). Permite calzar con el Figma sin abrir un rediseño. Descartado "solo reporte de hallazgos": el usuario pidió que el blog "se vea bien", no solo diagnosticarlo.
- **No:** **tocar el schema `post` / agregar tags / campos nuevos.** Fuera de alcance; el schema actual cubre todo lo necesario. Si aparece la necesidad (autor, categoría), va en su propia spec.
- **No:** **funcionalidad nueva del listado** (búsqueda, orden configurable, tags desde CMS, posts por página). No lo pidió el usuario; mantiene la spec contenida en contenido + visual.
- **Sí:** **screenshots de QA en `.playwright-screens/`** (memoria del proyecto), antes/después, como evidencia del QA visual.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Las portadas del Figma son **grupos de vectores** (SVG con cientos de nodos); `download_assets` podría exportarlas pesadas o mal recortadas. | Exportar cada portada como su propio SVG desde el nodo contenedor; si un SVG sale >~150 KB o se ve sucio, exportar ese como **PNG @2x**. Verificar cada archivo en el navegador (paso 1) antes de asignarlo. |
| La **foto Unsplash** del frame puede no ser descargable como asset (licencia / no embebida como fill exportable). | Si la foto no se extrae limpia, usar solo las 4 ilustraciones en el ciclo (el patrón cíclico sigue funcionando con 4). Documentar en las notas de implementación. |
| **SVG como `coverImage`** en un `type: image` de Tina: el CMS o el `<img>` podría no previsualizar bien el SVG. | El render usa `<img src={coverImage}>`, que soporta SVG. Si el panel de Tina no lo previsualiza, es solo cosmético del admin; la web renderiza igual. Validar en paso 4. |
| Nuevas **clases Tailwind** en los ajustes de QA fallan en dev por staleness del JIT (memoria del proyecto). | Preferir clases ya presentes o estilos inline; reiniciar el dev server si una clase nueva no aplica; correr `astro build` desde la raíz. |
| El **filtro por tag** o la **paginación** se desincroniza al pasar de 3 a 12 posts (índices, orden de fecha). | Cubierto por criterios de aceptación explícitos (9 en página 1, filtro por tag, sin repetición contigua). QA funcional en paso 4. |
| La **asignación cíclica** deja dos portadas iguales contiguas según el orden por fecha del grid. | Verificar el orden final renderizado (no solo el del archivo) y ajustar fecha o portada de algún post para romper la repetición. Criterio de aceptación explícito. |
| El QA revela una diferencia **estructural** (no de estilo) con el Figma, tentando un rediseño fuera de alcance. | Anotar el hallazgo como pendiente para otra spec; en esta solo se aplican los ajustes de estilo listados en el Alcance. |

---

## Qué **NO** entra en este spec

- Cambiar el schema `post` o agregar campos/etiquetas nuevas.
- Rediseñar la estructura de `BlogGrid` / `BlogHero` / `BlogPreview` / detalle, o el patrón dual `.astro` + `React`.
- Funcionalidad nueva del listado (búsqueda, orden configurable, tags desde CMS, posts por página).
- SEO/OG por post, subir las portadas desde el CMS, o reescribir los 3 posts existentes.
- Tocar Header / Footer / maintenance / Lenis.

Cada uno de estos, si aterriza, va en su propio spec.

---

## Notas de implementación (2026-07-01)

Implementado en la rama `spec-15-blog`. QA visual con dev server (modo local) + Playwright MCP (desktop 1440px, mobile 400px); screenshots en `.playwright-screens/` (gitignored). `astro build` completo: **38 páginas, sin errores**, incluidas las **12 rutas `/blog/<slug>`**. El paso `tinacms build` requiere credenciales de TinaCloud (no disponibles en modo local) — misma limitación de entorno de specs previas; corre en deploy.

**Desviación aprobada — set de portadas.** Solo **2 de las 5** portadas del Figma se extrajeron limpias: `cover-guide.png` (card "MVNO / The Ultimate Guide") y `cover-laptop.jpg` (foto laptop B&N). Las ilustraciones **Cloud / AI / 5G** son SVG importados de Webflow con máscaras que **renderizan vacío** en cualquier export/screenshot del MCP (PNG 149 bytes / 1×1, SVG `null`); se intentó por contenedor, por nodo de ilustración, por grupo padre y en formato SVG. Con acuerdo del usuario se completó el set con **4 portadas SVG on-brand generadas** (gradientes Fiberlux + motivo por tema): `cover-cloud.svg`, `cover-security.svg`, `cover-network.svg`, `cover-data.svg`. Set final = **6 portadas** repartidas cíclicamente (cada una ×2, sin repetición contigua). La "foto Da Nang" del modelo resultó ser la misma imagen laptop en dos tamaños.

**Sin ajustes de estilo.** El QA visual de las 4 superficies (listado, hero-carrusel, Insights del home vs frame `1574-8819`, detalle) calzó con las referencias **sin tocar código** de componentes; la latitud de ajustes quedó sin usar porque las tarjetas ya coincidían con el Figma de specs previas.

**Observaciones fuera de alcance (para otra spec):**
- `BlogPreview.astro` (Insights del home) consulta `first: 6, sort: 'date'` → muestra los posts **más antiguos** primero. Para una sección "Novedades" lo natural sería `last: 6` (más recientes). Comportamiento preexistente; no se tocó por estar fuera de alcance (cambiar queries del listado).
- El detalle emite 1 warning de **hydration mismatch** en `ShareButtons` (href de compartir con `https://fiberlux.com/...` en SSR vs `localhost` en cliente). Componente preexistente, solo en dev local; no lo introdujo esta spec.

**Featured:** 4 posts `featured: true` (`mvno`, `telefonia-ip`, `sd-wan`, `data-center`). El hero de `/blog` los prioriza; el Insights del home no filtra por `featured` (toma por fecha, ver observación).
