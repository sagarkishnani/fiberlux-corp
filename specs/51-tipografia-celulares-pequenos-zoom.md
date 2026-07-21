# SPEC 51 — Tipografía en celulares muy pequeños: zoom-out global ≤375px

> **Estado:** Aprobado
> **Depende de:** SPEC 30 (mecanismo de `zoom` sobre `#a11y-content` del panel de accesibilidad)
> **Fecha:** 2026-07-21
> **Objetivo:** Reducir ~10% todo el contenido en pantallas de ancho ≤375px aplicando `zoom: calc(0.9 * var(--a11y-font-scale))` sobre el wrapper `#a11y-content`, compuesto con el zoom de "Agrandar texto", para que las letras (incluidos los tamaños px inline) no se vean tan grandes en celulares muy pequeños.

---

## Alcance

**Dentro:**

- **Regla `@media (max-width: 375px)`** que aplica un **`zoom` < 1 (factor 0.9)** al wrapper de contenido **`#a11y-content`**, achicando de forma **uniforme** todo lo que hay dentro: texto (px inline + rem + escala `clamp`), imágenes y espaciados.
- **La regla vive en el bloque `styles` de `src/components/shared/AccessibilityPanel.tsx`** — que es donde el CSS global realmente se envía (server-rendered con la isla), ya que `global.css` no se bundlea.
- **Composición con "Agrandar texto"**: el zoom de pantalla pequeña **multiplica** al `--a11y-font-scale` (`zoom: calc(0.9 * var(--a11y-font-scale))`), de modo que la accesibilidad sigue funcionando encima (p. ej. a escala 1.2 → 0.9 × 1.2 = 1.08). Se cubren tanto el estado normal como el `.a11y-scaled`.
- **Solo afecta ≤375px**; por encima de 375px nada cambia.
- **QA** en anchos ≤375 (375, 360, 320) verificando que el layout no se rompe y que el **Header fijo** sigue bien posicionado (el `zoom` sobre `#a11y-content` puede afectar el contexto de `position: fixed`).

**Fuera de alcance (para futuros specs):**

- **Reducciones de tipografía por componente** o "solo texto" (no se tocan componentes uno por uno).
- **Cambiar la escala tipográfica** (`clamp` en `tailwind.config.mjs`) ni los tamaños `text-[Npx]` inline.
- **Otros breakpoints** (>375px queda igual).
- **Tocar `global.css`** (código muerto, no se bundlea).
- **Cambiar el mecanismo de `zoom`** del panel de accesibilidad ni sus otras funciones.
- **Reducción progresiva por ancho** (se usa un factor fijo, no un `clamp`/vw).

---

## Modelo de datos

Esta feature **no introduce estructuras de datos nuevas**. Es una sola regla CSS (media query) que reutiliza la variable existente `--a11y-font-scale` y el wrapper `#a11y-content` (definidos por el SPEC 30). No hay cambios de schema, contenido ni tipos.

**Factor de reducción:** `0.9` (10% más pequeño). Es el único "parámetro"; si luego se quiere más/menos, se ajusta ese número.

---

## Plan de implementación

> Todo el cambio vive en el bloque `styles` de `src/components/shared/AccessibilityPanel.tsx`. Un solo paso de código + QA. Deja el sitio ejecutable (`npm run dev`).

1. **Agregar la media query en el bloque `styles`** de `AccessibilityPanel.tsx`, después de la regla de zoom de accesibilidad existente (`html.a11y-scaled #a11y-content { zoom: var(--a11y-font-scale); }`), para que componga bien:

   ```css
   /* Celulares muy pequeños: achica ~10% todo el contenido (incluye px inline),
      multiplicando por el zoom de accesibilidad para no romperlo. */
   @media (max-width: 375px) {
     #a11y-content,
     html.a11y-scaled #a11y-content {
       zoom: calc(0.9 * var(--a11y-font-scale));
     }
   }
   ```

   La doble selección cubre el estado normal (`#a11y-content`, con `--a11y-font-scale` = 1 → zoom 0.9) y el estado con "Agrandar texto" activo (`html.a11y-scaled #a11y-content`, que por orden/‌especificidad gana sobre la regla base y compone el factor). *Verificación:* en un viewport de 360px, los títulos grandes (`text-[40px]`, `text-[48px]`, etc.) y el texto en general se ven ~10% más chicos; en 390px nada cambia.

2. **QA visual + Header + accesibilidad** en anchos ≤375 (375, 360, 320) sobre páginas representativas (home, una solución, un subservicio, contacto). Confirmar: (a) el texto se ve más pequeño y las secciones dejan de verse apretadas/desbordadas; (b) el **Header fijo** sigue en su lugar al hacer scroll; (c) activar "Agrandar texto" sigue agrandando (composición correcta); (d) en 390px+ no hay cambios. *Verificación:* `npm run build` sin errores/warnings nuevos; sin errores en consola; Header y layout correctos en los tres anchos.

