# SPEC 40 — Motor de arrastre unificado para sliders (momentum + snap)

> **Status:** Aprobado
> **Depends on:** SPEC 05, SPEC 13, SPEC 34, SPEC 35
> **Date:** 2026-07-17
> **Objective:** Unificar el arrastre de los cinco sliders del sitio en un único hook con inercia (momentum) y encaje limpio en card, tomando lo mejor de Soluciones y Casos de éxito.

## Por qué existe este spec

Hoy los cinco sliders (Testimonios, Soluciones, Certificaciones, Casos de éxito y Rubros) reimplementan cada uno su propia lógica de arrastre por copia, y se sienten distintos: Testimonios no tiene "settle" animado (salta), Soluciones/Certificaciones hacen snap determinista de una card sin inercia, Casos tiene inercia pero encaja de forma menos predecible, y Rubros usa una arquitectura aparte (`transform: translateX` con Pointer Events y autoplay) sin momentum. El objetivo es una física de arrastre **idéntica y más suave** en los cinco, sin tocar su diseño visual ni el autoplay de Rubros.

## Scope

**In:**

- Crear un hook React compartido `useDragSlider` que centraliza: arrastre con mouse (vía `scrollLeft`), tracking de velocidad, momentum con inercia al soltar, encaje determinista a card, y navegación por flechas con animación suave.
- Migrar los 5 componentes al hook: `TestimonialSliderReact.tsx`, `SolucionesSliderReact.tsx`, `CertificacionesSliderReact.tsx`, `CasosSliderReact.tsx` y `RubrosReact.tsx`.
- Convertir `RubrosReact.tsx` de su arquitectura actual (`transform: translateX` + Pointer Events + índice en estado) al motor `scrollLeft` compartido, **conservando su autoplay** (5s, con pausa en hover/foco/drag y off con `prefers-reduced-motion`) y su wrap-around (tras la última card vuelve a la primera).
- Conservar intacto el aspecto visual y los comportamientos propios de cada uno (opacidad de cards inactivas, fades de texto de Soluciones, modal de video de Casos, `activeIndex`, estados de las flechas, autoplay de Rubros).
- Suavizar los 3 frentes reportados: arrastre 1:1 sin tirones, soltar con inercia + encaje limpio, y flechas con animación suave (apagando `scroll-snap` durante la animación).
- Respetar `prefers-reduced-motion`.

**Out of scope (for future specs):**

- Soporte táctil con momentum en JS: en móvil se usa el scroll nativo + CSS snap del navegador (ya da inercia); no se duplica en JS. Rubros pierde su drag por Pointer Events pero gana el scroll táctil nativo del navegador.
- Autoplay en los otros cuatro sliders (solo Rubros lo tiene; no se añade a los demás).
- Cualquier cambio de diseño visual, tamaños de card, cantidad de cards visibles o contenido CMS.
- Migrar a una librería de carrusel (embla / keen-slider / swiper).
- Otros carruseles del sitio (StickyCards o cualquier otro no listado): quedan fuera.

## Data model

Este spec no introduce datos de CMS nuevos. Introduce **una interfaz de hook** (contrato de código), no datos persistidos:

```ts
// src/hooks/useDragSlider.ts
interface DragSliderOptions {
  slideSelector?: string;     // selector de cada slide para medir (ej. ".sol-slide"), default ".slide"
  align?: "start" | "center"; // cómo alinea la card al encajar. Soluciones/Cert = "start", Casos/Testimonios = "center"
  momentum?: boolean;         // default true
  decay?: number;             // factor de desaceleración por frame, default 0.92
  minVelocity?: number;       // px/frame por debajo del cual se encaja, default 0.6
  nudgeThreshold?: number;    // fracción de card para arrastres cortos, default 0.15
  snapRestoreMs?: number;     // ms para re-activar CSS snap tras animar, default 500
}

interface DragSlider {
  ref: React.RefObject<HTMLDivElement>;
  activeIndex: number;
  atStart: boolean;
  atEnd: boolean;
  hasDragged: React.RefObject<boolean>;
  handlers: Pick<React.DOMAttributes<HTMLDivElement>,
    "onMouseDown" | "onMouseMove" | "onMouseUp" | "onMouseLeave" | "onClickCapture">;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}
```

