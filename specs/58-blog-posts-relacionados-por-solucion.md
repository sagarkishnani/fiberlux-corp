# SPEC 58 — Blog: posts relacionados por solución (tags = soluciones)

> **Estado:** Aprobado
> **Depende de:** SPEC 15 (blog), SPEC 11/12 (plantillas solución/subservicio)
> **Fecha:** 2026-07-22
> **Objetivo:** Que cada página de solución muestre los posts del blog cuyo tag corresponde a esa solución (o los 6 más recientes por defecto), y restringir los tags del blog a las 4 soluciones para que no haya etiquetas sueltas.

---

## Por qué este spec existe

Hoy la sección "Insights & Novedades" (`BlogPreview`) muestra siempre los 6 posts más recientes, igual en home, en las páginas de solución y en los subservicios: no hay relación post↔solución. Además, los tags del blog son una lista cerrada pero con valores genéricos (Big data, SaaS, ISPs, etc.) que no enlazan a ninguna solución, generando "tags sueltos". El cliente quiere que cada solución muestre sus posts según el tag y que los tags solo puedan ser las 4 soluciones.

---

## Scope

**In:**

- Cambiar las `options` del campo `tags` (post, en `tina/config.ts`) a las **4 soluciones** (value = slug, label = título legible), eliminando los tags genéricos actuales.
- `BlogPreview` recibe la solución actual y **filtra** los posts cuyo tag la incluye; si no hay ninguno, cae a los **6 más recientes**.
- Cablear la solución en `/soluciones/<solución>` (usa el `solucion` del path) y en los subservicios (usan el `solucionSlug` de su padre → filtra por la **categoría padre**).
- Un post puede tener **varias** soluciones (aparece en varias páginas).
- Mapa compartido `slug → label` (4 soluciones) para mostrar la etiqueta legible donde el blog pinta tags (grid, card, hero, detalle, preview).
- **Migración** de los 2 posts actuales a `data-center-cloud`.

**Out of scope (futuro):**

- Filtro/UI por tag en la página del blog (`/blog`) más allá de mostrar la etiqueta correcta.
- Tags a nivel de subservicio individual (se filtra solo por las 4 categorías).
- Home y `/fiberlux-app`: siguen mostrando los 6 recientes (no son una solución).
- Rediseño visual del carrusel de posts.

---

## Data model

No hay colección nueva. Se cambia el conjunto de valores del campo `tags` del post y se agrega un mapa compartido de soluciones.

**1. Campo `tags` (post) — `tina/config.ts`.** De lista de strings genéricos a lista con las 4 soluciones (value = slug del `services`, label = título):

```
options: [
  { value: "conectividad-empresarial", label: "Conectividad Empresarial" },
  { value: "ciberseguridad-gestionada", label: "Ciberseguridad Gestionada" },
  { value: "data-center-cloud",        label: "Data Center, Cloud y Continuidad de Negocio" },
  { value: "servicios-gestionados",    label: "Servicios Gestionados" },
]
```

El frontmatter de cada post guarda el/los **slug(s)** en `tags`.

**2. Mapa compartido `src/utils/solutions.ts`** (única fuente de verdad de los 4 slugs y sus labels):

```ts
export const SOLUTIONS = [
  { slug: "conectividad-empresarial", label: "Conectividad Empresarial" },
  { slug: "ciberseguridad-gestionada", label: "Ciberseguridad Gestionada" },
  { slug: "data-center-cloud", label: "Data Center, Cloud y Continuidad de Negocio" },
  { slug: "servicios-gestionados", label: "Servicios Gestionados" },
] as const;

export function solutionLabel(slug: string): string { /* slug → label, fallback: slug */ }
```

**3. Migración de posts actuales** (`src/content/blog/*.mdx`, campo `tags`):

```
big-data-decisiones-empresariales.mdx : [Big data, SaaS] → [data-center-cloud]
saas-productividad-equipos.mdx        : [SaaS, Cloud]     → [data-center-cloud]
```

---

## Implementation plan

1. **Mapa de soluciones.**
   Crear `src/utils/solutions.ts` con `SOLUTIONS` (4 slugs + labels) y `solutionLabel(slug)`. Sin uso todavía; compila.

2. **Restringir los tags del blog a las 4 soluciones.**
   En `tina/config.ts`, cambiar las `options` del campo `tags` del post por las 4 soluciones (`{value, label}` como en Data model). `tinacms build` regenera tipos. Prueba manual: en `/admin`, el campo Etiquetas solo ofrece las 4 soluciones.

