# SPEC 18 — Elementos 3D de Spline en los heroes (Home, Servicios, Soporte) con estrategia de rendimiento

> **Status:** Implementado
> **Depends on:** —
> **Date:** 2026-07-02
> **Objective:** Mostrar la escena Spline en los heroes de Home, Servicios y Soporte mediante un componente compartido con carga condicional por dispositivo/red, loader premium con revelación y pausa del render cuando la pestaña está oculta, de modo que funcione sin degradar el rendimiento.

## Section 1 — Por qué existe este spec

El hero de Home ya tenía la escena configurada (`splineSceneUrl`) pero con el render de `<Spline>` comentado, desactivado por rendimiento. Los heroes de Servicios y Soporte reservaban un hueco para el 3D pendiente de las URLs `.splinecode`. Este spec reactiva Home y rellena Servicios/Soporte con salvaguardas concretas de rendimiento, reutilizando un único componente.

## Scope

**In:**

- Componente compartido `src/components/shared/SplineScene.tsx` que encapsula toda la lógica 3D.
- Reactivar el 3D en el hero de **Home** (`splineSceneUrl` ya existente).
- Añadir el 3D en los heroes de **Servicios** y **Soporte** (columna derecha ya reservada), desktop-only (`allowMobile={false}`, la columna va oculta en móvil).
- Campo CMS `splineSceneUrl` en las colecciones `servicios` y `soporteTecnico` (Home ya lo tenía).
- **Carga condicional**: en móvil, la escena live solo carga si el dispositivo/red lo soportan; si no, sin 3D.
- **Loader premium** mientras carga (glow que respira + sweep + spinner de marca) y **revelación** al cargar (fade + escala + desenfoque que se enfoca).
- **`prefers-reduced-motion`**: no cargar el 3D.
- **Pausa del render** cuando la pestaña está oculta (Page Visibility API).
- **Error boundary** alrededor de `<Spline>`: si el chunk lazy o el runtime fallan, la isla no cae.
- **Integración con el fondo**: `setBackgroundColor("transparent")` al cargar + opción `featherEdges` (máscara radial `closest-side`) para que el 3D acotado no dibuje una caja rectangular sobre el fondo de la página.

**Out of scope (para futuros specs):**

- Migrar a `<spline-viewer>` (web component) — se descartó, ver Decisiones.
- Poster/screenshot estático de la escena — se descartó, ver Decisiones.
- Quitar la marca "Built with Spline" (depende del plan de Spline, no del código).
- 3D en subpáginas de solución/subservicio u otras páginas.

## Data model

Esta feature **no introduce estructuras de datos complejas**. Añade un único campo string por colección:

- `home.hero.splineSceneUrl` — ya existía.
- `servicios.splineSceneUrl` — nuevo (`src/content/servicios/index.json`).
- `soporteTecnico.splineSceneUrl` — nuevo (`src/content/soporte-tecnico/index.json`).

Todos guardan la URL `.splinecode`. El loader/revelación son estado local de UI en `SplineScene.tsx`, sin persistencia.

Umbrales de la detección de capacidad (constantes en `SplineScene.tsx`):

```js
// prefers-reduced-motion → static
// desktop (>=1024px) → spline
// móvil + allowMobile=false → static
// móvil + allowMobile=true → spline solo si:
//   - navigator.connection?.saveData !== true
//   - effectiveType ∈ {undefined, "4g"}   (se excluye slow-2g/2g/3g)
//   - navigator.deviceMemory === undefined || >= 4
// `undefined` = apto (Safari/iOS no exponen estas APIs)
```

## Implementation plan