Convenciones: posición gobernada siempre por `scrollLeft` sobre un contenedor `overflow-x-auto` (no `transform`); velocidad en px/frame con filtro paso-bajo (`v = 0.8·v + 0.2·Δx`).

El autoplay de Rubros **no entra al hook**: vive en el componente y usa la API pública del hook. Cada tick lee `atEnd` y llama `goTo(0)` (wrap) o `next()`; la pausa por hover/foco/drag y el corte con `prefers-reduced-motion` se mantienen a nivel de componente. El hook no añade opción de `loop`.

## Implementation plan

1. Crear `src/hooks/useDragSlider.ts` con la interfaz `DragSliderOptions`/`DragSlider`, el estado (`activeIndex`, `atStart`, `atEnd`), los refs de drag (`isDragging`, `hasDragged`, `startX`, `startScrollLeft`, `lastX`, `velocity`, `momentumId`, `snapTimer`), y las funciones internas `measure()` (mide los slides vía `slideSelector`), `animateTo(left)` (apaga snap → `scrollTo smooth` → restaura snap por `snapRestoreMs`), `snapToNearest()` y `snapDirectional(startScrollLeft, endScrollLeft)`. Aún sin usar. Commit: el hook compila.
2. Migrar `SolucionesSliderReact.tsx` al hook (`slideSelector: ".sol-slide"`, `align: "start"`). Borrar su `onMouseDown/Move/Up`, `animateTo`, `stepPx`, `scrollToIndex`, `scrollByCards` locales; cablear `ref`, `handlers`, `activeIndex`, `atStart/atEnd`, `next/prev`. Prueba manual: arrastre lento sigue al mouse; flick rápido avanza varias cards y encaja; flechas suaves. Es la referencia, valida el hook primero.
3. Migrar `CertificacionesSliderReact.tsx` (`slideSelector: ".cert-slide"`, `align: "start"`). Misma sustitución. Prueba: 2 cards visibles en desktop, flechas y edges OK.
4. Migrar `CasosSliderReact.tsx` (`slideSelector: ".caso-slide"`, `align: "center"`). Mantener `VideoModal` y que el click tras drag NO abra el modal (vía `hasDragged`/`onClickCapture` del hook). Prueba: inercia + encaje al centro; abrir modal solo sin arrastre.
5. Migrar `TestimonialSliderReact.tsx` (`align: "center"`). Es el que más mejora: ahora tiene inercia + encaje en lugar de saltar. Prueba: soltar ya no da el "salto" brusco.
6. Migrar `RubrosReact.tsx` al hook (`align: "start"`). Reemplazar el viewport `overflow-hidden` + track `transform: translateX` por un contenedor `overflow-x-auto` con snap y `scrollbar` oculto (patrón de los otros); borrar los Pointer Events, `dragDelta`, `step`/`maxScroll`/`baseOffset` locales. Re-cablear el autoplay para que cada tick llame `atEnd ? goTo(0) : next()`, conservando pausa por hover/foco/drag y corte con reduced-motion. Prueba: autoplay avanza y hace wrap; arrastre con momentum; touch scrollea nativo.
7. QA visual en `npm run dev` de los 5: arrastre lento, flick rápido, flechas, autoplay de Rubros (avance, wrap y pausa al interactuar), `prefers-reduced-motion`, bordes (primera/última card), y consola sin errores.

## Acceptance criteria

- [ ] Existe `src/hooks/useDragSlider.ts` y los 5 sliders lo importan; ninguno conserva su propio `onMouseMove`/`onMouseUp` (ni Pointer Events en Rubros) de scroll ni su `animateTo` local.
- [ ] Arrastre lento: el contenido sigue al mouse 1:1 sin tirones.
- [ ] Flick rápido y soltar: el slider continúa con inercia, desacelera y encaja exactamente en una card (nunca queda a medias).
- [ ] Arrastre corto (< 15% del ancho de card): vuelve o avanza exactamente una card de forma determinista.
- [ ] Las flechas animan suave y sin corte (no saltan al origen a mitad de animación).
- [ ] Un click tras arrastrar NO dispara la acción de la card: no navega el link de Soluciones ni abre el modal de Casos.
- [ ] Con `prefers-reduced-motion` las transiciones son instantáneas (`behavior: auto`, sin momentum).
- [ ] `activeIndex`/opacidad, los fades de texto de Soluciones, el modal de Casos y los estados `disabled` de las flechas funcionan igual que antes.
- [ ] El autoplay de Rubros sigue avanzando cada 5s, hace wrap tras la última card, se pausa en hover/foco/drag y no corre con `prefers-reduced-motion`.
- [ ] En Rubros el arrastre táctil (móvil) sigue funcionando vía scroll nativo del navegador.
- [ ] Sin errores en consola al montar los componentes ni al arrastrar.

