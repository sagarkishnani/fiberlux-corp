# SPEC 113 — Home: apertura narrativa (hero fibra + frases) y motor de capítulos

> **Estado:** Aprobado
> **Depende de:** SPEC 88 (patrón de modos `heroBackground`), SPEC 97 (chrome cinematográfico del hero: wordmark, coreografía de entrada, bloqueo de scroll), SPEC 112 (`lattice`, el modo hermano más reciente y la duplicación de `CINE_MODES` entre `HeroHomeReact` y `BaseLayout`), SPEC 96/39 (morph FLX→FIBERLUX y `HeroLogoIntro`), SPEC 71 (`data-reveal`, `data-count-up`, `data-parallax` sobre `motion`), SPEC 110 (ciclo de vida de listeners con View Transitions), SPEC 80 (i18n `_en` + `tField`)
> **Fecha:** 2026-09-11
> **Objetivo:** Abrir la Home con un tramo narrativo de scroll — nuevo fondo de hero `fiber` (túnel de filamentos ópticos en WebGL2) encadenado con un capítulo de frases — sobre un motor de capítulos sticky + scrub reutilizable.

---

## Sección 1 — Por qué existe este spec

El cliente trajo dos referencias de scroll —`o-scs.com` e `incredibles.dev`— pidiendo "esos efectos de scroll y el storytelling". Ambas se inspeccionaron en vivo antes de escribir nada, y el hallazgo que gobierna esta spec es este:

**`o-scs.com` no usa `pin` de GSAP en ningún sitio.** De sus 79 ScrollTriggers, 73 llevan `scrub` y **ninguno** lleva `pin`. Lo que parece pineado es `position: sticky` de CSS dentro de wrappers de 4 a 8 alturas de viewport (hero `3600px`, intro `7200px` sobre un viewport de 900), y GSAP solo anima el contenido atado al progreso de ese wrapper. Sus `start`/`end` van en múltiplos exactos del viewport (`bottom-=3600 bottom` → `bottom-=1800 bottom` → …): son **capítulos encadenados dentro de un mismo panel clavado**. `incredibles.dev` hace lo mismo con menos recorrido y pone el gasto en WebGL2 crudo (9 canvas de simulación de fluido, sin three.js).

Con eso se construyó un prototipo desechable de la Home (`fiberlux-scroll.html`, publicado como artifact) con el contenido real de `src/content/home/index.json`. El cliente lo revisó y dejó cuatro instrucciones:

1. **El hero funciona.** Se aprueba el tratamiento de túnel de fibra.
2. **Hay una raya horizontal en el medio que parpadea mucho.** Es un bug real del shader, no una decisión estética (ver Sección 6).
3. **El hero se mantiene hasta las frases**, y de ahí en adelante se continúa con los bloques que ya existen en la Home, aplicándoles estos efectos.
4. **Fuera los chips de los costados y el índice lateral.**

Este spec cubre el punto 1, 2 y 4 más el capítulo de frases del punto 3. **Aplicar el motor a los bloques existentes es la SPEC 114**, deliberadamente separada: son tres áreas distintas y no caben en un objetivo de una frase.

---

## Sección 2 — Concepto

El tramo de apertura es **un solo plano continuo** dividido en capítulos: el fondo de fibra no se corta entre el hero y las frases, y eso es lo que hace que se lea como una sola secuencia en vez de como dos secciones pegadas. Es el truco de continuidad de `o-scs` (un vídeo de fondo de 3170 px atravesando varias secciones), aquí resuelto con un canvas fijo.

**Anatomía de un capítulo:**

```
[data-chapter] --len: 3          height: calc(3 * 100svh)   ← genera la duración
  └ [data-chapter-stage]         position: sticky; top: 0; height: 100svh
```

El wrapper alto es el que crea el recorrido; el hijo sticky es lo que el usuario ve clavado; y las animaciones van atadas al progreso del wrapper, nunca a un `pin`.

