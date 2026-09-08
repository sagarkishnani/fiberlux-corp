# SPEC 100 — Hero Home: nube de partículas que se dispersa con el scroll (Three.js)

> **Estado:** Aprobado
> **Depende de:** SPEC 88 (patrón de modos `heroBackground`), SPEC 97 (modo `cinematic` = planeta COBE, el fondo actual que se conserva), SPEC 96 (island de efecto WebGL + wiring Tina + carga diferida de `three`), SPEC 39 (wordmark FIBERLUX / `HeroLogoIntro`), SPEC 80 (i18n `_en`/`tField`), SPEC 44 (poster mobile 3D)
> **Fecha:** 2026-09-08
> **Objetivo:** Añadir un nuevo modo de fondo del hero `dotfield` — una nube esférica de partículas en Three.js, sobre rejilla y halo morado, que se inclina hacia el puntero y se dispersa conforme se hace scroll.
>
> **Revisión (2026-09-08, tras QA con el cliente):** el alcance cambió durante la implementación. (1) El efecto queda **solo en el hero**: se retiró la reaparición en secciones posteriores. (2) La **malla plana de puntos con ondas expansivas** se sustituyó por una **nube esférica que se dispersa con el scroll**, siguiendo las referencias de guardz.com que trajo el cliente — la malla se veía "simple", no impactante. Las secciones marcadas ~~así~~ quedaron sin efecto.

---

## Sección 2 — Alcance

**Dentro:**

- **Nuevo modo `heroBackground: "dotfield"`** en el enum del CMS, hermano de `3d`/`video`/`imagen`/`waveform`/`nodefield`/`morph`/`cinematic`. **Aditivo**: ningún modo existente se toca. Queda **activo en el home**.
- **El planeta actual sigue disponible.** El modo `cinematic` (`CinematicBackground.tsx`, planeta punteado COBE) se conserva íntegro y seleccionable desde Tina; se le **corrige la etiqueta**, que decía "god-rays + tokens flotantes" (texto heredado de SPEC 97, antes de que el componente pasara a ser el planeta). Pasa a leer *"Planeta de fibra (globo punteado)"*.
- **Nuevo componente `src/components/effects/ParticleNebula.tsx`** (React island, Three.js). Tres capas, de atrás hacia delante:
  1. **Halo radial morado** sobre el negro base y **rejilla tenue** enmascarada hacia los bordes — ambos en CSS, porque son estáticos.
  2. **Nube esférica de partículas** (`THREE.Points` + `ShaderMaterial` additivo): miles de puntos repartidos sobre una **corteza** esférica (más densos hacia el borde, para que se lea el contorno de la esfera y no una bola maciza), con giro autónomo lento, "respiro" y centelleo por partícula.
  3. **Paleta escalonada**: mayoría de partículas tenues en morado, ~17% encendidas en magenta claro y más gordas (el bokeh del ref), y un ~3% de acento frío cian — el guiño a la referencia; `accentRatio: 0` lo deja 100% en paleta Fiberlux.
- **Dispersión ligada al scroll** (el efecto que pidió el cliente): el progreso se mide contra el alto del propio hero y expande el radio de cada partícula con un **multiplicador propio por partícula** — sin eso la nube se escala como un bloque y parece un zoom, no una dispersión. Al final del recorrido queda un campo suelto de puntos sobre la rejilla.
- **Inclinación por puntero** (desktop): la nube se inclina suavemente hacia el cursor (lerp), dando profundidad. Desactivada en touch y en `reduced-motion`.
- **Sistema de pulsos** (lo que sobrevive del `dot-wave` de referencia): un frente esférico viaja del centro hacia fuera y, al cruzar cada capa de la nube, **empuja y enciende** sus partículas. Es el anillo del HTML de referencia trasladado del plano al radio de la esfera. Se dispara por **click en el hero** (fuerza 1.4, ignorando clicks sobre botones/links para no competir con ellos) y **solo** cada 3.2–5.4 s (fuerza 0.7), con los mismos tiempos del ref. Máximo 4 pulsos simultáneos; desactivado en `reduced-motion`.
- **Editable en Tina**: subgrupo `hero.dotfield` con `intensity` (`sutil`/`medio`/`intenso`, mapeado a presets de conteo, opacidad y tamaño). El resto (paleta, radio, corteza, velocidades, curva de dispersión) va horneado en `PARAMS`.
- **El wordmark FIBERLUX (`HeroLogoIntro`) y toda la coreografía de entrada se mantienen**: el modo comparte el "chrome cinematográfico" con `cinematic` a través de un `CINE_MODES` en `HeroHomeReact` y de la clase `.cine-intro-page` de `BaseLayout`.
- **Velo de legibilidad propio**: en este modo el velo radial del centro baja mucho respecto al de `cinematic` (allí tapa el brillo del planeta; aquí borraría justo la nube, que **es** el fondo). Queda un apoyo mínimo bajo el bloque de texto, más un refuerzo en mobile.
- **Mobile — versión ligera**: menos partículas, DPR cap 1.5, sin inclinación por puntero, tope de ~30 fps y cámara más lejos (en retrato la nube debe caber entera detrás del texto). Reemplaza el poster estático de SPEC 44 solo en este modo.
- **Accesibilidad**: `prefers-reduced-motion: reduce` → frame estático (nube quieta, sin dispersión ni puntero, sin rAF). Canvas `aria-hidden`. Señal `fbx:hero-scene-loaded` para el `SitePreloader`.
- **Rendimiento**: `three` se importa en diferido (`lazy` + `Suspense`, igual que `MorphSolutions`); el rAF se pausa fuera de viewport (`IntersectionObserver`); `renderer.dispose()`, `geometry.dispose()`, `material.dispose()` y baja de listeners al desmontar.

