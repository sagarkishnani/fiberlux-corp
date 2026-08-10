# SPEC 101 — Hero de Nosotros: candado seguro sobre red viva (WebGL híbrido)

> **Estado:** Implementado
> **Depende de:** SPEC 03 (nosotros), SPEC 91 (heros nosotros/casos fondo flow), SPEC 92 (NodeField plexus), SPEC 98 (CinematicRays god-rays)
> **Fecha:** 2026-08-10
> **Objetivo:** Rehacer el hero de `/nosotros` como una escena híbrida — red plexus viva (NodeField) de fondo + candado morado sólido a la derecha como núcleo seguro, con un halo de god-rays Three.js detrás — en layout de dos columnas (título izquierda, gráfico derecha).

## Sección 1 — Por qué existe este spec

El cliente pidió llevar la referencia (candado con íconos orbitando) al hero de Nosotros con el dinamismo del hero Home/Soluciones. La primera versión (SVG/CSS puro, candado centrado como fondo) se veía plana y "no parecía un hero". Tras iterar con el cliente se decidió: (1) layout de dos columnas con el candado a la derecha y el título a la izquierda a la misma altura; (2) subir el impacto con **WebGL**, reusando el patrón del sitio (efecto con fallback) para no romper el requisito de rendimiento. La conexión temática con Nosotros la da una **red de nodos** ("La red que impulsa a las empresas del Perú"), con el candado como núcleo seguro de esa red.

## Alcance

**Dentro:**

- `src/components/effects/OrbitLock.tsx`: candado central **sólido** (relleno) en disco magenta con glow que pulsa, anillos concéntricos + arco cónico girando, tres **tiles glass** (glassmorphism) con íconos **lineales** que orbitan y contra-rotan: **rayo, servidor, globo**. SVG/CSS, sin WebGL.
- `src/components/effects/LightHalo.tsx` (nuevo): halo de **god-rays + polvo GPU** (Three.js), fuente de luz colocada **detrás del candado** (derecha en desktop, centrada en mobile vía `lightPosMobile`). Deriva compacta del shader de `CinematicRays`. Alpha de salida = intensidad (para componerse sobre el canvas de la red, no taparlo).
- `src/components/nosotros/HeroNosotrosReact.tsx`: layout dos columnas (texto izquierda · gráfico derecha, `items-center`), con capas **NodeField (plexus, canvas 2D) → LightHalo (god-rays) → velo → contenido**. Se retiró `FlowEffect` y su fallback (`showFallback`, `hero-nosotros-bg`, `circular-gradient-bg.avif`).
- **Fallback y rendimiento:** NodeField es canvas 2D (liviano) y siempre funciona; LightHalo es WebGL con `onUnsupported` → si falla, se oculta el halo y quedan red + candado. Ambos: render a escala reducida/DPR capado (LightHalo), pausa fuera de viewport, y respetan `prefers-reduced-motion`.
- **Mobile:** gráfico centrado (halo con `lightPosMobile`), fondo atenuado (velo inferior) y el texto **solapa** un poco el gráfico (negative margin + z por encima).

**Fuera de alcance (specs futuros):**

- Eliminar o modificar `FlowEffect.tsx` (el archivo permanece intacto).
- Editabilidad en Tina de íconos, colores, posición de luz o parámetros del efecto (hardcodeado en `PARAMS`).
- Aplicar este hero a otras páginas.
- Textos/labels junto a cada tile orbital.

## Modelo de datos

Esta feature **no introduce nuevas estructuras de datos ni campos en Tina**. El hero sigue leyendo `about.hero.title` / `about.hero.subtitle` (con `_en`). Íconos, colores, posición de luz y parámetros de animación viven hardcodeados en `PARAMS` de `OrbitLock.tsx` y `LightHalo.tsx`.

## Plan de implementación

