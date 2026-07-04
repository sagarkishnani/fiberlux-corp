# SPEC 19 — Responsive global: cimientos + pasada por todas las pantallas

> **Estado:** Aprobado
> **Depende de:** Ninguno (toca transversalmente los cimientos de estilo y todas las páginas ya existentes; no bloquea specs previos).
> **Fecha:** 2026-07-04
> **Objetivo:** Hacer que todo el sitio se vea correctamente en mobile, tablet y laptop, primero haciendo responsive los cimientos de diseño (tipografía, padding de contenedores y spacing de secciones) y luego corrigiendo página por página los tamaños fijos, overflows y grids que hoy solo funcionan en desktop.

## Alcance

**Dentro:**

- **Cimientos responsive** (`tailwind.config.mjs` + `src/styles/global.css`):
  - Tipografía: que `heading-*` y `subtitle-*` escalen por breakpoint (o vía `clamp()`), de modo que un `h1`/`h2` grande no desborde en mobile. Incluye ajustar los defaults de `h1`–`h6` en `global.css`.
  - `.section` / `.section-*`: padding vertical y horizontal responsive (hoy `py-20 px-4` fijo).
  - `.container-xl` / `.container-lg`: padding lateral responsive (hoy `px-16` / `px-8` fijo).
  - Un patrón/utilidad claro para reemplazar los `text-[NNpx]` hardcodeados por algo que escale.
- **Pasada página por página** (cada página = un paso commiteable del plan), corrigiendo tamaños de fuente desktop-only, padding/márgenes fijos, overflow horizontal, grids que no colapsan, imágenes/Spline y carruseles:
  - `index` (home), `nosotros`, `servicios/index`, `soporte-tecnico`, `contacto`, `blog/index` + `blog/[slug]`, `casos-de-exito`, `formas-de-pago`, plantilla `servicios/[solucion]`, plantilla `servicios/[solucion]/[subservicio]`, `reclamos` (selector + `reclamo`/`queja`/`apelacion`), legales (`libro-reclamaciones`, `derechos-arco`, `tratamiento-datos`), `informacion-abonados`.
  - Componentes con `style={{…}}` inline (formularios, reclamos) también se adaptan.
- **QA visual** a 375, 390, 768, 1024, 1280 y 1440 px contra las referencias mobile existentes en `references/`; tablet (768/1024) por criterio (interpolando desktop↔mobile, sin referencia propia).
- **Regresión desktop:** a ~1440 px (ancho nativo del diseño) el sitio se mantiene visualmente idéntico al actual; el rango laptop (1024–1439) solo se ajusta donde hoy esté roto o desproporcionado, sin rediseño.

**Fuera de alcance (para futuras specs):**

- **Rediseñar** layouts, jerarquía o composición: esto es adaptación responsive, no rediseño.
- Nuevas secciones, features o cambios de contenido/copys.
- Cambios en el **schema de TinaCMS** o en el contenido de `src/content/`.
- Crear **referencias de tablet** (no existen; se resuelven por criterio).
- Accesibilidad más allá de lo ya existente (controles a11y de `global.css`).
- Migrar el sistema de tokens a Tina o rehacer la escala tipográfica desde cero.

---

## Modelo de datos

Esta feature **no introduce colecciones ni campos de TinaCMS ni estructuras de estado**. Lo que sí introduce es una **escala responsive concreta** para los tokens de diseño. Ese es el contrato.

### 1. Tipografía — de px fijo a `clamp()` (en `tailwind.config.mjs`)

Los tamaños grandes pasan a `clamp(min, preferido, max)` y el `lineHeight` a **ratio unitless** (para que escale con la fuente). El `max` es exactamente el tamaño desktop actual (cero regresión en desktop). Solo escalan headings y subtitles; `body-*` y `caption-*` se quedan igual (ya son legibles en mobile).

