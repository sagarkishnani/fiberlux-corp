# SPEC 48 — Rediseño del slider de soluciones al nuevo Figma (eyebrow, card activa con degradado, bullets con viñeta)

> **Estado:** Aprobado
> **Depende de:** SPEC 35 (componente `SolucionesSlider` que se rediseña), SPEC 40 (motor de arrastre `useDragSlider`)
> **Fecha:** 2026-07-21
> **Objetivo:** Rediseñar el bloque de slider de soluciones (`SolucionesSliderReact`) al nuevo Figma —eyebrow desde el CMS, columna izquierda con título/descripción de la card activa, card activa con degradado magenta y bullets con viñeta, "Conoce más →" y número en la fila inferior, y glows de fondo con `line.svg`/`planet.svg`— en las 3 páginas que lo usan, dejando comentado el diseño actual.

---

## Alcance

**Dentro:**

- **Rediseñar `src/components/shared/SolucionesSliderReact.tsx`** (mismo componente del SPEC 35, sin crear uno nuevo), conservando su motor de slider (`useDragSlider`: drag + flechas + snap + `prefers-reduced-motion`) y su sincronización izquierda ↔ card activa.
- **Comentar (no borrar)** el markup/estilos del diseño actual dentro del componente, con nota "diseño anterior — reutilizar luego".
- **Columna izquierda:**
  - Nuevo **eyebrow `[ SOLUCIONES ]`** arriba del título, derivado de `services.title` (mayúsculas, entre corchetes, estilo técnico Space Mono).
  - **Título** grande + **descripción** de la **solución activa** (ya existe, se conserva la sincronización).
  - **Pill de flechas** prev/next (prev tenue, next magenta), como hoy.
- **Cards:**
  - **Card activa:** **degradado magenta** hecho con **CSS** (oscuro arriba → magenta abajo), borde sutil.
  - **Cards inactivas:** fondo plano oscuro, sin degradado, con texto atenuado (gris).
  - **Bullets con viñeta (•)** en lugar de líneas sin punto.
  - **"Y más"** como **bullet editable**: se muestra (atenuado) **solo** en las cards cuyo contenido lo incluye (no fijo).
  - **Fila inferior:** **número grande** (`item.number`) abajo-izquierda y **"Conoce más →"** (con flecha, → `item.url`) abajo-derecha, en la misma fila.
- **Fondo de la sección:** componer `public/images/soluciones/line.svg` y `planet.svg` como **glows decorativos absolutos** detrás del contenido (estáticos, no CMS).
- **Responsive:** desktop (izquierda ~38% + carrusel con 1 card + peek) y mobile (título/desc arriba, cards y flechas debajo), como hoy.
- **Las 3 páginas** que ya montan `<SolucionesSlider />` (home, soporte-técnico, soluciones) reciben el rediseño automáticamente al ser el mismo componente.

**Fuera de alcance (para futuros specs):**

- **Cambiar el schema** de `home.services` en `tina/config.ts` (se reutiliza tal cual: `title`, `number`, `title`, `description`, `icon`, `bullets`, `url`).
- **Reactivar o tocar** `StickyCardsReact.tsx` / `StickyCards.astro` (siguen comentados desde SPEC 35).
- **Editar los glows de fondo desde el CMS** (los SVG son decorativos y estáticos).
- **Cambiar el contenido textual** de las soluciones (títulos, descripciones, bullets ya existen).
- **Rediseñar otras secciones** del home / soporte-técnico / soluciones.
- **Convertir el eyebrow o "Conoce más" en campos nuevos** del CMS (el eyebrow sale de `services.title`; "Conoce más" es etiqueta estática + `item.url`).

---

## Modelo de datos

Esta feature **no introduce estructuras nuevas ni cambia el schema**. Reutiliza `home.services` tal como lo dejó el SPEC 35 (`tina/config.ts` + `src/content/home/index.json`):

```js
// home.services — se conserva sin cambios de schema
services: {
  title: string,        // → ahora también alimenta el eyebrow "[ TITLE ]"
  items: [
    {
      number: string,      // "01"…"04" → número grande, fila inferior izquierda de la card
      title: string,       // → título del panel izquierdo (card activa)
      description: string, // → descripción del panel izquierdo (card activa)
      icon: string,        // → YA NO se renderiza (el SPEC 35 lo usaba como onda; el nuevo diseño no lleva onda por card)
      bullets: string[],   // → viñetas de la card; un bullet "Y más…" se pinta atenuado
      url: string,          // → destino de "Conoce más →"; si falta, no se renderiza el enlace
    },
  ],
}
```

