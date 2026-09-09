# SPEC 112 — Hero Home: retícula volumétrica atravesada por ondas (Three.js)

> **Estado:** Prototipo para validación con el cliente
> **Depende de:** SPEC 88 (patrón de modos `heroBackground`), SPEC 97 (chrome cinematográfico del hero), SPEC 100 (`dotfield` / `ParticleNebula`, el fondo que este modo viene a sustituir), SPEC 96 (island de efecto WebGL + wiring Tina + carga diferida de `three`), SPEC 39 (wordmark FIBERLUX / `HeroLogoIntro`)
> **Fecha:** 2026-09-08
> **Objetivo:** Nuevo modo de fondo del hero `lattice` — una retícula 3D de puntos por la que se avanza, atravesada por ondas esféricas de luz que la sueltan de su formación y la dejan recomponerse.

---

## Sección 1 — Origen

El cliente rechazó el fondo actual (`dotfield`, SPEC 100) por ser **"literalmente una copia de guardz"**. Sus dos referencias son:

1. `guardz.com` — nube volumétrica de partículas, profundidad, paralaje.
2. Un HTML propio, `dot-wave-background.html` — malla plana de puntos con ondas circulares expansivas que **encienden** los puntos al pasar (no los desplazan).

Encargo textual: **mezclar ambas, sin copiar ninguna y sin que se vea superpuesto** (nada de pintar la malla encima de la nube). Además, y explícitamente: **ni nodos ni planeta**; tiene que ser novedoso, abstracto y tech.

**Lo que delataba la copia** en `ParticleNebula` (útil para no reincidir): la **silueta esférica centrada** detrás de texto centrado, el **bokeh** de partículas grandes y difusas (`sizeMax: 6.8`, comentado en el propio código como *"hacen el bokeh del ref"*), el **estallido al hacer scroll**, y el **acento cian** (`accentRatio`). Ninguno de los cuatro sobrevive aquí.

## Sección 2 — Concepto

> **Revisión (2026-09-08, tras QA con el cliente).** La primera versión soltaba los puntos de su nodo al paso del frente (una "transición de fase" de malla a nube). El cliente la rechazó: *"la interacción es demasiado tosca, los elementos van por doquier y no hay una estructura fija; me lo imaginaba más como un pulse"*. Y además: *"no es impactante, solo es un fondo y ya"*. El desplazamiento se eliminó por completo y se añadieron cuatro capas de acontecimiento.

**REGLA DE ORO: los puntos no se mueven.** Están clavados en su nodo y lo único que viaja es la luz — igual que en el HTML de referencia, donde los puntos solo crecen y brillan al pasar la onda. La única excepción es la formación de entrada, que ocurre una vez y termina.

De ahí sale el concepto: **en reposo ves una malla; cuando el pulso la atraviesa descubres que es un volumen.** El volumen no se dibuja, se revela — y eso lo consigue tener dos ventanas de profundidad distintas (ver Sección 5).

Cinco capas de comportamiento sobre las mismas partículas:

1. **Retícula** — nodos fijos en una caja 3D, con una banda de foco estrecha que deja UNA capa nítida.
2. **Pulso** — anillo de luz que nace donde el usuario hace click. **En desktop no hay ningún pulso automático, ninguno**: ni recurrente ni al terminar la intro. El pulso lo pone el usuario. Solo en **táctil** (donde es poco probable que nadie toque la pantalla) late solo, un anillo flojo cada 9 s desde el wordmark.
3. **Onda de señal** — un paquete de luz recorriendo una traza sinusoidal de lado a lado, como una señal por un cable.
4. **Puntero** — lente de luz que enciende los nodos a su alrededor; click = anillo desde ahí. Es lo que hace que deje de ser un vídeo de fondo. Estaba en el HTML de referencia desde el principio (radio 140 px, escala +1.8) y la primera versión no lo implementó.
5. **Formación de entrada** — los puntos llegan sueltos y se cuadran, cristalizando hacia fuera desde el wordmark.
6. **Dispersión de salida** — al scrollear, ligada a la **velocidad** (no solo a la posición): ataque rápido (`0.18`) para que la rotura se sienta causada por tu scroll, y retorno lento (`0.055`) para que se vea recomponerse. Reutiliza el mismo vector por partícula que la formación, así cada punto se va por su lado — sin eso la retícula se escalaría en bloque y parecería un zoom. La velocidad se mide en el loop (no en el evento de scroll) para tener un `dt` fiable; con Lenis el `scrollY` ya viene suavizado.

Gesto de scroll (salida): el plano de foco **retrocede**, el campo se apaga y la retícula **se dispersa en función de la VELOCIDAD del scroll** — bajas de golpe y se deshace; te paras y se recompone sola en su formación exacta. La dispersión rompe la regla de oro a propósito, igual que la formación de entrada: son las dos **transiciones**, momentos en los que la retícula está llegando o yéndose, no en reposo.

## Sección 3 — Alcance

**Dentro:**

