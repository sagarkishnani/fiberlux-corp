# SPEC 100 — Hero Home: campo de puntos reactivo (Three.js) + reaparición por scroll

> **Estado:** Aprobado
> **Depende de:** SPEC 88 (patrón de modos `heroBackground`), SPEC 97 (modo `cinematic` = planeta COBE, el fondo actual que se conserva), SPEC 96 (island de efecto WebGL + wiring Tina + carga diferida de `three`), SPEC 39 (wordmark FIBERLUX / `HeroLogoIntro`), SPEC 80 (i18n `_en`/`tField`), SPEC 44 (poster mobile 3D)
> **Fecha:** 2026-09-08
> **Objetivo:** Añadir un nuevo modo de fondo del hero `dotfield` — una malla de puntos en Three.js que reacciona al puntero y emite ondas expansivas ligadas al scroll, y que reaparece como telón de fondo en tres secciones posteriores del home (SolucionesStack, EmpresasRed, BannerApp).

---

## Sección 2 — Alcance

**Dentro:**

- **Nuevo modo `heroBackground: "dotfield"`** en el enum del CMS, hermano de `3d`/`video`/`imagen`/`waveform`/`nodefield`/`morph`/`cinematic`. **Aditivo**: ningún modo existente se toca. Queda **activo en el home** tras el QA.
- **El planeta actual sigue disponible.** El modo `cinematic` (`CinematicBackground.tsx`, planeta punteado COBE) se conserva íntegro y seleccionable desde Tina; se le **corrige la etiqueta** en `tina/config.ts`, que hoy dice "god-rays + tokens flotantes" (texto heredado de SPEC 97, antes de que el componente pasara a ser el planeta). Pasa a leer: *"Planeta de fibra (globo punteado)"*.
- **Nuevo componente `src/components/effects/DotWaveField.tsx`** (React island, Three.js): un `<canvas>` WebGL con una **malla regular de puntos** (`THREE.Points` + `ShaderMaterial`) sobre transparente, en paleta de marca, con:
  1. **Halo radial de fondo** morado (gradiente en el propio shader de fondo o capa CSS detrás), equivalente al `createRadialGradient` del HTML de referencia pero en morado sobre negro `#0A0A0A`.
  2. **Reacción al puntero** (desktop): los puntos dentro de un radio crecen y ganan opacidad.
  3. **Ondas expansivas (ripples)**: anillos que se propagan desde un origen agrandando y encendiendo los puntos que cruzan la banda del anillo, desvaneciéndose con la distancia.
  4. **Ondas automáticas** cada ~3–5 s, para que el fondo tenga vida sin interacción.
- **Ondas ligadas al scroll (el efecto "Guardz")**: el scroll **emite ondas expansivas**. Al acumular un delta de scroll por encima de un umbral se dispara un ripple cuyo origen depende de la dirección (borde superior al bajar, inferior al subir) y cuya fuerza escala con la velocidad del scroll. Es el mecanismo elegido para "las partículas se abren al hacer scroll".
- **Reaparición en 3 secciones posteriores** del home: `SolucionesStack`, `EmpresasRed` y `BannerApp`. Se implementa con un **wrapper nuevo `src/components/shared/DotFieldBackdrop.astro`** que envuelve a la sección y monta el island detrás (`client:visible`), en **variante `section`** (menos densidad, menor opacidad, sin halo protagonista). El wrapper se aplica **solo en `src/pages/index.astro`** (y su espejo `/en`), no dentro de los componentes de sección — `SolucionesStack` también se usa en `/soluciones` y `/soporte-tecnico`, y ahí no debe cambiar nada.
- **Sin click.** El click **no** dispara ondas: el hero tiene botones y las secciones tienen cards/links; el ripple por click competiría con la interacción real. (Sí quedan hover + automáticas + scroll.)
- **Editable en Tina**: nuevo subgrupo `hero.dotfield` con `intensity` (enum `sutil`/`medio`/`intenso`, mapeado a presets horneados) y `sections` (lista de checkboxes para encender/apagar el fondo en cada una de las tres secciones). El resto de parámetros (colores, spacing, radios, velocidades) van horneados en `PARAMS`.
- **El wordmark FIBERLUX (`HeroLogoIntro`, SPEC 39/97) se mantiene** igual en el modo nuevo: la condición de montaje pasa de `mode === "cinematic"` a `mode === "cinematic" || mode === "dotfield"`. También se mantienen los velos de legibilidad (mobile y desktop) adaptados a este modo.
- **Mobile — versión ligera**: corre el efecto (no el poster estático de SPEC 44) con `spacing` mayor (menos puntos), DPR cap 1.5 y **sin hover**; quedan las ondas automáticas y las de scroll.
- **Accesibilidad**: `prefers-reduced-motion: reduce` → frame estático (malla + halo pintados una vez, sin rAF, sin ondas ni hover). Canvas `aria-hidden`. Señal `fbx:hero-scene-loaded` para el `SitePreloader` como los demás modos.
- **Rendimiento**: `three` se importa **en diferido** (`lazy`, igual que `MorphSolutions`) para que los otros modos no lo descarguen; el rAF se pausa fuera de viewport con `IntersectionObserver` en las cuatro instancias; `renderer.dispose()` y limpieza de listeners al desmontar.

