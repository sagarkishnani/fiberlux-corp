# SPEC 94 — Flechas de sliders a los costados (desktop)

> **Estado:** Aprobado
> **Depende de:** SPEC 68 (motor Embla + `SliderArrows` compartido), SPEC 34/35/48/55 (diseños de sliders), SPEC 93 (último trabajo en Soluciones).
> **Fecha:** 2026-08-05
> **Objetivo:** En desktop (≥1024px), reemplazar el control de flechas de los carruseles de cards por dos flechas circulares magenta superpuestas y centradas verticalmente sobre los bordes izquierdo y derecho de cada slider, sin alterar el comportamiento en mobile/tablet.

---

## Scope

**In:**

- **Solo desktop (≥1024px, breakpoint `lg`).** Se añade una presentación de flechas laterales que aparece únicamente en `lg+`.
- **Presentación compartida nueva:** dos flechas **circulares magenta** independientes (una izquierda, una derecha), superpuestas (`absolute`) sobre los bordes del carrusel y **centradas verticalmente** respecto al viewport de las cards. Reutilizan el color/hover de marca y el estado habilitado/deshabilitado según `canPrev`/`canNext` de cada slider.
- **Se aplica a los 7 componentes de carrusel de cards:**
  1. Testimonios (`shared/TestimonialSliderReact`)
  2. Soluciones home (`shared/SolucionesSliderReact`)
  3. Certificaciones (`certificaciones/CertificacionesSliderReact`)
  4. Casos de éxito (`casos-de-exito/CasosSliderReact`)
  5. Blog preview (`blog/BlogPreviewReact`)
  6. Blog hero (`blog/BlogHero`)
  7. Catálogo de soluciones (`servicios/CatalogoSolucionesReact`)
- **En cada slider, en `lg+`:** se oculta el control de flechas actual (píldora en columna/arriba/abajo) y se muestran en su lugar las flechas laterales. La lógica de navegación existente (`next`/`prev`, `goTo`, wrap de Certificaciones) se reutiliza tal cual.
- **Catálogo:** los dots (puntos indicadores) se mantienen centrados abajo; **solo** se mueven las flechas a los costados.

**Out of scope (no se toca):**

- **Mobile y tablet (<1024px):** todo queda **exactamente como hoy** — píldoras, flechas circulares de Casos en móvil, dots del Catálogo, posiciones actuales.
- **Timeline de Nosotros** (`TimelineReact`): conserva su diseño con barra de progreso y sus flechas propias.
- **Rubros** (marquee, sin flechas) y **Partners** (marquee/grid).
- **Motor y comportamiento** de los sliders: autoplay, loop, arrastre, momentum, wrap de Certificaciones, toggle de hover en bordes — sin cambios.
- **Rediseño visual de las cards** o del contenido de cualquier sección.
- **Cambios de color de marca** o de la semántica hover/disabled (solo cambia la forma: círculo en vez de píldora cuadrada).

---

## Modelo de datos

No introduce datos nuevos. Es un cambio puramente presentacional (layout de UI). **No** se agregan campos a Tina ni configuración por instancia: las flechas laterales son el comportamiento fijo en desktop para los 7 sliders del scope.

---

## Plan de implementación

Cada paso deja el sitio funcional.

1. **Componente compartido `shared/SliderSideArrows.tsx`.** Renderiza dos botones **circulares** independientes (izq/der), posicionados `absolute` (`left-*` / `right-*`, `top-1/2 -translate-y-1/2`), visibles solo en `lg+` (`hidden lg:flex`). Props: `canPrev`, `canNext`, `onPrev`, `onNext`, `labelPrev`, `labelNext`, y opcional `offset`/`className` para afinar separación por slider. Reutiliza los colores de `SliderArrows` (magenta habilitado `#96237A` / hover `#650F50`, aubergine deshabilitado `#3B0E30`) y `aria-label`. **No** se modifica `SliderArrows` (se sigue usando tal cual en mobile/tablet).

2. **Envolver el viewport en un contenedor `relative`** en cada slider (varios ya lo son). Las flechas deben ser **hermanas** del viewport de Embla (que es `overflow-hidden`) dentro de ese wrapper relative, **no** hijas del viewport, para que no las recorte el overflow. `z` por encima de las cards.