**Cambios de contenido (no de schema):**

- **Ninguno obligatorio.** El contenido actual ya sirve: los items 01/02/04 incluyen el bullet `"Y más..."` y el 03 no, que es exactamente el comportamiento editable-por-card que se definió (03 no mostrará "Y más").
- El campo **`icon`** de cada item queda **sin uso visual** en el nuevo diseño (antes era la onda por card). Se conserva en el schema y el JSON para no romper Tina ni el SPEC 35 comentado; simplemente no se pinta.

**Assets estáticos (no CMS):**

- `public/images/soluciones/line.svg` — mancha magenta alargada/inclinada (blur). Glow de fondo de sección.
- `public/images/soluciones/planet.svg` — círculo magenta grande (blur). Glow de fondo de sección.
- Ambos ya existen en el repo; se referencian con ruta `BASE_URL`-aware.

**Convenciones de runtime (`SolucionesSliderReact.tsx`):**

- El **eyebrow** se deriva de `services.title`: se muestra como `[ ${title.toUpperCase()} ]`. Si `services.title` está vacío, no se renderiza el eyebrow (no rompe).
- **"Y más"** se detecta con el helper ya existente `isMoreLabel(b)` (regex `/^y\s*m[aá]s/i`): ese bullet se saca de la lista de líneas normales y se pinta como etiqueta atenuada **solo si existe** en `item.bullets` (deja de renderizarse de forma fija).
- **Card activa** = `activeIndex`; recibe la clase con degradado magenta. Las demás quedan planas y atenuadas (misma lógica de `opacity` actual + estilo de texto gris).
- Fallback chain intacto: `useTina` data → `initialData`; si no hay items, el componente retorna `null`.

---

## Plan de implementación

> Todo el trabajo nuevo vive en `src/components/shared/SolucionesSliderReact.tsx`. No se toca el schema, ni el contenido, ni las 3 páginas (el componente es compartido). Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.

1. **Comentar el diseño actual dentro del componente.** Envolver el bloque JSX del render actual (card con onda, "Y más…" fijo, "Conoce más" arriba del número) en un comentario claramente rotulado (`/* ── Diseño anterior (SPEC 35) — reutilizar luego ── */`), sin borrarlo. *Verificación:* el archivo compila; el diseño viejo queda como referencia comentada.

2. **Fondo de sección con los glows.** Añadir en la `<section>` los dos SVG (`line.svg`, `planet.svg`) como `<img>` decorativos absolutos (`pointer-events-none`, `aria-hidden`, `z-0`) posicionados según la referencia (planet grande abajo-izquierda; line como streak secundario), con el contenido por encima (`relative z-10`). Rutas `BASE_URL`-aware. *Verificación:* la sección muestra los glows magenta de fondo sin tapar el texto.

3. **Eyebrow desde el CMS.** En la columna izquierda, sobre el título, renderizar `[ {services.title.toUpperCase()} ]` con estilo técnico (Space Mono, tracking, tamaño pequeño, color tenue). Ocultar si `services.title` está vacío. `data-tina-field` sobre `services.title`. *Verificación:* aparece `[ NUESTRAS SOLUCIONES ]` (o el título editado) arriba del título grande y es editable en Tina.

4. **Bullets con viñeta.** Cambiar la lista de la card de líneas sin punto a lista con viñeta `•` (dot magenta/blanco), tamaño y espaciado según la referencia. *Verificación:* cada bullet muestra su punto de viñeta.

5. **"Y más" editable por card.** Reemplazar el `<p>Y más…</p>` fijo por: pintar la etiqueta atenuada **solo si** `item.bullets` incluye un bullet que matchee `isMoreLabel`. *Verificación:* la card 03 (Data Center) no muestra "Y más"; 01/02/04 sí.

6. **Fila inferior número + "Conoce más".** Reestructurar el pie de la card a una fila `justify-between`: número grande (`item.number`, atenuado) a la izquierda y enlace **"Conoce más →"** (con glifo de flecha, → `item.url`, oculto si no hay url) a la derecha. `data-tina-field` en `number` y `url`. *Verificación:* número abajo-izquierda y "Conoce más →" abajo-derecha, en la misma línea base.