## Decisions

- **Sí:** hook compartido `useDragSlider`. Unifica la física y elimina la duplicación actual entre Soluciones y Certificaciones (hoy son casi idénticos por copia).
- **Sí:** momentum con inercia + encaje a card (combina la inercia de Casos con el snap determinista de Soluciones). Es el modelo elegido.
- **Sí:** seguir usando `scrollLeft` sobre overflow nativo, no `transform: translateX` con estado React. Ya funciona, aprovecha el CSS snap nativo en móvil y no rompe el scroll accesible.
- **Sí:** umbral direccional del 15% para arrastres cortos (heredado de Soluciones). Evita medios-pasos accidentales.
- **Sí:** apagar `scroll-snap-type` durante las animaciones programáticas y restaurarlo por `setTimeout` (de Soluciones/Casos). En Chromium el `snap: mandatory` corta el smooth-scroll y lo regresa al origen.
- **Sí:** parametrizar `align` (`start` vs `center`) en el hook. Soluciones/Certificaciones/Rubros alinean a la izquierda; Casos/Testimonios centran.
- **Sí:** convertir Rubros de `transform: translateX` + Pointer Events al motor `scrollLeft`. Es el precio de tener un solo motor; a cambio Rubros gana momentum y scroll táctil nativo.
- **Sí:** dejar el autoplay de Rubros en el componente, manejándolo con la API del hook (`next`/`goTo`/`atEnd`). Evita meter lógica específica de una pantalla dentro del hook compartido.
- **No:** librería de carrusel (embla/keen/swiper). Añade peso y reescribiría todo el visual ya afinado.
- **No:** momentum en JS para touch. El scroll nativo del navegador ya da buena inercia en móvil; duplicarlo pelearía con el sistema.
- **No:** `transform: translateX` (lo que hoy usa Rubros). Perdería el snap nativo y complicaría el layout responsive por card.
- **No:** añadir una opción `loop` al hook. El wrap de Rubros lo resuelve el autoplay con `atEnd ? goTo(0) : next()`; los otros cuatro no hacen wrap.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El momentum se pasa del borde del slider. | `scrollLeft` se clampa solo al rango del contenedor; el `snapToNearest` final corrige la posición. |
| Distinto `align` (start vs center) entre sliders produce encajes inconsistentes. | El hook parametriza `align` y mide los children reales vía `slideSelector`; se prueba cada slider por separado. |
| Regresión en el "click-swallow": un drag abre el modal de Casos o el link de Soluciones. | El hook expone `hasDragged` + `onClickCapture`; cubierto por criterio de aceptación explícito. |
| El `setTimeout` que restaura el snap se pisa entre interacciones rápidas. | Se limpia el timer previo (`snapTimer`) antes de cada animación, como ya hace `animateTo` en Soluciones. |
| El autoplay de Rubros dispara `next()` mientras el snap/momentum aún anima y produce saltos. | El tick del autoplay se pausa mientras `dragging` y usa la misma `animateTo`; se prueba el solape avance-automático + arrastre manual. |
| La conversión de Rubros (transform→scrollLeft) rompe su layout de 4 cards/step medido. | El hook mide los slides reales vía `slideSelector`; se verifica el step y el ancho de card en desktop y móvil. |

## What is **not** in this spec

- Otros carruseles del sitio: StickyCards y cualquier otro no listado.
- Soporte táctil con momentum en JS (se mantiene el scroll nativo del navegador).
- Autoplay en los sliders que hoy no lo tienen (solo Rubros lo conserva).
- Rediseño visual, tamaños de card o contenido CMS.

Cada uno de esos, si aterriza, va en su propio spec.
