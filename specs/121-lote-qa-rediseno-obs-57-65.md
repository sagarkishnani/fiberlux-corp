# SPEC 121 — Lote QA post-rediseño: popup, testimonios, SGSI, manos, drawer, categorías, blog y app

> **Estado:** Aprobado
> **Depende de:** SPEC 117, SPEC 118, SPEC 119, SPEC 120
> **Fecha:** 2026-11-04
> **Objetivo:** Resolver las 9 observaciones visuales y funcionales que dejó el cliente sobre el sitio rediseñado (tema claro).

---

## Por qué existe este spec

El cliente revisó staging después del rediseño (SPEC 117–120).
Son ajustes chicos, pero tocan 9 componentes distintos.
Agruparlos permite una sola rama, un solo PR y una sola pasada de QA visual.
Se registran en `specs/observaciones-cliente.md` como **obs 57–65**.

---

## Scope

**Incluye:**

| Obs | Observación | Componente | Causa / cambio |
|---|---|---|---|
| 57 | La X del popup se ve azul; los íconos morados casi no se notan | `src/components/popup/PopupReact.tsx` | X: `bg-fx-night/85` → blanco translúcido (`bg-white/10`, `border-white/25`, `text-white`). Íconos de features: `text-fx-purple` / `border-fx-purple/40` / `bg-fx-purple/10` → lila claro (`#E9A7DC` texto; borde y fondo en ese mismo tono con alpha). |
| 58 | El video de los testimonios no se abre al hacer clic (desktop) | `src/components/shared/TestimoniosV2.tsx` | Causa probable: en `pointerdown`, `w.setPointerCapture()` redirige el `click` al wrapper del carrusel y el `<button>` de la card nunca lo recibe. Arreglo: tomar la captura del puntero solo cuando empieza un arrastre real (>6px). Confirmar con Playwright antes de tocar. |
| 59 | La línea divisoria de la Política SGSI casi no se ve | `src/components/nosotros/NosotrosSgsiReact.tsx` | `border-fx-soft` (#F2F1F2) → `border-fx-line-strong` (#D8D5D8). |
| 60 | Las manos (Home, Manifiesto) se ven borrosas | `src/components/home/HomeManifestoReact.tsx` | Es el `blur-[1px]` intencional del prototipo, no la resolución del PNG. Se quita el blur **solo en mobile**; desktop conserva `lg:blur-[1.6px]`. |
| 61 | El drawer mobile no hace scroll y corta los últimos enlaces | `src/components/shared/HeaderV3React.tsx` | Al abrir el drawer se llama a `lenis.stop()`, y Lenis bloquea touch/wheel. Arreglo: `data-lenis-prevent` en los paneles `overflow-y-auto` del drawer (principal y submenú) + `overscroll-contain`. |
| 62 | La card "Nuestra solución" sale descuadrada en todas las categorías (mobile) | `src/components/servicios/CategoriaV2React.tsx` | Con `min-h-[260px]` el texto sube y choca con la flecha de la esquina (`right-7 top-7`, 48px). Arreglo: reservar el espacio de la flecha en mobile (padding superior en el bloque de texto o `min-h` mayor), como la card del Desafío con `pr-[72px]`. |
| 63 | Espaciados desparejos entre "Todos los artículos", compartir y copiar (mobile) | `src/components/blog/ArticleV2React.tsx` | La fila usa `justify-between` sin `gap`: la pastilla queda pegada a compartir, mientras compartir↔copiar tienen `gap-2`. Arreglo: `gap-2` también en la fila + `whitespace-nowrap` en la etiqueta (hoy se parte en 2 líneas); en mobile se reduce `tracking`/`pr` de la pastilla para que entre en 1 línea a 360px. |
| 64 | El título del artículo y los subtítulos del cuerpo son muy grandes (mobile) | `src/components/blog/ArticleV2React.tsx` + `src/styles/fx.css` | H1 `text-[43px]` → `text-[37px]` (−6px). `.fx-art h2` 40 → 34px y `.fx-art h3` 28 → 24px, **solo bajo 1024px** (media query). Desktop sin cambios. |
| 65 | El teléfono de Fiberlux App tiene parallax en mobile y se descuadra al scrollear | `src/components/fiberlux-app/FiberluxAppV2React.tsx` | El parallax de `phoneRef` corre solo en `≥1024px`; en mobile se limpia el `transform`. El parallax del mock de eficiencia no se toca. |

**Fuera de scope (otros specs):**

- Re-exportar los assets de las manos a mayor resolución.
- Rediseñar el popup o cambiar su paleta general.
- Ajustar la tipografía del blog en desktop.
- Revisar el motor de arrastre de otros carruseles (Casos, Certificaciones) más allá de verificar que no tengan el mismo bug del obs 58.

---

## Modelo de datos

Este lote no introduce estructuras de datos ni cambios de schema en Tina.
Son cambios solo de presentación y de comportamiento.

---

## Plan de implementación

Rama: `fix-lote-qa-rediseno-obs-57-65` contra `staging`.

1. **Popup (57).** Cambiar las clases del botón de cierre y de los íconos de features. Verificación: abrir el popup; X blanca translúcida e íconos legibles sobre ciruela.
2. **SGSI (59).** Cambiar el token del borde. Verificación: en `/nosotros` los divisores se distinguen sin dominar.
3. **Manos (60).** `blur-[1px]` → `blur-0 lg:blur-[1.6px]`. Verificación: Home a 390px, manos nítidas.
4. **Testimonios (58).** Reproducir el bug con Playwright a 1512px. Mover `setPointerCapture` al primer `pointermove` que supere 6px. Verificación: clic en la foto abre `VideoModal` con YouTube; el arrastre sigue funcionando sin abrir el modal.
5. **Drawer (61).** Agregar `data-lenis-prevent` y `overscroll-contain` a los dos paneles. Verificación: a 390×667 el drawer scrollea hasta "Fiberlux App"; el submenú de Soluciones también scrollea.
6. **Card "Nuestra solución" (62).** Reservar el espacio de la flecha en mobile. Verificación: en las 4 categorías a 390px el texto no se cruza con la flecha.
7. **Blog: fila de acciones (63).** `gap-2` + `nowrap` + pastilla compacta en mobile. Verificación: a 360 y 390px, 3 controles en una sola línea con la misma separación.
8. **Blog: tipografía (64).** H1 mobile a 37px. Media query `max-width: 1023px` para `.fx-art h2/h3`. Verificación: `getComputedStyle` a 390px y a 1512px.
9. **Fiberlux App (65).** Condicionar el parallax del teléfono a `matchMedia("(min-width: 1024px)")` y resetear el `transform` en mobile. Verificación: a 390px el teléfono queda con `transform: none` al scrollear.
10. **Registro.** Agregar obs 57–65 a `specs/observaciones-cliente.md` con su entrada de log. `npm run build` en verde.

---

## Criterios de aceptación

- [ ] La X del popup no tiene tono azul: fondo blanco translúcido e ícono blanco.
- [ ] Los íconos de features del popup usan lila claro y se distinguen del fondo.
- [ ] En desktop, un clic en la foto o el play de un testimonio (Home y Fiberlux App) abre el modal con el video de YouTube.
- [ ] Arrastrar el carrusel de testimonios más de 6px no abre el modal.
- [ ] Los divisores de la Política SGSI usan `fx-line-strong`.
- [ ] A 390px las manos del Manifiesto no tienen `filter: blur`; a 1512px conservan `blur(1.6px)`.
- [ ] A 390×667 el drawer mobile hace scroll hasta el último enlace, en el panel principal y en el de Soluciones.
- [ ] En las 4 categorías de solución, a 390px, el texto de "Nuestra solución" no se superpone con la flecha.
- [ ] En el artículo, a 360px y 390px, "Todos los artículos" ocupa 1 línea y los tres controles están separados por el mismo gap (ES y EN).
- [ ] A 390px: H1 del artículo 37px, `.fx-art h2` 34px, `.fx-art h3` 24px. A 1512px siguen en 72 / 40 / 28px.
- [ ] A 390px el teléfono del hero de Fiberlux App no cambia de `transform` al scrollear; a 1512px el parallax sigue funcionando.
- [ ] `npm run build` en verde y sin scroll horizontal nuevo a 390px.
- [ ] obs 57–65 registradas en `specs/observaciones-cliente.md`.

---

## Decisiones

- **Sí:** un solo spec y una sola rama para las 9 observaciones. Son ajustes de pocas líneas e independientes.
- **Sí:** quitar el blur de las manos solo en mobile. Es donde lo reportó el cliente; en desktop el blur viene del prototipo.
- **No:** re-exportar los PNG de las manos. A 1035px de ancho sobran para 291 CSS px × 3 DPR; el problema es el filtro.
- **Sí:** `fx-line-strong` para el divisor SGSI. Token existente y el cliente pidió "solo un poco"; `fx-line` (#ECE9EC) apenas se diferenciaría del actual.
- **Sí:** bajar también los h3 del cuerpo en mobile (28 → 24px) para mantener la jerarquía con el h2 reducido. No lo pidió el cliente explícitamente.
- **No:** quitar el parallax del mock de eficiencia de Fiberlux App. El cliente solo mencionó el teléfono.
- **Sí:** `data-lenis-prevent` en vez de dejar de llamar a `lenis.stop()`. El stop es lo que bloquea el scroll del fondo mientras el drawer está abierto.
- **Sí:** definición rápida sin ronda de preguntas: el contexto del código alcanzó para identificar causa y arreglo de cada observación.

---

## Riesgos

| Riesgo | Mitigación |
|---|---|
| La causa del obs 58 no es el pointer capture | El paso 4 empieza reproduciendo el bug con Playwright; si es otra causa, se documenta en el tracker antes de arreglarla. |
| Capturar el puntero tarde hace que el arrastre se pierda si el cursor sale del carrusel | La captura se toma al superar 6px, antes de que el cursor pueda salir. Verificar arrastrando rápido. |
| La pastilla del blog no entra en 1 línea en EN ("All articles") o a 320px | Verificar ambos idiomas; si no entra, bajo 360px se oculta el texto y queda solo la flecha con `aria-label`. |

---

## Qué **no** entra en este spec

- Re-exportar las imágenes de las manos.
- Cambios de tipografía del blog en desktop.
- Rediseño del popup.
- Auditoría del motor de arrastre de otros carruseles.