3. **Migrar los 2 posts existentes.**
   En cada `.mdx`, reemplazar los tags viejos por `data-center-cloud` según la tabla del Data model. Prueba manual: los posts tienen solo el tag de solución.

4. **Etiqueta legible en la UI del blog.**
   En los componentes que pintan tags (`BlogGridCard`, `BlogGrid`, `BlogHero`, `BlogDetailReact`, `BlogPreviewReact`, y las páginas `blog/index.astro` / `blog/[slug].astro` según corresponda), mostrar `solutionLabel(tag)` en vez del slug crudo. Prueba manual: las pills muestran el nombre de la solución, no el slug.

5. **Filtrado en `BlogPreview` por solución.**
   En `src/components/blog/BlogPreview.astro`: aceptar prop opcional `solucion?: string`. Traer un lote amplio de posts (p. ej. `first: 50, sort: 'date'`), y si viene `solucion`, filtrar los que tengan ese slug en `tags` (hasta 6); si el filtro queda vacío o no viene `solucion`, usar los **6 más recientes**. Pasar el resultado a `BlogPreviewReact` (sin cambios en el React). Prueba manual: con `solucion` que tiene posts, se ven filtrados; sin posts, se ven los 6 recientes.

6. **Cablear la solución en las páginas.**
   - `/soluciones/[solucion].astro`: pasar `solucion={solucion}` (el `Astro.params`) a `<BlogPreview />`.
   - `/soluciones/[solucion]/[subservicio].astro`: leer el `solucionSlug` del subservicio (de su query) y pasarlo como `solucion` a `<BlogPreview />` (filtra por la categoría padre).
   - Home y `/fiberlux-app`: **no** pasan `solucion` (siguen con los 6 recientes).
   Prueba manual: en una página de Data Center & Cloud aparecen los 2 posts migrados; en Ciberseguridad (sin posts) aparecen los 6 recientes.

---

## Acceptance criteria

- [ ] En `/admin`, el campo Etiquetas de un post solo permite elegir entre las 4 soluciones.
- [ ] Los 2 posts existentes quedan con tag `data-center-cloud` y sin tags genéricos.
- [ ] En la página de solución **Data Center, Cloud y Continuidad de Negocio** aparecen esos posts en "Insights & Novedades".
- [ ] En una solución sin posts asociados (ej. Ciberseguridad) aparecen los 6 posts más recientes.
- [ ] En un subservicio, los posts mostrados corresponden a su solución padre.
- [ ] En home y `/fiberlux-app` se siguen mostrando los 6 más recientes.
- [ ] Un post con 2 soluciones aparece en las 2 páginas correspondientes.
- [ ] Las pills de tags en el blog muestran el nombre de la solución (no el slug).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** el tag guarda el **slug** de la solución (value) y muestra el título como label. El slug matchea directo con la ruta `/soluciones/<slug>`; el label da un texto legible.
- **Sí:** se filtra por las **4 categorías**, no por subservicio. Más simple y siempre hay contenido a nivel categoría (decisión del cliente).
- **Sí:** en subservicio se filtra por la **solución padre** (`solucionSlug`).
- **Sí:** un post puede tener **varias** soluciones (decisión del cliente).
- **Sí:** fallback a **6 recientes** cuando la solución no tiene posts, para no dejar la sección vacía.
- **Sí:** migrar los 2 posts a `data-center-cloud` (ambos son de datos/cloud/SaaS).
- **No:** tocar el diseño del carrusel de posts ni agregar filtro por tag en `/blog` (otro spec si se pide).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El filtro por tag no es trivial en la query de Tina local | Traer un lote amplio (`first: 50`) y filtrar en JS por `tags.includes(solucion)`; tomar hasta 6. |
| Posts viejos con tags fuera de las nuevas `options` quedan "inválidos" en Tina | La migración (paso 3) reasigna los 2 posts; no quedan tags legacy. |
| El label largo ("Data Center, Cloud y Continuidad…") se ve grande como pill | Es el nombre real de la solución; si molesta, se acorta el label en `SOLUTIONS` (no afecta el matching por slug). |
| Subservicio sin `solucionSlug` poblado | Si falta, `BlogPreview` cae al fallback de 6 recientes (comportamiento actual). |

---

## Lo que **no** está en este spec

- Filtro/UI por tag dentro de la página `/blog`.
- Tags a nivel de subservicio individual.
- Cambios de posts en home / `/fiberlux-app`.
- Rediseño del carrusel de "Insights & Novedades".

Cada uno, si aterriza, va en su propio spec.
