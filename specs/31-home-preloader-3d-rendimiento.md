# SPEC 31 — Preloader de bienvenida en Home y optimización de rendimiento de los elementos 3D

> **Status:** Implementado
> **Depends on:** SPEC 18
> **Date:** 2026-07-13
> **Objective:** Añadir un preloader de bienvenida (una vez por sesión, solo en Home) que enmascare la carga del 3D y revele el sitio al cargar la escena con topes de seguridad, más un poster estático de respaldo en equipos débiles, un cap de DPR más agresivo y prefetch en idle de las escenas de Servicios y Soporte.

## Section 1 — Por qué existe este spec

Los elementos 3D de Spline (SPEC 18) a veces se "lagean" y tardan un poco en cargar. Este spec ataca ambos problemas: la **percepción de carga** con un preloader de bienvenida que enmascara el arranque de la escena de Home, y el **lag real** con un poster estático de respaldo en equipos débiles y un cap de DPR más agresivo. Como el sitio es un MPA (Astro SSG) y cada navegación es una recarga completa, "que los 3D se queden cargados" se resuelve calentando la caché HTTP con prefetch en idle de las escenas de las otras páginas.

## Scope

**In:**

- **Preloader de bienvenida** (`src/components/shared/SitePreloader.tsx`): overlay a pantalla completa con estética **híbrida Fiberlux** (marca + glow magenta de fondo + contador discreto 0→100 + wipe de revelación).
- **Solo en Home**, **una vez por sesión** (bandera en `sessionStorage`). Recargas posteriores dentro de la misma sesión no lo muestran.
- **Cierre coordinado con la escena**: se revela cuando la escena Spline de Home dispara su `onLoad`, con **mínimo ~800 ms** (evita parpadeo) y **tope máximo ~6 s** (nunca deja al usuario atrapado si la escena tarda o falla).
- **Bloqueo de scroll/interacción** mientras el preloader está visible; al revelar, se libera.
- **Señal de carga** desde `SplineScene` hacia el preloader (callback/evento) para saber cuándo la escena de Home terminó.
- **Poster estático de respaldo** en `SplineScene`: nuevo prop `poster` (URL de imagen). Se muestra en equipos **no aptos** (móvil débil / red lenta / `prefers-reduced-motion`) en vez del glow ambiental actual, y como capa base bajo la escena viva mientras carga.
- **Campo CMS `splinePosterUrl`** en las colecciones `home`, `servicios` y `soporteTecnico` (PNG que sube el cliente desde una captura de cada escena).
- **Cap de DPR más agresivo**: bajar el actual `1.5` a un valor menor (p. ej. `1.25`), o escalar según memoria del dispositivo.
- **Prefetch en idle**: tras revelar Home, en tiempo idle (`requestIdleCallback`) se precargan a caché HTTP los `.splinecode` de Servicios y Soporte.

**Out of scope (para futuros specs):**

- Preloader/intersticial en Servicios, Soporte u otras páginas (se decidió solo Home).
- Preloader en cada recarga o "una vez de por vida" (`localStorage`) — se eligió una vez por sesión.
- Barra de progreso real byte-a-byte de la descarga del `.splinecode` (Spline no expone progreso; el contador es simulado con easing que se completa al `onLoad`).
- Límite de FPS forzado en el runtime de Spline (no hay API pública limpia; el ahorro real viene del poster en equipos débiles + pausa fuera de viewport ya existente).
- Migrar a `<spline-viewer>` o cambiar el runtime.
- View Transitions / navegación SPA para que los 3D persistan entre páginas (sigue siendo MPA; solo se calienta la caché HTTP vía prefetch).

## Data model

Esta feature añade **un solo campo string por colección** y no introduce estructuras complejas:

- `home.hero.splinePosterUrl` — nuevo (`src/content/home/index.json`).
- `servicios.splinePosterUrl` — nuevo (`src/content/servicios/index.json`).
- `soporteTecnico.splinePosterUrl` — nuevo (`src/content/soporte-tecnico/index.json`).

Todos guardan la URL de un PNG (captura de la escena). Estado de UI, sin persistencia salvo la bandera de sesión:

```js
// Bandera del preloader (una vez por sesión)
sessionStorage.getItem("fbx:preloaderShown") // "1" | null

// Constantes del preloader (SitePreloader.tsx)
const MIN_VISIBLE_MS = 800;   // evita parpadeo
const MAX_VISIBLE_MS = 6000;  // tope de seguridad

// Cap de DPR (SplineScene.tsx)
const DPR_CAP = 1.25;         // antes 1.5

// Coordinación escena → preloader
window.dispatchEvent(new CustomEvent("fbx:hero-scene-loaded"));
```

