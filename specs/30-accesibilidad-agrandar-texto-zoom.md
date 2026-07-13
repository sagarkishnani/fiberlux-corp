# SPEC 30 — "Agrandar texto" de accesibilidad escala TODO el texto (zoom del contenido)

> **Estado:** Implementado
> **Depende de:** Spec 23 (introdujo el `.a11y-fab` y el patrón `#a11y-content`). No lo reabre; reutiliza su wrapper.
> **Fecha:** 2026-07-13
> **Objetivo:** Reemplazar el escalado por `html { font-size }` (que solo agranda texto en `rem`/`em`) por un `zoom` gateado sobre `#a11y-content`, para que **todo** el texto crezca al usar "Agrandar texto" y el slider — incluidos los textos en `px` fijo que hoy se quedan igual.

## Alcance

**Dentro:**

- En `AccessibilityPanel.tsx`: **quitar** la regla `html { font-size: calc(100% * var(--a11y-font-scale)) }` y sustituirla por `html.a11y-scaled #a11y-content { zoom: var(--a11y-font-scale) }`.
- Gatear el zoom tras una clase `a11y-scaled` que solo se añade cuando `fontScale !== 1` (a escala 100% → cero efecto, cero riesgo sobre el header fijo).
- Añadir el toggle de esa clase en dos sitios: `applyState()` (`AccessibilityPanel.tsx`) y el script inline de `<head>` (`BaseLayout.astro`) — para que no haya FOUC / salto al recargar con el ajuste ya activo.
- Como el zoom actúa sobre `#a11y-content`, **cubre automáticamente todo el contenido**: páginas, formularios, reclamos, blog, header y footer (opción "todo incluido").

**Fuera de alcance (para otros specs):**

- Tocar el botón de WhatsApp o el panel de accesibilidad en sí (viven **fuera** de `#a11y-content` a propósito; son controles, no deben escalar).
- Convertir `px → rem` en tokens de Tailwind o componentes (el zoom lo vuelve innecesario).
- El ajuste "Espaciado entre letras" (`--a11y-letter-spacing` sobre `body`) — sigue igual, no lo toca.
- Los efectos de color (contraste/saturación/invertir) — su `filter` sobre `#a11y-content` se mantiene y **compone** con el zoom.
- Rediseñar el panel, badge o cualquier control.

## Modelo de datos

No introduce ni modifica estructuras de datos. Reutiliza la variable CSS existente `--a11y-font-scale` y el estado `fontScale` del `A11yState`; solo cambia **cómo** se aplica esa variable (zoom en vez de `html font-size`) y añade el toggle de una clase.

## Plan de implementación

> Un solo cambio funcional repartido en dos archivos. Tras aplicarlo: `npm run dev` levanta sin errores y "Agrandar texto" agranda todo el texto del sitio.

1. **Sustituir el mecanismo de escalado** en `AccessibilityPanel.tsx` (bloque `styles`):
   - **Quitar** la regla actual:
     ```css
     html { font-size: calc(100% * var(--a11y-font-scale)); }
     ```
   - **Añadir** en su lugar el zoom gateado sobre el wrapper de contenido:
     ```css
     html.a11y-scaled #a11y-content { zoom: var(--a11y-font-scale); }
     ```
   - *Test:* con la clase presente y `--a11y-font-scale: 1.3`, un texto en `px` (p. ej. `body-md` = 16px) crece de forma visible; a escala 100% (sin clase) nada cambia.

2. **Togglear la clase `a11y-scaled` en `applyState()`** (`AccessibilityPanel.tsx`), junto a los `classList.toggle` existentes:
   ```js
   r.classList.toggle("a11y-scaled", s.fontScale !== 1);
   ```
   - *Test:* mover el slider a 100% quita la clase; a cualquier otro valor la pone.

