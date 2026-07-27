# SPEC 78 — Lote QA cliente: Home, Nosotros, App, Formas de pago, Soporte, Casos y Accesibilidad

> **Estado:** Implementado
> **Depende de:** SPEC 04 (timeline slide-animation), SPEC 05/47 (rubros), SPEC 13/57 (casos/testimonios logo), SPEC 14/32 (formas de pago), SPEC 06/45/74 (soporte), SPEC 22/54 (¿por qué Fiberlux?), SPEC 23/30 (accesibilidad), SPEC 37/53 (Fiberlux App), SPEC 43/28 (partners)
> **Fecha:** 2026-07-26
> **Objetivo:** Resolver once observaciones puntuales de QA del cliente sobre Home, Nosotros, Fiberlux App, Formas de pago, Soporte técnico, Casos de éxito y el botón de accesibilidad, sin cambios de schema y en un solo lote desplegable.

---

## Por qué existe este spec

Lote de observaciones del cliente (mismo criterio que SPEC 36 y 56): bugs y ajustes visuales/contenido aislables a nivel de componente, agrupados para un solo deploy. Se registra también en `specs/observaciones-cliente.md`.

---

## Scope

**In:**

- **obs1 — Home / cifras "¿Por qué Fiberlux?":** reducir la velocidad del count-up a ~1 s.
- **obs2 — Home / partners:** logos con footprint visual homogéneo + la marquesina **no se pausa** al hacer hover.
- **obs3 — Nosotros / Rubros:** al hover la imagen hace un **zoom leve**, se **ilumina** y su **opacidad sube a 100%**.
- **obs4 — Nosotros / Hitos:** hacerlos **draggeables** (sobre la animación vertical actual), **autoplay 5 s → 4 s** y **corregir el color de las flechas**.
- **obs5 — Fiberlux App / beneficios:** agregar los ítems **4 y 5** a los 3 existentes.
- **obs6 — Soluciones/subservicio:** **ocultar en mobile** el form hero ("¿Conversamos?") que aparece arriba.
- **obs7 — Formas de pago:** **aumentar ligeramente** el tamaño de letra en todos los textos.
- **obs8 — Soporte técnico:** añadir **íconos clickeables** por canal (WhatsApp / correo / llamada).
- **obs9 — Casos de éxito:** mostrar el **logo de la empresa** en vez de la comilla, poblando el campo `logo` con los assets de `images/testimonials`.
- **obs10 — Casos de éxito (desktop):** el slider **arranca desde la izquierda** y se **quita el título redundante** "Casos de éxito" del slider.
- **obs11 — Accesibilidad:** el control de contraste pasa de ON/OFF a **4 estados**: Desactivado / Bajo / Medio / Alto.

**Out of scope:**

- Rediseño del motor de sliders (`useSlider`/Embla) más allá de color de flechas (obs4) y alineación (obs10).
- Sourcing de logos nuevos: obs9 usa solo los assets que ya existen en `public/images/testimonials/`.
- Cambiar el schema de TinaCMS (todo se resuelve con contenido existente o props locales).

---

## Data model

Sin nuevas colecciones ni cambios de schema. Cambios de **contenido** y una **prop nueva**:

**Contenido (obs5) — `src/content/fiberlux-app/index.json` → `beneficios.items[]`**, agregar:

```
{ "icon": "<uno del set existente>", "title": "Facturación digital",
  "text": "Descarga tus facturas individual o masivamente, y revisa tu estado de cuenta actualizado." }
{ "icon": "<uno del set existente>", "title": "Tickets al instante",
  "text": "Crea tickets al instante y gestiona incidencias o requerimientos desde tu teléfono." }
```

(títulos tentativos; texto literal del cliente. El grid pasa de 3 a 5 cards.)

**Contenido (obs9) — `src/content/casos-de-exito/index.json` → `items[].logo`:**

```
Boticas         → "/images/testimonials/logo-boticas-y-hogar-salud.png"
Cámara Arequipa → "/images/testimonials/logo-camara-de-comercio-arequipa.png"
Grupo Gloria    → "/images/testimonials/logo-grupo-gloria.svg"
```

**Prop nueva (obs6) — `ServiciosForm.astro` / `ServiciosFormReact.tsx`:**

```
hideOnMobile?: boolean   // default false; oculta la instancia hero en mobile (<md)
```

