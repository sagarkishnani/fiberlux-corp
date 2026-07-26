# SPEC 71 — Sitio con vida: base de animaciones (repeat, SVG draw, count-up, parallax) + Home

> **Estado:** Implementado
> **Depende de:** SPEC 69 (base `data-reveal` + Motion), SPEC 70 (patrón de scroll fx)
> **Fecha:** 2026-07-26
> **Objetivo:** Ampliar la base de animaciones (re-disparo para bloques izquierda/derecha, dibujado de SVGs de línea, count-up de cifras, parallax sutil y micro-interacciones hover) y aplicarla a la página Home como piloto para dar sensación de sitio interactivo.

---

## Scope

**In:**

- **Base ampliada** (Motion, sobre el `reveal.ts` de SPEC 69):
  - **`data-reveal="left|right"` + `data-reveal-repeat`** → aparecen desde su lado y **re-aparecen/desaparecen** al entrar/salir del viewport (los bloques de dos columnas). Los bloques completos (`up`/`fade`) siguen animando **una vez**.
  - **`data-svg-draw`** en un SVG inline de línea → anima el trazo (`stroke-dashoffset`) al entrar. Íconos rellenos usan `fade`/`scale` (no draw).
  - **`data-count-up`** en una cifra → cuenta de 0 al valor al entrar (respeta prefijo/sufijo tipo `+`, `%`, `K`).
  - **`data-parallax="<factor>"`** → traslación vertical sutil ligada al scroll (Motion `scroll()`), para fondos/glows.
- **Micro-interacciones hover** (CSS/Tailwind) en cards y botones de Home (lift/scale/glow suaves).
- **Aplicación en Home** (`src/pages/index.astro` y sus secciones): fade-up en bloques completos, left/right donde haya dos columnas (ej. BannerApp), count-up en Stats, parallax en glows, hover en cards.
- **Accesibilidad:** todo respeta `prefers-reduced-motion` (sin animación; contenido visible; count-up muestra el valor final).

**Out of scope (futuro):**

- Aplicar a otras páginas (nosotros, soluciones, subservicios, blog, contacto, soporte, formas de pago, casos, app…): specs cortos por página.
- **HeroHome** (Spline 3D + preloader + logo animado): se deja intacto para no romper esa coreografía.
- SolucionesSlider (ya animado en SPEC 69).
- Config de animaciones desde Tina.
- Animar SVGs rellenos con draw (solo `fade`/`scale`).

---

## Data model

No hay datos nuevos de Tina. Atributos y piezas (amplían SPEC 69):

**1. Atributos** (en `reveal.ts` / módulo fx):

```
data-reveal="left|right" data-reveal-repeat   → direccional que re-anima al entrar/salir
data-svg-draw [data-draw-duration="1.2"]      → dibuja el trazo del SVG de línea
data-count-up [data-count-duration="1.6"]     → cuenta 0→valor (mantiene +, %, K, etc.)
data-parallax="0.15"                          → parallax vertical sutil (factor 0–1)
```

**2. Módulos** (`src/scripts/`):
- `reveal.ts` (ampliado): soporta `data-reveal-repeat` (no deja de observar; al salir vuelve al estado oculto) y `data-svg-draw` (mide `getTotalLength()` de cada `path/line/polyline`, setea `stroke-dasharray`/`dashoffset` y anima a 0).
- `fx.ts` (nuevo): `data-count-up` (parseo de número + `animate(0→valor)` con `onUpdate`) y `data-parallax` (`scroll()` que traslada `y` según factor). Cargado en `BaseLayout` (no en mantenimiento), como `reveal.ts`.

**3. Anti-FOUC:** los nuevos estados ocultos siguen el patrón `.reveal-js` de SPEC 69 (draw: trazo oculto; count-up: muestra el valor final si no hay JS; parallax: sin transform inicial).

**4. Hover (CSS):** clases utilitarias (ej. `transition + hover:-translate-y-1 + hover:shadow`) en las cards/botones de Home; sin JS.

**5. Aplicación en Home** (secciones → efecto):

```
HomePartners          → fade-up (bloque) + hover en logos
TestimonialSlider     → fade-up (bloque)
Stats (Por qué…)      → fade-up + count-up en las cifras
CertificacionesSlider → fade-up (bloque) + parallax en su glow
BannerApp             → left/right (imagen ↔ texto) con repeat
BlogPreview           → fade-up (bloque) + hover en cards
HeroHome              → sin cambios (fuera de scope)
SolucionesSlider      → ya animado (SPEC 69)
```

---

## Implementation plan

1. **Base: re-disparo (`data-reveal-repeat`).**
   En `reveal.ts`, para elementos con `data-reveal-repeat`: no dejar de observar; al entrar animar a visible, al salir devolver al estado oculto (para re-animar al re-entrar). Los que no tienen repeat siguen una sola vez. Prueba manual: un bloque `left`/`right` con repeat aparece al bajar y desaparece al subir; uno sin repeat queda fijo.

