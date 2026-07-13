# SPEC 23 — Botón de accesibilidad visible sobre cualquier fondo (anillo blanco)

> **Estado:** Implementado
> **Depende de:** Ninguno. Convive con Spec 22 (que introdujo el fondo `bg-brand-purple` de la sección de cifras). No lo reabre.
> **Fecha:** 2026-07-13
> **Objetivo:** Añadir un anillo blanco y una sombra oscura al FAB de accesibilidad (`.a11y-fab`) para que no se camufle cuando pasa por encima de la sección "¿Por qué Fiberlux?", que usa el mismo morado de marca que el botón.

## Por qué existe este spec

El FAB de accesibilidad usa `background: #96237A` (brand-purple) y la sección "¿Por qué Fiberlux?" (`StatsReact.tsx:172`) usa `bg-brand-purple` (`#96237A`) — **el mismo color exacto**. Al hacer scroll, el botón queda morado sobre morado y desaparece (ver captura). El botón de WhatsApp no sufre esto porque es verde. La solución debe garantizar contraste sobre *cualquier* fondo del sitio, no solo el magenta.

## Alcance

**Dentro:**

- Añadir al `.a11y-fab` un **anillo/borde blanco** (~2–3px) y una **sombra oscura** de separación, manteniendo el `background: #96237A` de marca.
- Ajustar el estado `:hover` para que el anillo blanco se conserve (hoy cambia a `#650F50`).
- Cambio localizado en el bloque `styles` de `src/components/shared/AccessibilityPanel.tsx`.

**Fuera de alcance (para otros specs):**

- Tocar el botón de WhatsApp (`WhatsAppButton.tsx`), que ya contrasta.
- Cambiar el color de fondo de la sección "¿Por qué Fiberlux?" (Spec 22).
- Rediseñar el panel de accesibilidad, su badge, backdrop o los cards internos.
- Lógica de detección de fondo por scroll (color adaptativo dinámico) — descartado por sobreingeniería (ver Decisiones).

## Modelo de datos

No introduce ni modifica estructuras de datos. Es un cambio puramente de estilos CSS dentro de la constante `styles` del componente.

## Plan de implementación

> Un solo paso, commiteable. Tras el cambio: `npm run dev` levanta sin errores.

1. **Estilo del FAB** en `AccessibilityPanel.tsx` → regla `.a11y-fab`:
   - Cambiar `border: none;` por `border: 3px solid #fff;` (anillo blanco).
   - Reforzar la sombra para separación en cualquier fondo, p. ej. combinar sombra oscura + glow de marca: `box-shadow: 0 4px 14px rgba(0,0,0,0.35), 0 8px 24px rgba(150,35,122,0.35);`.
   - En `.a11y-fab:hover`: mantener el borde blanco (que el cambio a `#650F50` no lo quite) y conservar el realce de sombra.
   - *Test:* el FAB muestra un aro blanco nítido sobre el header oscuro y sobre la sección magenta.

## Criterios de aceptación

- [ ] El FAB de accesibilidad es claramente visible cuando se solapa con la sección "¿Por qué Fiberlux?" (fondo `#96237A`).
- [ ] El FAB sigue visible sobre el fondo oscuro por defecto del sitio (`#0A0A0A`) y sobre secciones claras.
- [ ] El FAB conserva su color de fondo morado de marca (`#96237A`).
- [ ] El anillo blanco se mantiene en estado `:hover` y el `:focus-visible` sigue funcionando.
- [ ] El badge de "ajustes activos" sigue posicionado y legible sobre el nuevo borde.
- [ ] `npm run dev` levanta sin errores nuevos; no hay regresión visual en el panel abierto.

## Decisiones

- **(a) Anillo blanco + sombra oscura, manteniendo el morado.** Elegido por el usuario. Cambio mínimo, coherente con la marca, resuelve el contraste sobre cualquier fondo.
- **No: FAB con fondo blanco e ícono morado.** Descartado por el usuario; cambia demasiado el aspecto actual.
- **No: cambiar el FAB a morado oscuro (`#650F50`/`#3B0E30`).** Descartado; contrastaría con el magenta pero no resuelve todos los fondos con la misma robustez que el anillo blanco.
- **No: color adaptativo según el fondo bajo el botón (detección por scroll).** Sobreingeniería para el problema; añade JS y complejidad sin beneficio claro.
- **No: mover el FAB para que no se cruce con la sección.** No resuelve el problema de fondo; el botón es `position: fixed` a propósito.

## Lo que **no** entra en este spec

- Rediseño del panel de accesibilidad o de sus controles.
- Cambios en el botón de WhatsApp.
- Cambios en el fondo de la sección "¿Por qué Fiberlux?".

## QA realizada

- **Home (`/`)** verificada en vivo (Chrome MCP). Con el FAB posicionado **sobre la sección magenta "¿Por qué Fiberlux?"** (`#96237A`), el botón se distingue nítidamente por el anillo blanco (zoom confirmado). Reproduce el escenario del reporte original, ya resuelto.
- **Estilos computados** del `.a11y-fab`: `border: 3px solid rgb(255,255,255)`, `background: rgb(150,35,122)`, `box-shadow: rgba(0,0,0,0.35) 0 4px 14px, rgba(150,35,122,0.35) 0 8px 24px`. HMR aplicó el cambio sin recompilar el schema de Tina.
- **Contraste sobre fondo oscuro** (`#0A0A0A`) y sobre las cards claras de "Nuestras soluciones": el FAB sigue visible en ambos.
- **`:hover`** conserva el anillo (la regla no toca `border`); **badge** sin cambios de posición.