`SplineScene` emite `fbx:hero-scene-loaded` en su `onLoad` **solo cuando es la instancia de Home** (nuevo prop `signalReady`). El preloader escucha ese evento y arranca su secuencia de cierre respetando `MIN_VISIBLE_MS`/`MAX_VISIBLE_MS`.

## Implementation plan

1. **CMS.** Añadir `splinePosterUrl` (tipo `image`) a `home.hero`, `servicios` y `soporteTecnico` en `tina/config.ts`; regenerar tipos (`tinacms build` o `dev`). Deja los JSON de contenido con el campo vacío por ahora. Verificación: el campo aparece en `/admin` y `astro build` compila.
2. **Poster en `SplineScene`.** Añadir prop `poster?: string`. Renderizar la imagen como capa base (bajo la escena) mientras carga, y como **única** salida cuando `renderMode === "static"` (hoy en ese caso no hay nada salvo el glow del padre). Verificación: forzando `prefers-reduced-motion` se ve el poster en vez del hueco.
3. **DPR más agresivo.** Bajar el cap de `1.5` a `1.25` en el `onLoad` de `SplineScene`. Verificación: la escena sigue viéndose bien en retina y baja la carga de GPU.
4. **Señal de Home.** Añadir prop `signalReady?: boolean` a `SplineScene`; cuando es `true`, en `onLoad` despachar `window` event `fbx:hero-scene-loaded`. Pasar `signalReady` desde `HeroHomeReact`. Verificación: en consola se ve el evento al cargar la escena de Home.
5. **Componente preloader.** Crear `src/components/shared/SitePreloader.tsx`: overlay full-screen, marca Fiberlux + glow magenta + contador simulado con easing + wipe de revelación. Lee `sessionStorage`; si ya se mostró, no monta. Bloquea scroll (`overflow:hidden` en `<html>`) mientras visible. Cierra al escuchar `fbx:hero-scene-loaded` respetando `MIN_VISIBLE_MS`, o al llegar a `MAX_VISIBLE_MS`. Al cerrar, marca `sessionStorage` y libera scroll. Verificación: primera carga de Home lo muestra, recarga en la misma sesión no.
6. **Montaje en Home.** Renderizar `<SitePreloader client:load />` en `src/pages/index.astro` (o en `BaseLayout` condicionado a Home). Verificación: solo aparece en Home, no en otras páginas.
7. **Contador coherente.** El contador sube con easing hasta ~90% durante la espera y salta a 100% al recibir el evento (o al tope). Verificación: nunca se queda "colgado" ni salta feo.
8. **Prefetch en idle.** Tras revelar (o en `astro:page-load` de Home), en `requestIdleCallback` (con fallback `setTimeout`) hacer `fetch(...splinecodeServicios)` y `fetch(...splinecodeSoporte)` para calentar la caché HTTP. Las URLs vienen del contenido de esas colecciones (leídas en build y pasadas al componente, o hardcode desde el mismo origen). Verificación: en Network se ven las descargas en idle; al abrir Servicios la escena carga notablemente más rápido.
9. **Poster en el contenido.** El cliente sube las 3 capturas por CMS y se rellenan los `splinePosterUrl`. Verificación visual en las 3 páginas.
10. **QA final.** `astro build` sin errores; recorrido de las tres páginas en desktop y móvil.

## Acceptance criteria

- [x] En la primera carga de Home por sesión aparece el preloader híbrido (marca + glow + contador).
- [x] Al recargar Home dentro de la misma sesión, el preloader **no** vuelve a aparecer.
- [x] El preloader **no** aparece en Servicios, Soporte ni ninguna otra página.
- [x] El preloader se revela cuando la escena de Home dispara `onLoad`, respetando un mínimo de ~800 ms.
- [x] Si la escena tarda o falla, el preloader se cierra igual al llegar a ~6 s (usuario nunca atrapado).
- [x] Mientras el preloader está visible, la página no hace scroll; al revelar, el scroll se libera.
- [x] En Soluciones/Soporte (desktop, caja contenida) se muestra el poster estático mientras carga y como respaldo si la escena falla. En Home (a sangre completa) **no** se usa poster: cubre la carga el glow ambiental, sin spinner.
- [x] El cap de DPR aplicado es 1.25 (verificable en el `onLoad`).
- [x] Tras cargar Home, en Network se observan las descargas idle de los `.splinecode` de Servicios y Soporte.
- [x] Al navegar a Servicios/Soporte tras haber estado en Home, su escena carga más rápido (caché HTTP caliente).
- [x] El campo `splinePosterUrl` es editable en `/admin` (usado en Servicios/Soporte; sigue presente en Home pero sin efecto).
- [~] `astro build` contra TinaCloud requiere primero hacer push del branch (schema nuevo). Verificado en dev (modo local) + smoke test en navegador de las 3 páginas.