```js
// fontSize responsive (min ≈ mobile, max = desktop actual)
'heading-xxl': ['clamp(2.5rem, 6vw + 1rem, 5rem)',       { lineHeight: '1.1'  }], // 40 → 80
'heading-xl':  ['clamp(2.25rem, 5.5vw + .75rem, 4.5rem)', { lineHeight: '1.1'  }], // 36 → 72
'heading-lg':  ['clamp(2rem, 5vw + .5rem, 4rem)',         { lineHeight: '1.12' }], // 32 → 64
'heading-md':  ['clamp(1.875rem, 4vw + .5rem, 3.5rem)',   { lineHeight: '1.14' }], // 30 → 56
'heading-sm':  ['clamp(1.625rem, 3.5vw + .5rem, 3rem)',   { lineHeight: '1.16' }], // 26 → 48
'heading-xs':  ['clamp(1.5rem, 2.5vw + .5rem, 2.5rem)',   { lineHeight: '1.2'  }], // 24 → 40
'subtitle-xl': ['clamp(2rem, 4vw + .5rem, 3.5rem)',       { lineHeight: '1.05' }], // 32 → 56
'subtitle-lg': ['clamp(1.75rem, 3vw + .5rem, 2.75rem)',   { lineHeight: '1.1'  }], // 28 → 44
'subtitle-md': ['clamp(1.5rem, 2vw + .5rem, 2rem)',       { lineHeight: '1.25' }], // 24 → 32
'subtitle-sm': ['clamp(1.25rem, 1.5vw + .4rem, 1.5rem)',  { lineHeight: '1.25' }], // 20 → 24
// subtitle-xs, body-*, caption-* → sin cambios
```

### 2. Secciones y contenedores (en `global.css`)

```css
/* antes → después */
.section      { @apply py-20 px-4; }                   /* → py-14 px-4 md:py-20 lg:py-24 md:px-6 */
.container-xl { @apply max-w-[1440px] mx-auto px-16; } /* → px-4 sm:px-6 md:px-10 lg:px-16 */
.container-lg { @apply max-w-[1200px] mx-auto px-8; }  /* → px-4 sm:px-6 md:px-8 */
```

### 3. Patrón para tamaños hardcodeados (los ~125 `text-[NNpx]`)

Regla de migración, en orden de preferencia:

1. **Reemplazar por el token más cercano** (`text-heading-lg`, etc.) — ya escala solo tras el punto 1.
2. Si no calza ningún token, usar **arbitrario con clamp**: `text-[clamp(1.5rem,4vw,2.5rem)]`.
3. Padding/márgenes fijos (`px-16`, `py-20`, `gap-16`, `mt-24`…) → **prefijos responsive** (`px-6 md:px-16`) o el token de `.container-*`/`.section` cuando aplique.

**Convenciones:**

- El `max` de cada `clamp` es el tamaño desktop actual → **desktop no cambia**.
- `lineHeight` unitless para que el interlineado acompañe al `clamp`.
- No se tocan `body-md/sm`, `caption-sm` ni colores/tokens de marca.

---

## Plan de implementación

> Cimientos primero (pasos 1–2), luego una pasada por página/grupo (cada uno commiteable y verificable por separado). Tras cada paso: `npm run dev` levanta y no hay overflow horizontal nuevo. QA con el navegador a 375/390/768/1024/1280/1440 px contra las referencias de `references/`.

1. **Cimientos — tipografía.** Convertir `heading-*` y `subtitle-*` a `clamp()` con `lineHeight` unitless en `tailwind.config.mjs` (max = tamaño desktop actual). *Test:* en desktop los títulos se ven idénticos; al reducir a 375px, `h1`/`h2` encogen y no desbordan.

2. **Cimientos — secciones y contenedores.** Hacer responsive `.section`, `.container-xl`, `.container-lg` en `global.css`. *Test:* el padding lateral en mobile deja de ser 64px; en desktop se mantiene.

3. **Shared.** Revisar/ajustar `Footer`, `StickyCards`, slider de testimonios y las primitivas de formulario (`FormControls`/`FormSuccess`). Header ya quedó responsive en specs previos; solo verificar regresión. *Test:* footer coincide con `references/footer.png` en mobile; el slider no desborda.

