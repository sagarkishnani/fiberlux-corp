# SPEC 38 — Retirar Legales del menú hamburguesa y ocultar hamburguesa en desktop

> **Estado:** Implementado
> **Depende de:** SPEC 33 (header top bar + navbar inline), SPEC 09 (menú desplegable), SPEC 01 (legales)
> **Fecha:** 2026-07-16
> **Objetivo:** Eliminar el bloque "Legales" de ambos overlays del menú hamburguesa y ocultar el botón hamburguesa en desktop, dejando la navegación desktop solo en el navbar inline.

## Por qué existe este spec

El overlay desktop del hamburguesa contiene casi únicamente la lista de Legales, que es redundante: los legales ya viven en el footer (de hecho el header los toma del footer como fuente única) y la navegación desktop ya está cubierta por el navbar inline. Al quitar los legales, el overlay desktop quedaría casi vacío (solo "Síguenos"), por lo que se opta por ocultar el hamburguesa en desktop en vez de mostrar un panel sin contenido útil.

## Alcance

**Dentro:**

- Quitar el bloque "Legales" del overlay **desktop** del hamburguesa (`HeaderV2React.tsx`, líneas ~578-584).
- Quitar el bloque "Legales" del overlay **móvil** del hamburguesa (`HeaderV2React.tsx`, líneas ~628-636).
- Ocultar el botón hamburguesa en desktop (`≥1024px`, breakpoint `lg`), dejándolo visible solo en móvil/tablet (`<1024px`).
- Limpiar el código muerto resultante en `HeaderV2React.tsx`: componente `LegalesList`, derivados `legalesColumn` / `legalesLinks`, interfaz `LegalLink`, constante `LEGALES_TITLE`.
- Actualizar el comentario descriptivo en `HeaderV2.astro` para reflejar el nuevo comportamiento.

**Fuera (para futuros specs):**

- Poblar el overlay desktop con enlaces curados (Formas de pago, Fiberlux App, etc.) — descartado por redundante.
- Cambios en el navbar inline de desktop (`header.desktopNav`).
- Cambios en la lista de legales del footer o en su edición en el CMS.
- Cambios en la navegación multinivel móvil (drill-down) más allá de quitar el bloque legales.

## Modelo de datos

Esta feature **no introduce ni modifica estructuras de datos**. Los legales siguen en la colección `global` (footer, columna "Legales") y se mantienen accesibles desde el footer. Solo se deja de consumir `footer.columns` dentro del header; `footer.social` se sigue usando para "Síguenos".

## Plan de implementación

1. **Ocultar hamburguesa en desktop.** En el botón hamburguesa (`HeaderV2React.tsx` ~línea 396) añadir `lg:hidden` a su clase. El navbar inline (`hidden lg:flex`) ya cubre desktop. Prueba manual: en `≥1024px` no aparece el botón hamburguesa; en `<1024px` sí. Commit.
2. **Quitar Legales del overlay desktop.** Eliminar el bloque `<div className="hidden lg:flex ...">` con el `<p>Legales</p>` y `<LegalesList columns />` (~líneas 578-584). Prueba manual: la app compila; el overlay desktop ya no se usa. Commit.
3. **Quitar Legales del overlay móvil.** Eliminar el bloque bajo divisor con `<p>Legales</p>` y `<LegalesList />` (~líneas 628-636). Prueba manual: en móvil, abrir el hamburguesa no muestra sección Legales; el resto de la navegación funciona. Commit.
4. **Limpiar código muerto.** Eliminar el componente `LegalesList`, los derivados `legalesColumn` y `legalesLinks`, la interfaz `LegalLink` y la constante `LEGALES_TITLE`. Verificar que `footer` sigue usándose solo para `social`. Prueba manual: la app compila sin warnings de variables sin uso. Commit.
5. **Actualizar comentario de `HeaderV2.astro`.** Ajustar la descripción del comportamiento del header (ya no menciona legales en el hamburguesa). Commit.

## Criterios de aceptación

- [ ] En `≥1024px` (desktop) el botón hamburguesa no se muestra; la navegación se hace por el navbar inline.
- [ ] En `<1024px` (móvil/tablet) el botón hamburguesa sí se muestra y abre el overlay.
- [ ] El overlay móvil del hamburguesa ya no contiene ninguna sección "Legales".
- [ ] El overlay desktop ya no contiene ninguna sección "Legales" (y no es alcanzable al estar oculto el botón).
- [ ] "Síguenos" (enlaces sociales) sigue apareciendo en el overlay móvil.
- [ ] Los legales siguen accesibles desde el footer, sin cambios.
- [ ] La app compila sin errores ni variables sin uso; no queda referencia a `LegalesList`, `legalesLinks`, `legalesColumn`, `LegalLink` ni `LEGALES_TITLE`.

## Decisiones

- **Sí:** ocultar el hamburguesa en desktop con `lg:hidden`. El overlay desktop quedaría sin contenido útil tras quitar legales, y el navbar inline ya cubre la navegación desktop.
- **No:** dejar el overlay desktop solo con "Síguenos". Un panel casi vacío tras un hamburguesa es mala UX.
- **No:** poblar el overlay desktop con enlaces curados (Formas de pago, Fiberlux App…). El propio usuario lo percibe redundante con el navbar inline; si se retoma, va en su propio spec.
- **Sí:** mantener los legales solo en el footer como fuente única, sin duplicarlos en el header.
- **Sí:** eliminar el código muerto (`LegalesList` y derivados) en vez de dejarlo comentado, para no arrastrar deuda.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Abrir el menú en móvil y redimensionar a desktop deja el overlay abierto sin botón para cerrarlo. | El handler de click-fuera en desktop (líneas ~263-275) cierra el overlay al clicar fuera de `a/button`; se mantiene ese `useEffect` para cubrir el caso. |
| El estilo `lg:h-[calc(100vh-80px)]` / `lg:rounded-b-[48px]` del overlay queda sin uso al no abrirse en desktop. | Es inerte y no molesta; se puede dejar. Opcional documentarlo, no eliminarlo en este spec. |

## Lo que **no** está en este spec

- Enlaces curados en el overlay desktop (Formas de pago, Fiberlux App, etc.).
- Rediseño del navbar inline de desktop.
- Cambios en los legales del footer o su edición en el CMS.

Cada uno, si se retoma, va en su propio spec.