**La regla que se equivoca todo el mundo (yo incluido, en el prototipo):** el tramo realmente clavado es `(N−1) × 100svh`, no `N`. El último viewport es el traspaso, cuando el panel ya se está yendo. Si una animación termina en el borde del wrapper, su final ocurre fuera de pantalla — fue exactamente lo que pasó con los contadores de cifras del prototipo, que llegaban a su valor final cuando el panel ya había salido. Por eso los `end` de `o-scs` van descontando alturas de viewport enteras.

**Coreografía del hero (tres actos, encadenados dentro del mismo panel):**

1. Se apagan los satélites: subtítulo y botones se van hacia abajo con fundido.
2. El titular cede el sitio y el wordmark FIBERLUX toma el centro.
3. El wordmark escala hacia el punto de fuga del túnel y el shader acelera: se entra en la fibra.

La **entrada** del hero no se toca — sigue siendo la coreografía existente de SPEC 97/39 (morph FLX→FIBERLUX y bloqueo de scroll inicial). Lo que este spec añade es la **salida**.

**Capítulo de frases.** Al salir del hero, tres frases se relevan una a una, cada una revelada línea por línea con máscara (`overflow: hidden` + desplazamiento vertical), atadas al scroll. El fondo de fibra sigue detrás, atenuado por un velo para que el texto respire. Entre capítulos hay un **corte a negro** que tapa la costura entre el panel que se va y el que llega; **sin isotipo** (el cliente lo pidió explícito: "por ahora no agregues el isotipo").

---

## Sección 3 — Alcance

**Dentro:**

- **Motor de capítulos reutilizable**: `src/components/shared/ScrollChapter.astro` + `src/scripts/chapters.ts`. Aporta el markup, el CSS sticky y el cálculo de ventanas por acto. Pensado para que la SPEC 114 lo consuma sin tocarlo.
- **Nuevo modo `heroBackground: "fiber"`** en el enum del CMS, hermano de los existentes. **Aditivo**: ningún modo se retira, `lattice`/`cinematic`/`dotfield` siguen seleccionables desde Tina para comparar.
- **Nuevo componente `src/components/effects/FiberTunnel.tsx`** (React island, WebGL2 crudo, sin three.js — mismo patrón que `AuroraRibbons`): un triángulo a pantalla completa y un fragment shader con tres tratamientos (`tunel`, `haz`, `reticula`).
- **Corrección de la costura de `atan2`** que produce la raya horizontal parpadeante (Sección 6).
- **Capítulo del hero**: `--len: 3`, con el acto de salida de la Sección 2 y el progreso acoplado a los uniforms del shader (acelera hacia el punto de fuga).
- **Capítulo de frases**: `src/components/home/Manifiesto.astro` + `ManifiestoReact.tsx`, montado en `src/pages/index.astro` entre el hero y `SolucionesStack`. Longitud `--len = items.length + 1`.
- **Editable en Tina**: subgrupo `hero.fiber` (`variant`, `intensity`) y grupo nuevo `home.manifiesto` (`items[] { line1, line2 }` con sus `_en`).
- **Velo de corte** entre capítulos: negro que entra y sale atado al scroll, sin marca.
- **Comparte el chrome cinematográfico** con `cinematic`/`dotfield`/`lattice` vía `CINE_MODES`. **Ojo:** esa lista está duplicada en `HeroHomeReact.tsx:27` y en `BaseLayout.astro:64` (`homeHeroCinematic`) y hay que tocar las dos; añadirlo solo en una deja el `.cine-intro-page` sin aplicar y se ven dos logos a la vez durante el morph — fue el bug que reportó el cliente en la SPEC 112.
- **Accesibilidad**: `prefers-reduced-motion` → frame único del shader, capítulos sin altura extra (las frases se apilan y se leen sin scroll), velo desactivado. Canvas `aria-hidden`. Señal `fbx:hero-scene-loaded`.
- **Rendimiento**: tope de DPR (1.5 escritorio / 1.0 móvil), auto-degradado de resolución por debajo de 46 fps, rAF pausado fuera de viewport y con `document.hidden`, fallback CSS si no hay WebGL2, y **garantía de un solo canvas WebGL vivo**: el de fibra se apaga antes de que arranque el aurora de `SolucionesStack`.
- **i18n**: las frases con `tField`; nada de copy fijo nuevo fuera del CMS.

