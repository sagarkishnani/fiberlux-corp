# SPEC 55 — Slider de soluciones: fondo con 3 vectores blur y cards glass parejas (fiel al Figma)

> **Estado:** Implementado
> **Depende de:** SPEC 48 (rediseño actual del slider que se ajusta), SPEC 40 (`useDragSlider`), SPEC 52 (glow de fondo con planet). No los reabre.
> **Fecha:** 2026-07-21
> **Objetivo:** Ajustar el fondo y las cards de `SolucionesSliderReact` para que coincidan con el Figma (Imagen #4): tres manchas magenta difuminadas de fondo y cards **glass parejas** (sin el degradado magenta horneado en la card activa), conservando el eyebrow `[ … ]` y toda la mecánica del slider.

## Alcance

**Dentro:**

- **Fondo con 3 vectores blur.** Componer **tres** glows decorativos magenta difuminados detrás del contenido, según la referencia:
  1. `planet.svg` — mancha grande **abajo-izquierda** (detrás del texto y las flechas). *(ya existe)*
  2. `line.svg` — streak secundario **arriba-izquierda**. *(ya existe)*
  3. **Tercer vector** (reusa `planet.svg` en otra posición/escala) — mancha **detrás de la card activa / zona derecha**, para que el glass la deje ver el magenta.
  - Reemplaza el `<div>` de glow radial CSS derecho actual por este tercer vector (para que sean 3 vectores SVG, no glow CSS suelto). Se conserva el grano sutil (`feTurbulence`).
- **Cards glass parejas.** Unificar card activa e inactiva a un mismo tratamiento **glass**: base oscura translúcida + `backdrop-blur` + borde blanco sutil + brillo interior arriba. El **magenta ya no se hornea** en la card: proviene de los vectores de fondo que se ven a través del glass.
- **Diferenciar activa vs inactiva** solo por: **texto en blanco** (activa) vs **atenuado** (inactivas), y un **borde/realce ligeramente más brillante** en la activa. Se elimina la clase con el degradado magenta radial fuerte (`.sol-card-active` actual).
- **Se conserva intacto:** el eyebrow `[ NUESTRAS SOLUCIONES ]` (desde `services.title`), la columna izquierda (título/descripción de la card activa), la pill de flechas, los bullets con viñeta, "Y más" editable por card, la fila inferior número + "Conoce más →", el motor `useDragSlider` (drag + flechas + snap + `prefers-reduced-motion`), la máscara de fade del carrusel y todos los `data-tina-field`.
- **Alcance = componente compartido:** el cambio en `SolucionesSliderReact.tsx` se propaga a las **3 páginas** (home, soporte-técnico, soluciones).

**Fuera de alcance:**

- Quitar los corchetes/eyebrow `[ SOLUCIONES ]` (se mantiene explícitamente).
- Cambiar el schema de `home.services` ni el contenido textual (títulos, descripciones, bullets, capitalización).
- Crear assets SVG nuevos dedicados para el tercer vector (se reutiliza `planet.svg`; un asset propio queda para otro spec si se quisiera).
- Tocar la mecánica del slider, el diseño comentado de SPEC 35, o `StickyCards*`.
- Rediseñar otras secciones de las 3 páginas.

---

## Modelo de datos

No introduce estructuras ni cambia el schema. Reutiliza `home.services` tal cual (`title`, `items[]` con `number`/`title`/`description`/`icon`/`bullets`/`url`). Los 3 vectores son assets estáticos (`planet.svg` ×2 + `line.svg`), no CMS. `icon` sigue sin uso visual.

---

## Plan de implementación

> Todo el trabajo vive en `src/components/shared/SolucionesSliderReact.tsx`. Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.

1. **Tercer vector de fondo.** Añadir un tercer `<img>` decorativo reusando `planet.svg` (absoluto, `pointer-events-none`, `aria-hidden`, `z-0`, con máscara radial como los otros dos) posicionado detrás de la card activa / zona derecha, y **eliminar el `<div>` de glow radial CSS derecho** actual. Ajustar posiciones/escala/opacidad de los tres para acercarse a la Imagen #4. *Verificación:* se ven 3 manchas magenta difuminadas de fondo; sin scroll horizontal (`overflow-hidden` intacto).
2. **Cards glass parejas.** Reescribir el estilo de card: mismo glass para activa e inactiva (base translúcida oscura + `backdrop-blur` + borde `white/…` sutil + `inset` highlight arriba). Eliminar la clase `.sol-card-active` con el degradado magenta radial. *Verificación:* ambas cards son glass; el magenta se ve a través, no horneado.
3. **Estado activo/inactivo.** Mantener la diferenciación por texto (blanco vs atenuado) y darle a la activa un borde/realce algo más brillante. *Verificación:* al navegar, la card activa se distingue por texto blanco y borde, no por un bloque magenta.
4. **QA visual + consola** (Chrome MCP) en las 3 páginas (home, soporte-técnico, soluciones), desktop (~1440px) y mobile (~390px), incluyendo `prefers-reduced-motion`. *Verificación:* coincide con la Imagen #4; el eyebrow sigue presente; navegación por flechas/drag correcta; sin errores en consola.

---

## Criterios de aceptación

- [ ] El fondo de la sección muestra **3 manchas magenta difuminadas** (planet abajo-izquierda, line arriba-izquierda, tercer vector detrás de la card activa/derecha); no queda glow radial CSS suelto.
- [ ] **Ambas cards** (activa e inactiva) tienen el mismo tratamiento **glass** (translúcido + blur + borde sutil); el magenta proviene del fondo, **no** de un degradado horneado en la card.
- [ ] La card **activa** se distingue por **texto blanco** y borde/realce ligeramente más brillante; las inactivas quedan con texto atenuado.
- [ ] Se conserva el **eyebrow `[ NUESTRAS SOLUCIONES ]`** (desde `services.title`), editable en Tina.
- [ ] Se conservan bullets con viñeta, "Y más" por card, fila inferior número + "Conoce más →", y todos los `data-tina-field`.
- [ ] Se conserva la mecánica del slider (flechas edge-aware, drag con snap, sincronización izquierda ↔ card activa, `prefers-reduced-motion`).
- [ ] Sin scroll horizontal; el cambio se ve en las **3 páginas**; `npm run dev` y `npm run build` sin errores/warnings nuevos.

## Decisiones tomadas y descartadas

- **Sí:** **3 vectores** = reusar `planet.svg` (×2) + `line.svg`, reemplazando el glow radial CSS derecho por el tercer vector. Elegido por el usuario ("reusar planet/line + 1 más"); evita assets nuevos.
- **No:** crear 3 SVG dedicados o usar blobs CSS. Descartado por la respuesta del usuario.
- **Sí:** **glass puro parejo**; quitar el degradado magenta interno de la card activa. Elegido por el usuario; el magenta viene del fondo a través del glass (fiel a la Imagen #4).
- **No:** suavizar o conservar el degradado horneado. Descartado por la respuesta del usuario.
- **Sí:** **mantener el eyebrow `[ … ]`** aunque el Figma de referencia no lo muestre. Pedido explícito del usuario.
- **Sí:** alcance = **componente compartido** (3 páginas). Elegido por el usuario.
- **No:** variante solo para la página de soluciones. Descartado.

### Ajustes durante QA (fiel al Figma — matizan decisiones previas)

- **El fill de la card NO es "glass puro sin degradado".** La referencia real (Figma) usa un **radial gradient `#3B0E30 → #96237A → #3B0E30`** (aubergine arriba/bordes → magenta abajo-centro) para que **ninguna zona quede negra**. Reemplaza la decisión inicial de "glass puro, magenta solo del fondo".
- **Textura del Figma:** cada card lleva `public/images/soluciones/black.png` tileada, **opacity 8% + `mix-blend-overlay`** (valores exactos del inspector), que oscurece/da grano y evita que el magenta salga sobresaturado.
- **Opacidad del fill radial de la activa** bajada a **~0.30** por pedido del cliente (magenta más sutil; el brillo fuerte lo aporta el bloom de fondo).
- **Sin brillo blanco superior:** se quitó el `linear-gradient` blanco y el `inset` highlight de las cards (la referencia no lo tiene). Queda solo el borde blanco 1.5px.
- **"Conoce más →"** en color **`#D5A7CA`** (Poppins medium 20px, del Figma).
- **Dimensiones desktop:** card más **alto y angosto** (formato retrato ~460×627): ancho `md:52%`, `min-h 620px`, borde `1.5px`, radio `30px`.
- **Bloom de fondo** agrandado/brillante (planet ×2 + line) para que suba por detrás de la card activa; la peek queda aubergine tenue (no negra).

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| Con glass parejo y sin degradado horneado, la card activa **pierde contraste** o "desaparece" en zonas sin glow. | El tercer vector se posiciona detrás de la card activa; la activa mantiene borde/realce más brillante y texto blanco; ajustar en QA (paso 3–4). |
| Los 3 vectores **sobre-iluminan** el fondo o generan banding. | Opacidades y máscaras radiales acotadas; grano sutil ya presente; QA de intensidad en paso 4. |
| El tercer `planet.svg` reposicionado **desborda** y genera scroll horizontal. | `<section>` mantiene `overflow-hidden`; `<img>` absoluto con tamaños/posiciones acotados y `pointer-events-none`. |
| El `backdrop-blur` de cards glass parejas impacta rendimiento en mobile con varias cards visibles. | Solo hay 1 card + peek visibles; blur moderado; QA en mobile (paso 4). |

## QA realizada

- **3 páginas verificadas en vivo (Chrome MCP):** home (`/`), soporte-técnico (`/soporte-tecnico`) y soluciones (`/soluciones`). En todas: 3 manchas magenta difuminadas de fondo, cards glass parejas (activa e inactiva con el mismo glass), magenta visible a través del glass desde el fondo, card activa con texto blanco + borde/realce más brillante, eyebrow `[ NUESTRAS SOLUCIONES ]` conservado.
- **Desktop (1440px) y mobile (390px):** sin scroll horizontal (`scrollWidth == innerWidth`). Bullets, "Y más", fila número + "Conoce más →" intactos.
- **Consola:** 0 errores en las 3 páginas (1 warning pre-existente, no nuevo).
- Implementación: tercer vector = segunda instancia de `planet.svg` a la derecha (reemplaza el glow radial CSS); estilos `.sol-card` (glass base parejo) + `.sol-card-active` (solo realce, sin degradado magenta horneado).
- Nota: `npm run build` aislado no se corrió por el datalayer de Tina activo en :9000 (dev server en marcha); no se tocó schema/tipos, así que la parte Tina del build no cambia.