**Fuera de alcance:**

- ~~Reaparición del efecto en secciones posteriores del home~~ — **retirado en la revisión**. Se implementó y se revirtió: las secciones pintan su propio fondo opaco (y `SolucionesStack` ya tiene su aurora WebGL propia), así que exigía tocarlas con una prop `transparentBg`. El cliente acotó el efecto al hero.
- ~~Malla regular de puntos con ondas expansivas por hover/click/scroll~~ — **sustituida** por la nube esférica. La malla se leía "simple"; la referencia de guardz.com es una nube volumétrica.
- Aplicar `dotfield` a heros de **otras páginas** o al resto de la web.
- Retirar o reescribir los modos existentes (`cinematic`, `morph`, `waveform`, `nodefield`, `3d`, `video`, `imagen`).
- Exponer en el CMS paleta, radio, corteza, velocidades o curva de dispersión (horneados en `PARAMS`; solo `intensity` es editable).
- Traducción `_en`: el modo no introduce copy visible.
- Réplica 1:1 de guardz.com: se hace interpretación de marca en morado.

---

## Sección 3 — Modelo de datos

**Contenido nuevo en Tina** (colección `home`, grupo `hero`, en `tina/config.ts`):

```js
// heroBackground → nuevo valor + etiqueta corregida de "cinematic"
{ value: "cinematic", label: "Planeta de fibra (globo punteado)" },   // etiqueta corregida
{ value: "dotfield",  label: "Campo de puntos (ondas por scroll)" },  // nuevo

// home.hero → subgrupo del modo
{ type: "object", name: "dotfield", label: "Hero — modo Campo de puntos",
  fields: [
    { type: "string", name: "intensity", label: "Intensidad del efecto",
      options: ["sutil", "medio", "intenso"] },
  ] }
```

- `intensity` es el **único** campo editable. Sin siblings `_en` (no hay texto visible).
- Contenido en `src/content/home/index.json`: `heroBackground: "dotfield"`, `dotfield.intensity: "medio"`.
- El grupo `hero.cinematic` (planeta) se conserva tal cual, para poder volver al fondo anterior desde Tina sin perder su configuración.

**Estado en runtime (`ParticleNebula.tsx`):**

```ts
const PARAMS = {
  count: 12000, countMobile: 4500,      // partículas
  dprCap: 2, dprCapMobile: 1.5,
  radius: 1.0,
  cameraZ: 2.85, fov: 45,
  sizeMin: 2.0, sizeMax: 6.8,           // px; las encendidas son más gordas (bokeh)
  brightRatio: 0.17, accentRatio: 0.03, // encendidas / acento frío
  rotationSpeed: 0.045, breathAmp: 0.035, breathSpeed: 0.35, twinkleSpeed: 1.4,
  shell: 0.26,                          // corteza fina: silueta nítida
  pulse: { maxActive: 4, band: 0.16, speed: 0.85, maxRadius: 2.1,
           push: 0.26, clickStrength: 1.4, autoStrength: 0.7 },
  autoPulseMs: [3200, 5400],
  spreadMax: 3.6, spreadFadeAt: 0.78,   // curva de dispersión por scroll
  pointerTilt: 0.16, pointerEase: 0.05,
  colorDim: [0x7a,0x3f,0x92], colorMid: [0xce,0x66,0xb8],
  colorHot: [0xff,0xa8,0xe8], colorAccent: [0x4b,0xd6,0xe2],
  haloStops: ["#3B0E30", "#1A0716", "#0A0A0A"], gridSize: 88, gridAlpha: 0.05,
} as const;

const INTENSITY = {
  sutil:   { countMul: 0.6,  opacity: 0.85, sizeMul: 0.9  },
  medio:   { countMul: 1.0,  opacity: 1.3,  sizeMul: 1.0  },
  intenso: { countMul: 1.35, opacity: 1.7,  sizeMul: 1.15 },
} as const;
```