**Fuera de alcance (specs futuras):**

- **Aplicar el motor de capítulos a los bloques existentes** de la Home (partners, `EmpresasRed`, certificaciones, banner de la app, blog) → **SPEC 114**. Incluye partir `EmpresasRed` en dos capítulos si se quiere el patrón de círculos + contadores para las cifras y el revelado por líneas para el testimonio.
- **Tocar `SolucionesStack`** (SPEC 108). Decisión explícita del cliente: ya es un capítulo de scroll con su rail sticky y su aurora, y rehacerlo es tirar trabajo validado. El tramo narrativo termina justo donde ese bloque empieza.
- Retirar `lattice`, `cinematic`, `dotfield` o `ParticleNebula`.
- El corte con isotipo ("por ahora no").
- Los chips técnicos flotantes (`hero.cinematic.floatingTokens`) y el índice de capítulos lateral del prototipo: el cliente los descartó. `floatingTokens` se conserva en el CMS porque lo usa el modo `cinematic`.
- Aplicar el fondo `fiber` a los heros de otras páginas.
- Exponer en Tina la paleta, la velocidad o la densidad del shader: viven en `PARAMS`.
- Hacer continuo el canvas de fibra a lo largo de toda la Home.

---

## Sección 4 — Modelo de datos

```js
// tina/config.ts — heroBackground: nuevo valor (junto a los 9 existentes)
{ value: "fiber", label: "Túnel de fibra (filamentos de luz)" },

// home.hero → subgrupo del modo
{ type: "object", name: "fiber", label: "Hero — modo Túnel de fibra",
  fields: [
    { type: "string", name: "variant", label: "Tratamiento",
      options: [
        { value: "tunel",    label: "Túnel (haces hacia el punto de fuga)" },
        { value: "haz",      label: "Haz (filamentos horizontales)" },
        { value: "reticula", label: "Retícula (malla con paquetes)" },
      ] },
    { type: "string", name: "intensity", label: "Intensidad del efecto",
      options: ["sutil", "medio", "intenso"] },
  ] },

// home → grupo nuevo, hermano de `services` / `stats`
{ type: "object", name: "manifiesto", label: "Home — Frases (tramo narrativo)",
  fields: [
    { type: "object", name: "items", label: "Frases", list: true,
      ui: { itemProps: (i) => ({ label: i?.line1 }) },
      fields: [
        { type: "string", name: "line1",    label: "Línea 1" },
        { type: "string", name: "line2",    label: "Línea 2" },
        { type: "string", name: "line1_en", label: "Línea 1 (EN)" },
        { type: "string", name: "line2_en", label: "Línea 2 (EN)" },
      ] },
  ] },
```

Contenido sembrado en `src/content/home/index.json`: `heroBackground: "fiber"`, `fiber: { variant: "tunel", intensity: "medio" }` y las tres frases validadas en el prototipo, todas construidas con copy que ya existe en el CMS (`hero.subtitle` y `stats.items[]`), no inventado:

| # | Línea 1 | Línea 2 |
| --- | --- | --- |
| 1 | Impulsamos tu operación | con servicios de alta calidad. |
| 2 | Sobre una red privada | 100% de fibra óptica. |
| 3 | Desplegada en 99 ciudades | de todo el Perú. |

El número de frases es libre: el capítulo calcula su altura como `items.length + 1` viewports.

---

## Sección 5 — El motor de capítulos

