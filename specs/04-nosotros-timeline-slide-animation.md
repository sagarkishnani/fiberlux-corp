# SPEC 04 — Transición slide-in del timeline de Historia (estilo effortel)

> **Status:** Implementado
> **Depends on:** SPEC 03 (sección Historia / timeline en Nosotros)
> **Date:** 2026-06-30
> **Objective:** Reemplazar la animación de *count-up* del año en el timeline de `/nosotros` por una transición de **slide vertical sincronizado** (año + heading se deslizan juntos dentro de una ventana `overflow:hidden`, ~1s con easing `cubic-bezier(0.544,0.001,0,0.995)`), replicando el efecto de effortel.com/about, manteniendo intactos las flechas, el autoplay, la barra de progreso y el soporte de `prefers-reduced-motion`.

---

## Scope

**In:**

- **Modificar `src/components/nosotros/TimelineReact.tsx`** para cambiar el mecanismo de transición del año y del heading:
  - **Eliminar el count-up:** retirar el hook `useCountUp` y el render del número interpolado dígito a dígito.
  - **Año con slide vertical:** el año activo se renderiza dentro de una **ventana `overflow:hidden`**; al cambiar de hito, el año actual se desliza hacia arriba (next) o hacia abajo (prev) y el nuevo año entra desde el lado opuesto.
  - **Heading sincronizado:** el heading se desliza **en la misma dirección y con el mismo tiempo/easing** que el año (reemplaza el fade+subida actual `timelineHeadingIn`).
- **Parámetros de la animación** (alineados a effortel): duración **~1000ms**, easing **`cubic-bezier(0.544, 0.001, 0, 0.995)`**, desplazamiento vertical de una posición completa.
- **Dirección según navegación:**
  - `next` y `autoplay` → el contenido sube (sale por arriba, entra por abajo).
  - `prev` → el contenido baja (sale por abajo, entra por arriba).
- **Mantener intactos:** flechas prev/next, autoplay ~5s con pausa al hover/foco/uso de flechas, wrap-around, barra de progreso proporcional (con su transición de `width` actual), etiquetas `startYear`/`endYear`, eyebrow, edición visual con `data-tina-field`, y los dos layouts (desktop/mobile).
- **`prefers-reduced-motion`:** con reduce-motion activo, **sin slide**; el año y el heading cambian instantáneo (igual criterio que hoy) y la barra no anima.

**Out of scope:**

- **Navegación scroll-driven / pin** (el efecto de scroll de effortel): se mantiene descartado; la navegación sigue siendo flechas + autoplay.
- **Cambios en el modelo de datos / TinaCMS:** no se toca `tina/config.ts` ni `src/content/about/index.json`; los `milestones[]` y `startYear`/`endYear` quedan igual.
- **Réplica de la implementación con Swiper.js** ni añadir esa dependencia: el slide se hace con CSS/React propio.
- **Slide "stack" con años adyacentes asomando** (peek): solo se ve un año a la vez (ventana de un slot).
- **Cambios en el fondo CSS, la barra de progreso, el copy, el layout o el responsive** más allá de envolver año/heading para el slide.
- **Aplicar este patrón a Home u otras secciones.**

---

## Data model

Esta spec **no introduce ni modifica datos**. No se toca `tina/config.ts` ni `src/content/about/index.json`; sigue usando el objeto `timeline` y su array `milestones[]` (`{ year, heading }`) tal como los dejó el SPEC 03. El cambio es **puramente de presentación/animación** dentro de `TimelineReact.tsx`.

Único detalle de runtime (no es dato nuevo, es estado de UI): se añade un estado de **dirección** del último cambio (`'next' | 'prev'`) para decidir el sentido del slide. No persiste, no afecta props ni el CMS.

---

## Implementation plan

> Todo el trabajo ocurre en `src/components/nosotros/TimelineReact.tsx`. Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.

1. **Retirar el count-up.** Eliminar el hook `useCountUp` y su uso; el año a mostrar pasa a ser directamente `active?.year`. La barra sigue usando `barProgress(...)`. *Test:* navega con flechas/autoplay pero el año cambia de golpe (estado intermedio esperado).

