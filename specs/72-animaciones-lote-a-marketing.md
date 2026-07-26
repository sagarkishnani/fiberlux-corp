# SPEC 72 — Animaciones Lote A (Marketing): Nosotros, Soluciones, Subservicios, Listado

> **Estado:** Implementado
> **Depende de:** SPEC 69 (base `data-reveal`), SPEC 70 (overlap hero), SPEC 71 (repeat/draw/count-up/parallax/hover)
> **Fecha:** 2026-07-26
> **Objetivo:** Aplicar la base de animaciones a las páginas de marketing (Nosotros, /soluciones/[solucion], subservicio y /soluciones) siguiendo las reglas ya definidas (dos columnas → izq/der con repeat; bloques completos → fade-up; Stats → count-up; SVGs de línea → draw; glows → parallax; cards → hover; heroes interiores → fade-in), sin duplicar lo ya animado.

---

## Scope

**In:**

- **Nosotros** (`nosotros/index.astro`): fade-in hero; Misión/Visión y demás bloques según su layout (dos columnas → izq/der con repeat; completos → fade-up); Values → stagger + hover; wrappers de Stats/Rubros/BannerApp/Certificaciones → fade-up.
- **/soluciones/[solucion]** (secciones internas al hero): ServicePartners, CatalogoSoluciones, Stats, ServiciosForm, BlogPreview, FaqSolucion → fade-up / stagger / hover según corresponda.
- **/soluciones/[solucion]/[subservicio]** (secciones internas): CasosDeUso, Stats, ServiciosForm, BlogPreview, FaqSubservicio; y **stagger** en las cards de Beneficios.
- **/soluciones** (listado): fade-in hero + cards del listado con stagger + hover.
- **Reglas** reutilizadas de specs 69/71 (mismos atributos: `data-reveal`, `data-reveal-repeat`, `data-reveal-stagger`, `data-svg-draw`, `data-parallax`; hover CSS).
- **Accesibilidad:** todo respeta `prefers-reduced-motion`.

**Out of scope (futuro):**

- **Lote B** (blog, casos, fiberlux-app, soporte, formas de pago, info-abonados) y **Lote C** (contacto, reclamos, legales). *(Para C se acordó fade-up sobrio; va en su spec.)*
- **Secciones que YA animan — no se duplican:** `ValorSolucion` (`vis` propio) y `Beneficios` como sección (overlap SPEC 70) — solo se les puede sumar stagger en cards si no choca; `TimelineReact` (animación propia SPEC 03/04); sliders ya migrados (Rubros, Soluciones, Catálogo mobile — SPEC 68/69); count-up nativo de Stats; parallax del glow de Certificaciones (ya a nivel componente en SPEC 71).
- Heroes con lógica especial (overlap soluciones/subservicio, 3D de Home, Embla del blog).
- Home (ya hecho, SPEC 71) y config desde Tina.

---

## Data model

Sin datos nuevos ni Tina. Se reutilizan los atributos de SPEC 69/71. Mapeo por página (sección → efecto):

**Nosotros:**
```
HeroNosotros      → fade-in del contenido (data-reveal="up" en el bloque de texto)
MissionVision     → dos columnas: misión izq (left+repeat) / visión der (right+repeat)
                    (si el layout es apilado → fade-up)
Values            → grid: data-reveal-stagger en las cards + hover
Timeline          → SIN cambios (anim. propia)
Stats             → wrapper fade-up (+ count-up nativo)
Rubros            → wrapper fade-up (slider ya animado)
BannerApp         → fade-up (modo imagen)
Certificaciones   → wrapper fade-up (parallax del glow ya activo)
```

**/soluciones/[solucion]** (dentro del `z-10` que sube sobre el hero):
```
ValorSolucion     → SIN reveal de sección (ya tiene `vis` + es overlap); stagger en cards solo si no choca
ServicePartners   → fade-up + hover en logos
CatalogoSoluciones→ desktop grid: stagger + hover (mobile slider ya animado)
Stats             → fade-up (+ count-up nativo)
ServiciosForm     → dos columnas → izq/der; si apilado → fade-up
BlogPreview       → wrapper fade-up
FaqSolucion       → fade-up + stagger en ítems del acordeón
```

**Subservicio:**
```
Beneficios        → stagger en las cards (la sección es overlap SPEC 70; no reveal de sección)
CasosDeUso        → fade-up + stagger/hover en cards
Stats / Form / Blog / Faq → igual que en solución
```

**/soluciones (listado):**
```
Hero listado      → fade-in del contenido
Cards de solución → stagger + hover
```

> Regla transversal: **antes de agregar un efecto a una sección, verificar que no tenga ya animación propia** (evitar doble). Se prefiere aplicar `data-reveal` en **wrappers** (en el `.astro`) y `stagger`/`hover` dentro del componente cuando haga falta.

---

## Implementation plan