2. **Base: dibujado de SVG (`data-svg-draw`).**
   En `reveal.ts`, para `[data-svg-draw]`: por cada `path/line/polyline/circle` medir `getTotalLength()`, setear `stroke-dasharray`/`stroke-dashoffset = length` y, al entrar en viewport, animar `dashoffset → 0` (duración configurable). Anti-FOUC vía CSS. Prueba manual: un SVG de línea de prueba se "dibuja" al entrar.

3. **fx: count-up (`data-count-up`).**
   Nuevo `src/scripts/fx.ts`: para `[data-count-up]`, parsear el texto (número + prefijo/sufijo), y al entrar animar 0→valor con `animate` + `onUpdate` (formateo con separador de miles, preservando `+`/`%`/`K`). Reduced-motion → valor final directo. Prueba manual: una cifra de prueba cuenta al entrar.

4. **fx: parallax (`data-parallax`).**
   En `fx.ts`, para `[data-parallax="f"]`, con `scroll()` trasladar `y` proporcional al progreso (factor `f`), sutil. Reduced-motion → sin efecto. Cargar `fx.ts` en `BaseLayout` (no en mantenimiento). Prueba manual: un fondo/glow se mueve levemente distinto al scroll.

5. **Aplicar a Home.**
   En `index.astro` y componentes de sus secciones, colocar los atributos según el Data model §5: fade-up en HomePartners/Testimonios/Certificaciones/Blog, left/right+repeat en BannerApp, count-up en Stats, parallax en el glow de Certificaciones. Prueba manual: al scrollear Home, cada sección anima como corresponde.

6. **Micro-interacciones hover en Home.**
   Añadir clases de hover (lift/scale/glow suaves, con `transition`) a las cards de Blog, logos de Partners y cifras/cards de Stats donde aporte. Respetar reduced-motion. Prueba manual: hover en esas cards da feedback sutil.

---

## Acceptance criteria

- [ ] Un bloque `data-reveal="left|right"` con `data-reveal-repeat` aparece desde su lado al entrar y **vuelve a ocultarse** al salir del viewport (re-anima al re-entrar).
- [ ] Un bloque completo (`up`/`fade`) anima **una sola vez**.
- [ ] Un SVG con `data-svg-draw` dibuja su trazo al entrar.
- [ ] Una cifra con `data-count-up` cuenta de 0 al valor (conservando `+`/`%`/etc.).
- [ ] Un elemento con `data-parallax` se traslada sutilmente distinto al scroll.
- [ ] En Home: Partners/Testimonios/Certificaciones/Blog hacen fade-up; BannerApp entra izquierda/derecha con repeat; Stats hace count-up; el glow de Certificaciones tiene parallax; las cards tienen hover.
- [ ] `HeroHome` y `SolucionesSlider` quedan **sin cambios** de comportamiento.
- [ ] Con `prefers-reduced-motion`, nada anima: todo visible, cifras en su valor final, sin parallax; sin contenido oculto.
- [ ] Sin FOUC ni saltos de layout; `npm run build` compila sin errores.

---

## Decisions

- **Sí:** todo se construye sobre la base `data-reveal` (SPEC 69) con Motion; sin dependencias nuevas.
- **Sí:** re-disparo **solo** en bloques izq/der (`data-reveal-repeat`); los bloques completos animan una vez (menos ruido visual).
- **Sí:** SVG **draw** solo en SVGs de línea; íconos rellenos usan `fade`/`scale`.
- **Sí:** count-up, stagger, parallax y hover como capacidades opt-in por sección (se aplican donde aportan).
- **Sí:** Home como piloto; el resto de páginas en specs cortos posteriores reutilizando esta base.
- **No:** tocar HeroHome (3D/preloader/logo) ni SolucionesSlider (ya animado).
- **No:** config desde Tina (por ahora atributos en código).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El re-disparo (aparecer/desaparecer) puede sentirse inquieto | Limitado a bloques izq/der; transición suave; se puede quitar el `repeat` de un bloque puntual. |
| `getTotalLength()` en SVGs sin trazo (rellenos) falla o no se ve | `data-svg-draw` solo en SVGs de línea; con try/catch se ignora si no aplica. |
| Count-up sobre cifras no numéricas (texto) | Parseo tolerante: si no hay número, se deja el texto tal cual. |
| Parallax + Lenis (scroll suave) pueden desincronizar | `scroll()` usa el scroll nativo que Lenis controla; factores bajos; se verifica. |
| Reveal en islands `client:visible` (Stats/Blog) pisado por hidratación | Igual que SPEC 69: atributos en wrappers; Motion escribe inline que la hidratación no elimina. |
| Muchos `will-change`/animaciones activas afectan rendimiento | Se liberan tras animar; parallax/repeat acotados a pocos elementos por vista. |

---

## Lo que **no** está en este spec

- Aplicar animaciones a páginas distintas de Home.
- HeroHome y SolucionesSlider.
- Draw en SVGs rellenos / íconos.
- Configuración de animaciones desde Tina.

Cada uno, si aterriza, va en su propio spec.
