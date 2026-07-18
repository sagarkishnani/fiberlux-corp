# SPEC 45 — Soporte técnico: animar el acordeón de canales en mobile

> **Estado:** Implementado
> **Depende de:** SPEC 06 (página `/soporte-tecnico` y el componente `CanalesSoporte` con el acordeón de canales).
> **Fecha:** 2026-07-17
> **Objetivo:** Que el acordeón de canales de `/soporte-tecnico` abra y cierre con una animación suave en mobile, en vez del salto instantáneo actual, replicando la sensación del expand animado de desktop.

---

## Alcance

**Dentro:**

- **Animar el abrir/cerrar del acordeón mobile** (branch `lg:hidden` de `CanalesSoporte.tsx`). Al tocar una tarjeta, su detalle (título, subtítulo, filas de acción) se despliega/colapsa con una **transición de altura + opacidad (~350ms)**, con un easing coherente con el de desktop (`cubic-bezier(0.4,0,0.2,1)`).
- **Reestructurar cada tarjeta mobile** para que el **header** (label del canal + botón toggle) esté **siempre presente** y el **cuerpo** sea un contenedor colapsable animado (hoy se hace un swap condicional que no se puede transicionar).
- **Indicador de estado** en el toggle: el ícono `+` rota (a `×`/45°) al abrir, como affordance del estado.
- **Mantener el comportamiento de un-solo-abierto** (`openIndex` ya existente y compartido) y el tap como disparador.
- **Honrar `prefers-reduced-motion`**: si está activo, abrir/cerrar es instantáneo (sin transición).

**Fuera (para futuros specs):**

- El **hero** y su 3D en mobile (el usuario no lo incluyó).
- El **acordeón desktop** (`hidden lg:flex`): queda exactamente igual.
- **Entrada al hacer scroll** (reveal escalonado): se descartó a favor del expand animado.
- Cambiar **contenido, canales, íconos, colores, layout** o las acciones (`wa.me` / `tel:` / `mailto:`).
- Añadir una **librería de animación** nueva (se hace con CSS).

---

## Modelo de datos

**Esta feature no introduce ni modifica datos, colecciones ni props.** Solo cambia el markup/CSS del branch mobile de `CanalesSoporte.tsx`, reutilizando el estado `openIndex` que ya existe.

---

## Plan de implementación

> Todo el trabajo vive en `src/components/soporte/CanalesSoporte.tsx` (branch mobile, `lg:hidden`). Cada paso deja el proyecto ejecutable.

1. **Acordeón mobile animado.** Reestructurar el branch `lg:hidden`: dejar el **header** (label + toggle) siempre montado como disparador (`onClick` → `setOpenIndex`, con `aria-expanded` reflejando el estado), y envolver el **cuerpo** (título, subtítulo, `renderRows`) en un contenedor colapsable que anime la altura vía `grid-template-rows: 0fr → 1fr` (con `overflow-hidden` y `min-h-0` en el hijo) más `opacity`, `~350ms cubic-bezier(0.4,0,0.2,1)`. Rotar el ícono `+` al abrir. Envolver la transición en una guarda de `prefers-reduced-motion` (instantáneo si `reduce`). *Test:* en mobile, tocar una tarjeta despliega su detalle con animación suave; tocar otra cierra la anterior y abre la nueva; con reduced-motion es instantáneo. Commit.

2. **QA + build.** Verificar en mobile (≤1023px) el abrir/cerrar animado, un-solo-abierto, sin saltos ni recortes de contenido, y que el desktop (≥1024) sigue idéntico. Correr `astro build`. *Test:* checklist en verde y build sin errores ni warnings nuevos. Commit.

---

## Criterios de aceptación

- [x] En **mobile (`<1024px`)**, al tocar una tarjeta de canal, su detalle se **abre/cierra con animación suave (~350ms)**, no instantáneo.
- [x] Solo hay **una tarjeta abierta a la vez** (`openIndex`), como hoy.
- [x] El **toggle** indica el estado (ícono `+` rota al abrir).
- [x] Con **`prefers-reduced-motion: reduce`**, el abrir/cerrar es **instantáneo** (sin transición).
- [x] El **acordeón desktop (`≥1024px`)** se comporta y se ve igual que antes.
- [x] **Contenido, canales, íconos, colores y acciones** (`wa.me` / `tel:` / `mailto:`) no cambian.
- [x] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** animar **solo el acordeón de canales** en mobile. *(Elección del usuario; el hero 3D queda fuera.)*
- **Sí:** **expand/collapse animado** (altura + opacidad), no reveal-on-scroll. *(Elección del usuario.)*
- **Sí:** técnica **`grid-template-rows: 0fr↔1fr`** para animar la altura **sin medir en JS** (robusto ante contenido variable), más `opacity`. La alternativa `max-height` se descarta por el timing impreciso con alturas desconocidas.
- **Sí:** reutilizar el estado **`openIndex`** ya compartido; no duplicar lógica ni estado.
- **Sí:** easing y duración **coherentes con el desktop** (`cubic-bezier(0.4,0,0.2,1)`, ~350ms) para que se sienta parte del mismo sistema.
- **Sí:** honrar **`prefers-reduced-motion`**, consistente con el resto del sitio.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El branch mobile hoy hace **swap condicional** (cuerpo vs botón); para animar altura hay que tener ambos en el DOM → reestructura del markup. | Header persistente + cuerpo colapsable; QA visual del estado colapsado vs abierto contra el diseño mobile. |
| `grid-template-rows: 0fr/1fr` no anima bien si el hijo no tiene `min-height:0` / `overflow:hidden`. | Aplicar `overflow-hidden` en el wrapper y `min-h-0` en el hijo; verificado en QA. |
| Algún navegador viejo no anima `grid-template-rows`. | Degrada a mostrar/ocultar sin animación (el contenido sigue accesible); aceptable. |
| El contenido del cuerpo "parpadea" o salta al final de la transición. | Animar también `opacity` del contenido y ajustar timing; QA en mobile real. |

---

## Lo que **no** entra en este spec

- El hero de soporte o su 3D en mobile.
- El acordeón desktop.
- Reveal-on-scroll u otras animaciones de entrada.
- Cambios de contenido, canales, colores o acciones.
- Librerías de animación nuevas.
