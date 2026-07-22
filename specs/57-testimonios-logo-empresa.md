# SPEC 57 — Testimonios: logo de empresa en vez de chip/avatar

> **Estado:** Implementado
> **Depende de:** SPEC 49 (testimonios tema claro), SPEC 24 (foto genérica), obs 11/12/13 (opción de logo)
> **Fecha:** 2026-07-22
> **Objetivo:** Rediseñar la tarjeta de testimonios para mostrar el logo de la empresa (sin chip magenta ni placeholder), con el logo en la columna izquierda en desktop y arriba del testimonio en mobile.

---

## Por qué este spec existe

El cliente pidió quitar el "chip magenta" (el marco con forma de folder relleno en `#96237A`) y el avatar placeholder (silueta genérica) de las tarjetas de testimonios, y en su lugar mostrar el logo de cada empresa. En desktop el logo va donde estaba el chip (columna izquierda); en mobile va arriba del testimonio y abajo queda solo el nombre y cargo de la persona. Los logos ya existen como assets pero no estaban asignados en el contenido.

---

## Scope

**In:**

- **Desktop:** quitar el frame magenta (`FRAME_PATH`) y el placeholder; poner el logo en la columna izquierda (sin marco, centrado); mantener quote/descripción/nombre/cargo a la derecha; quitar el logo pequeño duplicado que hoy va junto al texto.
- **Mobile:** quitar el avatar (chip + placeholder); poner el logo **arriba** del testimonio (sobre el quote); abajo dejar nombre **+ cargo**.
- **Fallback sin logo:** mostrar el nombre de la empresa (`company`) como texto en el lugar del logo (desktop y mobile).
- **Contenido:** asignar los 3 logos existentes a sus testimonios.
- Retirar de la tarjeta el uso del placeholder y de la foto de persona (`avatar`): el diseño pasa a basarse en el logo.

**Out of scope (futuro / otros specs):**

- Cambios de schema en Tina (el campo `logo` ya existe).
- Editar textos/nombres/cargos de los testimonios (solo se asignan logos).
- Rediseño del panel/tema de la sección (se mantiene el tema claro del SPEC 49).
- Aplicar el mismo tratamiento a "Casos de éxito" (es otra sección; iría en su propio spec).

---

## Data model

Este spec no introduce estructuras nuevas ni cambia el schema de TinaCMS. El campo `logo` ya existe en cada item de `testimonials.items[]`.

Solo se rellena el contenido en `src/content/home/index.json` para los 3 testimonios existentes:

```
// testimonials.items[i].logo
Boticas Hogar y Salud                     → "images/testimonials/logo-boticas-y-hogar-salud.png"
Cámara de Comercio e Industria de Arequipa → "images/testimonials/logo-camara-de-comercio-arequipa.png"
Grupo Gloria                              → "images/testimonials/logo-grupo-gloria.svg"
```

El campo `avatar` deja de usarse en la tarjeta (se conserva en el schema por compatibilidad, pero el diseño ya no lo pinta).

---

## Implementation plan

Cada paso deja el sitio funcional y es commiteable por sí solo.

1. **Asignar logos en el contenido.**
   En `src/content/home/index.json`, poner el `logo` de cada uno de los 3 items de `testimonials.items[]` según el mapeo del Data model. Prueba manual: los 3 logos aparecen en la sección.

2. **Desktop — logo en columna izquierda, sin chip ni placeholder.**
   En `src/components/shared/TestimonialCard.tsx`, en el bloque desktop (`md:grid md:grid-cols-[240px_1fr]`):
   - Eliminar el SVG del frame magenta (`FRAME_PATH`) y la `<img>` con `frameSrc`/placeholder de la columna izquierda.
   - Renderizar en esa columna el logo (`logoSrc`) con `object-contain`, centrado, a un tamaño legible (p. ej. alto acotado tipo `max-h-[96px]` y ancho contenido). Sin fondo magenta.
   - Si no hay logo: mostrar el nombre de la empresa (`company`) como texto en esa columna.
   - Quitar el logo pequeño duplicado que hoy va junto al texto (bloque `logoSrc && !useLogoAsAvatar`).
   Prueba manual: en desktop se ve el logo a la izquierda (sin marco), y el texto/nombre/cargo a la derecha.

3. **Mobile — logo arriba del testimonio, nombre + cargo abajo.**
   En el bloque mobile (`md:hidden`) de `TestimonialCard.tsx`:
   - Eliminar el avatar (frame magenta + `<img>` con `frameSrc`).
   - Renderizar el logo (`logoSrc`) **arriba**, antes del quote (`object-contain`, alto acotado tipo `max-h-[40px]`). Si no hay logo: nombre de la empresa como texto.
   - Abajo dejar solo nombre + cargo (sin imagen).
   Prueba manual: en mobile el logo va arriba, el quote debajo, y al pie el nombre y cargo.

4. **Limpieza.**
   Quitar del componente lo que quede sin uso a raíz de lo anterior: `FRAME_PATH`, `PLACEHOLDER_AVATAR`, `useLogoAsAvatar`, `frameSrc`, `frameFit`, `photoSrc` si ya no se usan. Mantener `logoSrc`. Prueba manual: `npm run build` compila sin variables/imports muertos.

---

## Acceptance criteria

- [ ] En desktop, la tarjeta de testimonios no muestra el chip magenta ni el placeholder de silueta.
- [ ] En desktop, el logo de la empresa aparece en la columna izquierda, sin marco, centrado.
- [ ] En desktop, no hay un segundo logo duplicado junto al texto.
- [ ] En desktop se mantienen quote, descripción, nombre y cargo a la derecha.
- [ ] En mobile, el logo aparece arriba del testimonio (sobre el quote).
- [ ] En mobile, abajo queda el nombre y el cargo, sin avatar ni chip.
- [ ] Si un testimonio no tiene logo, se muestra el nombre de la empresa como texto en el lugar del logo (desktop y mobile).
- [ ] Los 3 testimonios (Boticas, Cámara Arequipa, Gloria) muestran su logo correcto.
- [ ] `npm run build` compila sin errores ni variables muertas.

---

## Decisions

- **Sí:** logo en la columna izquierda en desktop (donde estaba el chip). Es lo que pidió el cliente ("donde correspondan").
- **Sí:** en mobile el logo va arriba y abajo queda nombre **+ cargo** (no solo el nombre) para conservar el contexto de quién habla.
- **Sí:** fallback sin logo = nombre de la empresa como texto. Evita un hueco cuando aún no se cargó el logo.
- **Sí:** se retira el uso de la foto de persona (`avatar`) y del placeholder; el diseño se basa en el logo. Las fotos estaban vacías y el cliente prefiere logos.
- **No:** tocar el schema de Tina. El campo `logo` ya existe; solo se rellena el contenido.
- **No:** rediseñar el panel/tema de la sección. Se mantiene el tema claro (SPEC 49).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Logos con proporciones muy distintas (PNG horizontal vs SVG cuadrado) se ven disparejos | `object-contain` + alto acotado; centrado. Ajustar el `max-h` contra los 3 logos reales. |
| Un logo PNG sobre fondo claro con poco contraste | Los assets actuales son legibles sobre `bg-brand-purple-lightest`; si alguno no, se revisa el asset (no el layout). |
| Testimonio sin logo deja hueco | Fallback a nombre de empresa como texto. |

---

## Lo que **no** está en este spec

- Cambios de schema en Tina.
- Editar textos/nombres/cargos de los testimonios.
- Rediseño del panel/tema de la sección de testimonios.
- El mismo tratamiento en "Casos de éxito".

Cada uno, si aterriza, va en su propio spec.
