# SPEC 96 — Hero Home: globo de partículas que morphea a las soluciones (Three.js)

> **Estado:** Implementado
> **Depende de:** SPEC 18/44 (hero 3D + poster mobile), SPEC 88 (patrón `heroBackground` modes), SPEC 89 (SolucionesScroll — destino de los links), SPEC 92 (NodeField, modo de fondo actual), SPEC 80 (i18n `_en`/`tField`)
> **Fecha:** 2026-08-06
> **Objetivo:** Añadir un nuevo modo de fondo del hero `morph` — un globo de partículas de conectividad (Three.js) que, al pulsar un trigger visible, se transforma en 4 nodos-solución clicables y vuelve solo a los ~6 s.

---

## Sección 2 — Alcance

**Dentro:**

- **Nuevo modo `heroBackground: "morph"`** en el enum del CMS, hermano de `3d`/`video`/`imagen`/`waveform`/`nodefield`. Los modos existentes quedan **intactos**; `morph` es aditivo.
- **Nuevo componente `src/components/effects/MorphSolutions.tsx`** (React island, Three.js): renderiza un `<canvas>` WebGL con ~8–15k partículas moradas de marca sobre transparente (la sección pone el negro `#0a0a0a`).
- **Dependencia nueva `three`** (+ `@types/three`). Se justifica por el pedido de "gran impacto"; el proyecto ya usa WebGL2 (`WaveformEffect`) y Spline.
- **Estado reposo — globo de conectividad:** las partículas forman una esfera tipo globo de red (puntos sobre la superficie), con **rotación lenta** continua y leve parallax/glow. Autoplay.
- **Trigger visible** (cue editable, ej. "Explora nuestras soluciones" + indicación de pulsar): al activarlo (click/tap/Enter) se dispara el morph.
- **Morph a 4 nodos-solución:** las partículas se reagrupan en **4 cúmulos etiquetados** (Data Center/Cloud, Conectividad, Ciberseguridad, Servicios Gestionados), cada uno con **label + ícono** y enlazado a su página de solución. Son focos clicables reales (no solo visual).
- **Fade del contenido del hero:** al morphear, el H1 + subtítulo + botones hacen **fade-out**; al revertir, **fade-in**. Los 4 nodos son protagonistas durante el estado morph.
- **Auto-revert a ~6 s:** transcurridos ~6 s sin interacción en estado morph, re-morphea al globo y reaparece el texto. Si el cursor está sobre un nodo, se pausa el timer para no interrumpir la lectura.
- **Datos editables en Tina:** nuevo subgrupo en `home.hero` con el `triggerLabel` y un `solutionNodes[]` de `{ label, url, icon }`, todos con sibling `_en` (i18n). El componente lee vía `tField`.
- **Mobile — versión ligera:** el morph **sí corre** en mobile, con conteo de partículas y calidad reducidos (DPR cap, menos puntos). Reemplaza el poster estático de SPEC 44 **solo para este modo**.
- **Accesibilidad:** `prefers-reduced-motion: reduce` → sin animación (frame estático del globo) y los 4 nodos-solución se ofrecen como **links accesibles** (lista navegable por teclado) para no esconder navegación tras el efecto. Señal `fbx:hero-scene-loaded` para el `SitePreloader` como los demás modos.

**Fuera de alcance (otros specs):**

- Cambiar el contenido/orden/diseño de la sección `SolucionesScroll` (SPEC 89); este spec solo **enlaza** a las páginas de solución.
- Aplicar el morph fuera del hero del home (otras páginas/heros).
- Editar desde Tina la forma del globo, colores, conteo de partículas o el tiempo de auto-revert (van horneados/constantes; solo el copy y los nodos son editables).
- Traducir contenidos que ya cubre SPEC 80 fuera de los campos nuevos aquí definidos.
- Réplica 1:1 del shader del Framer de referencia (se hace una interpretación de marca, no copia del template).

---

## Sección 3 — Modelo de datos

