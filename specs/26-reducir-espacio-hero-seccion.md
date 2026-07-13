# SPEC 26 — Reducir el espacio vertical entre Hero y la sección siguiente

> **Estado:** Implementado
> **Depende de:** SPEC 10, SPEC 11, SPEC 12, SPEC 13, SPEC 06
> **Fecha:** 2026-07-13
> **Objetivo:** Reducir en desktop el aire acumulado entre el Hero y la primera sección de las páginas de solución, subservicio, casos de éxito y soporte, tocando solo el `pb` inferior de cada Hero.

## Por qué existe este spec

Cada Hero cierra con un `padding-bottom` grande en desktop (`lg:pb-24`/`lg:pb-28`/`lg:pb-32`) y la sección que le sigue abre con un `padding-top` también grande (`md:py-24` / `md:pt-20`). Los dos se suman y producen ~192–208px de vacío entre el Hero y el primer contenido real. En la página de solución (`El valor de la resiliencia`) esto se percibe como un salto vacío. El mismo patrón se repite en subservicio, casos de éxito y soporte.

## Alcance

**Dentro:**

- Reducir el `padding-bottom` de desktop (`lg:`) del Hero en las cuatro páginas afectadas:
  - `src/components/servicios/HeroSolucionReact.tsx` → `lg:pb-24` → `lg:pb-8`
  - `src/components/servicios/HeroSubservicioReact.tsx` → `lg:pb-24` → `lg:pb-8`
  - `src/components/casos-de-exito/HeroCasosReact.tsx` → `lg:pb-32` → `lg:pb-10`
  - `src/components/soporte/HeroSoporteReact.tsx` → `lg:pb-28` → `lg:pb-8`
- Dejar el gap final de desktop consistente en ~120–128px en las cuatro páginas.

**Fuera de alcance (para futuros specs):**

- Móvil y tablet: el `pb-20` móvil y todos los `padding-top` de las secciones siguientes quedan intactos.
- El `padding-top` de las secciones que siguen (ValorSolucion, Beneficios, CasosSlider, CanalesSoporte): no se tocan.
- Otras páginas (home, nosotros, formas de pago, contacto, blog): no muestran este gap acumulado y quedan fuera.
- Ajustar el `HeroServicios` de la página índice `/soluciones` (le sigue `StickyCards`, comportamiento distinto): no se toca.

## Modelo de datos

Este spec no introduce ni modifica estructuras de datos. Solo cambia clases de Tailwind en componentes de presentación.

## Plan de implementación

1. En `HeroSolucionReact.tsx` (línea ~60), cambiar `lg:pb-24` por `lg:pb-8` en el contenedor `relative z-10 site-container`. Verificar en `/soluciones/conectividad-empresarial` que el bloque "El valor de la resiliencia" queda más cerca del Hero en desktop.
2. En `HeroSubservicioReact.tsx` (línea ~71), cambiar `lg:pb-24` por `lg:pb-8`. Verificar en una página de subservicio que "Beneficios" sube.
3. En `HeroCasosReact.tsx`, cambiar `lg:pb-32` por `lg:pb-10`. Verificar en `/casos-de-exito`.
4. En `HeroSoporteReact.tsx`, cambiar `lg:pb-28` por `lg:pb-8`. Verificar en `/soporte-tecnico`.
5. QA visual en desktop (≥1024px) y móvil de las cuatro páginas: el gap desktop se redujo, el móvil quedó igual.

## Criterios de aceptación

- [ ] En desktop, el espacio entre el Hero y la sección siguiente en `/soluciones/[x]` es visiblemente menor que antes (~128px vs ~192px).
- [ ] En desktop, el mismo gap se redujo en subservicio, casos de éxito y soporte.
- [ ] En móvil (<1024px) el espacio de las cuatro páginas es idéntico al de antes del cambio.
- [ ] El `padding-top` de las secciones ValorSolucion, Beneficios, CasosSlider y CanalesSoporte no cambió.
- [ ] Ninguna otra página cambió su layout.
- [ ] `npm run build` compila sin errores.

## Decisiones

- **Sí:** reducir solo el `pb` inferior del Hero (un solo lado), no el `pt` de la sección siguiente. Mantiene el padding interno simétrico de cada sección y concentra el cambio en un único punto por página.
- **Sí:** solo desktop, vía overrides `lg:`. El gap en móvil ya era menor y aceptable.
- **Sí:** reducción moderada (opción a), no agresiva. El bloque sigue respirando.
- **Nota:** al tocar un solo lado, el gap final queda en ~120–128px (no ~72–96px como una reducción a ambos lados). Si más adelante se quiere más ajustado, se reduce también el `pt` de la sección siguiente en otro spec.
- **No:** unificar todos los Heroes bajo un componente/token de spacing común. Es refactor mayor; va en su propio spec si alguna vez llega.

## Qué **no** está en este spec

- Cambios en móvil/tablet.
- Tocar el `padding-top` de las secciones siguientes.
- Home, nosotros, formas de pago, contacto, blog, página índice de soluciones.
- Refactor a un sistema de spacing compartido entre Heroes.