**Fuera de alcance (otros specs):**

- Un **único canvas fijo** detrás de todo el home revelado por sección (opción "Guardz literal"): se descartó por riesgo de rendimiento y por tocar el layout de todas las secciones.
- Aplicar `dotfield` a heros de **otras páginas** (Nosotros, Soluciones, Casos, Soporte) o a secciones distintas de las tres elegidas.
- Retirar, reescribir o degradar los modos existentes (`cinematic`, `morph`, `waveform`, `nodefield`, `3d`, `video`, `imagen`).
- Ondas por **click** y ondas ligadas al puntero en **touch**.
- Exponer en el CMS colores, spacing, radios, velocidades o número de ondas (horneados en `PARAMS`; solo `intensity` y `sections` son editables).
- Traducción `_en`: el modo no introduce copy visible.
- Réplica 1:1 del HTML de referencia (es canvas 2D y azul): se hace la misma mecánica en Three.js y en morado de marca.
- Cambios de contenido, orden o diseño de `SolucionesStack` / `EmpresasRed` / `BannerApp`: solo se les pone un telón de fondo.

---

## Sección 3 — Modelo de datos

**Contenido nuevo en Tina** (colección `home`, dentro del grupo `hero`, en `tina/config.ts`):

```js
// home.hero → añadir "dotfield" al enum de heroBackground (options existentes intactas)
// y corregir la etiqueta de "cinematic", que hoy describe el efecto anterior.
options: [
  { value: "3d",        label: "Escena 3D (Spline)" },
  { value: "video",     label: "Video de fondo" },
  { value: "imagen",    label: "Imagen de fondo" },
  { value: "waveform",  label: "Waveform (shader animado)" },
  { value: "nodefield", label: "Node field (partículas plexus)" },
  { value: "morph",     label: "Morph (globo de partículas → soluciones)" },
  { value: "cinematic", label: "Planeta de fibra (globo punteado)" },   // ← etiqueta corregida
  { value: "dotfield",  label: "Campo de puntos (ondas por scroll)" },  // ← nuevo
]

// home.hero → nuevo subgrupo para el modo dotfield
{
  type: "object", name: "dotfield", label: "Hero — modo Campo de puntos",
  fields: [
    { type: "string", name: "intensity", label: "Intensidad del efecto",
      options: ["sutil", "medio", "intenso"],
      description: "Controla densidad de puntos, brillo y fuerza de las ondas. Default: medio." },
    { type: "string", name: "sections", label: "Repetir el fondo en estas secciones",
      list: true,
      options: [
        { value: "soluciones", label: "Soluciones (bloque apilado)" },
        { value: "empresas",   label: "¿Por qué Fiberlux? + testimonios" },
        { value: "app",        label: "Banner Fiberlux App" },
      ],
      description: "Secciones del home donde el campo de puntos vuelve a aparecer, más tenue." },
  ]
}
```

