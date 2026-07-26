# SPEC 70 — Overlap sticky del hero en soluciones y subservicios

> **Estado:** Implementado
> **Depende de:** SPEC 11/12 (plantillas solución/subservicio), SPEC 69 (Motion ya instalado)
> **Fecha:** 2026-07-26
> **Objetivo:** En las páginas de solución y subservicio, fijar el hero mientras la sección siguiente (Valor / Beneficios) sube por encima cubriéndolo al hacer scroll, liberándolo cuando esa sección termina.

---

## Scope

**In:**

- **`/soluciones/[solucion]`**: envolver `HeroSolucion` + (`HtmlInjection` + `ValorSolucion`) en un contenedor de overlap; el hero queda `sticky top-0 z-0`, `ValorSolucion` va `relative z-10` (fondo opaco) y sube por encima; el hero se **libera** al terminar `ValorSolucion`.
- **`/soluciones/[solucion]/[subservicio]`**: igual con `HeroSubservicio` + (`HtmlInjection` + `Beneficios`).
- **Capa JS con Motion** (ya instalado, sin dependencia nueva): módulo `src/scripts/heroOverlap.ts` que, con `scroll()`, aplica un **efecto sutil al hero mientras es cubierto** (leve scale-down + oscurecido). Respeta `prefers-reduced-motion` (sin efecto; el overlap sticky se mantiene).
- **Desktop y mobile.**
- **Borde superior recto** en la sección que sube (sin redondeo).

**Out of scope (futuro):**

- Otras páginas/secciones (home, nosotros, etc.).
- **GSAP / ScrollTrigger** (descartado por peso; se usa Motion + CSS sticky).
- Cambiar contenido o diseño del hero, Valor o Beneficios.
- Parallax del fondo del hero (solo el efecto sutil de cobertura).
- Aplicar el overlap a secciones más abajo (solo hero ↔ sección inmediata siguiente).

---

## Data model

Esta feature **no introduce estructuras de datos nuevas** ni campos de Tina. Es layout + animación. Piezas concretas:

**1. Marcado en las páginas** (`[solucion].astro`, `[subservicio].astro`):

```
<div class="relative">                             ← contenedor de overlap
  <div class="sticky top-0 z-0" data-hero-sticky>  ← hero fijo
     <HeroSolucion />                                (o HeroSubservicio)
  </div>
  <div class="relative z-10">                       ← sube por encima (opaco)
     <HtmlInjection location="…-after-hero" />
     <ValorSolucion />                               (o Beneficios)
  </div>
</div>
```

El hero (sticky, altura = su contenido) se fija dentro del contenedor `.relative` (hero + sección); al pasar la sección, el contenedor termina y el hero se suelta.

**2. Módulo `src/scripts/heroOverlap.ts`** (Motion):

```
Por cada [data-hero-sticky]:
  scroll( animate(heroInner, { scale: [1, 0.96], opacity/brightness: [1, ~0.85] }),
          { target: contenedor .relative, offset: ["start start", "end start"] } )
Si prefers-reduced-motion → no se aplica (solo queda el sticky).
```

Se carga globalmente desde `BaseLayout` (junto a `reveal.ts`), no en modo mantenimiento; solo actúa si encuentra `[data-hero-sticky]`.

**3. Consideración de fondos:** `ValorSolucion` y `Beneficios` ya tienen fondo opaco (`bg-greyscale-darkest`), requisito para cubrir el hero. No se tocan.

---

## Implementation plan

1. **Overlap sticky en `/soluciones/[solucion]`.**
   En `[solucion].astro`, envolver `HeroSolucion` en `<div class="sticky top-0 z-0" data-hero-sticky>` y `HtmlInjection` + `ValorSolucion` en `<div class="relative z-10">`, todo dentro de un `<div class="relative">`. Prueba manual: al scrollear, el hero queda fijo y ValorSolucion sube por encima; al terminar Valor, el hero se suelta.