## Decisions

- **Sí:** preloader solo en Home, una vez por sesión (`sessionStorage`). Da el toque premium sin cansar a visitantes recurrentes ni repetirse entre páginas.
- **No:** preloader en cada página con 3D. Repetitivo en la navegación MPA.
- **No:** preloader "una vez de por vida" (`localStorage`). Se pierde el efecto en visitas futuras y complica pruebas.
- **Sí:** cierre por `onLoad` real con tope de seguridad (min 800 ms / max 6 s). Evita tanto el parpadeo como el usuario atrapado.
- **No:** duración fija sin escuchar la escena. Revelaría antes de tiempo o esperaría de más.
- **Sí:** contador **simulado** con easing. Spline no expone progreso de descarga; un contador falso bien eased se percibe honesto y se completa al `onLoad`.
- **Sí:** poster estático editable por CMS (`splinePosterUrl`) como respaldo en equipos débiles. Es la mayor palanca real contra el lag: los equipos flojos no corren WebGL, ven una imagen fiel.
- **Sí (ajuste post-impl.):** poster **solo en Soluciones/Soporte**, no en Home. En Home el 3D va a sangre completa; una captura con `object-cover` se maximiza y recorta mal (peor en mobile). En Home la carga la cubre el glow ambiental del hero, sin spinner (`hideLoader`). El campo CMS de Home queda presente pero sin efecto.
- **Sí:** cuando hay poster, se elimina el spinner y el poster hace crossfade a la escena viva (0.6 s). El poster es el placeholder instantáneo; el spinner era justo el "otro loader" que sobraba.
- **Sí:** posters servidos como **WebP** en `public/models/` (home 1.5 MB → n/a, Soluciones 549→36 KB, Soporte 602→19 KB). Deben aparecer al instante; el WebP con transparencia pesa una fracción del PNG.
- **No:** placeholder genérico autogenerado. Menos fiel a cada escena; el cliente ya puede exportar capturas desde Spline.
- **Sí:** DPR cap a 1.25 (antes 1.5). Menos píxeles que renderizar en retina, pérdida de nitidez apenas perceptible.
- **No:** límite de FPS forzado. El runtime de Spline no expone una API limpia; el ahorro real ya viene de la pausa fuera de viewport (SPEC 18) + poster en equipos débiles.
- **Sí:** prefetch en idle de las otras escenas. Es la única forma de "que se queden cargadas" en un MPA: calienta la caché HTTP sin bloquear Home.
- **No:** View Transitions / SPA para persistir los 3D en memoria entre páginas. Cambio arquitectónico grande; va en su propio spec si algún día se quiere.
- **Sí:** coordinación por `CustomEvent` en `window` (`fbx:hero-scene-loaded`). Desacopla el preloader de la implementación interna de `SplineScene` sin context ni props enredadas entre islas Astro separadas.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La escena de Home no dispara `onLoad` (error/red muerta) y el preloader se cuelga | Tope duro `MAX_VISIBLE_MS` (~6 s) cierra siempre; el preloader nunca depende solo del evento. |
| `sessionStorage` bloqueado (modo privado estricto) | Envolver en `try/catch`; si falla, el preloader se comporta como "cada carga" en vez de romper. |
| Islas Astro separadas: el preloader y `SplineScene` no comparten árbol React | Comunicación vía `window` `CustomEvent`, no vía context/props. |
| `requestIdleCallback` no existe en Safari | Fallback a `setTimeout(..., 2000)` para el prefetch. |
| El poster pesa y compite con la carga de la escena | Servir PNG optimizado/comprimido; el poster es capa base, la escena lo cubre al cargar. |
| El bloqueo de scroll queda "pegado" si algo revienta al cerrar | Liberar el scroll en un `finally`/cleanup del efecto de cierre. |

## What is **not** in this spec

- Preloader en Servicios, Soporte u otras páginas.
- Preloader por recarga o "una vez de por vida".
- Barra de progreso real de descarga del `.splinecode`.
- Límite de FPS forzado en el runtime.
- Migración a `<spline-viewer>` o cambio de runtime.
- View Transitions / navegación SPA para persistir los 3D entre páginas.

Cada uno, si algún día entra, va en su propio spec.