**Estado (obs11) — `AccessibilityPanel.tsx`:** `contrast: boolean` → `contrastLevel: 0 | 1 | 2 | 3` (0 = desactivado). Debe sincronizarse en el script pre-paint de `BaseLayout.astro`.

---

## Implementation plan

Cada paso es commiteable y deja el sitio funcional.

1. **obs1 — Velocidad de cifras.** En `src/components/StatsReact.tsx:116`, cambiar `useCounter(value, 2000 + index * 150, isVisible)` a `1000 + index * 60` (≈1 s con stagger mínimo). *Test:* los números llegan a su valor en ~1 s al entrar en viewport.

2. **obs2 — Partners.** En `src/components/shared/PartnersMarquee.tsx`: (a) quitar la regla `.partners-marquee:hover .partners-track { animation-play-state: paused }` (líneas ~128-130) para que no se detenga; (b) dar footprint homogéneo: envolver cada logo en una caja de tamaño fijo (altura + `max-width` iguales, `object-contain`, centrado) en vez de solo `h-7 md:h-9`, para que todos ocupen el mismo espacio visual. *Test:* al pasar el mouse la cinta sigue corriendo; los logos se ven de tamaño parejo.

3. **obs3 — Rubros hover.** En `src/components/nosotros/RubrosReact.tsx`: añadir `group` al `<article>` (línea ~123) y a la `<img>` (líneas ~132-138) `transition-[transform,filter,opacity] duration-300 group-hover:scale-105 group-hover:brightness-110` y subir la opacidad base a `group-hover:opacity-100`. *Test:* al hover la imagen del rubro hace zoom leve, se ilumina y queda al 100%.

4. **obs4 — Hitos draggeables + timer + flechas.** En `src/components/nosotros/TimelineReact.tsx`:
   - **Drag:** añadir handlers pointer (down/move/up) sobre el `SlideWindow` que, al superar un umbral horizontal, disparen `next()`/`prev()` (reutilizando la animación vertical existente). No se migra a Embla.
   - **Timer:** `setInterval(…, 5000)` → `4000` (líneas ~151-158).
   - **Flechas:** corregir el color (hoy prev `opacity-40` gris + next magenta). Adaptar el patrón de flechas de los otros sliders (`SliderArrows`) para consistencia de color/estado. *Test:* se puede arrastrar entre hitos; avanzan solos cada 4 s; las flechas tienen color coherente.

5. **obs5 — Beneficios App 4 y 5.** Agregar los dos ítems en `src/content/fiberlux-app/index.json`. Verificar que el grid (`BeneficiosAppReact.tsx:81`, `md:grid-cols-3`) acomode 5 cards de forma equilibrada (p. ej. `md:grid-cols-3` con la 4ª/5ª centradas, o `lg:grid-cols-5`). *Test:* se ven 5 beneficios; layout ordenado en desktop y mobile.

6. **obs6 — Ocultar form hero en mobile.** Añadir prop `hideOnMobile` a `ServiciosForm.astro`/`ServiciosFormReact.tsx` que aplique `hidden md:block` (o equivalente) al bloque. Activarla solo en la instancia **hero** de las páginas `/soluciones/*` (categoría y subservicio). *Test:* en mobile el form de arriba no aparece en soluciones/subservicio; en desktop sí; el resto de instancias del form no cambian.

7. **obs7 — Tipografía Formas de pago.** Subir un escalón las clases de texto en `HeroFormasPagoReact.tsx` (H1 e intro) y `FormasPagoSelectorReact.tsx` (título de paso, descripción, sub-bullets, dropdown). *Test:* los textos de la página se ven ligeramente más grandes, sin romper el layout.

8. **obs8 — Íconos de canales en Soporte.** En `src/components/soporte/CanalesSoporte.tsx`, mapear un ícono por `channel.type` (`whatsapp`→`FaWhatsapp`, `email`→`FaEnvelope`, `call`→`FaPhone`) y renderizarlo en la fila/enlace clickeable para que se note que es accionable. *Test:* cada canal muestra su ícono y el `<a>` sigue llevando a `wa.me`/`mailto:`/`tel:`.

9. **obs9 — Logos en Casos.** Poblar `items[].logo` en `src/content/casos-de-exito/index.json` con los 3 assets de `images/testimonials`. `CasoCard.tsx` (líneas ~113-124) ya renderiza el logo en vez de `QuoteMark` cuando `logo` existe. *Test:* cada card muestra el logo de la empresa en lugar de la comilla magenta.