7. **Estado activo/inactivo de la card.** Card activa: degradado magenta CSS (oscuro arriba → magenta abajo) + borde sutil + texto en blanco. Cards inactivas: fondo plano oscuro, texto atenuado (gris), sin degradado (se mantiene la `opacity` de peek existente). *Verificación:* al navegar, solo la card activa tiene el degradado magenta; las demás quedan planas/grises.

8. **Ajuste responsive.** Revisar que en desktop (izquierda ~38% + 1 card + peek) y en mobile (eyebrow/título/desc arriba, cards y flechas debajo) el nuevo layout respete el patrón actual. Ajustar paddings, `min-height` de card y tamaños de tipografía al nuevo diseño. *Verificación:* en ~1440px y ~390px el bloque coincide con la referencia y no hay cortes.

9. **QA visual + consola en las 3 páginas.** Comparar contra la imagen de referencia en home, soporte-técnico y soluciones (desktop + mobile), incluyendo `prefers-reduced-motion`. *Verificación:* `npm run build` sin errores/warnings nuevos; navegación por flechas/drag correcta; sincronización izquierda estable; sin errores en consola.

**Notas del plan:**

- Pasos 1–2 preparan (comentar viejo + fondo); 3–7 arman el nuevo diseño de forma incremental; 8–9 cierran responsive y QA.
- El motor `useDragSlider` y la sincronización izquierda ↔ card activa **no se reescriben**; solo cambia el markup/estilo que renderiza.
- El QA visual usa Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] El diseño anterior (SPEC 35) queda **comentado** dentro de `SolucionesSliderReact.tsx`, rotulado y sin borrar.
- [ ] La sección muestra los **glows de fondo** compuestos con `line.svg` y `planet.svg` (decorativos, detrás del contenido, sin tapar el texto).
- [ ] Sobre el título aparece el **eyebrow `[ … ]`** derivado de `services.title` en mayúsculas; si `services.title` está vacío, el eyebrow **no** se renderiza.
- [ ] La **columna izquierda** muestra eyebrow + **título + descripción de la card activa** y se actualiza al navegar con flechas, drag o scroll.
- [ ] Cada card muestra sus **bullets con viñeta (•)**.
- [ ] La etiqueta **"Y más"** aparece (atenuada) **solo** en las cards cuyo contenido la incluye: **no** en la 03 (Data Center), **sí** en 01/02/04.
- [ ] En el pie de cada card, el **número** (`item.number`) va **abajo-izquierda** y **"Conoce más →"** va **abajo-derecha**, en la misma fila.
- [ ] **"Conoce más →"** navega a `item.url`; si el item no tiene `url`, el enlace **no** aparece.
- [ ] La **card activa** tiene el **degradado magenta** (CSS); las cards **inactivas** quedan planas, oscuras y con texto atenuado.
- [ ] Al navegar, el degradado magenta se mueve siempre a la **card activa** (solo una card a la vez lo tiene).
- [ ] Se conserva la mecánica del slider: **flechas** edge-aware (prev tenue / next magenta), **drag** con snap por card y **sincronización** izquierda ↔ card activa.
- [ ] Con **`prefers-reduced-motion: reduce`** activo, la navegación no usa scroll suave (comportamiento heredado intacto).
- [ ] En **desktop (~1440px)** el bloque coincide con la referencia (eyebrow + título + descripción + pill de flechas a la izquierda; 1 card + peek a la derecha).
- [ ] En **mobile (~390px)** el eyebrow/título/descripción van arriba y las cards + flechas debajo, sin cortes.
- [ ] El **eyebrow** (`services.title`), el **número** y el **enlace** (`url`) de cada card son editables desde Tina (`data-tina-field`).
- [ ] El rediseño se ve en las **3 páginas** (home, soporte-técnico, soluciones) al ser el mismo componente compartido.
- [ ] No se modificó el schema de `home.services`, ni `StickyCards*`, ni otras secciones.

---

## Decisiones tomadas y descartadas