- **Nuevo modo `heroBackground: "lattice"`** en el enum del CMS, hermano de los existentes. **Aditivo**: ningún modo se toca, `dotfield` y `cinematic` siguen seleccionables desde Tina para comparar.
- **Nuevo componente `src/components/effects/LatticeField.tsx`** (React island, Three.js): un solo `THREE.Points` + `ShaderMaterial` aditivo, con las cinco capas de la Sección 2.
- **Editable en Tina**: subgrupo `hero.lattice` con `intensity` (`sutil`/`medio`/`intenso`). El resto va horneado en `PARAMS`.
- **Comparte el chrome cinematográfico** con `cinematic`/`dotfield` (wordmark, coreografía de entrada, bloqueo de scroll) vía `CINE_MODES`. **Ojo:** esa lista está DUPLICADA en `BaseLayout.astro` (`homeHeroCinematic`) y hay que tocar las dos. Añadir el modo solo en `HeroHomeReact` deja el `.cine-intro-page` sin aplicar, y entonces el CSS `.cine-intro-page [data-hero-logo]` no oculta el wordmark real durante el morph FLX→FIBERLUX: **se ven dos logos a la vez**, el real y el de la intro. Fue exactamente el bug que reportó el cliente.
- **Velo de legibilidad propio en mobile**, más suave que el de los otros modos (ver Sección 5).
- **Accesibilidad**: `prefers-reduced-motion` → frame estático sin ondas ni avance. Canvas `aria-hidden`. Señal `fbx:hero-scene-loaded` para el `SitePreloader`.
- **Rendimiento**: `three` en diferido (`lazy` + `Suspense`), rAF pausado fuera de viewport (`IntersectionObserver`), tope de 30 fps y DPR 1.35 en mobile, tope duro de conteo, y `dispose()` de geometría/material/renderer al desmontar.

**Fuera de alcance:**

- Aplicar el modo a heros de otras páginas.
- Retirar `dotfield`/`ParticleNebula` — se conserva hasta que el cliente valide la dirección (incluido su uso como telón de la franja de partners, que este spec no toca).
- Exponer en el CMS paleta, pasos de la retícula, foco o velocidades.
- Traducción `_en`: el modo no introduce copy visible.

## Sección 4 — Modelo de datos

```js
// tina/config.ts — heroBackground: nuevo valor
{ value: "lattice", label: "Retícula volumétrica (onda que la atraviesa)" },

// home.hero → subgrupo del modo
{ type: "object", name: "lattice", label: "Hero — modo Retícula volumétrica",
  fields: [
    { type: "string", name: "intensity", label: "Intensidad del efecto",
      options: ["sutil", "medio", "intenso"] },
  ] }
```

Contenido en `src/content/home/index.json`: `heroBackground: "lattice"`, `lattice.intensity: "medio"`.

## Sección 5 — Implementación y calibración

**Truco central: cero estado por partícula.** Como el frente viaja a velocidad constante desde un origen fijo, el shader **despeja** el instante en que cruzó a cada partícula:

```
age = uTime − t0 − distancia(p, origen) / velocidad
```

`age ≈ 0` enciende (gaussiana estrecha). Sin buffers de estado, sin trabajo por partícula en JS: por frame solo se mueven unos pocos uniforms, así que el coste no crece con el número de puntos. Y un `t0` **en el futuro** da `age < 0` y no enciende nada, así que una **ráfaga entera de anillos concéntricos se programa de una sola vez**.

**Dos ventanas de profundidad, y ahí está el concepto entero.** `rest` es una gaussiana **estrecha** (`focusWidth 1.35`) que solo deja nítida una capa: es lo que hace legible la retícula. `wake` es **mucho más ancha** (`3.8`) y solo la usan los eventos: por eso, cuando el pulso atraviesa, se encienden también las capas del fondo y el campo se **revela** como volumen. El origen del latido va detrás del plano de foco (`depth 6.2` vs `focusDist 4.6`), así que el frente llega primero al fondo y **avanza hacia la cámara** — lo que una referencia plana no puede hacer.

**El hueco de legibilidad se aplica solo al reposo**, nunca a los eventos: el campo se abre alrededor del texto pero el pulso lo atraviesa entero.

### Cinco calibraciones que decidieron si el efecto se ve o no

Están todas comentadas en el código porque **no son obvias y todas se descubrieron a base de romperlas**:

1. **Paso lateral ≠ paso en profundidad** (`spacing 0.30` vs `spacingZ 2.2`). Con una retícula isótropa densa caben ~7 capas en el rango visible, se superponen a escalas distintas y el conjunto se lee como **ruido**, por perfectamente ordenado que esté en 3D.
2. **Banda de foco** (`focusDist 4.6`, `focusWidth 1.35`) en vez de un fundido cerca/lejos. Deja **una** capa nítida y las vecinas como eco; y como la banda está fija en el espacio mientras la retícula avanza, las capas entran y salen de foco solas (profundidad de campo).
3. **Giro casi nulo** (`yaw 0.05`, `pitch 0.03`). El giro inclina cada capa en profundidad (`halfW · sin(yaw)` unidades a lo ancho del encuadre); en cuanto esa inclinación se acerca al paso entre capas, una misma capa entra y sale de foco a lo largo de la pantalla y vuelve la papilla. A 17º el patrón se descompone del todo.
4. **Variación de brillo entre nodos muy contenida** (`baseDim 0.78`, `brightRatio 0.08`, centelleo ±0.12). Verificado a ojo aislando el efecto: con brillo plano la malla salta a la vista; con 50% de rango, desaparece. **Nodos de brillos muy dispares destruyen la lectura de orden aunque la geometría sea exacta.**
5. **Velocidad y grosor del anillo** (`speed 2.1`, `width 0.26`). A 5.2 u/s el frente cruzaba el encuadre en 0.6 s — un fogonazo imperceptible; la referencia tarda ~2.5 s. Y el anillo tiene que ser **más ancho que una celda** (≈1.8 celdas): más estrecho, cae entre nodos y en vez de un aro se encienden puntos sueltos.
6. **Separación de la ráfaga ≫ ancho del anillo** (`burstGap 0.7` vs `width 0.26`). Con anillos casi pegados se funden en una sola banda gorda en vez de leerse como anillos concéntricos.
7. **El ancho del anillo va en ESPACIO, no en tiempo.** Medido en tiempo, el grosor real es `|dr/dt|·width`: con expansión desacelerada el aro nace como un pegote de ~340 px que se va afinando. Es lo que hacía que el click *"no se sintiera satisfactorio"*. En espacio, el aro tiene grosor constante (≈1.5 celdas) y se lee como aro desde el primer frame. Además el radio se calcula en JS (es el mismo para todos los puntos), así que el shader solo compara distancias: una exponencial por anillo.
8. **Expansión desacelerada** `r(t) = A·(1 − e^(−t/τ))` (`reach 11`, `ease 1.9`). A velocidad constante la onda del click salía con la misma inercia que una ambiental, sin acuse de recibo. Desacelerando, sale disparada y se asienta sola.
9. **En desktop no hay pulso automático.** Primero fue ráfaga de 3 anillos + eco cada 6 s, luego un anillo flojo cada 9 s, y al final ninguno: el cliente lo pidió explícito — *"solo debería haber pulse si hago click"*. Un latido de fondo, por flojo que sea, compite con el del usuario en vez de dejarle mandar. Queda **solo en táctil** (`heart.autoOnTouch`, gated por `(hover: hover) and (pointer: fine)`), donde es poco probable que nadie toque la pantalla y el campo se quedaría inerte. Al quitar el ambiente hubo que subir el reposo (`restLevel 0.62 → 0.78`) o el hero se quedaba apagado entre clicks.
10. **Destello local en el click** (`punch 1.8`, decaimiento 6.5/s ⇒ casi todo se va en ~0.35 s), aparte del anillo que sale. Sin él el click solo lanza algo que se aleja y no se siente que hayas **tocado** nada.
11. **Topes de saturación** (`ring.cap 1.3`, `eventCap 2.2`, `maxPointPx 13`). Los eventos se suman (latido + barrido + puntero) y sin tope el campo se iba a blanco, los puntos se convertían en discos enormes y el titular quedaba ilegible. El tono encendido es **magenta de marca, no blanco**, por lo mismo.

### Otras decisiones

- **Punto duro, sin bokeh**: núcleo con borde apenas suavizado (`smoothstep(1.0, 0.55, d)`) y halo mínimo (0.2).
- **Sin avance de la cámara.** La primera versión hacía viajar la retícula con un bucle envolvente; se retiró junto con el desplazamiento: si lo único que debe moverse es la luz, la retícula tampoco se mueve. Queda un vaivén de 0.012 rad y el paralaje del puntero.
- **Sin rejilla CSS.** Los modos anteriores pintaban una grilla plana en CSS sobre el efecto. Aquí eso sería literalmente la superposición que el encargo prohíbe: **la grilla la dibuja la propia retícula.** Solo queda el halo radial morado.
- **Hueco de legibilidad**: el campo se **abre** alrededor del bloque de texto (elipse en NDC, ponderada por profundidad para que solo afecte a los puntos cercanos) en vez de taparse con un velo. El titular queda *dentro* del campo, no encima.
- **Paleta 100% Fiberlux**, sin acento frío.
- **Mobile**: menos capas (`spacingZ 2.6`), DPR 1.35, 30 fps, sin paralaje de puntero, y **velo propio más suave** — el de `dotfield` (0.82 de negro, calibrado contra el brillo de la esfera) borraba la retícula entera.

## Sección 6 — Verificación

- `npx tinacms dev -c "astro build"` → **108 páginas, exit 0**.
- Verificado en navegador a 1440×900 y 390×844: retícula con estructura fija y legible, formación de entrada, anillo por click y por latido, barrido de señal, lente del puntero, y retroceso del foco al scrollear. Titular legible en todos los estados.
- Sin errores ni avisos de shader en consola.

## Sección 7 — Pendiente tras validación

- Decidir si `dotfield`/`ParticleNebula` se retira (incluido su uso como telón de la franja de partners) o se conserva como alternativa en Tina.
- Medición de fps en equipo ligero (requisito duro del cliente).
- Afinado fino de intensidad/paleta con el cliente sobre el prototipo.