- `intensity` y `sections` son los **únicos** campos editables; todo lo demás va horneado (mismo criterio que SPEC 96/97).
- Sin siblings `_en`: el modo no introduce texto visible.
- Contenido inicial en `src/content/home/index.json`: `heroBackground: "dotfield"` tras el QA, `dotfield.intensity: "medio"`, `dotfield.sections: ["soluciones", "empresas", "app"]`.
- El grupo `hero.cinematic` (planeta) **se conserva tal cual**, para poder volver al fondo actual desde Tina sin perder su configuración.

**Estado en runtime (no persistido, dentro de `DotWaveField.tsx`):**

```ts
const PARAMS = {
  spacing: 22,             // px entre puntos (desktop) — igual que el HTML de referencia
  spacingMobile: 30,       // malla más rala en móvil
  dprCap: 2,               // cap desktop; 1.5 en mobile
  baseRadius: 1.15,        // radio base del punto en px
  baseAlpha: 0.14,         // opacidad de reposo del punto
  pointerRadius: 140,      // px de influencia del puntero (desktop)
  pointerBoost: { scale: 1.8, alpha: 0.55 },
  ripple: {
    band: 34,              // grosor del anillo (px)
    speed: 6.5,            // px/frame de expansión
    maxRadiusFactor: 0.9,  // × max(W,H)
    boost: { scale: 2.2, alpha: 0.85 },
    maxActive: 6,          // ondas simultáneas (tamaño del array de uniforms)
  },
  autoRippleMs: [3200, 5400],   // rango aleatorio entre ondas automáticas
  scroll: {
    deltaThreshold: 180,   // px de scroll acumulado para emitir una onda
    strengthRange: [0.6, 1.5], // fuerza según velocidad de scroll
    cooldownMs: 260,       // mínimo entre ondas de scroll
  },
  color:       [0x96, 0x23, 0x7a],  // brand-purple #96237A
  colorLight:  [0xd6, 0x4d, 0xb8],  // acento claro para los puntos encendidos
  haloStops: ["#3B0E30", "#1A0716", "#0A0A0A"],  // halo radial morado → negro
} as const;

// Presets aplicados sobre PARAMS según hero.dotfield.intensity.
const INTENSITY = {
  sutil:   { spacingMul: 1.25, alphaMul: 0.7, rippleMul: 0.7 },
  medio:   { spacingMul: 1.0,  alphaMul: 1.0, rippleMul: 1.0 },
  intenso: { spacingMul: 0.85, alphaMul: 1.3, rippleMul: 1.35 },
} as const;

// Variante de montaje: el hero manda, las secciones son telón de fondo.
type Variant = "hero" | "section";
// "section" ⇒ halo apagado, alphaMul × 0.55, sin ondas automáticas (solo scroll),
// spacing × 1.2. El contenido de la sección siempre gana en contraste.

type Ripple = { x: number; y: number; radius: number; strength: number; maxRadius: number };
```

- La malla se construye una vez por resize: `cols × rows` puntos en un `Float32Array` de posiciones, subido a un `BufferGeometry`. **No se recorre el array en JS por frame**: el crecimiento/brillo por puntero y por ondas se calcula **en el vertex/fragment shader** a partir de uniforms (`uPointer`, `uRipples[6]`), que es la diferencia de fondo con el HTML de referencia (canvas 2D, bucle JS sobre todos los puntos).
- Las ondas activas se mantienen en un array JS de máximo `ripple.maxActive`; cada frame se avanza su `radius`, se descartan las que superan `maxRadius` y se vuelca el array a los uniforms. Coste por frame: O(6), no O(nº de puntos).
- `Math.random()` está permitido (runtime navegador).

---

## Sección 4 — Plan de implementación