**Se construye sobre `motion`, no sobre GSAP.** El repo ya tiene el vocabulario completo: `src/scripts/heroOverlap.ts` usa exactamente `scroll(animate(el, {...}, { ease: "linear" }), { target, offset })`, que es literalmente el `scrub` de ScrollTrigger; `src/scripts/fx.ts` ya resuelve contadores (`data-count-up`) y paralaje; y `window.__lenis` ya está expuesto desde `BaseLayout`. Añadir GSAP sería una tercera librería de animación para hacer lo que ya se hace.

**`ScrollChapter.astro`** — markup y CSS, sin lógica:

```astro
---
const { len = 3, id, class: cls } = Astro.props;
---
<section data-chapter id={id} style={`--len:${len}`} class={cls}>
  <div data-chapter-stage><slot /></div>
</section>
```

```css
[data-chapter]       { position: relative; height: calc(var(--len) * 100svh); }
[data-chapter-stage] { position: sticky; top: 0; height: 100svh; overflow: hidden; }
```

**`src/scripts/chapters.ts`** — un helper que traduce "acto del capítulo" a `offset` de Motion y registra la limpieza:

```ts
// Un acto va de la fracción `from` a la fracción `to` del recorrido del wrapper.
// El rango clavado es (len-1)/len del wrapper: de ahí el factor de escala, para
// que `to: 1` signifique "cuando el panel se suelta" y no "cuando el wrapper
// termina" (que ya es fuera de pantalla).
export function act(wrapper: HTMLElement, len: number, from: number, to: number) {
  const k = (len - 1) / len;
  return { target: wrapper, offset: [`${from * k * 100}% start`, `${to * k * 100}% start`] };
}
```

Cada acto es una llamada `scroll(animate(...), act(...))`. El valor devuelto por `scroll()` es su función de parada y **se registra siempre** en el `cleanup` de `onEachPage` (SPEC 110): `scroll()` deja un listener global vivo que sobrevive al swap de View Transitions si no se cancela.

Se descartó atar las animaciones a una custom property (`@property --p` + `calc()` en el `transform`): es más elegante sobre el papel pero deja la animación repartida entre CSS y JS, complica depurar por qué algo no se mueve, y no aporta rendimiento frente a lo que ya hace `motion`.

---

## Sección 6 — El shader de fibra

Fragment shader sobre un triángulo a pantalla completa. La idea es la única que es literalmente el producto del cliente: **luz viajando dentro de vidrio**. Filamentos que convergen a un punto de fuga, con paquetes de luz recorriéndolos.

**La raya horizontal parpadeante — causa y arreglo.** El modo `tunel` trabaja en coordenadas polares: `a = atan(c.y, c.x)`. En el eje donde el ángulo salta de `π` a `−π` hay una discontinuidad, y ahí `fwidth()` —que es la derivada por píxel y es lo que da el antialiasing de cada filamento— se dispara a un valor enorme. Esa fila de píxeles se ensancha hasta cubrir la pantalla y titila con cada frame. **No es un filamento: es el antialiasing reventando en la costura.**

Dos medidas, ambas necesarias:

1. **Acotar el ancho derivado**: `float w = min(fwidth(coord) * 1.6 + 0.0025, 0.25);`. Sin el tope, un solo píxel con derivada infinita pinta una línea a pantalla completa.
2. **Número entero de filamentos por vuelta** (`9, 16, 23, 30`). Con un número no entero, `fract()` no empalma en el salto de `±π` y queda una costura **permanente** además del parpadeo. Es una condición del diseño del shader, no un ajuste: hay que documentarla en el código o volverá con el primer retoque de densidad.

**Otras calibraciones que vienen validadas del prototipo:**