3. **Integración por slider (lg+):** insertar `<SliderSideArrows/>` en el wrapper del carrusel y **ocultar en `lg`** el control de flechas actual, manteniéndolo intacto por debajo de `lg`:
   - **Certificaciones / Soluciones home:** la píldora de la columna izquierda pasa de `hidden lg:block` a oculta en desktop; el pill móvil `lg:hidden` se conserva.
   - **Testimonios:** se oculta la píldora `hidden lg:flex` (arriba-derecha); el pill móvil se conserva.
   - **Casos:** el pill `hidden md:block` pasa a `hidden md:block lg:hidden` (se conserva en md–lg); las flechas circulares `md:hidden` de móvil no se tocan.
   - **Blog preview / Blog hero:** se oculta en `lg` la `SliderArrows` de su header/fila; por debajo de `lg` queda como hoy.
   - **Catálogo:** se ocultan en `lg` los dos botones de flecha del bloque inferior; **los dots permanecen** centrados abajo.

4. **Centrado vertical y no recorte:** anclar las flechas al alto del área de cards (viewport), verificando que no desborden horizontalmente la página en anchos grandes (respetar contenedor global / SPEC 21) ni queden tapadas por glows/máscaras.

5. **Accesibilidad:** conservar `aria-label` Anterior/Siguiente, foco por teclado visible y estado `disabled` cuando el slider no hace loop (p. ej. Certificaciones bordeado por wrap propio: mantener su comportamiento actual).

6. **QA visual** en ≥1024px de los 7 sliders (incluye Testimonios tema claro, Certificaciones fondo oscuro con peek, Soluciones con glass) y verificación de que <1024px queda idéntico.

---

## Criterios de aceptación

- [ ] En ≥1024px, cada uno de los 7 sliders muestra exactamente **2 flechas circulares magenta**: una centrada verticalmente sobre el borde izquierdo y otra sobre el derecho del área de cards.
- [ ] En ≥1024px, el control de flechas anterior (píldora en columna/arriba/abajo) **no** se muestra en ninguno de los 7.
- [ ] En <1024px, cada slider se ve y comporta **idéntico a hoy** (píldoras, flechas circulares móviles de Casos, dots del Catálogo intactos).
- [ ] Las flechas laterales invocan `next`/`prev` del slider correspondiente y respetan su estado habilitado/deshabilitado (o quedan siempre activas si el slider hace loop).
- [ ] En Catálogo, los dots siguen visibles y centrados abajo; solo cambiaron de lugar las flechas.
- [ ] Las flechas **no** quedan recortadas por el `overflow-hidden` del viewport ni desbordan horizontalmente la página (incl. anchos 4K).
- [ ] Hover conserva el color de marca; foco por teclado visible; `aria-label` Anterior/Siguiente presentes.
- [ ] El Timeline de Nosotros queda **sin cambios**.

---

## Decisiones tomadas y descartadas

- **Forma círculo magenta** (no cuadrado). Elegido por el cliente; se ve más liviano flotando al costado.
- **Superpuestas sobre el borde** (no en el margen/gutter). Elegido: no angosta el carrusel. Se acepta el riesgo de tapar levemente la esquina de una card.
- **Componente nuevo `SliderSideArrows`** en vez de extender `SliderArrows`. La píldora actual se sigue usando en mobile/tablet; separar evita regresiones.
- **Solo desktop (≥1024px / `lg`)**. Pedido explícito; mobile y tablet quedan intactos.
- **Sin configuración en CMS.** No se solicitó; se mantiene simple y fijo.
- **Dots del Catálogo intactos.** Pedido explícito (mobile no se toca); en desktop solo migran las flechas.
- **Timeline fuera de alcance.** Su diseño con barra de progreso no encaja con dos flechas laterales simples.
- **Definición rápida:** tras cerrar las 4 decisiones clave (posición, estilo, alcance, dots), el cliente pidió "asumir el resto"; el resto de detalles se resolvió con los criterios por defecto de este spec.

---

## Riesgos identificados

- **Superposición con contenido:** en sliders con cards a sangre/peek (Certificaciones, Soluciones), la flecha puede solaparse con texto o íconos. Mitigación: colocarlas sobre el gutter/borde con leve separación, `z` alto, y preferentemente sobre las cards "peek" ya desvanecidas.
- **Recorte por `overflow-hidden`:** si las flechas se colocan dentro del viewport de Embla, se recortan. Mitigación: renderizarlas como hermanas del viewport dentro de un wrapper `relative`.
- **Anchos grandes (4K) / contenedor global (SPEC 21):** posicionar relativo al área de cards, no al borde de pantalla, para que no queden despegadas ni desborden.
- **Contraste en Testimonios (tema claro, SPEC 49):** verificar que la flecha magenta contraste sobre el panel claro (ya usa magenta sólido).
