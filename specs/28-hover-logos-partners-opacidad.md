# SPEC 28 — Hover de los logos de partners: mantener blancos y subir la opacidad

> **Estado:** Implementado
> **Depende de:** SPEC 11 (franja `partners` global y per-categoría, componente `PartnersMarquee`)
> **Fecha:** 2026-07-13
> **Objetivo:** En la franja de logos de partners, al hacer hover el logo se mantiene blanco (no revela su color original) y solo sube su opacidad del 55% al 100%, para que se note el cambio sin que los logos de arte oscuro desaparezcan sobre el fondo casi negro.

## Por qué existe este spec

En las páginas de categoría de solución (`/soluciones/[solucion]`) y en la franja global del home, los logos de partners se muestran en desktop forzados a blanco (`filter: brightness(0) invert(1)`) al 55% de opacidad. El hover original aplicaba `filter: none`, revelando el **color original** del logo. Muchos logos tienen arte negro o muy oscuro (Ubiquiti = `rgb(0,0,0)`, Mikrotik = `rgb(41,51,57)`, Peplink = apagado), así que al revelar su color quedaban negro-sobre-fondo-negro y **desaparecían** en hover. La solución es no quitar nunca el filtro blanco: al hover el logo sigue blanco y solo sube la opacidad al 100%, un realce visible y uniforme para todos los logos.

## Alcance

**Dentro:**

- En `src/components/shared/PartnersMarquee.tsx`, dentro del bloque `<style>`, en la regla `@media (min-width: 768px)` (línea ~86), cambiar el hover del logo a solo `opacity: 1`, **sin** tocar el `filter` (el logo sigue blanco por la regla base `.partner-logo`).
- El cambio aplica en **todas** las franjas que usan `PartnersMarquee`: la per-categoría (`ServicePartners` en `/soluciones/[solucion]`) y la global del home (`Partners`). Al ser el mismo componente, una sola edición cubre ambas.

**Fuera de alcance:**

- El estado en reposo desktop (blanco al 55%): no se toca.
- El estado en mobile (<768px, color nativo al 100%, sin hover): no se toca — el problema es solo el hover en desktop.
- No se agrega escala (`transform: scale`) ni ningún otro efecto: solo el cambio de opacidad.
- No se crea variante ni prop para diferenciar categorías vs home: el cambio es idéntico en ambos.
- La animación del marquee, el `mask-image`, la pausa en hover y `prefers-reduced-motion`: no se tocan.

## Modelo de datos

Este spec no introduce ni modifica estructuras de datos. Solo cambia la regla de hover (`opacity`, sin `filter`) en el CSS inline de un componente de presentación.

## Plan de implementación

1. En `src/components/shared/PartnersMarquee.tsx`, en la regla `.partner-logo:hover` dentro de `@media (min-width: 768px)` (línea ~86), dejarla como `opacity: 1` y quitar el `filter: none` para que el logo conserve el blanco. La transición existente (`transition: filter 0.35s ease, opacity 0.35s ease`) ya anima el cambio.
2. `npm run build` para confirmar que compila.
3. QA visual en desktop (≥768px): al hacer hover, cualquier logo (incluidos los de arte negro como Ubiquiti o Mikrotik) se mantiene blanco y solo se ve más brillante; en mobile el comportamiento no cambia.

## Criterios de aceptación

- [ ] En desktop, al hacer hover sobre un logo de partner, el logo **se mantiene blanco** y sube a **100% de opacidad** (desde el 55% en reposo).
- [ ] Ningún logo desaparece ni se oscurece en hover, incluidos los de arte negro (Ubiquiti, Mikrotik, Peplink).
- [ ] El estado en reposo desktop sigue siendo blanco al 55%.
- [ ] El comportamiento en mobile (<768px) no cambió.
- [ ] El cambio se ve tanto en la franja de partners de las categorías como en la del home.
- [ ] No se agregó escala ni ningún otro efecto de hover.
- [ ] `npm run build` compila sin errores.

## Decisiones

- **Sí:** al hover **mantener el logo blanco** (conservar `filter: brightness(0) invert(1)`) y solo subir la opacidad del 55% al 100%. Es el único enfoque que da un cambio visible sin que ningún logo desaparezca.
- **No:** revelar el color original en hover (`filter: none`), ni siquiera atenuado al 65%. Se implementó primero y se descartó: los logos de arte negro (Ubiquiti `rgb(0,0,0)`, Mikrotik `rgb(41,51,57)`) quedaban invisibles sobre el fondo casi negro, y bajar la opacidad no lo arregla (negro al 65% sigue sin verse).
- **No:** agregar `transform: scale` sutil. El cliente pidió explícitamente solo un cambio de opacidad.
- **Sí:** aplicar el cambio en el componente compartido `PartnersMarquee` (afecta home y categorías). Es el mismo comportamiento en ambos; una variante per-página sería complejidad innecesaria.

## Qué **NO** entra en este spec

- Efecto de escala u otros efectos de hover.
- Revelar el color original de los logos en hover.
- Cambios al estado en reposo o al comportamiento en mobile.
- Variante o prop para diferenciar la franja del home de la de categorías.
- Cambios a la animación del marquee o a `prefers-reduced-motion`.