- **Velo radial detrás del texto** (`radial-gradient` de negro al 82% en el centro, transparente al 78% del radio). La primera versión era legible sobre el papel e ilegible en pantalla: el núcleo del túnel cae justo donde va el titular.
- **El núcleo solo brilla durante el hero.** El uniform de fogonazo tiene que **decaer** al salir del hero; si se queda en su valor final (el error del prototipo) el núcleo quema el texto de las frases. El decaimiento es independiente del avance del viaje, que es monótono y va con el progreso global: si el fogonazo moviera el viaje, al decaer se viajaría hacia atrás.
- **Viñeta al 68%** desde el 30% del radio, y tonemap exponencial: sin él los cruces de filamentos se van a blanco.
- **El acento es magenta de marca, nunca blanco**, salvo el propio núcleo.

**Rendimiento.** Todas las palancas en un objeto `PARAMS` al inicio del componente, como en el resto de efectos del repo: `dprMax 1.5` / `dprMobile 1.0`, `fpsFloor 46` con auto-degradado de la escala de render hasta `0.55`, rAF detenido con `document.hidden` y fuera de viewport. Medido en el prototipo a 1440×900: 120 fps sostenidos en reposo y scrollando, sin llegar a degradar.

---

## Sección 7 — Plan de implementación

Cada paso deja el sitio compilando y funcionando.

1. **Motor de capítulos.** `ScrollChapter.astro` + `chapters.ts` con el helper `act()` y el registro de limpieza. Sin consumidores: el sitio no cambia.
2. **Shader.** `FiberTunnel.tsx` con los tres tratamientos, el arreglo de la costura, el fallback sin WebGL2 y el frame único de `prefers-reduced-motion`.
3. **Modo `fiber`.** Enum en `tina/config.ts`, subgrupo `hero.fiber`, wiring en `HeroHomeReact` (carga diferida con `lazy`, como `LatticeField`) y alta en **las dos** listas `CINE_MODES`. Ya es seleccionable desde Tina; el hero todavía no tiene capítulo.
4. **Capítulo del hero.** Envolver el hero en `ScrollChapter` con `--len: 3`, añadir los tres actos de salida y acoplar el progreso a los uniforms.
5. **Contenido.** Grupo `manifiesto` en Tina y sembrado de las tres frases con sus `_en` en `index.json`.
6. **Capítulo de frases.** `Manifiesto.astro` + `ManifiestoReact.tsx` con el relevo y el revelado por máscara, montado en `index.astro` entre el hero y `SolucionesStack`. El wrapper `/en` lo hereda.
7. **Velo de corte** entre capítulos, sin isotipo, y apagado del canvas de fibra antes de que entre el aurora.
8. **QA**: build, navegador a 1440×900 y 390×844, `prefers-reduced-motion`, sin WebGL2, y los cuatro modos de hero anteriores.

---

## Sección 8 — Criterios de aceptación

- [ ] `npx tinacms dev -c "astro build"` termina con exit 0 y el mismo número de páginas que antes del cambio.
- [ ] Con `heroBackground: "fiber"`, **no hay ninguna línea horizontal** —ni fija ni parpadeante— en el fondo, verificado a 1440×900 y 390×844 y en los tres tratamientos.
- [ ] El hero no muestra chips técnicos flotantes ni índice lateral de capítulos.
- [ ] El titular y el subtítulo del hero son legibles sobre el fondo durante todo el recorrido del capítulo.
- [ ] Las frases del capítulo de manifiesto se leen completas: ninguna termina su revelado después de que el panel sticky se haya soltado.
- [ ] Al entrar en `SolucionesStack`, el canvas de fibra ya no consume rAF y el aurora es el único canvas WebGL vivo.
- [ ] Con `prefers-reduced-motion: reduce`: un solo frame del shader, las frases visibles sin scroll y sin capítulos de altura extra.
- [ ] Sin WebGL2: fallback CSS y hero legible.
- [ ] Cambiar `heroBackground` a `lattice`, `cinematic`, `dotfield`, `morph`, `3d`, `video` o `imagen` desde Tina restituye el comportamiento anterior sin residuos del tramo narrativo.
- [ ] Las frases y sus `_en` se editan desde Tina y se reflejan en `/` y en `/en`.
- [ ] Tras navegar a otra página con View Transitions, no queda ningún `scroll()` del tramo narrativo escuchando.
- [ ] No se ven dos logos a la vez durante el morph de entrada (regresión de `CINE_MODES` de la SPEC 112).