10. **obs10 — Slider casos desde la izquierda + sin título redundante.** En `CasosSliderReact.tsx`: cambiar `align: "center"` → `"start"` y ajustar el padding lateral (`px-6 md:px-[max(...)]`, líneas ~75/108) para que la primera card quede pegada a la izquierda en desktop; ocultar/vaciar el `sectionTitle`/`<h2>` "Casos de éxito" (líneas ~63-68) que duplica el H1 del hero. *Test:* en desktop el slider arranca desde la izquierda y no hay doble título "Casos de éxito".

11. **obs11 — Contraste de 4 estados.** En `AccessibilityPanel.tsx`: reemplazar `contrast: boolean` por `contrastLevel: 0|1|2|3`; en `applyState()` (líneas ~46-65) mapear a `--a11y-contrast`/`--a11y-brightness` — **propuesta:** Desactivado=`1`/`1` (sin `.a11y-filter`), Bajo=`0.85`/`1`, Medio=`1.2`/`1.02`, Alto=`1.5`/`1.05`. Reemplazar el `ToggleCard` único (líneas ~206-211) por un control de 4 estados. **Sincronizar los mismos valores** en el script pre-paint de `BaseLayout.astro` (líneas ~159-162). *Test:* los 4 estados aplican filtros distintos y persisten al recargar.

---

## Acceptance criteria

- [ ] obs1: los números de "¿Por qué Fiberlux?" completan su conteo en ~1 s.
- [ ] obs2: la marquesina de partners no se detiene al hacer hover; los logos tienen tamaño visual parejo.
- [ ] obs3: al hover sobre un rubro, la imagen hace zoom leve, se ilumina y queda al 100% de opacidad.
- [ ] obs4: los Hitos se pueden arrastrar, avanzan solos cada 4 s y las flechas tienen color coherente.
- [ ] obs5: la sección de beneficios de la App muestra 5 ítems, con layout ordenado en desktop y mobile.
- [ ] obs6: en mobile no aparece el form hero en `/soluciones/*`; en desktop sí; otras instancias del form intactas.
- [ ] obs7: los textos de Formas de pago se ven ligeramente más grandes sin romper el layout.
- [ ] obs8: cada canal de Soporte muestra su ícono (WhatsApp/correo/llamada) y el enlace sigue funcionando.
- [ ] obs9: cada card de Casos muestra el logo de la empresa en vez de la comilla.
- [ ] obs10: en desktop el slider de Casos arranca desde la izquierda y no hay título "Casos de éxito" duplicado.
- [ ] obs11: el contraste tiene 4 estados (Desactivado/Bajo/Medio/Alto) que aplican filtros distintos y persisten al recargar.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** un solo spec batch (precedente 36/56); un deploy.
- **obs4:** drag sobre la animación vertical actual (spec 04), **no** migrar a Embla — para no regresar el efecto vertical. Timer a 4 s.
- **obs6:** "forms de top en mobile" = form hero de `/soluciones/*` (aclarado por el cliente), no la página Fiberlux App (que no tiene form).
- **obs9:** se reusan los logos de `images/testimonials` (aclarado por el cliente); sin sourcing nuevo.
- **obs11:** interpretación de la nota del cliente ("bajo/medio ≈ más opaco, valor 0.algo") → escala donde Bajo reduce el contraste (<1) y Alto lo sube (>1). **Valores propuestos, a afinar en el device.**

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| obs2 "misma proporción" es subjetivo | Caja de footprint fijo por logo (best-effort); afinar altura/anchura tras verlo. |
| obs4 el drag interfiere con la animación vertical o el autoplay | Umbral de arrastre + pausar autoplay durante el gesto; reutilizar `next/prev` existentes. |
| obs5 con 5 cards el grid `md:grid-cols-3` queda desbalanceado | Elegir `lg:grid-cols-5` o centrar la última fila; validar en ambos breakpoints. |
| obs11 los valores de contraste no coinciden con lo que el cliente imagina | Valores marcados como propuesta; el modelo de 4 estados queda listo para reajustar sin refactor. |

---

## Lo que **no** entra

- Sourcing de logos nuevos para casos (solo los de `images/testimonials`).
- Refactor del motor `useSlider`/Embla.
- Cambios de schema en TinaCMS.