1. `OrbitLock.tsx` — candado sólido morado + disco con glow, anillos, arco cónico girando y tres tiles glass con íconos lineales (rayo/servidor/globo) que orbitan y contra-rotan; palancas en `PARAMS`; respeta `prefers-reduced-motion`.
2. Integrar `OrbitLock` en el hero retirando `FlowEffect` y su lógica de fallback.
3. Layout de dos columnas (texto izquierda · gráfico derecha, misma altura); título con `text-shadow` morado.
4. `LightHalo.tsx` — reusar el shader de god-rays de `CinematicRays` en un componente compacto (rays + polvo), con fuente de luz configurable detrás del candado; **alpha = intensidad** para componerse sobre la red; DPR capado, pausa fuera de viewport, reduced-motion, `onUnsupported`.
5. Añadir `NodeField` (plexus) como fondo del hero + `LightHalo` como halo + velo de legibilidad; envolver `LightHalo` en un div absoluto (su root trae `position:relative` inline).
6. Fallback WebGL: estado `haloOk` en el hero; si `LightHalo` falla, se oculta y quedan red + candado.
7. Responsive mobile: `lightPosMobile` centrado, velo inferior para atenuar el fondo, y texto solapando el gráfico (negative margin + z).

## Criterios de aceptación

- [x] `/nosotros` carga sin errores de consola atribuibles a estos componentes (los 2 errores existentes son de `data-reveal`/GSAP, preexistentes).
- [x] El hero muestra una **red de nodos (plexus)** animada de fondo en morado.
- [x] El candado central es **relleno** con glow morado (no verde) y actúa como núcleo, con un **halo de god-rays** detrás.
- [x] Orbitan exactamente 3 tiles con íconos **lineales**: rayo, servidor y globo. No hay ícono de reloj/tiempo.
- [x] El candado es el único elemento sólido/opaco; red, halo y tiles tienen opacidad < 1.
- [x] Layout de dos columnas: título a la izquierda, gráfico a la derecha, a la misma altura (desktop).
- [x] El halo **no tapa la red** (alpha = intensidad); la red se ve a través del glow.
- [x] Con `prefers-reduced-motion: reduce` la escena queda estática (sin órbita, pulso ni rAF de WebGL).
- [x] Si WebGL no está disponible, el halo se oculta y el hero sigue con red + candado.
- [x] En mobile el gráfico está **centrado**, el fondo está **atenuado** y el texto **solapa** un poco el gráfico, legible.
- [x] `FlowEffect.tsx` sigue existiendo (no se usa en este hero).
- [x] `astro build` pasa en verde (116 páginas).

## Decisiones

- **Sí:** híbrido **NodeField (canvas 2D) + LightHalo (Three.js)**. La red da la conexión temática y es liviana; el halo da el impacto "cinematic".
- **No:** god-rays de `CinematicRays` completo (traía tiles/streams y luz cenital). Se hizo `LightHalo`, versión compacta con la luz detrás del candado.
- **Sí:** revertir la decisión original "sin WebGL". Se sigue el patrón del sitio (WebGL + fallback + tuning de rendimiento), protegiendo el requisito del cliente.
- **Sí:** `alpha = intensidad` en el shader del halo. Con alpha=1.0 (como el original) el canvas tapaba la red debajo.
- **Sí:** candado y glow en `brand-purple` (`#96237A`); íconos rayo + globo + **servidor** (reloj reemplazado por red/servidor).
- **No:** editable en Tina. Es decorativo; hardcodearlo mantiene el build simple.
- **Sí:** en mobile, gráfico centrado + fondo atenuado + texto solapado, por pedido explícito del cliente.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El halo lava la red plexus (ambos magenta) | Halo apretado alrededor del candado (`vig`) + `alpha = intensidad`; la red respira en el resto del hero. |
| WebGL no disponible / dispositivo lento | LightHalo con `onUnsupported` (se oculta), render a escala reducida + DPR capado, pausa fuera de viewport, reduced-motion. La red (canvas 2D) y el candado (CSS) no dependen de WebGL. |
| Legibilidad del texto sobre la red | Velo lateral (desktop) / inferior (mobile); el título es blanco con text-shadow morado. |
| El root de LightHalo/CinematicRays trae `position:relative` inline | Se envuelve en un div `absolute inset-0` (patrón de `HeroServicios`). |

## Lo que **no** entra en este spec

- Modificar o borrar `FlowEffect.tsx`.
- Editabilidad CMS del gráfico (íconos, color, luz, parámetros).
- Llevar este hero a otras páginas.
- Labels de texto por tile orbital.

Cada uno, si aparece, va en su propio spec.