---

## Sección 9 — Decisiones tomadas y descartadas

| Decisión | Por qué |
| --- | --- |
| **`motion`, no GSAP** | El repo ya usa `scroll(animate(…, { ease: "linear" }))` en `heroOverlap.ts`, que es el mismo `scrub`. GSAP sería una tercera librería de animación (con `three` y `motion` ya dentro) para hacer lo mismo. El prototipo usó GSAP solo porque era un HTML suelto sin acceso al sistema del proyecto. |
| **`position: sticky`, no `pin`** | Es lo que hacen las dos referencias: `o-scs` tiene 0 ScrollTriggers con `pin` sobre 79. El `pin` reescribe el layout y compite con Lenis; el sticky no. |
| **Rango útil `(len−1)/len`** | El último viewport del wrapper es el traspaso. Atar animaciones al borde del wrapper las termina fuera de pantalla — el error verificado en el prototipo con los contadores. |
| **Modo aditivo `fiber`** | Convención del repo (SPEC 88/112). `lattice` es de hace tres días y sigue en validación: retirarlo ahora sería decidir por el cliente. |
| **Fondo acotado al tramo narrativo** | La Home ya tiene aurora WebGL en `SolucionesStack` y nebula en partners. Dos contextos WebGL vivos a la vez van en contra del requisito duro de rendimiento del cliente. Descartado el canvas continuo en toda la página, que es lo que hace `o-scs`. |
| **Sin isotipo en el corte** | Pedido explícito del cliente ("por ahora"). El velo negro se queda porque es lo que tapa la costura entre paneles. |
| **`SolucionesStack` intacto** | Pedido explícito. Además ya es un capítulo de scroll validado (SPEC 108). |
| **`variant` expuesto en Tina** | Los tres tratamientos ya están escritos y probados en el prototipo, y el cliente eligió comparándolos. Exponerlos cuesta un `select` y evita una spec futura si cambia de opinión. |
| **Frases editables en Tina** | Es copy visible. La alternativa (hornearlo) obligaría a tocar código para corregir una tilde. |
| **Descartado: `@property --p` + `calc()`** | Reparte la animación entre CSS y JS, complica depurar y no mejora el rendimiento frente a `motion`. |
| **Descartado: una spec única** | Toca tres áreas (fondo del hero, sección nueva, re-tratamiento de 5 bloques). No cabe en un objetivo de una frase; se parte en 113 y 114. |

---

## Sección 10 — Riesgos

1. **Solape de canvas en el traspaso.** Si el apagado del canvas de fibra llega tarde, hay un momento con dos contextos WebGL2 vivos. Mitigación: `IntersectionObserver` con margen sobre el tramo narrativo, y criterio de aceptación explícito.
2. **Longitud percibida.** El tramo añade ~5 pantallas antes del primer bloque de conversión. La palanca es `--len` de cada capítulo (hero 3, frases `items+1`), y está pensada para bajarla sin tocar animaciones.
3. **`CINE_MODES` duplicado.** Dar de alta el modo en una sola de las dos listas reproduce el bug de los dos logos de la SPEC 112. Va como criterio de aceptación.
4. **`scroll()` y View Transitions.** Deja listener global; sin registrar la parada en el `cleanup` de `onEachPage` se acumulan entre navegaciones (SPEC 110).
5. **`100svh` en iOS.** La barra del navegador cambia la altura del viewport durante el scroll y el recorrido de un capítulo se recalcula. `svh` es la unidad correcta, pero conviene verificar en dispositivo real que el relevo de frases no salta.
6. **El shader en equipo ligero.** Hay auto-degradado, pero la medición de fps en un equipo modesto sigue siendo requisito duro del cliente y no se ha hecho todavía (mismo pendiente que dejó la SPEC 112).
