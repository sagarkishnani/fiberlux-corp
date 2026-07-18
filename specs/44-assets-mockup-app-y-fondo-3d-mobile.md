# SPEC 44 — Assets: mockup real en Fiberlux App y fondo 3D estático en home mobile

> **Estado:** Implementado
> **Depende de:** SPEC 37 (hero de `/fiberlux-app` con campo `mockup`), SPEC 18 (hero 3D Spline del home + campo `splinePosterUrl`), SPEC 31 (preloader del home ligado al `hero-scene-loaded`).
> **Fecha:** 2026-07-17
> **Objetivo:** Usar el mockup real en el hero de `/fiberlux-app` y, en el home mobile, reemplazar el 3D (que da problemas) por una imagen de fondo estática, dejando el 3D intacto en desktop.

---

## Alcance

**Dentro:**

- **Mockup real en Fiberlux App.** Apuntar el campo `hero.mockup` de la página `/fiberlux-app` al asset `images/fiberlux-app/fiberlux-app-mockup.png` (hoy apunta a `images/fiberlux-app/mockup.png`). El hero ya renderiza ese campo como `<img>`; es solo cambiar el valor de contenido.
- **Fondo estático del 3D en home mobile.** En el hero del home, en mobile (`<1024px`, `lg`):
  - Mostrar `images/home/cover-3d-mobile.jpeg` como **fondo completo** del hero (full-bleed, `object-cover`, detrás del texto, con las viñetas actuales para legibilidad).
  - **No cargar el Spline** en mobile (`allowMobile={false}` en `SplineScene`), que es la causa de los problemas.
  - La imagen mobile se toma del campo CMS existente `hero.splinePosterUrl` (editable), sembrado con la ruta del asset.
- **Desktop intacto.** En `≥1024px` el hero 3D en vivo se comporta exactamente como hoy.

**Fuera (para futuros specs):**

- Cambiar la escena 3D, su URL, o el comportamiento del preloader más allá de verificar que sigue funcionando.
- Producir un poster/estático para el 3D en **desktop** (desktop sigue con el 3D en vivo, sin poster, como hoy).
- Tocar el layout mobile del hero (posición del texto, botones) más allá de poner la imagen de fondo.
- Editar o rediseñar el hero de `/fiberlux-app` (solo cambia la ruta del mockup).
- Optimizar/re-exportar los assets (se usan tal cual están en `public/`).

---

## Modelo de datos

**No introduce ni modifica schema.** Reutiliza dos campos ya existentes:

- `fiberluxApp.hero.mockup` (image) — solo cambia su **valor** de contenido.
- `home.hero.splinePosterUrl` (image, definido en SPEC 18, hoy sin uso ni valor) — se **siembra** con `images/home/cover-3d-mobile.jpeg` y se **cablea** como fondo mobile del hero.

No hay campos nuevos.

---

## Plan de implementación

> Trabajo en `src/content/fiberlux-app/index.json`, `src/content/home/index.json` y `src/components/home/HeroHomeReact.tsx`. Cada paso deja el proyecto ejecutable.

1. **Mockup de Fiberlux App.** En `src/content/fiberlux-app/index.json`, cambiar `hero.mockup` a `images/fiberlux-app/fiberlux-app-mockup.png`. *Test:* `/fiberlux-app` muestra el mockup nuevo en el hero (desktop y mobile). Commit.

2. **Contenido del fondo mobile del home.** En `src/content/home/index.json`, sembrar `hero.splinePosterUrl = "images/home/cover-3d-mobile.jpeg"`. *Test:* el JSON valida; el valor llega a `HeroHomeReact`. Commit.

3. **Fondo estático mobile en el hero del home.** En `HeroHomeReact.tsx`:
   - Agregar un `<img>` de fondo **solo mobile** (`lg:hidden`, `absolute z-0 inset-0 w-full h-full object-cover`) con `src` = `BASE_URL` + `hero.splinePosterUrl` (render condicional si hay valor).
   - Envolver la capa de la escena 3D en `hidden lg:block` (no visible en mobile).
   - Pasar `allowMobile={false}` a `<SplineScene>` para que **no cargue el 3D** en `<1024px`.
   *Test:* en mobile (<1024) se ve la imagen de fondo y el 3D no se carga; en desktop (≥1024) el 3D sigue igual. Commit.

4. **QA + build.** Verificar mobile (fondo estático, sin carga de Spline, texto legible con viñetas, preloader completa) y desktop (3D intacto), en `/` y `/fiberlux-app`. Correr `astro build`. *Test:* checklist en verde y build sin errores ni warnings nuevos. Commit.

---

## Criterios de aceptación

- [x] El hero de `/fiberlux-app` muestra `fiberlux-app-mockup.png` (desktop y mobile).
- [x] En el home **mobile (`<1024px`)** el fondo del hero es `cover-3d-mobile.jpeg` (full-bleed) y el **3D no se carga** (sin la escena Spline ni sus problemas).
- [x] En el home **desktop (`≥1024px`)** el hero 3D en vivo se comporta igual que antes.
- [x] El texto del hero mobile sigue **legible** sobre la imagen (viñetas/degradados actuales).
- [x] El **preloader** del home completa en mobile (no queda colgado esperando el `hero-scene-loaded`).
- [x] Sin scroll horizontal en `/`; `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** un solo spec para los dos cambios (ambos chicos, de assets/contenido). *(Agrupados por el usuario.)*
- **Sí (cambio 1):** solo cambiar la **ruta** del mockup; el hero ya lo renderiza (SPEC 37), no se toca componente ni schema.
- **Sí (cambio 2):** imagen **full-bleed** como fondo del hero mobile. *(Elección del usuario.)*
- **Sí:** breakpoint **1024px / `lg`**, coherente con la lógica JS de `SplineScene` (desktop = ≥1024 carga 3D). *(Elección del usuario.)* Tablets (768–1023px) muestran la imagen.
- **Sí:** **no cargar el Spline en mobile** (`allowMobile={false}`), que es la causa raíz de "problemas en mobile" (además ahorra la carga pesada del 3D).
- **Sí:** reusar el campo CMS existente `splinePosterUrl` como fuente de la imagen mobile (editable), en vez de hardcodear la ruta.
- **No:** usar el prop `poster` de `SplineScene`. Quedaría confinado a la banda inferior donde vive el 3D en mobile; se usa un `<img>` propio full-bleed para que sea el fondo completo.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El preloader (SPEC 31) espera el evento `hero-scene-loaded`; con `allowMobile={false}` el Spline no arranca en mobile. | Verificar que `SplineScene` en modo estático igual emite "ready"/dispara el evento; QA del preloader en mobile. Si no, ajustar el disparo del evento en modo estático. |
| Legibilidad del texto sobre la imagen full-bleed en mobile. | Se conservan las viñetas/degradados z-[1] del hero; QA visual a varias alturas de mobile. |
| Si `splinePosterUrl` queda vacío, el fondo mobile desaparece. | Se siembra el valor; el `<img>` es render condicional (si vacío, no rompe, solo no hay imagen). |
| `object-cover` recorta el chip del asset en ciertas relaciones de aspecto mobile. | QA a 360/390/430px de ancho y distintas alturas; ajustar `object-position` si hace falta. |

---

## Lo que **no** entra en este spec

- Poster/estático del 3D en desktop.
- Cambiar la escena 3D, su URL o el preloader (más allá de verificarlo).
- Rediseñar el hero de `/fiberlux-app` o el layout mobile del hero del home.
- Re-exportar u optimizar los assets.