1. **Scaffold del island.** Crear `src/components/effects/DotWaveField.tsx` con props `{ className?, variant?: "hero" | "section", intensity?: "sutil" | "medio" | "intenso", signalReady?, onUnsupported? }`. `<canvas aria-hidden>` + `useEffect` que crea `WebGLRenderer` / `Scene` / `OrthographicCamera` (proyección en píxeles, sin perspectiva). Si no hay WebGL, `onUnsupported?.()` y salir. **Estado:** canvas vacío montado, build verde.
2. **Malla de puntos + halo.** Construir la grilla (`spacing` según variante/intensidad/dispositivo) en un `BufferGeometry`; `ShaderMaterial` con blending additivo que pinta cada punto como disco suave en `color`/`colorLight`. Detrás, el halo radial morado (`haloStops`). Rebuild de la grilla en `resize` con DPR capado. **Estado:** campo de puntos estático en morado sobre negro, idéntico en composición a la referencia.
3. **Ondas expansivas (uniforms + shader).** Añadir `uRipples[maxActive]` (`vec4`: x, y, radius, strength) y la lógica de banda del anillo en el shader (`boost` de escala y alpha proporcional a `1 - |dist - radius| / band`, atenuado por `1 - radius / maxRadius`). Loop rAF que avanza y purga ondas. Función interna `addRipple(x, y, strength)`. **Estado:** una onda disparada a mano recorre el campo y lo enciende.
4. **Ondas automáticas.** Temporizador que llama a `addRipple` en posición aleatoria cada `autoRippleMs` con fuerza baja. Desactivadas en `variant: "section"`. **Estado:** el hero tiene vida sin tocar nada.
5. **Reacción al puntero (desktop).** Listener `pointermove` sobre el contenedor → uniform `uPointer` con lerp suave en el rAF; `pointerleave` lo manda fuera de pantalla. Desactivado en touch (`matchMedia('(hover: hover)')`). **Estado:** halo de puntos que crecen siguiendo el mouse.
6. **Ondas ligadas al scroll.** Listener `scroll` pasivo: acumular delta; al superar `deltaThreshold` (respetando `cooldownMs`), `addRipple` con origen en el borde superior o inferior según dirección y `strength` interpolada por velocidad. Es el mecanismo de "apertura" al hacer scroll. **Estado:** bajar por el home lanza ondas que atraviesan el campo.
7. **Wiring del modo en el hero.** En `HeroHomeReact.tsx`: import diferido (`lazy`) de `DotWaveField`; bloque `mode === "dotfield"` que lo monta en `z-0` con `variant="hero"`, `intensity` desde el CMS y `signalReady`, dentro de `<Suspense>` como `MorphSolutions`. Extender a `dotfield` las condiciones de `HeroLogoIntro` y de los dos velos de legibilidad (mobile/desktop), ajustando su opacidad para este fondo. **Estado:** hero completo con el campo de puntos y el wordmark intacto.
8. **Wrapper de sección.** Crear `src/components/shared/DotFieldBackdrop.astro`: `<div class="relative">` con el island montado `client:visible` en `absolute inset-0 z-0 pointer-events-none` (variante `section`) y `<slot />` en `z-10`. En `src/pages/index.astro` envolver `SolucionesStack`, `EmpresasRed` y `BannerApp` según `hero.dotfield.sections` (leído de la query `home` que la página ya resuelve). Replicar en el wrapper `/en` si no reexporta la página ES tal cual. **Estado:** el campo reaparece, más tenue, en las tres secciones.
9. **Tina + contenido.** Añadir `dotfield` al enum, corregir la etiqueta de `cinematic` y crear el subgrupo `hero.dotfield` en `tina/config.ts`; regenerar `tina/__generated__` y actualizar la query `home` si hace falta. Sembrar `src/content/home/index.json` (`heroBackground: "dotfield"`, `intensity: "medio"`, las tres secciones activas). **Estado:** editable en `/admin`, planeta seleccionable como alternativa.
10. **Mobile ligero.** `matchMedia` / ancho para `spacingMobile`, DPR 1.5 y hover apagado; en el hero mobile se refuerza el velo radial para que el titular se lea. Reemplaza el poster de SPEC 44 solo en este modo. **Estado:** fluido en móvil de gama media.
11. **reduced-motion + preloader + cleanup.** `prefers-reduced-motion: reduce` → un solo render (malla + halo, sin ondas ni puntero, sin rAF). Disparar `fbx:hero-scene-loaded` en el primer frame. `IntersectionObserver` pausa el rAF de cada instancia fuera de viewport. En el `return`: `cancelAnimationFrame`, `renderer.dispose()`, liberar geometría/material, quitar `pointermove` / `scroll` / `resize` / observer / matchMedia. **Estado:** accesible, sin fugas, sin gasto fuera de pantalla.
12. **QA visual + build.** Comparar contra la referencia (imagen del cliente + `dot-wave-background.html`) en desktop y mobile; verificar legibilidad del H1/subtítulo/botones sobre el campo y sobre las tres secciones; medir que las cuatro instancias no degraden el scroll. Confirmar que `npm run build` (tinacms build → astro build) pasa sin errores nuevos. **Estado:** listo.

