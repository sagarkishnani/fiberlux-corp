# SPEC 97 — Hero Home: modo `cinematic` (god-rays + tokens flotantes + titular neón)

> **Estado:** Implementado
> **Depende de:** SPEC 88 (patrón `heroBackground` modes), SPEC 96 (modo `morph`, referencia de estructura de island de efecto y wiring Tina), SPEC 39 (wordmark FIBERLUX en header), SPEC 80 (i18n `_en`/`tField`), SPEC 44 (poster mobile 3D)
> **Fecha:** 2026-08-06
> **Objetivo:** Añadir un nuevo modo de fondo del hero `cinematic` — atmósfera tipo FXology con rayos de luz volumétrica, tokens de conectividad flotando con parallax y polvo de luz, más un titular con glow neón y barrido de luz, todo en morado de marca.

---

## Sección 2 — Alcance

**Dentro:**

- **Nuevo modo `heroBackground: "cinematic"`** en el enum del CMS, hermano de `3d`/`video`/`imagen`/`waveform`/`nodefield`/`morph`. **Aditivo**: los modos existentes quedan intactos. Se deja activo en el home tras el QA.
- **Nuevo componente `src/components/effects/CinematicBackground.tsx`** (React island): capa de fondo que renderiza tres sub-capas —
  1. **God-rays** (rayos de luz volumétrica) cayendo desde arriba: conos de gradiente morado con blur y animación lenta de opacidad/desplazamiento. **Capa aislada** para poder subirla a shader WebGL2 si el QA lo pide, sin tocar el resto.
  2. **Tokens de conectividad flotantes**: elementos DOM (ej. `Gbps`, `99.9%`, `12 ms`, `IP`, glifos de fibra/nodo/nube) derivando lento con **parallax** ligado al puntero, tenues y desenfocados por profundidad (los del "fondo" más pequeños/borrosos).
  3. **Polvo de luz ambiental**: partículas puntuales suaves en **canvas 2D** flotando/parpadeando, additive, sobre el negro base.
- **Titular neón (contenido, z-10 en `HeroHomeReact`)**: el H1 existente recibe **glow morado + barrido de luz** (light-sweep) tipo FXology. Convive con el wordmark FIBERLUX del header (SPEC 39). Reusa `hero.title`/`subtitle`/`buttons` — no requiere contenido nuevo para el texto.
- **Parallax por puntero** sutil en desktop: rayos, tokens y polvo se desplazan levemente según la posición del mouse (distintas magnitudes por profundidad). Desactivado en touch y en `reduced-motion`.
- **Tokens editables en Tina**: nuevo subgrupo `hero.cinematic` con una lista `floatingTokens[]` de `{ text }` (con default curado horneado si el CMS no define ninguno). El resto de parámetros (colores, densidad, velocidad, config de rayos) van horneados en `PARAMS`.
- **Mobile — versión ligera**: el efecto corre en mobile con menos polvo/tokens, DPR reducido y parallax por puntero desactivado (deriva autónoma). Reemplaza el poster estático de SPEC 44 solo en este modo.
- **Accesibilidad**: `prefers-reduced-motion: reduce` → frame estático (sin rAF, sin barrido ni parallax; rayos y glow presentes pero quietos). Los tokens son decorativos (`aria-hidden`). Señal `fbx:hero-scene-loaded` para el `SitePreloader` como los demás modos.

**Fuera de alcance (otros specs):**

- Aplicar el modo `cinematic` fuera del hero del home (otras páginas/heros) — el pedido es "por ahora solo el hero"; el rollout a toda la web es un spec posterior.
- Retirar o modificar los modos existentes (`morph`, `waveform`, etc.); `cinematic` es aditivo y el `morph` globo se desactiva **solo** por estar en otro modo (no se borra su código).
- Editar desde Tina colores, densidad de partículas, velocidad, tiempos o config de rayos (horneados en `PARAMS`; solo el copy de tokens es editable).
- Eyebrow-pill ("Our Capital, Your Success") y fila de feature-chips del ref: se reusa el contenido existente del hero (`eyebrow`/`buttons` si existen); no se crean estructuras nuevas para eso aquí.
- Réplica 1:1 del template de FXology (Behance/Dribbble son referencia de atmósfera/iluminación, no assets extraíbles): se hace interpretación de marca en morado.
- Subir la capa de god-rays a WebGL2: solo se hará **si** el QA visual lo requiere; el spec deja la capa aislada para permitirlo, pero no lo compromete.