1. **Nosotros.**
   En `nosotros/index.astro` y los componentes de sus secciones: `data-reveal="up"` en el bloque de contenido del hero; en `MissionVision` aplicar izq/der + `repeat` si son dos columnas (o fade-up si apilado); `data-reveal-stagger` + hover en las cards de `Values`; wrappers `data-reveal="up"` para Stats, Rubros, BannerApp y Certificaciones. **No tocar** Timeline. Prueba manual: al scrollear Nosotros cada bloque anima según su tipo, sin doble animación.

2. **/soluciones/[solucion] (secciones internas).**
   En `[solucion].astro` (dentro del contenedor `z-10`) y componentes: fade-up + hover en ServicePartners; stagger + hover en el grid desktop de CatalogoSoluciones; fade-up en Stats; izq/der o fade-up en ServiciosForm según layout; wrapper fade-up en BlogPreview; fade-up + stagger de ítems en FaqSolucion. **No** agregar reveal de sección a ValorSolucion (ya tiene `vis`/overlap); evaluar stagger en sus cards solo si no choca. Prueba manual: en una solución, las secciones bajo el hero animan sin romper el overlap.

3. **/soluciones/[solucion]/[subservicio] (secciones internas).**
   En `[subservicio].astro` y componentes: `data-reveal-stagger` en las cards de Beneficios (sin reveal de la sección, que es overlap); fade-up + stagger/hover en CasosDeUso; Stats/Form/Blog/Faq igual que en solución. Prueba manual: en un subservicio, todo anima y el overlap del hero se conserva.

4. **/soluciones (listado).**
   En `soluciones/index.astro`: fade-in del contenido del hero; `data-reveal-stagger` + hover en las cards del listado. Prueba manual: el listado aparece en cascada al entrar.

5. **Verificación cruzada.**
   Revisar cada página en desktop y mobile: sin FOUC, sin doble animación (Valor/Beneficios/Timeline/sliders/count-up intactos), sin overflow horizontal por left/right, reduced-motion sin animación. `npm run build` compila.

---

## Acceptance criteria

- [ ] Nosotros: hero hace fade-in; Misión/Visión entra izq/der (o fade-up si apilado); Values en cascada con hover; Stats/Rubros/BannerApp/Certificaciones hacen fade-up; Timeline **sin cambios**.
- [ ] /soluciones/[solucion]: ServicePartners/Stats/Blog hacen fade-up; Catálogo (desktop) en cascada con hover; Form entra izq/der o fade-up; FAQ fade-up con ítems en cascada; el **overlap del hero se conserva** y ValorSolucion **no** se anima dos veces.
- [ ] Subservicio: Beneficios muestra sus cards en cascada (sin romper el overlap); CasosDeUso/Stats/Form/Blog/FAQ animan; overlap conservado.
- [ ] /soluciones (listado): hero fade-in y cards en cascada con hover.
- [ ] Los bloques izq/der con `repeat` re-aparecen/desaparecen al scrollear arriba/abajo; los completos animan una vez.
- [ ] Con `prefers-reduced-motion`: nada anima, todo visible, sin contenido oculto.
- [ ] Sin FOUC, sin overflow horizontal, sin regresiones en secciones ya animadas.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** reutilizar la base (specs 69/71) tal cual; este spec **solo agrega atributos/clases** (sin nueva lógica ni dependencias).
- **Sí:** lote A (marketing) primero; B y C en specs posteriores.
- **Sí:** heroes interiores con fade-in sobrio; se excluyen los de lógica especial (overlap, 3D, Embla).
- **Sí:** no duplicar animación en secciones que ya la tienen (Valor `vis`, Beneficios overlap, Timeline, sliders, count-up nativo, parallax de Certificaciones).
- **Sí:** `data-reveal` preferentemente en wrappers `.astro`; `stagger`/`hover` dentro del componente cuando aplique.
- **No:** tocar Home, config Tina, ni los lotes B/C.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Doble animación al sumar reveal donde ya hay una | Regla transversal: verificar antes de agregar; lista explícita de "no tocar". |
| `left/right` + `repeat` causan overflow horizontal | Aplicar dentro de contenedores con `overflow-hidden` o en la sección; verificación en el paso 5. |
| Reveal de sección sobre el overlap (Valor/Beneficios) rompe el sticky | No se pone reveal en esas secciones; solo stagger en cards internas. |
| Islands `client:visible` (varios) pisan estilos de Motion | Igual que specs previos: atributos en wrappers; Motion escribe inline que la hidratación no elimina. |
| MissionVision/Form no son realmente dos columnas | Se decide izq/der vs fade-up al leer el layout real en impl (paso 1/2). |
| Muchas animaciones activas por página afectan rendimiento | `will-change` se libera tras animar; `repeat`/parallax acotados. |

---

## Lo que **no** está en este spec

- Lotes B (blog, casos, app, soporte, formas de pago, info-abonados) y C (contacto, reclamos, legales).
- Home (ya hecho).
- Heroes con lógica especial (overlap, 3D, Embla).
- Config de animaciones desde Tina.

Cada uno, si aterriza, va en su propio spec.