**Atributos por partícula** (todos precomputados una vez al montar, subidos como `BufferAttribute`): `position` = dirección **normalizada** sobre la esfera, `aRadius` = radio propio dentro de la corteza, `aSpread` = multiplicador de dispersión propio, `aSize`, `aPhase` (centelleo), `aColor`.

Separar dirección y radio es lo que permite expandir la nube **sin tocar el buffer**: el shader hace `position * (aRadius * uBreath * (1 + uSpread * aSpread * spreadMax))`. Por frame en JS solo se actualizan `uTime`, `uSpread`, `uBreath` y la rotación — el coste no crece con el número de partículas.

---

## Sección 4 — Plan de implementación

1. **Scaffold del island** con renderer, cámara perspectiva, guard de WebGL, resize coalescido, `IntersectionObserver`, señal de preloader y cleanup completo.
2. **Geometría de la nube**: direcciones uniformes sobre la esfera (método de la coordenada z), radios con densidad hacia el borde, y los atributos por partícula (`aSpread`, `aSize`, `aPhase`, `aColor`) con el reparto de paleta.
3. **Shader**: posición radial + turbulencia lenta, centelleo, tamaño por profundidad (`gl_PointSize` ∝ 1/z), y fragment con núcleo nítido + halo suave (el bokeh sin textura).
4. **Movimiento propio**: giro autónomo, "respiro" de la nube.
5. **Dispersión por scroll**: progreso contra el alto del hero, suavizado hacia el uniform `uSpread`, con desvanecimiento parcial al final.
6. **Inclinación por puntero** en desktop, con lerp en el rAF.
7. **Fondo CSS**: halo radial morado + rejilla tenue enmascarada hacia los bordes.
8. **Wiring del modo en el hero** (`HeroHomeReact`): import diferido, bloque `dotfield` en z-0, y extensión del chrome cinematográfico (`CINE_MODES` + `.cine-intro-page`) para que el wordmark, la coreografía de entrada y el bloqueo de scroll funcionen igual que en `cinematic`.
9. **Velo de legibilidad propio del modo** (mucho más suave que el del planeta) en mobile y desktop.
10. **Tina + contenido**: enum, etiqueta corregida de `cinematic`, subgrupo `dotfield`, regeneración de tipos y seed del contenido.
11. **Mobile ligero**: conteo, DPR, cámara más lejos en retrato, sin puntero, tope de 30 fps.
12. **QA visual + build**: comparar contra las referencias de guardz.com en los tres momentos (nube compacta arriba → dispersión a media pantalla → campo suelto), verificar legibilidad del texto y que `npm run build` pase.

---

## Sección 5 — Criterios de aceptación

