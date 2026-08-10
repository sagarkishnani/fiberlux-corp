# SPEC 100 — Casos de éxito: hero sin fondo + slider protagonista

> **Estado:** Implementado
> **Depende de:** SPEC 13 (página `/casos-de-exito`, `CasosSlider`, colección `casosDeExito`), SPEC 91 (FlowEffect que se retira del hero), SPEC 94 (flechas laterales del slider).
> **Fecha:** 2026-08-10
> **Objetivo:** Rediseñar `/casos-de-exito` para que los casos se vean a primera vista, quitando la imagen/FlowEffect del hero y dejando el slider de video-testimonios como protagonista sobre un fondo neutro continuo.

---

## Alcance

**Dentro:**

- Convertir el hero de pantalla completa (`min-h-[70vh]/[85vh]` con imagen + FlowEffect + overlay negro) en una **cabecera compacta** sobre fondo neutro (`greyscale-darkest`), sin imagen ni FlowEffect.
- Unificar hero + slider en **un bloque de color continuo** (mismo fondo, sin corte), para que el primer caso asome dentro del primer viewport en desktop.
- Mantener breadcrumb, H1 "Casos de éxito" e intro editables (`data-tina-field`, `_en`), pero con menor peso vertical.
- **Slider protagonista:** el carrusel de video-testimonios queda como foco visual; se conserva su mecánica actual (drag, flechas laterales desktop, flechas a los costados del video en móvil, atenuado de slides inactivas, modal de video).
- Un **incremento de interactividad acotado** en el slider: indicador de progreso/dots + realce de la card "peek" siguiente.
- Dejar `heroImage` como campo **opcional/oculto** (fallback histórico) sin romper contenido existente.
- QA visual desktop + móvil con Playwright contra el nuevo layout.

**Fuera de alcance (para futuras specs):**

- Marquee/banda de logos de clientes en el hero (se evaluó y se descartó, ver decisiones).
- Filtros por rubro o navegación por tabs del slider.
- Hover-play (autoreproducción del video al pasar el cursor).
- Rediseño del `CasoCard` interno (poster/cita/autor) o del `VideoModal`.
- Cambios en el bloque de testimonios del Home o en `HomePartners`.

---

## Modelo de datos

Esta feature **no introduce estructuras de datos nuevas**. Reutiliza la colección `casosDeExito` de SPEC 13.

Único cambio de esquema, no destructivo:

- `heroImage` pasa de campo visible a **opcional/oculto** en `tina/config.ts` (ej. `ui.component: () => null` o descripción "obsoleto — el hero ya no usa fondo"). El valor existente en `src/content/casos-de-exito/index.json` se conserva como fallback histórico y no se borra.

Los campos `breadcrumb`, `heading`, `intro` (+ `_en`), `sectionTitle`, `items[]` y `seo` no cambian.

---

## Plan de implementación

1. **Retirar el fondo del hero.** En `HeroCasosReact.tsx`: eliminar el `<FlowEffect>`, la capa de imagen (`backgroundImage`) y el overlay `bg-black/40`. Dejar la sección con `background: #0A0A0A` plano. Commit dejando la página funcional (hero plano oscuro).

2. **Compactar la cabecera.** En el mismo componente: bajar la altura de `min-h-[70vh] md:min-h-[85vh]` a una cabecera corta (ej. padding superior para librar el header fixed + H1 + intro en 1-2 líneas, sin el spacer `flex-1` que empujaba el texto al fondo). Reducir el margen inferior de la intro. Manual test: el H1 y la intro quedan arriba, compactos.

3. **Unificar bloque de color.** En `src/pages/casos-de-exito/index.astro`: asegurar que `HeroCasos` y `CasosSlider` comparten `greyscale-darkest` sin corte visible entre ambos (quitar/ajustar paddings que generen banda). El slider ya usa `bg-greyscale-darkest`; alinear el `pt` del slider para que la primera card asome dentro del primer viewport en desktop (~≥1440px). Manual test: no hay franja ni cambio de tono entre cabecera y slider; la primera card se ve above the fold.

4. **Realce de la card "peek" siguiente.** En `CasosSliderReact.tsx`: subir la opacidad de las slides inactivas de `opacity-25` a un valor que las haga "asomar" con más presencia (ej. `opacity-40`) y/o ajustar el `gap`/ancho para que se vea claramente que hay más casos. Manual test: se percibe que el carrusel continúa.