2. **Añadir estado de dirección.** `useState<'next' | 'prev'>('next')`; `next()`/autoplay → `'next'`, `prev()` → `'prev'`. *Test:* la dirección se actualiza al navegar (DevTools).

3. **Ventana `overflow:hidden` para el año.** Envolver `renderYear(...)` en un contenedor de altura fija con `overflow:hidden`, sin romper el posicionado (fondo en desktop, derecha en mobile). *Test:* año recortado a su ventana; layout sin desajustes vs. SPEC 03.

4. **Slide vertical del año — entrada + salida (obligatorio).** Al cambiar de hito se renderizan **ambos años** (saliente y entrante) dentro de la ventana: en `next` el saliente sube y sale por arriba mientras el entrante sube desde abajo; en `prev`, al revés. Duración **1000ms**, easing **`cubic-bezier(0.544, 0.001, 0, 0.995)`**, desplazamiento de una posición completa. Tras la transición queda solo el año activo. *Test:* el año viejo se desliza fuera y el nuevo entra en sincronía, como effortel.

5. **Heading sincronizado — entrada + salida.** Mismo mecanismo que el año (saliente + entrante), **misma dirección/duración/easing**, en su propia ventana `overflow:hidden`. Reemplaza la animación `timelineHeadingIn`. *Test:* año y heading se deslizan juntos, saliente y entrante a la vez.

6. **Respetar `prefers-reduced-motion`.** Con reduce-motion activo: sin slide (año y heading cambian instantáneo, sin doble render) y barra sin transición, reutilizando `reducedMotion` + media query del `<style>`. *Test:* con reduce-motion en el SO, el contenido cambia seco.

7. **Limpieza y verificación.** Quitar CSS muerto (`@keyframes timelineHeadingIn` y clases sin uso); confirmar autoplay/pausa/wrap-around y barra intactos. *Test:* `npm run dev` y `npm run build` sin errores/warnings nuevos; QA visual desktop y mobile (~390px) con Playwright contra `.playwright-screens/effortel-timeline-ref.png`.

**Notas del plan:**

- Año y heading comparten dirección, duración y easing → conviene una sola constante/clase reutilizable para ambos.
- La barra de progreso **no cambia** (conserva su transición de `width`).
- Al manejar dos elementos a la vez por ventana, cuidar que navegar rápido entre hitos no deje años "fantasma" (limpiar el saliente al terminar/interrumpir la transición).
- La verificación visual se hace con Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] El año **ya no hace count-up** (no cuenta dígito a dígito); el hook `useCountUp` fue eliminado del componente.
- [ ] Al avanzar con **next** (o por autoplay), el año saliente se desliza hacia **arriba** y el nuevo año entra desde **abajo**, dentro de una ventana `overflow:hidden` (no se ve desbordar fuera de su caja).
- [ ] Al retroceder con **prev**, el año saliente se desliza hacia **abajo** y el nuevo entra desde **arriba**.
- [ ] El **heading** se desliza **en la misma dirección, al mismo tiempo y con el mismo easing** que el año (entrada + salida sincronizadas); la animación previa de fade/subida ya no se usa.
- [ ] La transición dura **~1000ms** y usa el easing **`cubic-bezier(0.544, 0.001, 0, 0.995)`**.
- [ ] Tras cada transición queda visible **solo el hito activo** (sin años/headings "fantasma" del slide anterior), incluso navegando rápido entre hitos.
- [ ] Las **flechas** prev/next siguen funcionando con wrap-around (último→primero y primero→último).
- [ ] El **autoplay** sigue avanzando ~5s en bucle y se **pausa** al hover/foco/uso de flechas, reanudando al salir.
- [ ] La **barra de progreso** sigue posicionándose proporcional a `(year − startYear)/(endYear − startYear)` y animando su `width` (sin cambios respecto al SPEC 03).
- [ ] Las **etiquetas** `startYear`/`endYear`, el **eyebrow** y la **edición visual** (`data-tina-field` en año/heading/labels) siguen presentes y funcionando.
- [ ] Con **`prefers-reduced-motion: reduce`** activo: no hay slide; año y heading cambian instantáneo y la barra no anima.
- [ ] En **desktop** y en **mobile (~390px)** el layout coincide con las referencias del SPEC 03 (no se rompe el posicionado al introducir las ventanas `overflow:hidden`).
- [ ] No se modificó `tina/config.ts` ni `src/content/about/index.json`.

