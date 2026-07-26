# SPEC 68 — Migración de sliders a Embla Carousel + autoplay configurable

> **Estado:** Implementado
> **Depende de:** SPEC 34/35/48/55 (diseños de sliders a preservar), SPEC 05 (rubros). **Reemplaza:** SPEC 40 y SPEC 62 (motor de arrastre propio).
> **Fecha:** 2026-07-26
> **Objetivo:** Reemplazar el motor propio `useDragSlider` por Embla Carousel en los 7 sliders del sitio, con autoplay (loop, pausa al interactuar, respeta `prefers-reduced-motion`) configurable desde Tina por tipo de slider, preservando los diseños actuales.

---

## Scope

**In:**

- **Dependencias:** `embla-carousel-react` y `embla-carousel-autoplay` (estables, MIT, ~5kb).
- **Hook compartido nuevo** `src/hooks/useSlider.ts` (sobre Embla): expone una API equivalente a la actual (`viewportRef`, `activeIndex`, `canPrev`/`canNext`, `next`/`prev`/`goTo`, `scrollSnaps`) + autoplay integrado.
- **Migrar los 7 sliders** a Embla (viewport + container), conservando su markup visual, gaps y alineación: Certificaciones, Soluciones (`home`), Testimonios (`home`), Casos, CatálogoSoluciones (`service`), BlogPreview, Rubros (`about`).
- **Autoplay en los 7**: loop infinito, `stopOnMouseEnter` + `stopOnInteraction`, desactivado si `prefers-reduced-motion`.
- **Config en Tina** centralizada en `global.sliders` (una entrada por slider: `autoplay` + `intervalMs`).
- **Eliminar** `src/hooks/useDragSlider.ts` una vez migrados todos.

**Out of scope (futuro):**

- Partners/ServicePartners (otro patrón: marquee/grid).
- Rediseño visual de cualquier slider (solo cambia el motor).
- Dots/paginación nuevos donde hoy no existen (se respeta lo que cada slider ya muestra: flechas, contadores, etc.).
- Config de autoplay por instancia/página (se usa una config por tipo de slider).

---

## Data model

**1. Dependencias** (`package.json`): `embla-carousel-react`, `embla-carousel-autoplay`.

**2. Config de sliders en Tina** — nuevo objeto en la colección `global` (`global.sliders`):

```
{ name: "sliders", label: "Sliders (autoplay)", type: "object",
  fields: [ <un objeto por slider>:
    { name: "<key>", label: "...", type: "object", fields: [
        { name: "autoplay",   label: "Autoplay",       type: "boolean" },
        { name: "intervalMs", label: "Intervalo (ms)", type: "number" },
    ] }
  ] }
```

Keys (7): `certificaciones`, `soluciones`, `testimonios`, `casos`, `catalogoSoluciones`, `blogPreview`, `rubros`.

**3. Defaults sembrados** (`global/index.json`):

```
vitrinas (logos/foto):   testimonios 5000 · certificaciones 3500 · rubros 3500   → autoplay: true
contenido:               soluciones 6000 · casos 6000 · catalogoSoluciones 6000 · blogPreview 6000 → autoplay: true
```

**4. API del hook `useSlider`** (equivalente funcional al actual, sobre Embla):

```ts
useSlider({ autoplay?: boolean; intervalMs?: number; loop?: boolean; align?: "start"|"center" })
  → { viewportRef, activeIndex, canPrev, canNext, scrollSnaps, next(), prev(), goTo(i) }
```

Cada componente pasa la config leída de `global.sliders.<key>` (vía props desde su `.astro`).

**5. Estructura DOM por slider (Embla):**

```
<div ref={viewportRef} class="overflow-hidden">   ← viewport
  <div class="flex">                                ← container
    <div class="slide …">…</div> × N                ← slides (mismo estilo/gap actual)
  </div>
</div>
```

---

## Implementation plan

1. **Dependencias + hook `useSlider`.**
   Instalar `embla-carousel-react` y `embla-carousel-autoplay`. Crear `src/hooks/useSlider.ts` sobre Embla: expone `{ viewportRef, activeIndex, canPrev, canNext, scrollSnaps, next, prev, goTo }`, integra el plugin Autoplay (`stopOnMouseEnter`, `stopOnInteraction`) y **desactiva autoplay si `prefers-reduced-motion`**. Prueba manual: un componente de prueba desliza y hace autoplay. (Sistema intacto: nada lo consume aún.)