- **Sí:** rediseñar **el mismo `SolucionesSliderReact.tsx`** en vez de crear un componente nuevo. Es el bloque compartido por las 3 páginas; evolucionarlo propaga el diseño sin duplicar código ni tocar las páginas.
- **Sí:** **comentar** (no borrar) el diseño anterior dentro del componente. Lo pidió el cliente ("comentar el código para no perderlo"); permite volver atrás o reutilizar piezas.
- **No:** eliminar el markup viejo. Se perdería la referencia y contradice el pedido.
- **Sí:** **glows de fondo** con `line.svg` + `planet.svg` como assets estáticos absolutos. Confirmado por el cliente; son decorativos y no necesitan edición desde el CMS.
- **No:** usar los SVG **dentro de la card** o como fondo editable en Tina. Descartado por la respuesta del cliente: van al fondo de la sección.
- **Sí:** **degradado magenta de la card activa con CSS** (no con un SVG por card). Confirmado; evita un asset extra y se adapta a cualquier alto de card.
- **Sí:** **eyebrow desde `services.title`** (mayúsculas, corchetes). Confirmado; reutiliza un campo existente y lo hace editable sin ampliar el schema.
- **No:** eyebrow como texto fijo hardcodeado. Descartado por la respuesta del cliente (lo maneja el CMS).
- **Sí:** **"Y más" editable por card** (desde `bullets`, vía `isMoreLabel`). Confirmado; respeta la referencia (aparece solo en algunas cards) y ya coincide con el contenido actual.
- **No:** "Y más" fijo en toda card (comportamiento SPEC 35). Descartado por la respuesta del cliente.
- **Sí:** **bullets con viñeta (•)**. Es lo que muestra la referencia (el SPEC 35 los pintaba como líneas sin punto).
- **Sí:** **número abajo-izquierda + "Conoce más →" abajo-derecha** en una fila. Coincide con la referencia (el SPEC 35 tenía "Conoce más" arriba del número, alineado a la izquierda).
- **Sí:** dejar el campo **`icon` sin uso visual** pero conservado en schema/JSON. Evita romper Tina y el SPEC 35 comentado; el nuevo diseño no lleva onda por card.
- **No:** quitar `icon` del schema. Sería un cambio de schema (fuera de alcance) y regeneraría artefactos de Tina.
- **Sí:** **conservar `useDragSlider`** y la sincronización izquierda ↔ card activa. Solo cambia el markup/estilo; la mecánica ya está probada (SPEC 35/40).
- **Sí:** alcance = **las 3 páginas** vía el componente compartido. Confirmado.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Los glows de fondo (`line.svg`/`planet.svg`) **desbordan** la sección o generan scroll horizontal. | La `<section>` mantiene `overflow-hidden`; los `<img>` van absolutos con tamaños/posiciones acotados y `pointer-events-none`. |
| El **degradado magenta** de la card activa compite con la legibilidad de los bullets. | Contenido en `relative z-10` con contraste suficiente; ajustar la parada del degradado en el QA (paso 8–9). |
| Cambiar el pie a `justify-between` **descuadra** cards con muchos bullets vs pocos. | `min-height` uniforme de card + pie anclado abajo (`mt-auto`); QA con la card de más bullets (Ciberseguridad). |
| El **eyebrow** derivado de `services.title` queda raro si el título es largo o ya viene en minúsculas/mayúsculas mixtas. | Normalizar con `toUpperCase()` y corchetes; si el título es muy largo, se acepta como decisión de contenido (editable en Tina). |
| Al comentar el diseño viejo pueden quedar **helpers o imports huérfanos** (p. ej. `resolveIcon`) que rompan el build. | Mantener los helpers que el nuevo diseño siga usando; los no usados se comentan junto al bloque viejo o se dejan sin warnings de lint. |
| El nuevo layout **rompe los solapes** `-mt-*`/`z-*` con las secciones vecinas en alguna de las 3 páginas. | QA visual en las 3 páginas (paso 9); no se cambian los wrappers de página, solo el interior del componente. |
| Las cards inactivas atenuadas **pierden contraste** de accesibilidad. | El texto atenuado es decorativo (card no activa); el contenido legible principal es la card activa; verificar contraste mínimo en QA. |

---

## Qué **NO** entra en este spec

- Cambiar el schema de `home.services` en `tina/config.ts`.
- Reactivar o modificar `StickyCardsReact.tsx` / `StickyCards.astro`.
- Glows de fondo editables desde el CMS (son estáticos).
- Cambios en el contenido textual de las soluciones.
- Rediseño de otras secciones del home / soporte-técnico / soluciones.
- Eyebrow o "Conoce más" como campos nuevos del CMS.

Cada uno de estos, si aterriza, va en su propio spec.