5. **Indicador de progreso (dots).** En `CasosSliderReact.tsx`: añadir dots/paginación bajo el slider (o contador `N/total`) usando `slider.activeIndex` y `slider.scrollTo`/equivalente del hook `useSlider`. Reutilizar el patrón si ya existe en otro slider; si no, dots simples clicables. Manual test: click en un dot navega al caso; el dot activo refleja `activeIndex`.

6. **`heroImage` opcional en el CMS.** En `tina/config.ts`: ocultar/marcar como obsoleto `heroImage` sin borrar el dato. Regenerar tipos (`tinacms build` implícito en `npm run dev`). Manual test: el panel `/admin` no ofrece editar el fondo del hero; el build no rompe.

7. **Paridad `/en` e i18n.** Verificar que la ruta `/en/casos-de-exito` (wrapper) renderiza el nuevo layout y que `tField`/`richField` siguen resolviendo `heading_en`/`intro_en`. Manual test: `/en/casos-de-exito` muestra la cabecera compacta y el slider con fallback ES.

8. **QA visual responsive.** Playwright MCP: capturas desktop (~1440px) y móvil del hero+slider; verificar continuidad de fondo, primera card visible, dots, flechas laterales (desktop) y flechas a los costados del video (móvil). Guardar en `.playwright-screens/`.

---

## Criterios de aceptación

- [x] El hero de `/casos-de-exito` ya no muestra imagen de fondo ni efecto FlowEffect ni overlay negro.
- [x] El hero ya no ocupa pantalla completa: la cabecera (breadcrumb + H1 + intro) queda compacta arriba.
- [x] En desktop (~1440px) la primera card del slider es visible sin hacer scroll.
- [x] No hay franja ni cambio de tono entre la cabecera y el slider (fondo `greyscale-darkest` continuo).
- [x] El slider conserva: drag, flechas laterales en desktop, flechas a los costados del video en móvil, atenuado de slides inactivas y modal de video (▶).
- [x] Existe un indicador de progreso (dots o contador) bajo el slider; su estado activo sigue a `activeIndex` y al hacer click navega al caso correspondiente.
- [x] Editar breadcrumb, H1 e intro desde `/admin` sigue funcionando (`data-tina-field`) y `_en` cae a ES si está vacío.
- [x] El panel `/admin` ya no ofrece editar la imagen de fondo del hero; el contenido existente no se pierde y el build pasa.
- [x] `/en/casos-de-exito` renderiza el nuevo layout.
- [x] `npm run build` termina sin errores.

---

## Decisiones

- **Sí:** Opción A (cabecera compacta + slider al pliegue). Cumple el objetivo con el menor rework y conserva H1/SEO/breadcrumb.
- **No:** Opción B (hero = caso destacado). Diluye el título de página y complica el H1/SEO; rework mayor.
- **No:** Opción C / banda de logos en el hero. Se replanteó la petición de "mostrar clientes" hacia "mostrar los casos"; los logos competirían con el slider protagonista. Queda fuera de alcance.
- **Sí:** Fondo neutro **oscuro** (`greyscale-darkest`). Mantiene legibilidad de posters/badges y continuidad con el sitio; evita rework del `CasoCard`.
- **No:** Panel claro tipo testimonios del Home. Obligaría a rediseñar el `CasoCard` y sus badges/videos sobre claro.
- **Sí:** Conservar la mecánica actual del slider y sumar solo dots + realce de peek. Interactividad perceptible sin sobre-ingeniería.
- **No:** Hover-play y filtros por rubro. Mayor superficie; se difieren a otra spec.
- **Sí:** `heroImage` opcional/oculto en vez de borrado. No rompe contenido existente ni migraciones.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Quitar FlowEffect deja código/imports muertos en `HeroCasosReact`. | Eliminar imports y assets no usados en el mismo commit del paso 1. |
| "Primera card above the fold" depende del alto de viewport y del header fixed. | Ajustar en QA (paso 8) con margen; criterio se valida a ~1440px, no en pantallas muy bajas. |
| El hook `useSlider` podría no exponer `scrollTo` para los dots. | Verificar en `src/hooks/useSlider`; si falta, exponerlo o derivar navegación de `prev/next`. |

---

## Lo que **no** entra en esta spec

- Marquee/banda de logos de clientes.
- Filtros por rubro o tabs en el slider.
- Hover-play del video.
- Rediseño de `CasoCard` o `VideoModal`.
- Cambios en testimonios del Home o `HomePartners`.

Cada uno, si aparece, va en su propia spec.