- [ ] Existe `heroBackground: "dotfield"` en el enum de Tina y el home lo usa; los demás modos siguen funcionando sin cambios.
- [ ] El modo `cinematic` (planeta punteado) sigue seleccionable y su etiqueta ya no dice "god-rays + tokens flotantes".
- [ ] Con `dotfield` activo, el hero muestra una **nube esférica densa de partículas** renderizada con **Three.js/WebGL**, sobre rejilla tenue y halo morado.
- [ ] La nube tiene **profundidad**: partículas de distinto tamaño y brillo, mayoría tenues y una minoría encendidas más gordas.
- [ ] La nube **gira, respira y centellea** sin ninguna interacción.
- [ ] Cada 3.2–5.4 s un **pulso** recorre la nube del centro hacia fuera, empujando y encendiendo las partículas al pasar.
- [ ] **Hacer click** en el hero dispara un pulso más fuerte; hacer click en un botón o link del hero **no** lo dispara.
- [ ] Al hacer **scroll** la nube **se dispersa** progresivamente hasta quedar un campo suelto de puntos, y vuelve a compactarse al subir.
- [ ] En **desktop** la nube se **inclina hacia el puntero**; en **touch** no.
- [ ] `hero.dotfield.intensity` cambia visiblemente densidad, brillo y tamaño.
- [ ] El wordmark FIBERLUX y la coreografía de entrada (titular, subtítulo, botones) funcionan igual que en `cinematic`.
- [ ] El texto del hero se lee sobre la nube sin que el velo la borre.
- [ ] En **mobile** corre la versión ligera (menos partículas, DPR 1.5, sin puntero, 30 fps), no el poster estático.
- [ ] Con `prefers-reduced-motion: reduce` la nube queda estática, sin rAF ni dispersión.
- [ ] El modo dispara `fbx:hero-scene-loaded`.
- [ ] El rAF se pausa fuera de viewport y, al desmontar, no quedan listeners, rAF ni recursos WebGL sin liberar.
- [ ] `three` se carga en diferido: con `heroBackground` en cualquier otro modo, no se descarga.
- [ ] **Ninguna sección del home** distinta del hero muestra el efecto; `SolucionesStack` conserva su aurora en el home, `/soluciones` y `/soporte-tecnico`.
- [ ] `npm run build` pasa sin errores nuevos.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** `dotfield` como **nuevo modo aditivo**, con el planeta actual (`cinematic`) conservado y seleccionable desde Tina (pedido explícito del cliente).
- **Sí:** **Three.js/WebGL** con todo el trabajo por partícula en el shader. El cliente lo pidió explícitamente ("que no sea algo simple con SVGs") y `three` ya era dependencia (SPEC 96).
- **Sí (revisado en QA):** **nube esférica volumétrica** en lugar de la **malla plana de puntos con ondas expansivas** del primer diseño. La malla se implementó completa (grid + ripples por hover/scroll/automáticas) y el cliente la vio "simple"; las referencias de guardz.com que trajo son una nube densa que se dispersa. Se conservó de la primera versión la idea de **scroll como motor del efecto**, pero como dispersión, no como onda.
- **Sí (revisado en QA):** el efecto queda **solo en el hero**. La reaparición en `SolucionesStack`/`EmpresasRed`/`BannerApp` se llegó a implementar (wrapper `DotFieldBackdrop` + prop `transparentBg`) y se revirtió por decisión del cliente. De paso se documenta el hallazgo: **todas las secciones del home pintan su propio fondo opaco**, así que cualquier telón por detrás exige tocarlas.
- **Sí (revisión 2):** **corteza más fina y esfera más contenida** (`shell` 0.42 → 0.26, `cameraZ` 2.25 → 2.85). Llenando el hero de borde a borde la nube se leía difusa; con la silueta definida gana impacto.
- **Sí (revisión 2):** se recupera el **ripple del `dot-wave`** como **sistema de pulsos radiales** (click + automáticos). Es la pieza del primer diseño que sí traduce bien a una nube 3D. Se descartó el ripple por hover (compite con la inclinación de la nube, que ya es la respuesta al cursor) y el ripple ligado al scroll (el scroll ya tiene su propio efecto: la dispersión).
- **Sí:** **dispersión con multiplicador por partícula**, no escala uniforme de la nube — si no, se ve como un zoom.
- **Sí:** **velo de legibilidad propio y mucho más suave** que el de `cinematic`. Reusar el del planeta borraba la nube justo en el centro.
- **Sí:** el modo **comparte el chrome cinematográfico** (wordmark, coreografía, bloqueo de scroll) vía `CINE_MODES`, en vez de duplicar bloques. Descubierto en QA: esos efectos estaban gateados por `mode === "cinematic"` y en `dotfield` el titular no se revelaba nunca.
- **Sí:** **acento frío cian minoritario** (~3%) como guiño al ref; `accentRatio: 0` lo deja 100% en paleta Fiberlux si el cliente lo prefiere.
- **Sí:** en el CMS solo `intensity`; el resto horneado en `PARAMS`, coherente con SPEC 96/97.
- **No:** aplicar `dotfield` a otras páginas, traducir copy, exponer parámetros crudos, ni replicar 1:1 guardz.com.

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| 12.000 partículas WebGL en el hero castigan móviles de gama media | Conteo y DPR reducidos en mobile, tope de ~30 fps en táctiles, pausa fuera de viewport, todo el trabajo por partícula en GPU (JS solo mueve 4 uniforms por frame). Pendiente de medir en iPhone real. |
| `three` (~508 KB sin comprimir) pasa a descargarse siempre en el home | Import diferido (`lazy` + `Suspense`), igual que `MorphSolutions`. Si pesa en QA, evaluar un build slim de `three`. |
| La nube resta legibilidad al titular/subtítulo/botones | Velo suave bajo el bloque de texto (reforzado en mobile), vignettes existentes en z-[1], contenido en z-10. Verificado en QA a 1440×900. |
| El acento cian se sale de la paleta de marca | Es un `PARAMS.accentRatio` de una línea: bajarlo a 0 deja la nube 100% morada. |
| La dispersión se siente brusca o demasiado rápida | `spreadMax` + `spreadFadeAt` + el denominador del progreso son afinables en `PARAMS`; ya se suavizaron una vez en QA. |
| El resultado no calza "1:1" con guardz.com | Se decidió interpretación de marca en morado, no copia. |

---

## Qué **no** está en este spec

- Reaparición del efecto en secciones posteriores del home (retirado por el cliente).
- Aplicar `dotfield` en heros de otras páginas.
- Exponer paleta, radio, velocidades o curva de dispersión en el CMS.
- Retirar o reescribir los modos de fondo existentes, incluido el planeta `cinematic`.