4. **Home** (`index.astro` + `components/home` + `StatsReact`). Hero, Spline, stats, secciones. *Test:* coincide con `references/mobile.png`; hero sin recorte, stats en columna.

5. **Nosotros** (`nosotros/index.astro` + `components/nosotros`). Hero, misión/visión, valores, timeline, rubros, stats. *Test:* coincide con `nosotros-historia-mob.png` y `rubros-mobile.jpg`; carruseles sin overflow.

6. **Servicios (index)** (`servicios/index.astro` + heros/listados). *Test:* coincide con `servicios-mobile.png`.

7. **Plantilla solución** (`servicios/[solucion].astro` + `HeroSolucionReact`, `CatalogoSoluciones`, `Beneficios`, `CasosDeUso`, `ValorSolucion`). *Test:* coincide con `soluciones-mob.png` / `conectividad-empresarial-mobile.jpg`; grids colapsan a 1 columna.

8. **Plantilla subservicio** (`servicios/[solucion]/[subservicio].astro` + `HeroSubservicioReact` y afines). Sin referencia mobile → por criterio, coherente con la plantilla solución. *Test:* sin overflow a 375/768; jerarquía intacta.

9. **Soporte técnico** (`soporte-tecnico/index.astro` + `components/soporte`). *Test:* coincide con `soporte-tecnico-mob.png`; canales de soporte en columna.

10. **Contacto** (`contacto/index.astro` + `components/contact` + form `contacto`). *Test:* coincide con `Contacto mobile.png`; formulario a ancho completo, campos legibles.

11. **Blog** (`blog/index.astro` + `blog/[slug].astro` + `components/blog`). *Test:* coincide con `blog-mobile.jpg`; grid de posts 1 columna, detalle con medidas de lectura correctas.

12. **Casos de éxito** (`casos-de-exito/index.astro` + `components/casos-de-exito`). *Test:* coincide con `casos-de-exito-mob.jpg`.

13. **Formas de pago** (`formas-de-pago/index.astro` + `components/formas-de-pago`). *Test:* coincide con `Formas de pago mobile.jpg`.

14. **Reclamos + formularios dinámicos** (`reclamos/index`, `reclamo`, `queja`, `apelacion` + `dynamic-form/DynamicFormReact` + estilos inline de `components/reclamos`). Sin referencia mobile → por criterio, apoyándose en `references/formularios.png`. *Test:* formularios usables a 375px; sin campos cortados ni desbordes por `style` inline.

15. **Legales + información de abonados** (`legales/libro-reclamaciones`, `derechos-arco`, `tratamiento-datos`, `informacion-abonados`). Sin referencia mobile → por criterio (tema claro, ancho de lectura). *Test:* texto legible a 375px, sin overflow, tablas/listas contenidas.

16. **QA final + build.** Repaso a 375/390/768/1024/1280/1440 en todas las rutas; `astro build` sin errores. Screenshots de QA (mobile + una tablet) en `.playwright-screens/`. *Test:* checklist de aceptación completo en verde.

---

## Criterios de aceptación

- [ ] `npm run dev` y `astro build` terminan sin errores ni warnings nuevos.
- [ ] **Sin scroll horizontal** en ninguna ruta a 375, 390, 768, 1024, 1280 y 1440 px.
- [ ] Los `heading-*`/`subtitle-*` escalan con `clamp()`: a 375px ningún título desborda ni se corta.
- [ ] `.section` y `.container-*` usan padding responsive; en mobile el padding lateral no es de 64px.
- [ ] Ningún tamaño de fuente hardcodeado (`text-[NNpx]`) queda fijo en un valor grande en mobile: todos migraron a token o `clamp`.
- [ ] Grids multicolumna (stats, cards, listados, casos, formas de pago, catálogo) **colapsan a 1 columna** en mobile sin apretujarse.
- [ ] Carruseles (rubros, testimonios) no desbordan el viewport en mobile y conservan drag/arrows.
- [ ] Formularios (`contacto`, reclamos, dinámicos con `style` inline) son usables a 375px: campos a ancho completo, sin cortes.
- [ ] Cada página con referencia mobile en `references/` coincide razonablemente con ella (home, nosotros, servicios, soporte, soluciones, blog, casos, contacto, formas de pago, rubros, footer).
- [ ] Tablet (768/1024) se ve equilibrado por criterio, sin huecos ni elementos gigantes.
- [ ] **Regresión desktop:** a ~1440px (ancho nativo del diseño) el sitio se ve idéntico al actual; el rango laptop (1024–1439) solo se ajustó donde estaba roto/desproporcionado, sin rediseño.
- [ ] No se modificó el schema de TinaCMS ni el contenido de `src/content/`.
- [ ] Hay screenshots de QA (mobile + una tablet) en `.playwright-screens/`.