---

## Sección 3 — Modelo de datos

**Contenido nuevo en Tina** (colección `home`, dentro del grupo `hero`, en `tina/config.ts`):

```js
// home.hero → añadir "cinematic" al enum de heroBackground (options existentes intactas)
{ name: "heroBackground", type: "string",
  options: ["3d", "video", "imagen", "waveform", "nodefield", "morph", "cinematic"] }

// home.hero → nuevo subgrupo para el modo cinematic
{ type: "object", name: "cinematic", label: "Hero — modo Cinematic (god-rays + tokens)",
  fields: [
    { type: "object", name: "floatingTokens", label: "Tokens flotantes (fondo)", list: true,
      ui: { itemProps: (i) => ({ label: i?.text || "Token" }) },
      fields: [
        { type: "string", name: "text", label: "Texto del token (ej. Gbps, 99.9%, 12 ms)" },
      ] },
  ] }
```

- Solo el **copy de los tokens** es editable. Colores, densidad, velocidad, config de rayos, tiempos y glow del titular van horneados en `PARAMS` (mismo criterio que SPEC 96).
- Los tokens son cadenas cortas y universales (unidades/cifras técnicas); **no** llevan sibling `_en` (no requieren traducción). Si el cliente quisiera traducirlos luego, se añade `text_en` siguiendo la convención SPEC 80 — fuera de alcance aquí.
- Si `floatingTokens` está vacío en el CMS, el componente usa un **default curado horneado** (`DEFAULT_TOKENS`) — mismo patrón que `DEFAULT_MORPH_NODES` en `HeroHomeReact`.
- El titular neón reusa `hero.title` / `hero.subtitle` / `hero.buttons` existentes; **no** se añaden campos de contenido para el texto.
- Contenido inicial en `src/content/home/index.json`: `heroBackground` se cambia a `"cinematic"` tras el QA; `cinematic.floatingTokens` se puede sembrar con los tokens de marca o dejar vacío (cae al default).

**Estado en runtime (no persistido, dentro de `CinematicBackground.tsx`):**

```ts
const PARAMS = {
  dustCount: 90,            // partículas de polvo (desktop)
  dustCountMobile: 40,      // versión ligera mobile
  dprCap: 2,                // cap desktop; 1.5 en mobile
  color: [0x96, 0x23, 0x7a],       // brand-purple #96237A
  colorLight: [0xd6, 0x4d, 0xb8],  // acento claro para brillos
  rayCount: 3,             // conos de luz volumétrica desde arriba
  parallaxStrength: 18,    // px máx de desplazamiento por puntero (desktop)
  driftSpeed: 0.04,        // velocidad de deriva autónoma de tokens/polvo
  sweepDurationMs: 4200,   // periodo del barrido de luz del titular
} as const;

// Default curado si el CMS no define tokens.
const DEFAULT_TOKENS = ["1 Gbps", "99.9%", "12 ms", "IPv6", "24/7", "SLA", "FTTH", "10G"];
```

- Cada token flotante recibe al montarse una **profundidad** `z ∈ [0,1]` (aleatoria, `Math.random()` permitido en runtime navegador) que fija su tamaño, opacidad, blur y factor de parallax (más lejos = más chico, más borroso, se mueve menos).
- El polvo se genera como puntos con posición/velocidad/fase propias; se dibuja en canvas 2D additive en cada frame del rAF.
- No hay estado de máquina (`Phase`) como en SPEC 96: `cinematic` es una atmósfera continua sin morph ni interacción de click; la única interacción es el parallax por puntero.

---

## Sección 4 — Plan de implementación