2. **Overlap sticky en `/soluciones/[solucion]/[subservicio]`.**
   Igual en `[subservicio].astro` con `HeroSubservicio` + (`HtmlInjection` + `Beneficios`). Prueba manual: mismo comportamiento en un subservicio.

3. **Módulo `heroOverlap.ts` (Motion) + carga en `BaseLayout`.**
   Crear `src/scripts/heroOverlap.ts`: por cada `[data-hero-sticky]`, con `scroll()` ligar al progreso del contenedor de overlap un efecto sutil del hero (scale `1→0.96` + oscurecido/opacidad `1→~0.85`); si `prefers-reduced-motion`, no aplicar. Cargarlo en `BaseLayout` junto a `reveal.ts` (no en mantenimiento). Prueba manual: el hero se atenúa/encoge levemente conforme la sección lo cubre; con reduced-motion queda solo el sticky.

4. **Verificar que el sticky no se rompe por ancestros con `overflow`.**
   Confirmar que ningún ancestro (`main`, `#a11y-content`, wrappers) tenga `overflow` que anule el `position: sticky`; ajustar si hace falta. Prueba manual: el pin funciona en desktop y mobile en ambas plantillas.

---

## Acceptance criteria

- [ ] En una página de solución, al hacer scroll el hero queda fijo y `ValorSolucion` sube por encima cubriéndolo; el hero se libera al terminar Valor.
- [ ] Lo mismo en una página de subservicio con `Beneficios` sobre `HeroSubservicio`.
- [ ] La sección que sube cubre el hero por completo (fondo opaco, sin que el hero se transparente detrás).
- [ ] El borde superior de la sección que sube es recto (sin redondeo).
- [ ] El hero muestra un efecto sutil (leve scale + oscurecido) mientras es cubierto; con `prefers-reduced-motion` no hay efecto pero el overlap sí ocurre.
- [ ] Funciona en desktop y mobile.
- [ ] El resto de la página (Partners/Catálogo/Stats/Form/Blog/FAQ) sigue con su layout y z-index actuales, sin regresiones.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** mecánica del overlap con **CSS `sticky`** (contenedor hero + sección; el hero se libera al terminar la sección).
- **Sí:** capa JS con **Motion** (ya instalado) vía `scroll()` para el efecto sutil del hero al ser cubierto.
- **No:** **GSAP/ScrollTrigger** — agregaría ~50kb solo para esto; Motion + sticky cubren el caso.
- **Sí:** overlap en desktop y mobile; borde superior recto (como on.pe).
- **Sí:** solo hero ↔ sección inmediata (Valor/Beneficios); el resto de la página no cambia.
- **Reversible:** si se decide quitar el efecto del hero, queda el overlap puro (solo sticky).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Un ancestro con `overflow: hidden/auto` anula `position: sticky` | Paso 4 lo verifica; el hero ya usa `overflow-hidden` en sí mismo (no afecta), el problema sería un ancestro — se ajusta si aparece. |
| El hero tiene `-mt-16` (se mete bajo el header); sticky `top-0` podría dejar franja o solaparse con el header fijo | Ajustar el `top` del sticky y verificar contra el header sólido de estas páginas; el header va en z superior. |
| En mobile el hero de imagen fijo puede sentirse pesado o saltar | Se prueba en mobile (paso 4); si molesta, se puede acotar a desktop en un ajuste posterior. |
| El efecto Motion sobre el hero pelea con animaciones internas del hero | El efecto se aplica a un wrapper/hero externo; es sutil y se puede desactivar dejando solo el sticky. |
| El `data-reveal` global o Lenis interfieren con el sticky/scroll | Sticky es CSS (independiente de Lenis); `scroll()` de Motion usa el scroll nativo que Lenis controla — se verifica el progreso en el paso 3. |

---

## Lo que **no** está en este spec

- Overlap en otras páginas/secciones (home, nosotros, etc.).
- GSAP / ScrollTrigger.
- Parallax del fondo del hero.
- Rediseño del hero, Valor o Beneficios.

Cada uno, si aterriza, va en su propio spec.