## Decisiones

- **Sí:** cimientos primero con `clamp()`. El `max` = tamaño desktop actual garantiza cero regresión en desktop y arregla de una los `h1`–`h6` y los pocos usos de token. El usuario lo aprobó.
- **No:** variantes `md:`/`lg:` explícitas para toda la tipografía. Más verboso y con saltos bruscos entre breakpoints; `clamp()` escala fluido.
- **Sí:** un solo spec para todas las páginas, cada página como paso commiteable. El usuario lo eligió sobre dividir en dos.
- **Sí:** breakpoints estándar de Tailwind (sm 640 / md 768 / lg 1024 / xl 1280) y QA a 375/390/768/1024/1280/1440. Ya es lo que asume el proyecto.
- **Sí:** tablet por criterio (interpolando desktop↔mobile). No existen referencias de tablet y crearlas queda fuera de alcance.
- **Sí:** páginas sin referencia mobile (subservicio, reclamos, legales, información de abonados) se resuelven por criterio, apoyándose en las referencias afines (`formularios.png`, plantilla solución). El usuario confirmó incluirlas.
- **Sí:** línea de regresión "idéntica" en ~1440px; laptop (1024–1439) puede ajustarse. Coherente con que el usuario reporta que laptop hoy tiene errores.
- **No:** rediseñar layouts o jerarquía. Esto es adaptación responsive, no rediseño; cualquier rediseño va en su propio spec.
- **No:** tocar el schema/contenido de Tina. El responsive es de presentación, no de datos.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Componentes con `style={{…}}` inline (reclamos/formularios) no aceptan clases responsive de Tailwind. | Migrar esos `style` inline a clases utilitarias, o usar `clamp()` dentro del propio `style`. Se aborda en los pasos 3, 10 y 14. |
| `clamp()` con `lineHeight` unitless cambia sutilmente el interlineado en desktop y rompe una composición ajustada. | El `max` iguala el tamaño actual; QA de regresión a 1440 en el paso 16. Ajuste puntual del ratio si alguna sección lo requiere. |
| La pasada por ~15 grupos de páginas es larga y arriesga regresiones cruzadas. | Cada página es un commit independiente; los cimientos (pasos 1–2) se validan antes de tocar páginas. |
| Staleness del JIT de Tailwind con clases nuevas (memoria del proyecto). | Reiniciar el dev server y correr `astro build` desde la raíz ante cualquier clase que no aplique. |
| Overflow por elementos de ancho fijo (imágenes, Spline, tablas, iframes). | `max-w-full`/`overflow-x-auto` contenido por elemento; verificación explícita de "sin scroll horizontal" en aceptación. |
| Tablet sin referencia puede quedar subjetivo. | Criterio documentado (interpolar desktop↔mobile); QA a 768 y 1024 en el paso 16. |

## Qué **NO** entra en este spec

- Rediseñar layouts, jerarquía o composición de cualquier página.
- Nuevas secciones, features o cambios de contenido/copys.
- Cambios en el schema o el contenido de TinaCMS.
- Crear referencias de diseño de tablet.
- Accesibilidad más allá de los controles a11y ya existentes.
- Rehacer la escala tipográfica desde cero o migrar tokens a Tina.

Cada uno de estos, si aterriza, va en su propio spec.