3. **Reflejar el toggle en el script inline de `<head>`** (`BaseLayout.astro`, junto a los `classList.add` pre-pintado), para evitar salto al recargar con el ajuste guardado:
   ```js
   if (s.fontScale && s.fontScale !== 1) r.classList.add("a11y-scaled");
   ```
   - *Test:* recargar la página con "Agrandar texto" activo no produce un flash de tamaño normal → grande.

## Criterios de aceptación

- [x] Con "Agrandar texto" (o el slider > 100%) activo, **crece todo el texto** de una página de contenido: títulos, cuerpo (`body-*`), captions (`caption-sm`), y textos en `px` fijo / `text-[NNpx]` que antes no crecían.
- [x] Los textos de **formularios y reclamos** (con `fontSize` inline en `px`) también crecen.
- [x] El **Header** sigue visible, alineado y funcional con el zoom activo (no se descoloca ni desborda).
- [x] El botón de **WhatsApp**, el **FAB de accesibilidad** y el **panel** NO cambian de tamaño (quedan fuera de `#a11y-content`).
- [x] A escala **100%** no hay ningún cambio visual respecto a hoy (la clase `a11y-scaled` no está presente → `zoom` no se aplica).
- [x] Recargar con el ajuste guardado **no produce flash** de tamaño (el script de `<head>` añade la clase pre-pintado).
- [x] Los efectos de **contraste / saturación / invertir** siguen funcionando y **componen** con el zoom (ambos sobre `#a11y-content`).
- [x] El slider muestra el % correcto y "Restablecer valores" vuelve a 100% quitando el zoom.
- [x] `npm run dev` levanta sin errores nuevos.

## Decisiones tomadas y descartadas

- **(a) `zoom` gateado sobre `#a11y-content`.** Elegido. Escala el 100% del contenido sin importar la unidad (`px`, `rem`, inline), con ~2–3 líneas y cero mantenimiento futuro; reutiliza el wrapper que ya introdujo Spec 23. Aceptado el efecto colateral: también agranda imágenes y espaciados dentro del contenido.
- **No: barrido `px → rem`** en tokens de Tailwind + ~40 componentes. Descartado: toca demasiados archivos y cualquier `px` nuevo reintroduce el bug (deuda permanente).
- **No: híbrido (solo tokens de Tailwind a `rem`).** Descartado: dejaría fuera los `text-[NNpx]` arbitrarios y los `fontSize` inline.
- **Gatear tras la clase `a11y-scaled` (no `zoom` incondicional).** Elegido para que a escala 100% no haya ningún efecto ni establezca contexto que pueda afectar al header fijo. El coste es togglear la clase en dos sitios (componente + script de `<head>`).
- **Mantener el escalado de `--a11y-letter-spacing` sobre `body` como está.** No se toca; es ortogonal al zoom.
- **No: mover el Header fuera de `#a11y-content`.** Descartado: la opción "todo incluido" quiere que el texto del header también crezca; sacarlo lo dejaría sin escalar.

## Riesgos identificados

- **Header fijo bajo el zoom (riesgo principal).** El `Header` es `position: fixed` (`HeaderReact.tsx:264`) y vive **dentro** de `#a11y-content` (`BaseLayout.astro:179`). Distintos navegadores tratan `zoom` sobre un ancestro de un descendiente `fixed` de forma no idéntica; podría descolocar o escalar de más la barra. **Mitigación:** QA en vivo del header con el zoom activo (desktop y móvil). *Fallback si se rompe:* aplicar el zoom solo a `<slot />` + footer (envolviéndolos) y dejar el header con su propio escalado, a costa de perder algo de "todo incluido" en el header.
- **Composición zoom + filter.** Contraste/saturación/invertir aplican `filter` sobre el mismo `#a11y-content`. Verificar que zoom + filter simultáneos no degraden nitidez ni layout.
- **Soporte de `zoom`.** Estándar y soportado en Chromium, Safari y Firefox recientes; en navegadores muy antiguos el ajuste simplemente no escalaría (degradación suave, sin romper nada).
