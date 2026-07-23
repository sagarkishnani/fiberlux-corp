# SPEC 63 — Blog: tags múltiples de lista compartida + selección de tags por página

> **Estado:** Aprobado
> **Depende de:** SPEC 15 (blog), SPEC 58 (a quien reemplaza), SPEC 11/12 (plantillas solución/subservicio)
> **Fecha:** 2026-07-22
> **Objetivo:** Reemplazar el modelo de tags del blog (hoy fijado a las 4 soluciones) por tags múltiples de una lista compartida, y permitir en Tina que cada página de solución y subservicio designe qué tags muestra su sección de posts (filtrando por intersección, con fallback a recientes).

---

## Por qué este spec existe

El SPEC 58 forzó los tags del blog a ser exactamente las 4 soluciones y filtró cada página por su propio slug de ruta. El cliente aclaró que lo que quiere es distinto: que una entrada de blog pueda tener **varios tags** (un tema puede tocar Conectividad y Ciberseguridad a la vez) y que **en cada página de solución/categoría y subservicio, desde Tina, pueda designar qué tags aparecen** en su sección de novedades. Así, una entrada con dos tags aparece en las dos páginas correspondientes. Se elige un modelo de **lista compartida** de tags (opción A): consistencia y dropdown, agregar un tag nuevo es un pequeño cambio en código.

---

## Scope

**In:**

- **Lista compartida de tags** (constante `BLOG_TAG_OPTIONS` en `tina/config.ts`, editable en código): `Conectividad`, `Ciberseguridad`, `Cloud`, `Data Center`, `Comunicaciones`, `Continuidad de negocio` (ampliable). Valores legibles (se muestran tal cual).
- **Blog `tags`** (colección `post`): `options = BLOG_TAG_OPTIONS`, `list: true` (**multi-tag**).
- **Campo `blogTags`** (`list`, `options = BLOG_TAG_OPTIONS`) en las colecciones **`service`** y **`subservicio`** → "qué tags mostrar en esta página".
- **`BlogPreview` filtra por intersección**: muestra los posts cuyos tags coincidan con alguno de los `blogTags` de la página; si la página no tiene `blogTags` → **6 recientes**.
- **Cableado:** `/soluciones/<categoría>` pasa `service.blogTags`; subservicio pasa `subservicio.blogTags`.
- **Pills del blog**: muestran el tag tal cual (se revierte el mapeo slug→label del SPEC 58).
- **Migración:** re-taggear los 2 posts actuales y poner `blogTags` por defecto en las 4 páginas de solución.

**Out of scope (futuro):**

- Tags de texto libre (opción B — descartada).
- Home y `/fiberlux-app` (siguen mostrando recientes).
- UI de filtro por tag dentro de `/blog` más allá de mostrar el tag.
- Rediseño visual del carrusel de posts.

**Reemplaza:** SPEC 58 (pasa a `Obsoleto`).

---

## Data model

**1. Lista compartida** — `tina/config.ts` (constante reutilizada por los 3 campos):

```
const BLOG_TAG_OPTIONS = [
  "Conectividad", "Ciberseguridad", "Cloud",
  "Data Center", "Comunicaciones", "Continuidad de negocio",
];
```

**2. Campo `tags` del post** (colección `post`): `type: "string", list: true, options: BLOG_TAG_OPTIONS`.

**3. Campo `blogTags`** (colecciones `service` y `subservicio`):
```
{ name: "blogTags", label: "Tags del blog a mostrar", type: "string", list: true,
  options: BLOG_TAG_OPTIONS,
  description: "Entradas del blog con alguno de estos tags aparecen en las novedades de esta página. Vacío = 6 más recientes." }
```

**4. Migración de posts** (`src/content/blog/*.mdx`):
```
big-data-decisiones-empresariales.mdx : [data-center-cloud] → [Data Center, Cloud]
saas-productividad-equipos.mdx        : [data-center-cloud] → [Cloud]
```

**5. `blogTags` por defecto** (`src/content/services/*.json`):
```
conectividad-empresarial  : ["Conectividad"]
ciberseguridad-gestionada : ["Ciberseguridad"]
data-center-cloud         : ["Data Center", "Cloud", "Continuidad de negocio"]
servicios-gestionados     : ["Comunicaciones"]
```
Subservicios: `blogTags` vacío por defecto (→ recientes); el cliente los designa en Tina cuando quiera.