**Notas del plan:**

- El QA usa Playwright MCP (screenshots en `.playwright-screens/`), emulando 375/360/320px.
- El riesgo principal (Header fijo bajo `zoom`) se valida explícitamente en el paso 2.

---

## Criterios de aceptación

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] En viewports **≤375px** todo el contenido (texto px inline + rem, imágenes, espaciados) se ve **~10% más pequeño** de forma uniforme.
- [ ] En viewports **>375px** (p. ej. 390px, desktop) **no hay ningún cambio** respecto a hoy.
- [ ] Los **títulos grandes** que usan px inline (`text-[40px]`, `text-[48px]`, `text-[56px]`, etc.) también se reducen (no solo la escala `clamp`).
- [ ] Activar **"Agrandar texto"** en ≤375px sigue **agrandando** el contenido (el factor 0.9 se **multiplica** con el escalado de accesibilidad, no lo anula).
- [ ] El **Header fijo** se mantiene correctamente posicionado al hacer scroll en ≤375px (el `zoom` no lo descoloca).
- [ ] No hay **scroll horizontal** ni recortes introducidos por el zoom en ≤375px.
- [ ] La regla vive en el bloque `styles` de `AccessibilityPanel.tsx` (no en `global.css`).
- [ ] No se modificó la escala tipográfica de `tailwind.config.mjs` ni componentes individuales.

---

## Decisiones tomadas y descartadas

- **Sí:** **`zoom` sobre `#a11y-content`** como lever global. Confirmado; es el único mecanismo que achica también los cientos de tamaños **`text-[Npx]` inline** (que son la mayoría de los títulos grandes) y ya está probado por el SPEC 30.
- **No:** reducir `html { font-size }`. Solo afectaría rem; los `text-[Npx]` inline (los que más "molestan" en pantallas chicas) quedarían igual.
- **No:** bajar tamaños **componente por componente / solo texto**. Hay cientos de tamaños px inline; sería mucho trabajo, frágil y fuera de proporción para el objetivo.
- **Sí:** **breakpoint ≤375px** (`max-width: 375px`). Confirmado ("de 375px hacia abajo", incluye 375).
- **Sí:** **factor fijo 0.9** (10% menos) en un solo escalón. Confirmado; simple y predecible.
- **No:** reducción **progresiva por ancho** (clamp/vw). Descartada por el cliente; el escalón fijo es más fácil de razonar y ajustar.
- **Sí:** **componer (multiplicar)** con `--a11y-font-scale` para no romper "Agrandar texto". Es la forma correcta de convivir con el zoom de accesibilidad existente.
- **Sí:** la regla en `AccessibilityPanel.tsx` (no en `global.css`). Es donde el CSS global realmente se envía; `global.css` no se bundlea.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El `zoom` sobre `#a11y-content` **descoloca el Header fijo** (crea contexto de containing-block) en ≤375px. | El SPEC 30 ya lidia con esto (FABs/panel viven fuera de `#a11y-content`); QA explícito del Header al scrollear en 375/360/320px; si falla, evaluar aplicar el zoom con un enfoque que no afecte `position: fixed`. |
| **Composición** incorrecta con "Agrandar texto": la regla base gateada (`html.a11y-scaled …`) podría ganar y anular el 0.9. | Incluir la variante `html.a11y-scaled #a11y-content` en la media query (después en el stylesheet) para que gane por orden; QA activando el slider de texto en ≤375px. |
| `zoom` tiene **soporte/represento distinto** entre navegadores (Chrome/Safari/Firefox). | Es la misma propiedad que ya usa el sitio para accesibilidad; QA en Chrome (principal) y, si se puede, Safari iOS (donde están los 375px reales). |
| El zoom **también achica imágenes/toques** (áreas táctiles) en pantallas chicas. | Es el trade-off aceptado (zoom uniforme); 10% es leve. Si algún control queda muy chico, se revisa puntualmente en otro spec. |
| Un ancho de **exactamente 375px** cae dentro del rango y algún usuario lo nota. | Confirmado por el cliente que 375 entra ("hacia abajo, incluye 375"). |

---

## Qué **NO** entra en este spec

- Reducciones de tipografía por componente o "solo texto".
- Cambios en la escala `clamp` de `tailwind.config.mjs` o en los `text-[Npx]` inline.
- Otros breakpoints (>375px).
- Tocar `global.css`.
- Cambiar el mecanismo de `zoom`/accesibilidad.
- Reducción progresiva por ancho (clamp/vw).

Cada uno de estos, si aterriza, va en su propio spec.