1. **Componente compartido.** `SplineScene.tsx`: props `scene`, `allowMobile`, `className`, `style`. Encapsula detección de capacidad, loader, revelación, pausa por visibilidad y error boundary. Llena su contenedor; el padre posiciona.
2. **Home.** Refactorizar `HeroHomeReact.tsx` para usar `SplineScene` (mobile permitido) dentro del contenedor desplazado; conservar glow ambiental y vignettes.
3. **CMS.** Añadir `splineSceneUrl` a `servicios` y `soporteTecnico` en `tina/config.ts`; regenerar tipos; poner las URLs en los JSON de contenido.
4. **Servicios / Soporte.** En sus heroes, sustituir la columna derecha reservada por `SplineScene` (`allowMobile={false}`, `absolute inset-0` sobre un contenedor `relative` con `minHeight`).
5. **Verificación.** `astro build` sin errores y QA visual en las tres páginas.

## Acceptance criteria

- [x] En desktop, Home, Servicios y Soporte renderizan y animan su escena Spline.
- [x] Mientras carga, se muestra un loader animado (no screenshot) y la escena aparece con revelación.
- [x] En Home móvil apto la escena carga; en móvil no apto no se descarga.
- [x] Servicios/Soporte no cargan el 3D en móvil (columna oculta + `allowMobile={false}`).
- [x] Con `prefers-reduced-motion: reduce` no se carga el runtime de Spline.
- [x] Al ocultar la pestaña el render se pausa; al volver, se reanuda; el scroll no interrumpe animaciones.
- [x] Si la escena falla al cargar, el hero queda sin 3D, sin caída de la isla.
- [x] El 3D se integra con el fondo: sin borde/caja rectangular visible en Servicios ni Soporte.
- [x] `astro build` termina sin errores (40 páginas).

## Decisions

- **Sí:** un único `SplineScene` compartido. Evita triplicar la lógica (capability, loader, reveal, pausa, boundary) en tres heroes.
- **Sí:** `@splinetool/react-spline`. Control de `lazy`, `Suspense`, `onLoad`/`onError` y acceso a la `Application` para pausar.
- **No:** `<spline-viewer>` (web component). Otro runtime, menos control del ciclo de vida en React. (Se usó puntualmente, fuera de la app, solo para pruebas.)
- **No:** poster/screenshot estático. Nunca calza con el contenedor 3D y resta sensación premium. Se reemplazó por loader + revelación.
- **Sí:** pausar por Page Visibility (pestaña oculta) en vez de por scroll. `stop()`/`play()` en cada scroll rompía las animaciones al volver (salto de reloj / animaciones de una pasada consumidas).
- **Sí:** error boundary propio. Un fallo del import lazy no lo captura el `onError` de `<Spline>`; sin boundary caía toda la isla.
- **Sí:** Servicios/Soporte desktop-only (`allowMobile={false}`). Su columna 3D ya va oculta en móvil; evita descargar la escena en un contenedor invisible.
- **Sí:** `splineSceneUrl` editable en CMS por página. Consistencia con Home y permite cambiar/limpiar la escena sin tocar código.
- **Sí:** `setBackgroundColor("transparent")` + `featherEdges`. Algunas escenas traen su fondo horneado (no lo quita `setBackgroundColor`); la máscara radial difumina el borde para fundirlo con el `#0a0a0a` de la página. Bonus: el fundido de esquinas oculta el badge "Built with Spline".

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `navigator.connection` / `deviceMemory` no existen en Safari/iOS | Tratar `undefined` como "apto"; `prefers-reduced-motion` sigue protegiendo. |
| El 3D sigue renderizando mientras la página está visible (aunque se scrollee) | Costo aceptable en dispositivos aptos; los no aptos ni descargan la escena. Se prefirió a romper animaciones al volver. |
| Peso del runtime en móviles medios | Carga `lazy`, diferida y condicional; en no aptos ni se descarga. |
| Aviso ".splinecode más reciente que la librería" | No bloquea el render; se resuelve subiendo `@splinetool/runtime` si hace falta. |

## What is **not** in this spec

- Cambiar a `<spline-viewer>`.
- Poster/screenshot estático de la escena.
- Quitar la marca "Built with Spline" (depende del plan de Spline).
- 3D en subpáginas de solución/subservicio u otras páginas.