**Contenido nuevo en Tina** (colección `home`, dentro del grupo `hero`, en `tina/config.ts`):

```js
// home.hero → añadir "morph" al enum de heroBackground (options existentes intactas)
{ name: "heroBackground", type: "string",
  options: ["3d", "video", "imagen", "waveform", "nodefield", "morph"] }

// home.hero → nuevo subgrupo para el modo morph
{ type: "object", name: "morph", label: "Hero — modo Morph (globo → soluciones)",
  fields: [
    { type: "string", name: "triggerLabel",    label: "Texto del trigger (ES)" },
    { type: "string", name: "triggerLabel_en", label: "Texto del trigger (EN)" },
    { type: "object", name: "solutionNodes", label: "Nodos-solución (4)", list: true,
      ui: { itemProps: (i) => ({ label: i?.label || "Nodo" }) },
      fields: [
        { type: "string", name: "label",    label: "Label (ES)" },
        { type: "string", name: "label_en", label: "Label (EN)" },
        { type: "string", name: "url",      label: "URL destino (página de solución)" },
        { type: "string", name: "icon",     label: "Ícono",
          options: ["datacenter", "conectividad", "ciberseguridad", "gestionados"] },
      ] },
  ] }
```

- `icon` es un enum cerrado mapeado a un glifo de `react-icons/fa6` en el componente (mismo patrón que `RubrosReact`/SPEC 05), no una URL libre.
- Contenido inicial en `src/content/home/index.json`: `heroBackground` se puede dejar como está o cambiar a `"morph"`; `morph.solutionNodes` se siembra con las 4 soluciones y sus URLs reales (las páginas de la colección `services`).
- Los `_en` vacíos caen a ES vía `tField` (convención SPEC 80).

**Estado en runtime (no persistido, dentro de `MorphSolutions.tsx`):**

```ts
const PARAMS = {
  particleCount: 12000,      // partículas base (desktop)
  particleCountMobile: 5000, // versión ligera mobile
  dprCap: 2,                 // cap desktop; 1.5 en mobile
  globeRadius: 1,            // radio esfera normalizada
  color: [0x96, 0x23, 0x7a], // brand-purple #96237A
  morphDuration: 1.2,        // s de interpolación globo↔nodos
  autoRevertMs: 6000,        // ~6 s en estado morph → vuelve al globo
  idleRotationSpeed: 0.05,   // rad/s de giro del globo en reposo
} as const;

type Phase = "idle" | "morphing-out" | "solutions" | "morphing-in";
```

- Cada partícula tiene **dos posiciones objetivo** precomputadas: `homePos` (punto en la esfera) y `nodePos` (punto asignado a uno de los 4 cúmulos). El morph interpola `home ↔ node` con easing; el `Phase` gobierna la dirección.
- El reparto de partículas entre los 4 nodos es fijo por índice (≈25% a cada cúmulo) para que los cúmulos tengan densidad pareja.
- `Math.random()` está permitido (runtime navegador; la restricción es solo para scripts de workflow).

---

## Sección 4 — Plan de implementación