---

## Sección 5 — Criterios de aceptación

- [ ] Existe `heroBackground: "dotfield"` en el enum de Tina y el home lo usa; los modos `3d`/`video`/`imagen`/`waveform`/`nodefield`/`morph`/`cinematic` siguen funcionando sin cambios.
- [ ] El modo `cinematic` (planeta punteado actual) sigue seleccionable desde Tina y su etiqueta ya no dice "god-rays + tokens flotantes".
- [ ] Con `dotfield` activo, el hero muestra una **malla regular de puntos** morados sobre un halo radial, renderizada con **Three.js/WebGL** (no SVG ni canvas 2D).
- [ ] En **desktop**, mover el puntero agranda e ilumina los puntos cercanos; en **touch** no hay reacción al puntero.
- [ ] **Hacer scroll emite ondas expansivas** que atraviesan el campo, con origen según la dirección del scroll y fuerza según su velocidad.
- [ ] Aparecen **ondas automáticas** cada ~3–5 s en el hero sin ninguna interacción.
- [ ] El **click no** dispara ondas en ninguna instancia.
- [ ] El campo **reaparece, más tenue**, detrás de `SolucionesStack`, `EmpresasRed` y `BannerApp`, y cada una se puede apagar desde `hero.dotfield.sections` en Tina.
- [ ] `SolucionesStack` en `/soluciones` y `/soporte-tecnico` **no** muestra el fondo nuevo (el wrapper vive solo en el home).
- [ ] `hero.dotfield.intensity` (`sutil`/`medio`/`intenso`) cambia visiblemente densidad, brillo y fuerza de las ondas.
- [ ] El wordmark FIBERLUX (`HeroLogoIntro`) se mantiene igual que en el modo `cinematic`.
- [ ] En **mobile** corre la versión ligera (malla más rala, DPR 1.5, sin hover), no el poster estático.
- [ ] Con `prefers-reduced-motion: reduce` el campo se pinta estático: sin rAF, sin ondas, sin reacción al puntero.
- [ ] El modo dispara `fbx:hero-scene-loaded`.
- [ ] Las cuatro instancias pausan su rAF fuera de viewport y, al desmontar, no quedan listeners, rAF ni recursos WebGL sin liberar (`renderer.dispose()`).
- [ ] `three` se carga en diferido: con `heroBackground` en cualquier otro modo y las secciones apagadas, no se descarga.
- [ ] `npm run build` pasa sin errores nuevos.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** `dotfield` como **nuevo modo aditivo**, con el planeta actual (`cinematic`) conservado y seleccionable desde Tina (pedido explícito del cliente: "coloca el del mundo actual en Tina para que lo puedan utilizar si desean").
- **Sí:** **Three.js/WebGL** con la reacción calculada en shader, no canvas 2D. El HTML de referencia recorre todos los puntos en JS por frame; con la densidad del hero a pantalla completa eso es caro. El cliente además pidió Three.js explícitamente ("que no sea algo simple con SVGs"). `three` ya es dependencia del proyecto (SPEC 96).
- **Sí:** reaparición en **3 secciones concretas** (`SolucionesStack`, `EmpresasRed`, `BannerApp`), repartidas arriba/medio/abajo del scroll. Descartado el **canvas único fijo detrás de todo el home** (más fiel a guardz.com pero con el mayor riesgo de rendimiento y tocando el layout de todas las secciones), y descartado limitarlo a dos secciones.
- **Sí:** la "apertura al scroll" se implementa como **onda expansiva ligada al scroll** (opción elegida por el cliente), no como cortina que se parte desde el centro ni como dispersión en Z.
- **Sí:** se conservan **hover + ondas automáticas**; se descarta la **onda por click** del HTML de referencia, porque el hero tiene botones y las secciones tienen cards/links, y el ripple competiría con la interacción real.
- **Sí:** paleta **adaptada a marca** (negro `#0A0A0A`, puntos `#96237A`/`#D64DB8`, halo morado), no el azul del HTML de referencia.
- **Sí:** el **wordmark FIBERLUX** (`HeroLogoIntro`, SPEC 39/97) se mantiene en el modo nuevo — es la entrada de marca y ya sustituye al `SitePreloader`.
- **Sí:** **wrapper `DotFieldBackdrop.astro` aplicado desde `index.astro`**, no edición de los componentes de sección: `SolucionesStack` se reutiliza en `/soluciones` y `/soporte-tecnico` y ahí no debe cambiar.
- **Sí:** en el CMS solo `intensity` y `sections`; colores, spacing, radios y velocidades horneados en `PARAMS`, coherente con SPEC 96/97.
- **Sí:** **mobile corre el efecto** en versión ligera, reemplazando el poster de SPEC 44 solo en este modo.
- **No:** aplicar `dotfield` a heros de otras páginas (rollout posterior), traducir copy (`_en`, no hay texto nuevo), exponer parámetros crudos en Tina, ni replicar 1:1 el HTML de referencia.
- **Nota de proceso:** las secciones 3 a 7 se redactaron sin revisión intermedia por indicación del cliente ("asume el resto y guarda"), después de cerrar en Fase 2 las siete preguntas de alcance, interacción, secciones, paleta y wordmark.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Cuatro instancias WebGL en el home (hero + 3 secciones) degradan el scroll | Cada island se monta `client:visible`, pausa su rAF fuera de viewport (`IntersectionObserver`) y las de sección van en variante ligera (menos puntos, sin ondas automáticas). Si el QA lo pide, se reduce a 2 secciones desde Tina sin tocar código. |
| `three` (~508 KB sin comprimir) pasa a descargarse siempre en el home al activar `dotfield` | Import diferido (`lazy` + `Suspense`), igual que `MorphSolutions`; las 4 instancias comparten un único chunk. Si el peso pesa en QA, se evalúa un build slim de `three` o `three/webgpu`-free imports puntuales. |
| Las ondas por scroll disparan demasiado seguido y el fondo "vibra" | `deltaThreshold` + `cooldownMs` en `PARAMS`, `strength` proporcional a la velocidad, y máximo `maxActive: 6` ondas simultáneas. |
| El campo de puntos resta legibilidad al H1/subtítulo/botones y al contenido de las tres secciones | Se reutilizan los velos radiales ya existentes del modo `cinematic` (mobile y desktop), la variante `section` va a ~55% de alpha y sin halo, y el contenido queda en `z-10`. Contraste verificado en QA. |
| Meter el fondo en `SolucionesStack` afecta también a `/soluciones` y `/soporte-tecnico` | El wrapper se aplica exclusivamente en `src/pages/index.astro` (y su espejo `/en`); los componentes de sección no se modifican. |
| Listeners globales (`scroll`, `pointermove`, `resize`) multiplicados por 4 instancias = fugas o coste | Un listener por instancia, todos pasivos, con lerp/acumulación resuelta dentro del rAF y `cancelAnimationFrame` + `renderer.dispose()` + `removeEventListener` explícitos en el cleanup. |
| El resultado no se siente "como guardz.com" porque allí el campo es continuo | Se documentó como decisión: 3 instancias en vez de canvas único. Si el cliente insiste tras verlo, la escalada al canvas fijo es un spec posterior, no un parche. |

---

## Qué **no** está en este spec

- Canvas único fijo detrás de todo el home revelado por sección.
- Aplicar `dotfield` en heros de otras páginas o en secciones distintas de las tres elegidas.
- Ondas por click, y reacción al puntero en dispositivos touch.
- Exponer colores, spacing, radios o velocidades en el CMS.
- Cambios de contenido, orden o diseño de `SolucionesStack`, `EmpresasRed` o `BannerApp`.
- Retirar o reescribir los modos de fondo existentes, incluido el planeta `cinematic`.