2. **Schema `global.sliders` + defaults.**
   En `tina/config.ts` agregar `global.sliders` (7 sub-objetos con `autoplay`/`intervalMs`). Sembrar los defaults en `global/index.json` (Data model §3). Regenera el cliente. Prueba manual: en `/admin` → Global → Sliders aparecen las 7 entradas.

3. **Migrar Certificaciones.**
   Reestructurar a viewport/container Embla, reemplazar `useDragSlider` por `useSlider`, pasar `global.sliders.certificaciones` desde el `.astro` (query a `global`). Conservar diseño, flechas y gaps. Prueba manual: arrastra, autoplay, flechas OK; se ve igual que antes.

4. **Migrar Testimonios** (`home.testimonials`, config `testimonios`). Igual que el paso 3. Prueba manual idem.

5. **Migrar Soluciones** (`home.services`, config `soluciones`). Prueba manual idem.

6. **Migrar CatálogoSoluciones** (`service`, config `catalogoSoluciones`). Prueba manual idem, en una página de solución.

7. **Migrar Casos** (`casosDeExito`, config `casos`). Prueba manual idem.

8. **Migrar BlogPreview** (config `blogPreview`; se aplica en home/solución/subservicio). Prueba manual idem en las 3 ubicaciones.

9. **Migrar Rubros** (`about.rubros`, config `rubros`), reemplazando su autoplay propio por el de Embla. Prueba manual idem.

10. **Eliminar el motor viejo.**
    Borrar `src/hooks/useDragSlider.ts` (ya sin consumidores) y marcar SPEC 40 y 62 como `Obsoleto`. Prueba manual: `grep` no encuentra `useDragSlider`; `npm run build` compila.

---

## Acceptance criteria

- [ ] `embla-carousel-react` y `embla-carousel-autoplay` están en `package.json`; `useDragSlider.ts` eliminado y sin imports remanentes.
- [ ] Los 7 sliders permiten arrastre con mouse y swipe táctil, y las flechas navegan.
- [ ] El índice activo / contador de cada slider refleja la posición correcta.
- [ ] Cada slider se ve igual que antes de la migración (diseño, gaps, alineación preservados).
- [ ] Cada slider hace autoplay según `global.sliders.<key>`, con loop, y se **pausa al pasar el mouse** y al interactuar.
- [ ] Con `prefers-reduced-motion` activo, ningún slider hace autoplay.
- [ ] En `/admin` → Global → Sliders, cambiar `autoplay`/`intervalMs` se refleja en el sitio.
- [ ] No hay overflow horizontal de página en ningún breakpoint; la hidratación (`client:visible`/`load`) funciona sin errores de consola.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** Embla Carousel (vs Swiper/motor propio): estable, ~5kb, arrastre fluido y plugin de autoplay oficial; paradigma cercano al scroll-snap actual.
- **Sí:** config de autoplay centralizada en `global.sliders` **por tipo de slider** (no por colección/instancia): un solo lugar en el CMS y sin ambigüedad para sliders reusados (BlogPreview, Catálogo).
- **Sí:** se preserva el markup/diseño de cada slider; solo cambia el motor.
- **Sí:** autoplay con `loop`, `stopOnMouseEnter` y `stopOnInteraction`; `prefers-reduced-motion` lo desactiva por completo.
- **Sí:** se elimina `useDragSlider` y SPEC 40/62 pasan a `Obsoleto`.
- **Consecuencia:** con `loop` activo, las flechas quedan siempre habilitadas (hoy se deshabilitaban en los extremos). Se acepta.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Regresión visual al reestructurar a viewport/container | Migrar **un slider por paso**, comparando contra el estado previo; conservar clases, gaps y alineación. |
| `loop` con pocos slides o anchos variables se comporta raro | Probar con los conteos reales; ajustar opciones Embla (`align`, `containScroll`, `slidesToScroll`) por slider. |
| Autoplay choca con Lenis / hidratación diferida (`client:visible`) | El autoplay se inicia en `mount` del island; el plugin gestiona pausa/visibilidad. |
| Sliders reusados leen una sola config | Es intencional (una config por tipo); documentado. |
| Aumento de bundle (~5-6kb) | Aceptable: se elimina el hook propio de 464 líneas. |
| `prefers-reduced-motion` no respetado = problema de accesibilidad | Criterio de aceptación explícito; se verifica en QA. |

---

## Lo que **no** está en este spec

- Partners/ServicePartners (marquee/grid).
- Rediseño visual de los sliders.
- Dots/paginación nuevos donde no existen hoy.
- Autoplay configurable por instancia/página.

Cada uno, si aterriza, va en su propio spec.
