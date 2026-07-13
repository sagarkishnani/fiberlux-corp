# SPEC 28 — Suavizar el hover de los logos de partners (opacidad al 65%)

> **Estado:** Implementado
> **Depende de:** SPEC 11 (franja `partners` global y per-categoría, componente `PartnersMarquee`)
> **Fecha:** 2026-07-13
> **Objetivo:** En la franja de logos de partners, al hacer hover el logo revela su color original pero a 65% de opacidad (en vez de 100%), para que los logos con texto oscuro no se vean fuertes sobre el fondo casi negro.

## Por qué existe este spec

En las páginas de categoría de solución (`/soluciones/[solucion]`) y en la franja global del home, los logos de partners se muestran en desktop forzados a blanco (`filter: brightness(0) invert(1)`) al 55% de opacidad. Al hacer hover, hoy se aplica `filter: none; opacity: 1;`, lo que revela el **color original** del logo al 100%. Los logos que contienen texto negro quedan oscuros y se ven mal sobre el fondo `greyscale-darkest`. Bajando la opacidad del hover a 65% se atenúan esos colores oscuros y el efecto se suaviza, manteniendo el hover como una revelación del color de marca.

## Alcance

**Dentro:**

- En `src/components/shared/PartnersMarquee.tsx`, dentro del bloque `<style>`, en la regla `@media (min-width: 768px)` (línea ~86), cambiar el hover del logo de `opacity: 1` a `opacity: 0.65`, manteniendo `filter: none` (sigue revelando el color original).
- El cambio aplica en **todas** las franjas que usan `PartnersMarquee`: la per-categoría (`ServicePartners` en `/soluciones/[solucion]`) y la global del home (`Partners`). Al ser el mismo componente, una sola edición cubre ambas.

**Fuera de alcance:**

- El estado en reposo desktop (blanco al 55%): no se toca.
- El estado en mobile (<768px, color nativo al 100%, sin hover): no se toca — el problema es solo el hover en desktop.
- No se agrega escala (`transform: scale`) ni ningún otro efecto: solo el ajuste de opacidad.
- No se crea variante ni prop para diferenciar categorías vs home: el cambio es idéntico en ambos.
- La animación del marquee, el `mask-image`, la pausa en hover y `prefers-reduced-motion`: no se tocan.

## Modelo de datos

Este spec no introduce ni modifica estructuras de datos. Solo cambia un valor de `opacity` en el CSS inline de un componente de presentación.

## Plan de implementación

1. En `src/components/shared/PartnersMarquee.tsx`, en la regla `.partner-logo:hover` dentro de `@media (min-width: 768px)` (línea ~86), cambiar `opacity: 1` por `opacity: 0.65` (dejando `filter: none`). La transición existente (`transition: filter 0.35s ease, opacity 0.35s ease`) ya anima el cambio.
2. `npm run build` para confirmar que compila.
3. QA visual en desktop (≥768px): al hacer hover sobre un logo con texto oscuro, el color aparece atenuado y ya no se ve fuerte; en mobile el comportamiento no cambia.

## Criterios de aceptación

- [ ] En desktop, al hacer hover sobre un logo de partner, se revela su color original a **65% de opacidad** (no al 100%).
- [ ] Un logo con texto negro se percibe atenuado en hover, no oscuro-fuerte.
- [ ] El estado en reposo desktop sigue siendo blanco al 55%.
- [ ] El comportamiento en mobile (<768px) no cambió.
- [ ] El cambio se ve tanto en la franja de partners de las categorías como en la del home.
- [ ] No se agregó escala ni ningún otro efecto de hover.
- [ ] `npm run build` compila sin errores.

## Decisiones

- **Sí:** hover revela el color original pero atenuado a **65%**. El cliente quiere ver el color de marca al pasar el mouse, pero los logos con texto oscuro se ven mal al 100%; 65% (punto medio entre el 60 y 70 que barajó) los suaviza sin desaparecerlos.
- **No:** mantener los logos blancos en hover (idea inicial del cliente). Se descartó tras la aclaración: prefiere que se vea el color real, solo que menos intenso.
- **No:** agregar `transform: scale` sutil. El cliente no lo pidió en la aclaración final; el ajuste de opacidad resuelve el problema reportado.
- **Sí:** aplicar el cambio en el componente compartido `PartnersMarquee` (afecta home y categorías). Es el mismo problema visual en ambos; una variante per-página sería complejidad innecesaria.

## Qué **NO** entra en este spec

- Efecto de escala u otros efectos de hover.
- Cambios al estado en reposo o al comportamiento en mobile.
- Variante o prop para diferenciar la franja del home de la de categorías.
- Cambios a la animación del marquee o a `prefers-reduced-motion`.
