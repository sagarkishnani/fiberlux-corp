# SPEC 75 — Hero del Home: video con parallax (reemplaza el 3D de Spline)

> **Estado:** No implementado
>
> _Nota: la implementación quedó en la rama `spec-75-home-hero-video-parallax` (sin mergear). Se descartó por definición: el `circuit-home.mp4` de origen es 1200×606 y a sangre se veía borroso (upscale ~1.85×). Para retomar: re-exportar el video a ~2400px de ancho, cambiar Estado a `Aprobado` y correr `/spec-impl`._
> **Depende de:** SPEC 18/31 (Spline hero + preloader home), SPEC 39 (logo animado hero→header), SPEC 44 (fondo estático mobile), SPEC 74 (componente `HeroVideo`)
> **Fecha:** 2026-07-26
> **Objetivo:** Reemplazar la escena 3D de Spline del hero del Home por el video `circuit-home.mp4` con `mix-blend-mode: screen` y parallax de mouse, eliminando el runtime de Spline y el jank, sin romper el preloader ni el layout.

---

## Scope

**In:**
- Reemplazar `<SplineScene>` del hero del Home por `<HeroVideo>` (extendido) con `circuit-home.mp4`.
- **Blend:** video con `mix-blend-mode: screen`; contenedor del hero con `isolation: isolate`; **quitar** de los ancestros del video los `transform`/`will-change`/`contain` actuales (hoy aíslan el blend → caja negra).
- **Parallax (solo desktop, `pointer: fine`):** `mousemove` en el contenedor del hero, transform ±14px con `translate3d` **directo en el `<video>`**, suavizado por CSS (`transition: transform .4s ease-out`), `mouseleave` → 0, `will-change: transform` en el video.
- **Pausa fuera de viewport:** IntersectionObserver (threshold 0.1) → `play()`/`pause()`.
- **Preloader:** el video dispara `fbx:hero-scene-loaded` al estar listo (`canplay`/`loadeddata`) para ocultar el `SitePreloader` sin esperar el fallback de 6s.
- **Reduce-motion:** oculta el video y muestra la imagen (`heroVideoPoster`) con el mismo `mix-blend-mode: screen`.
- `pointer-events: none` en el video (no bloquear los CTAs).
- **Fuente editable en Tina:** reemplazar `splineSceneUrl`/`splinePosterUrl` del hero del Home por `heroVideo`/`heroVideoPoster` (default `/videos/circuit-home.mp4` + imagen actual).
- Quitar el import de `@splinetool/react-spline`/`SplineScene` **solo** de `HeroHomeReact`.

**Out of scope:**
- **Mobile:** se mantiene la imagen estática a sangre actual (SPEC 44); el video/parallax es **solo desktop (lg+)**.
- Home sigue sin webm/avif: **un solo `<source>` mp4** (los assets chip.webm/avif del brief no existen; se usa `circuit-home.mp4` y como poster/fallback la imagen actual del hero).
- Heroes de Soporte/Soluciones (ya migrados en SPEC 74) y el de Servicios interno → no se tocan.
- Eliminar la dependencia `@splinetool` del `package.json` (Home ya no la usa, pero el retiro del paquete queda para un spec de limpieza; otros heroes internos aún la referencian).

---

## Data model

Sin datos de contenido nuevos; se renombran campos Tina y se extiende un componente.

**1. Tina — hero del Home (`tina/config.ts`, collection `home` → objeto `hero`):**
```
- splineSceneUrl  (string) → ELIMINAR
- splinePosterUrl (image)  → renombrar a heroVideoPoster (image) [poster / mobile / reduce-motion]
+ heroVideo       (image/media)  "Video del hero (loop)"  default /videos/circuit-home.mp4
```

**2. Contenido (`src/content/home/index.json` → hero):**
```
+ "heroVideo": "/videos/circuit-home.mp4"
+ "heroVideoPoster": "<imagen actual del hero>"   (la que hoy usa splinePosterUrl)
```

**3. `src/components/shared/HeroVideo.tsx` (extensión, props opcionales):**
```
parallax?: boolean         // ±14px translate3d directo al video; listener en el contenedor; solo pointer:fine
pauseOffscreen?: boolean   // IntersectionObserver (threshold 0.1) play/pause
onReady?: () => void       // se llama en canplay/loadeddata (Home lo usa para el evento del preloader)
fit/className flexible      // Home cubre a sangre (object-cover) vs w-full h-auto de soporte/soluciones
```
Soporte/Soluciones siguen usándolo sin esas props → comportamiento actual intacto.

---

## Implementation plan