1. **Scaffold del island.** Crear `src/components/effects/CinematicBackground.tsx` con props `{ className?, signalReady?, tokens?, onUnsupported? }`. Estructura de capas: `<div>` raíz relativo con (a) rayos (DOM/CSS), (b) tokens (DOM), (c) `<canvas aria-hidden>` para el polvo. `useEffect` monta el loop. **Estado:** componente vacío que compila, capas montadas sin animar.
2. **God-rays (capa aislada).** Renderizar `rayCount` conos de luz desde el borde superior con `linear-gradient`/`conic-gradient` morado, `filter: blur(...)`, `mix-blend-mode: screen`, cada uno con animación CSS lenta de opacidad y leve rotación/traslación (fases desfasadas). Mantener esta capa en un sub-bloque claramente delimitado (`{/* GOD-RAYS LAYER — swappable a WebGL2 */}`). **Estado:** rayos de luz volumétrica cayendo desde arriba sobre el negro base.
3. **Polvo de luz (canvas 2D).** En el rAF, dibujar el polvo additive (radial soft, colores `color`/`colorLight`), con deriva autónoma (`driftSpeed`) y parpadeo por fase. DPR cap según dispositivo. **Estado:** polvo ambiental flotando/parpadeando.
4. **Tokens flotantes (DOM + profundidad).** Renderizar los tokens (CMS o `DEFAULT_TOKENS`) como spans posicionados absolutos, cada uno con su `z` → tamaño/opacidad/blur; deriva autónoma lenta. Font mono (Space Mono) tenue morada. `aria-hidden`. **Estado:** tokens de conectividad derivando en el fondo con profundidad.
5. **Parallax por puntero.** Listener `pointermove` (solo desktop / no-touch): mapear posición a un offset y aplicarlo a rayos, tokens y polvo con magnitud proporcional a `z` (`parallaxStrength`). Interpolación suave (lerp) en el rAF, sin jank. **Estado:** las capas responden sutilmente al mouse con sensación de profundidad.
6. **Titular neón + barrido.** En `HeroHomeReact.tsx`, bloque `mode === "cinematic"`: aplicar al H1 clases de **glow morado** (text-shadow multi-capa) y un **light-sweep** (pseudo-elemento con gradiente que barre horizontalmente cada `sweepDurationMs`, vía `background-clip: text` o máscara). Subtítulo/botones con leve realce coherente. **Estado:** titular con resplandor neón y barrido de luz.
7. **Wiring del modo en el hero.** En `HeroHomeReact.tsx`, añadir el bloque `mode === "cinematic"` que monta `CinematicBackground` en `z-0` (patrón de `waveform`/`nodefield`), pasa `tokens` desde `hero.cinematic.floatingTokens` (o default), y `signalReady`. Reusar las vignettes existentes (z-[1]) para legibilidad. **Estado:** el modo se ve completo en desktop con el contenido encima.
8. **Tina + contenido.** Añadir el enum `cinematic` + subgrupo `cinematic` en `tina/config.ts`, regenerar tipos (`__generated__`), actualizar la query `home` si hace falta. Sembrar/activar en `src/content/home/index.json`. El home ya existe en ambos locales (`/en` wrapper). **Estado:** editable en `/admin`, tokens configurables.
9. **Mobile ligero.** `matchMedia`/ancho para elegir `dustCountMobile`, `dprCap` 1.5, menos tokens y **parallax por puntero desactivado** (solo deriva autónoma). Reemplaza el poster de SPEC 44 solo en modo `cinematic`. **Estado:** efecto fluido en móvil de gama media.
10. **reduced-motion + preloader + cleanup.** `prefers-reduced-motion: reduce` → frame estático (sin rAF, sin barrido ni parallax; rayos/glow quietos). Disparar `fbx:hero-scene-loaded` (`signalReady`) al montar la escena. `IntersectionObserver` pausa el rAF fuera de viewport. En el `return`: `cancelAnimationFrame`, quitar listeners (`pointermove`, observer, matchMedia). **Estado:** accesible, sin fugas, sin gasto fuera de pantalla.
11. **QA visual + build.** Comparar contra la intención (god-rays + tokens + polvo + titular neón) frente a las referencias FXology adaptadas a morado; verificar contraste/legibilidad del texto sobre los rayos; **decidir en este punto** si los god-rays venden la profundidad o si la capa aislada debe subirse a WebGL2 (fuera de alcance si no hace falta). Verificar que `npm run build` (tinacms build → astro build) pase sin errores nuevos. **Estado:** listo.

---

## Sección 5 — Criterios de aceptación

