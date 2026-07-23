# SPEC 62 — Sliders: igualar la fluidez de arrastre a la de soluciones

> **Estado:** Implementado
> **Depende de:** SPEC 40 (motor de arrastre unificado `useDragSlider`)
> **Fecha:** 2026-07-22
> **Objetivo:** Igualar la fluidez de arrastre de los sliders de blog, testimonios, certificaciones, rubros y casos de éxito a la del slider de soluciones, aplicándoles `momentum: false` en `useDragSlider`.

---

## Por qué este spec existe

El cliente reporta que solo el slider de soluciones se siente 100% fluido al arrastrar las cards; el resto (blog, clientes/testimonios, isos/certificaciones) no. Todos usan el mismo motor `useDragSlider` y todos enganchan los handlers de drag, así que el arrastre 1:1 es idéntico. La única diferencia de configuración es que **soluciones usa `momentum: false`** y los demás el default `momentum: true`. Con `momentum: true`, al soltar se proyecta un "fling" con inercia que puede pasarse de largo; con `momentum: false`, el gesto asienta como máximo una card en su dirección (aterrizaje limpio y predecible). Testimonios usa el mismo `snap-mandatory` que soluciones pero sigue en `momentum:true` — confirmando que la variable es el momentum, no el tipo de snap.

---

## Scope

**In:**

- Agregar `momentum: false` al `useDragSlider` de estos 5 componentes:
  - `src/components/blog/BlogPreviewReact.tsx` (blog / Insights)
  - `src/components/shared/TestimonialSliderReact.tsx` (clientes / testimonios)
  - `src/components/certificaciones/CertificacionesSliderReact.tsx` (isos)
  - `src/components/nosotros/RubrosReact.tsx` (rubros)
  - `src/components/casos-de-exito/CasosSliderReact.tsx` (casos de éxito)

**Out of scope (futuro):**

- `SolucionesSliderReact` (ya tiene `momentum: false` — es la referencia).
- `CatalogoSolucionesReact` (usa `nativeSnap`; su aterrizaje lo maneja el snap nativo por diseño).
- Cambiar el default de `momentum` en el hook `useDragSlider` (se decidió por-slider explícito).
- Otros ajustes del motor (`decay`, `minVelocity`, umbrales) — solo si `momentum:false` no basta (ver Riesgos).
- Rediseño visual o cualquier otro aspecto de los sliders.

---

## Data model

Este spec no introduce estructuras de datos ni cambios de schema. Es solo configuración de props en 5 componentes.

---

## Implementation plan

1. **Aplicar `momentum: false` en los 5 sliders.**
   En cada componente, en la llamada a `useDragSlider({ ... })`, agregar la línea `momentum: false,` (junto a `slideSelector`/`align`/`itemCount`), replicando la config de `SolucionesSliderReact`:
   - `BlogPreviewReact.tsx`
   - `TestimonialSliderReact.tsx`
   - `CertificacionesSliderReact.tsx`
   - `RubrosReact.tsx`
   - `CasosSliderReact.tsx`
   Prueba manual: arrastrar una card en blog, testimonios, certificaciones, rubros y casos de éxito se siente igual que en soluciones (asienta una card por gesto, sin fling que se pase de largo). `npm run build` compila.

---

## Acceptance criteria

- [ ] Los 5 sliders (blog, testimonios, certificaciones, rubros, casos de éxito) tienen `momentum: false` en su `useDragSlider`.
- [ ] Al arrastrar una card en esos 5, el gesto asienta una card en la dirección del arrastre, sin inercia que se pase de largo (igual que soluciones).
- [ ] El slider de soluciones no cambia (ya era `momentum: false`).
- [ ] El catálogo no cambia (sigue con `nativeSnap`).
- [ ] Las flechas (prev/next) siguen funcionando en todos.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** replicar exactamente la config de soluciones (`momentum: false`) en los otros sliders. Es la única diferencia y la referencia validada por el cliente.
- **Sí:** por-slider explícito (no cambiar el default del hook), para no afectar el catálogo (nativeSnap) ni sliders futuros sin querer.
- **Sí:** incluir también rubros y casos de éxito (no solo los 3 nombrados) para que todo el sitio se sienta uniforme.
- **No:** tocar `decay`/`minVelocity`/umbrales por ahora; solo si `momentum:false` no basta.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `momentum:false` no basta y algún slider sigue sintiéndose distinto | En ese caso, afinar el mismo motor (`decay`, `minVelocity`, `nudgeThreshold`) o revisar el snap CSS del slider afectado, en un ajuste posterior. |
| El diagnóstico (momentum) no cubre un caso puntual de rendimiento en alguna página | Verificar cada slider tras el cambio; si uno persiste, tratarlo aparte con su contexto. |
| Cambiar de `momentum:true` a `false` altera la sensación esperada en algún slider ancho | Es justo el comportamiento pedido (igual a soluciones); si el cliente prefiere inercia en alguno, se revierte solo ese. |

---

## Lo que **no** está en este spec

- El slider de soluciones (ya es la referencia) y el catálogo (nativeSnap).
- Cambiar el default del hook `useDragSlider`.
- Tuning adicional del motor más allá de `momentum:false`.
- Rediseño visual de los sliders.

Cada uno, si aterriza, va en su propio spec.