---

## Decisiones

- **Sí:** reemplazar el count-up por un **slide vertical** del año. Es lo que pidió la referencia (effortel) y da una sensación más cinematográfica que el contador de dígitos.
- **No:** conservar el count-up en paralelo. Mezclar contar dígitos + deslizar se ve confuso; el slide lo sustituye por completo.
- **Sí:** **sincronizar el heading** con el mismo slide (dirección/duración/easing). En effortel año y contenido se mueven juntos; mantenerlos desacoplados (fade propio del heading) rompería la cohesión.
- **Sí:** **entrada + salida** (doble render del saliente y el entrante) en lugar de solo animar la entrada. Es más fiel a effortel (el año viejo se ve salir), aunque exige limpiar el saliente al terminar/interrumpir la transición.
- **Sí:** parámetros tomados de la medición real de effortel — **~1000ms** y easing **`cubic-bezier(0.544, 0.001, 0, 0.995)`**. Evita "inventar" el timing y replica la referencia.
- **No:** usar **Swiper.js** (lo que usa effortel) ni añadir esa dependencia. El slide se resuelve con CSS/React propio; el componente ya gestiona índice, autoplay y barra, así que Swiper sería peso y acoplamiento innecesarios.
- **No:** **scroll-driven / pin**. Se mantiene la decisión del SPEC 03 (choca con Lenis, frágil en mobile); esta spec solo cambia la transición, no el modelo de navegación.
- **Sí:** mantener **flechas + autoplay + barra de progreso** intactos. El cambio es de presentación; reaprovecha toda la lógica existente.
- **No:** mostrar **años adyacentes asomando** (peek/stack). Effortel muestra un año a la vez en una ventana recortada; replicamos eso.
- **No:** tocar **datos / TinaCMS**. La animación no necesita campos nuevos; evitar migraciones del JSON.
- **Sí:** **spec nuevo `04`** en vez de enmendar el `03`. El `03` queda como histórico (describía el count-up); el `04` documenta el reemplazo de la animación.
- **Sí:** respetar **`prefers-reduced-motion`**. Accesibilidad; consistente con el SPEC 03.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Navegar rápido entre hitos (o autoplay disparando durante una transición) deja años/headings "fantasma" por el doble render (saliente + entrante). | Limpiar el elemento saliente al terminar la transición (`onTransitionEnd`) y/o cancelar el saliente anterior antes de iniciar uno nuevo; mantener una sola pareja saliente/entrante a la vez. |
| Las ventanas `overflow:hidden` recortan de más y descuadran el layout (año gigante de fondo en desktop, año a la derecha en mobile). | Fijar la altura de la ventana a la del bloque del año/heading y QA visual desktop + mobile (~390px) contra las referencias del SPEC 03 antes de cerrar. |
| El slide entra en conflicto con el smooth-scroll Lenis o con la animación de `width` de la barra. | El slide es un `transform` local del año/heading (no afecta scroll ni layout); la barra conserva su transición independiente de `width`. |
| `prefers-reduced-motion` no corta bien el doble render y se ve un salto raro. | Con reduce-motion: render simple (solo el activo), sin saliente ni transición; mismo criterio que el resto de animaciones del componente. |
| El timing/easing copiado no "se siente" igual que effortel por diferencias de tamaño/tipografía. | Parámetros parametrizados en una constante única; ajustar duración/easing en el paso de QA comparando con `.playwright-screens/effortel-timeline-ref.png`. |
| Forzar remount con `key` en cada cambio podría perder el `data-tina-field` o romper la edición visual. | Mantener `data-tina-field` en el render del año/heading activo y verificar la edición visual en `/admin` tras el cambio. |