- [ ] Existe `heroBackground: "cinematic"` en el enum de Tina; los modos `3d`/`video`/`imagen`/`waveform`/`nodefield`/`morph` siguen funcionando sin cambios.
- [ ] Con `cinematic` activo, el hero muestra **rayos de luz volumétrica** morados cayendo desde arriba sobre el negro base.
- [ ] Hay **tokens de conectividad** (ej. `1 Gbps`, `99.9%`, `12 ms`) derivando lento en el fondo, con profundidad (los "lejanos" más pequeños/borrosos).
- [ ] Hay **polvo de luz ambiental** (canvas 2D) flotando/parpadeando.
- [ ] El **titular** (H1) tiene **glow morado** y un **barrido de luz** (light-sweep) animado; convive con el wordmark FIBERLUX del header sin romperlo.
- [ ] En **desktop** las capas responden al puntero con **parallax** sutil por profundidad; en **touch** el parallax está desactivado (solo deriva autónoma).
- [ ] `floatingTokens[]` es **editable en Tina**; si está vacío, se usa el default curado.
- [ ] En **mobile** el efecto corre en versión ligera (menos polvo/tokens, DPR reducido, sin parallax por puntero), no el poster estático.
- [ ] Con `prefers-reduced-motion: reduce` no hay animación (frame estático: rayos/glow quietos, sin barrido ni parallax).
- [ ] El modo `cinematic` dispara `fbx:hero-scene-loaded` para ocultar el `SitePreloader`.
- [ ] Al desmontar no quedan listeners ni rAF activos; el rAF se pausa fuera de viewport.
- [ ] La capa de god-rays está aislada en un sub-bloque claramente delimitado (swappable a WebGL2 sin tocar el resto).
- [ ] `npm run build` pasa sin errores nuevos.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** `cinematic` como **nuevo modo aditivo** de `heroBackground`, no reemplazo de los otros modos (decisión del cliente). Se activa en el home tras el QA; el morph globo se desactiva solo por estar en otro modo, sin borrar su código.
- **Sí:** **DOM/CSS + canvas 2D ligero** para toda la escena, con la **capa de god-rays aislada** para poder subirla a WebGL2 solo si el QA lo exige. El cliente prefirió canvas 2D ligero salvo que "no quede igual"; se arranca ligero (mejor para mobile/mantenimiento) con puerta de escape a WebGL en el único punto que lo justifica. Se descartó Three.js/WebGL completo y shader dedicado de entrada por peso/batería y dificultad de iterar el copy de tokens.
- **Sí:** flotantes = **tokens de conectividad/tech** (Gbps, 99.9%, ms, IP…), on-brand, en vez de las fórmulas matemáticas del ref o de íconos de marca (decisión del cliente).
- **Sí:** **titular neón con glow + barrido**, con el morph globo desactivado en este modo (decisión del cliente); descartado conservar el morph bajo la atmósfera y descartado dejar el titular actual sin tocar.
- **Sí:** **tokens editables en Tina** (subgrupo `hero.cinematic.floatingTokens`), resto horneado en `PARAMS`; coherente con SPEC 96. Sin `_en` (tokens universales).
- **Sí:** **mobile corre el efecto en versión ligera** (sin parallax por puntero), reemplazando el poster de SPEC 44 solo en este modo.
- **No:** aplicar `cinematic` a otros heros/páginas (rollout a toda la web = spec posterior); no está el eyebrow/chips del ref como estructura nueva (se reusa contenido existente); no se traduce el copy de tokens; no se compromete el WebGL2 salvo que el QA lo pida.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Los god-rays en CSS no "venden" la profundidad volumétrica del ref | Capa aislada y delimitada: si el QA lo pide, se sube solo esa capa a un shader WebGL2 sin rehacer tokens/polvo/titular. |
| Muchos elementos DOM + canvas + parallax causan jank en mobile | Versión ligera (menos polvo/tokens, DPR 1.5, sin parallax por puntero), pausa fuera de viewport (IntersectionObserver), `cancelAnimationFrame` al desmontar. |
| El glow/barrido del titular resta legibilidad al texto | Glow acotado (text-shadow contenido) + vignettes existentes (z-[1]); contraste verificado en QA; `reduced-motion` deja el titular quieto y legible. |
| El wordmark FIBERLUX del header (SPEC 39) y el titular neón compiten o se cruzan | El titular vive en z-10 del contenido y el header en z-[80]; se verifica holgura anti-cruce en QA (mismo cuidado que SPEC 41). |
| Parallax por puntero con listeners mal liberados = fugas | Un solo `pointermove` con lerp en el rAF; cleanup explícito de listeners/observer/matchMedia en el `return`. |
| La atmósfera no calza "1:1" con FXology | Se decidió interpretación de marca en morado, no copia; `PARAMS` afinable en el tope del archivo. |

---

## Qué **no** está en este spec

- Aplicar el modo `cinematic` en heros de otras páginas o al resto de la web (rollout posterior).
- Retirar o reescribir los modos de fondo existentes.
- Editar colores/densidad/velocidad/tiempos/config de rayos desde el CMS.
- Traducir el copy de los tokens (`_en`).
- Subir los god-rays a WebGL2 salvo que el QA visual lo determine.