---

## Implementation plan

1. **Lista compartida + schema.**
   En `tina/config.ts`: definir `BLOG_TAG_OPTIONS`; cambiar `options` del `tags` del post a esa lista; agregar el campo `blogTags` a las colecciones `service` y `subservicio`. (El `tinacms dev` regenera el cliente.) Prueba manual: en `/admin`, el post y las páginas de solución/subservicio ofrecen los mismos tags; `blogTags` es multi-select.

2. **Migrar los posts.**
   Reemplazar los tags de los 2 `.mdx` según el Data model. Prueba manual: no quedan tags `data-center-cloud`.

3. **`blogTags` por defecto en las 4 categorías.**
   Poner `blogTags` en los 4 `services/*.json` según el Data model. Prueba manual: cada categoría trae sus tags.

4. **Filtrado en `BlogPreview` por lista de tags.**
   En `src/components/blog/BlogPreview.astro`: reemplazar la prop `solucion` (slug único) por `tags` (array). Traer lote amplio, y si `tags` tiene elementos, filtrar los posts cuyos `tags` intersecten `tags` (hasta 6); si `tags` vacío o sin coincidencias → 6 recientes. Prueba manual: la página con tags muestra los posts que los tienen; sin tags, recientes.

5. **Cablear las páginas.**
   - `/soluciones/[solucion].astro`: pasar `tags={service.blogTags}` (leer del query del service).
   - `/soluciones/[solucion]/[subservicio].astro`: pasar `tags={subservicio.blogTags}`.
   - Home y `/fiberlux-app`: sin `tags` (recientes).
   Prueba manual: Data Center muestra posts de Data Center/Cloud; un subservicio sin `blogTags` muestra recientes.

6. **Pills del blog: tag tal cual.**
   Revertir el uso de `solutionLabel` en los componentes del blog (`BlogGridCard`, `BlogCard`, `BlogGrid`, `BlogDetailReact`): mostrar el tag directamente (ya es legible). Quitar el import si queda sin uso. Prueba manual: las pills muestran "Data Center", "Cloud", etc.

---

## Acceptance criteria

- [ ] En `/admin`, el `tags` del post y el `blogTags` de solución/subservicio ofrecen la misma lista de tags y permiten varios.
- [ ] Una entrada con 2 tags aparece en las 2 páginas cuyos `blogTags` incluyan alguno de esos tags.
- [ ] Una página de solución con `blogTags` muestra solo los posts que tienen alguno de esos tags.
- [ ] Una página con `blogTags` vacío (o sin coincidencias) muestra los 6 posts más recientes.
- [ ] Home y `/fiberlux-app` siguen mostrando recientes.
- [ ] Los 2 posts migrados no conservan tags viejos (`data-center-cloud`).
- [ ] Las pills del blog muestran el tag legible (no un slug).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** lista compartida de tags (opción A) en vez de texto libre. Consistencia y dropdown; agregar un tag = editar `BLOG_TAG_OPTIONS`.
- **Sí:** valores legibles como valor del tag (no slug), para que las pills los muestren sin mapa de labels.
- **Sí:** `blogTags` por página (categoría y subservicio); el filtro es por **intersección** de tags (un post puede salir en varias páginas).
- **Sí:** fallback a 6 recientes cuando la página no designa tags o no hay coincidencias.
- **Sí:** este spec reemplaza al SPEC 58 (que pasa a `Obsoleto`).
- **No:** texto libre (opción B) ni filtro/UI de tags en `/blog`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Agregar un tag nuevo requiere tocar código (`BLOG_TAG_OPTIONS`) | Es un cambio de una línea; se asumió al elegir la opción A (lista compartida). |
| El filtro por intersección no es trivial en la query de Tina | Traer un lote amplio (`first: 50`) y filtrar en JS por intersección de arrays; tomar hasta 6. |
| Posts con tags viejos (`data-center-cloud`) quedan fuera de las opciones | La migración (paso 2) los reasigna; no quedan tags legacy. |
| Subservicio sin `blogTags` | Cae al fallback de recientes (comportamiento definido). |

---

## Lo que **no** está en este spec

- Tags de texto libre.
- Home / `/fiberlux-app`.
- Filtro/UI por tag dentro de `/blog`.
- Rediseño del carrusel de novedades.

Cada uno, si aterriza, va en su propio spec.