1. **Dependencia + scaffold.** `npm i three @types/three`. Crear `src/components/effects/MorphSolutions.tsx` con props `{ className?, signalReady?, locale?, triggerLabel?, nodes?, onUnsupported? }`, un `<canvas aria-hidden>` y el `useEffect` que crea `WebGLRenderer`/`Scene`/`Camera`. Si WebGL no está disponible, `onUnsupported?.()` y salir. **Estado:** canvas WebGL vacío, build no rompe.
2. **Geometría del globo (reposo).** Generar `particleCount` puntos sobre una esfera (distribución Fibonacci) → `homePos`. `THREE.Points` con `PointsMaterial` morado (additive blending, `sizeAttenuation`, glow por textura de punto suave). Giro lento en el loop (`idleRotationSpeed`). **Estado:** globo de partículas morado girando sobre transparente.
3. **Geometría de los 4 cúmulos (nodos).** Calcular 4 centros repartidos en el layout del hero (grid/arco); asignar cada partícula a un cúmulo por índice y muestrear su `nodePos` (nube gaussiana alrededor del centro). **Estado:** posiciones objetivo listas (aún sin animar).
4. **Motor de morph.** Interpolar por-partícula `pos = lerp(from, to, easeInOutCubic(t))` con `t` avanzando en `morphDuration`. Máquina de estados `Phase`: `idle → morphing-out → solutions → morphing-in → idle`. **Estado:** el globo se transforma en los 4 cúmulos y vuelve, suave.
5. **Trigger + fade del contenido del hero.** En `HeroHomeReact.tsx`, bloque `mode === "morph"`: montar `MorphSolutions` en `z-0` y un **trigger visible** (`triggerLabel`, botón accesible). Al activarlo: `Phase → morphing-out` y aplicar clase de fade-out al H1/subtítulo/botones; al revertir, fade-in. **Estado:** pulsar el trigger desvanece el texto y dispara el morph.
6. **Nodos-solución clicables.** En estado `solutions`, superponer 4 anclas HTML posicionadas sobre cada cúmulo (proyección 3D→2D o layout fijo), cada una `label + ícono` enlazando a `node.url`. Focus/hover en un nodo **pausa** el timer de auto-revert. **Estado:** los 4 cúmulos son links reales a las páginas de solución.
7. **Auto-revert ~6 s.** Al entrar en `solutions`, arrancar timer `autoRevertMs`; al expirar sin interacción → `morphing-in` (vuelve al globo, reaparece el texto). Hover/focus sobre un nodo pausa/reinicia el timer. **Estado:** vuelve solo a los ~6 s.
8. **i18n + Tina wiring.** Añadir enum `morph` + subgrupo `morph` en `tina/config.ts`, regenerar tipos, actualizar la query `home`. Leer `triggerLabel`/`nodes[].label` vía `tField` con el `locale` prop; `icon` mapeado a `react-icons/fa6`. Sembrar `content/home/index.json`. Añadir el wrapper `/en` si aplica (el home ya existe en ambos locales). **Estado:** editable en `/admin`, ES/EN con fallback.
9. **Mobile ligero.** `matchMedia` / ancho para elegir `particleCountMobile` y `dprCap` 1.5; el morph corre en mobile (reemplaza el poster de SPEC 44 solo en modo `morph`). **Estado:** efecto fluido en móvil de gama media.
10. **reduced-motion + preloader + cleanup.** `prefers-reduced-motion` → frame estático del globo (sin rAF) y render de los 4 nodos como **lista de links accesible**; disparar `fbx:hero-scene-loaded` cuando la escena está lista (`signalReady`). IntersectionObserver pausa el rAF fuera de viewport. En el `return`: `renderer.dispose()`, liberar geometrías/materiales/texturas, quitar listeners, `cancelAnimationFrame`. **Estado:** accesible, sin fugas, sin gasto fuera de pantalla.
11. **QA visual + build.** Comparar contra la intención (globo → 4 nodos → vuelta), verificar contraste del texto durante el fade, y que `npm run build` (tinacms build → astro build) pase sin errores nuevos. **Estado:** listo.

---

## Sección 5 — Criterios de aceptación