1. **Extender `HeroVideo`.**
   Agregar props `parallax`, `pauseOffscreen`, `onReady` y permitir controlar el `fit`/clases sin romper los usos actuales. Parallax detrás de `matchMedia('(pointer: fine)')`, transform directo al `<video>`, `transition: transform .4s ease-out` + `will-change: transform` por CSS, `mouseleave`→`translate3d(0,0,0)`. `pauseOffscreen` con IntersectionObserver. `onReady` en `canplay`. Mantener `mix-blend-mode: screen`, `muted` por ref, `playsInline`, `pointer-events:none`, y reduce-motion → poster `img`. Prueba: soporte/soluciones siguen igual.

2. **Tina + contenido (Home).**
   En `tina/config.ts` (collection `home`, objeto `hero`) reemplazar `splineSceneUrl`/`splinePosterUrl` por `heroVideo`/`heroVideoPoster`. En `src/content/home/index.json` setear `heroVideo: "/videos/circuit-home.mp4"` y `heroVideoPoster` con la imagen actual. `tinacms build` regenera tipos.

3. **Reestructurar `HeroHomeReact`.**
   Quitar `SplineScene` y su import. Poner `<HeroVideo parallax pauseOffscreen onReady=… className=cover>` en la capa desktop. **Quitar `will-change`/`contain`/`transform: translateZ` del wrapper del video** y aplicar `isolation: isolate` al contenedor del hero, con el gradiente ambiental en ese mismo contenedor. Conservar dimensiones/posición del área (el offset `right-[-40%]` usa `right`, no `transform`, se mantiene). `onReady` → `window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"))`. Mobile: imagen estática actual sin cambios (SPEC 44). Reduce-motion: la imagen la resuelve `HeroVideo`.

4. **Verificación + build.**
   Desktop: sin caja negra, parallax suave (±14px, `.4s`), evento de preloader dispara al cargar (no espera 6s), sin request a `prod.spline.design`, video se pausa fuera de viewport, CTAs clickeables. Mobile: imagen estática, sin errores en consola. Reduce-motion: imagen. `npm run build` compila.

---

## Acceptance criteria

- [ ] No hay rectángulo negro alrededor del chip (blend correcto en desktop).
- [ ] El chip sigue el cursor con movimiento suave (±14px, `.4s ease-out`), sin saltos; vuelve a 0 al salir el mouse.
- [ ] En mobile se ve la imagen estática (SPEC 44), sin parallax y sin errores en consola.
- [ ] Con `prefers-reduced-motion: reduce` se ve la imagen estática (no el video).
- [ ] En Network **no** aparece ningún request a `prod.spline.design`; `HeroHomeReact` no importa `SplineScene`.
- [ ] El `SitePreloader` se oculta al cargar el video (evento `fbx:hero-scene-loaded`), sin depender del fallback de 6s.
- [ ] Scrollear el Home no produce frames caídos; el video se pausa fuera de viewport.
- [ ] Los CTAs del hero siguen clickeables (`pointer-events` correcto).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** un solo `<source>` mp4 (`circuit-home.mp4`); poster/reduce-motion = imagen actual del hero. No hay webm/avif.
- **Sí:** fuente editable en Tina (`heroVideo`/`heroVideoPoster`), coherente con SPEC 74.
- **Sí:** mobile mantiene imagen estática (SPEC 44); video/parallax solo desktop.
- **Sí:** extender `HeroVideo` con props opcionales (un solo componente para todo el sitio).
- **Sí:** el video dispara `fbx:hero-scene-loaded` para no colgar el preloader.
- **No:** poster en el `<video>` — reintroduce el flash de caja con `screen` (aprendido en SPEC 74); el preloader tapa la carga y reduce-motion ya usa la imagen.
- **No:** retirar el paquete `@splinetool` (queda para spec de limpieza).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un ancestro con `transform`/`will-change`/`contain` reaísla el blend → caja negra | Paso 3 los elimina y usa `isolation: isolate` en el contenedor; verificación en paso 4. |
| El preloader se cuelga si el video no señala listo | `onReady` en `canplay` dispara el evento; el fallback de 6s ya existe como red de seguridad. |
| `will-change: transform` en el video crea su propio stacking context | Es el **mismo** elemento con el blend (permitido); el problema solo aplica a ancestros. |
| Parallax en touch | Se registra solo con `pointer: fine`. |
| Layout se rompe al quitar el wrapper con transform | Se conservan tamaños/posición (offset por `right`, no por `transform`). |
| Peso/decodificado del video en el Home | `pauseOffscreen` pausa fuera de viewport; se recomienda re-exportar `circuit-home.mp4` liviano (fuera de alcance del spec). |

---

## Lo que **no** está en este spec

- Mobile con video (se mantiene imagen estática, SPEC 44).
- webm/avif (solo mp4 existente).
- Retiro del paquete `@splinetool` del proyecto.
- Otros heroes (Soporte/Soluciones ya migrados; Servicios interno intacto).