- [ ] Existe `heroBackground: "morph"` en el enum de Tina; los modos `3d`/`video`/`imagen`/`waveform`/`nodefield` siguen funcionando sin cambios.
- [ ] Con `morph` activo, el hero muestra un **globo de partículas moradas** girando lento sobre el negro base.
- [ ] Hay un **trigger visible** (texto editable) que al pulsarse (click/tap/Enter) dispara el morph.
- [ ] Al morphear, el H1 + subtítulo + botones hacen **fade-out** y las partículas se reorganizan en **4 cúmulos-solución** etiquetados.
- [ ] Cada uno de los 4 nodos es un **link accesible** a la URL de su página de solución (con label + ícono).
- [ ] Transcurridos ~6 s en estado morph **sin interacción**, vuelve al globo y el texto reaparece (fade-in); hover/focus sobre un nodo pausa ese timer.
- [ ] `triggerLabel` y `solutionNodes[]` (`label`, `url`, `icon`) son **editables en Tina**, con soporte `_en` y fallback ES vía `tField`.
- [ ] En **mobile** el morph corre en versión ligera (menos partículas / DPR reducido), no el poster estático.
- [ ] Con `prefers-reduced-motion: reduce` no hay animación (frame estático) y los 4 nodos aparecen como **lista de links navegable por teclado**.
- [ ] El modo `morph` dispara `fbx:hero-scene-loaded` para ocultar el `SitePreloader`.
- [ ] Al desmontar no quedan listeners, rAF ni recursos WebGL sin liberar (`renderer.dispose()`).
- [ ] `npm run build` pasa sin errores nuevos; `three`/`@types/three` quedan en `package.json`.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** `morph` como **nuevo modo aditivo** de `heroBackground`, no reemplazo de código de los otros modos. El cliente eligió "reemplaza el fondo del hero" pero se implementa como modo conmutable desde el CMS.
- **Sí:** **Three.js / WebGL** (no canvas 2D). El pedido es "gran impacto y dinamismo"; el proyecto ya carga WebGL (Spline, `WaveformEffect`). Se descartó canvas 2D (specs 92/95) por menor profundidad/glow.
- **Sí:** forma en reposo = **globo de conectividad** (metáfora directa de Fiberlux), descartando la esfera genérica del ref, el wordmark y la constelación plexus.
- **Sí:** click = **morph a 4 nodos-solución clicables** (el efecto ES el menú), descartando el simple scroll a `SolucionesScroll` y el overlay de cards.
- **Sí:** **trigger visible + fade del texto** del hero, para que texto y nodos clicables no compitan; descartado el "click en cualquier parte" del ref y el "texto se mantiene".
- **Sí:** **auto-revert a ~6 s** (decisión del cliente), en vez de toggle manual o loop automático permanente.
- **Sí:** **nodos editables en Tina** (nuevo subgrupo `hero.morph`) con `_en`, coherente con la arquitectura CMS/i18n; descartado hardcodear o derivar de `services`.
- **Sí:** **mobile corre el morph en versión ligera** (decisión del cliente), reemplazando el poster de SPEC 44 solo en este modo.
- **No:** editar desde Tina la forma/colores/conteo/tiempo (horneados en `PARAMS`); solo el copy y los nodos son editables.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `three` (~150kb) infla el bundle del home | Import solo dentro del island `MorphSolutions` (hidratado `client:visible`); no entra en el resto del sitio. Evaluar `three` slim / imports puntuales. |
| WebGL + 12k partículas causa jank/batería en mobile | Versión ligera (`particleCountMobile`, DPR 1.5), pausa fuera de viewport (IntersectionObserver), `renderer.dispose()` al desmontar, respeto a `reduced-motion`. |
| Navegación (soluciones) escondida tras un efecto = problema de accesibilidad/SEO | Los 4 nodos son anclas HTML reales con `href`; en `reduced-motion` se listan como links navegables por teclado desde el inicio. |
| El texto del hero (H1/botones) y el trigger compiten o el fade deja estados intermedios ilegibles | Máquina de estados única gobierna fade + morph; trigger visible dispara la transición; contraste verificado en QA. |
| Auto-revert a 6 s interrumpe al usuario mientras lee/apunta a un nodo | Hover/focus sobre un nodo pausa/reinicia el timer; el revert solo ocurre en idle real. |
| El morph no calza "1:1" con el Framer de referencia | Se decidió interpretación de marca, no copia; `PARAMS` afinable en el tope del archivo. |

---

## Qué **no** está en este spec

- Rediseño o reordenamiento de `SolucionesScroll` (SPEC 89); aquí solo se enlaza.
- Aplicar el morph en heros de otras páginas.
- Editar forma/colores/conteo/tiempo desde el CMS.
- Réplica fiel del shader del template de Framer.
