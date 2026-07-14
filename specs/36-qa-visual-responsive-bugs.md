# SPEC 36 — QA visual responsive: pasada de bugs en todo el sitio

> **Estado:** Implementado
> **Depende de:** SPEC 19 (cimientos responsive con `clamp()` — se asume ya implementado; esta pasada es correctiva, no rehace cimientos). Roza transversalmente las regresiones introducidas por SPEC 20–35 (rename soluciones, sliders nuevos, header topbar, preloader 3D).
> **Fecha:** 2026-07-14
> **Objetivo:** Hacer una pasada de QA visual en laptop, tablet y mobile por todas las páginas del sitio y **corregir los bugs funcionales de responsive** (scroll bloqueado, overflow horizontal, elementos cortados/solapados, márgenes/padding rotos, grids que no colapsan, carruseles que desbordan), empezando por el scroll bloqueado del Home en mobile — sin re-tunear tamaños que ya funcionan ni rediseñar.

## Resultado de la implementación (2026-07-14)

QA en vivo con navegador headless (Playwright) a 375/390/768/1024/1280/1440 px sobre las 17 rutas + componentes compartidos.

- **P0 (scroll bloqueado del Home en mobile): confirmado y corregido.** Causa raíz: `SitePreloader` fijaba `html.style.overflow = "hidden"` al cargar y solo lo restauraba en el cleanup del `useEffect`, pero el componente **nunca se desmonta** (solo renderiza `null` vía `setHidden`), así que el cleanup no corría y el overflow quedaba bloqueado **permanentemente** en la primera visita de la sesión. En desktop no se notaba porque Lenis hace scroll programático (que ignora `overflow:hidden`); en mobile el scroll táctil es nativo y sí quedaba bloqueado. Fix: liberar el overflow explícitamente en `finish()` (más red de seguridad en cleanup), de forma idempotente. Verificado: en mobile el overflow queda `visible`, el preloader sigue revelando bien y desktop no cambia.
- **Resto del sitio (steps 2–15): sin bugs funcionales.** Ninguna ruta presenta scroll horizontal, cortes, solapes que tapen contenido, grids sin colapsar, carruseles desbordados ni formularios cortados a 375px (form de reclamo: 23 campos, 0 desbordando). Los cimientos de SPEC 19 y los specs 20–35 (construidos responsive) se sostienen. Screenshots de QA en `.playwright-screens/`.
- **Build:** `astro build` OK (67 páginas, sin errores). Único cambio de código en todo el spec: `src/components/shared/SitePreloader.tsx`.

## Alcance

**Dentro:**

- **Prioridad 0 — Scroll bloqueado del Home en mobile.** Diagnosticar y arreglar que en `/` no se pueda scrollear hacia abajo en mobile. Sospechoso principal: `SitePreloader.tsx` bloquea `html.style.overflow = "hidden"` durante la carga del 3D y solo lo libera con `fbx:hero-scene-loaded` o el tope de 6s; posible interacción con Lenis y el hero `100svh`. Se confirma en vivo con el navegador.
- **Pasada de QA por todas las rutas públicas**, cada grupo un paso commiteable, buscando y corrigiendo **bugs funcionales** en los 3 tamaños:
  - `/` (Home), `/nosotros`, `/soluciones` (index), plantilla `/soluciones/[solucion]`, plantilla `/soluciones/[solucion]/[subservicio]`, `/soporte-tecnico`, `/contacto`, `/blog` + `/blog/[slug]`, `/casos-de-exito`, `/formas-de-pago`, `/reclamos` (selector) + `/reclamos/reclamo` · `/queja` · `/apelacion`, `/legales/libro-reclamaciones` · `/derechos-arco` · `/tratamiento-datos`, `/informacion-abonados`.
  - También los **componentes compartidos** que aparecen en varias páginas (Header V2 con topbar, Footer, sliders de soluciones / testimonios / certificaciones, rubros, formularios dinámicos con `style` inline).
- **Qué cuenta como "bug funcional" (lo que SÍ se corrige):**
  1. Scroll bloqueado o que no responde (mobile/touch).
  2. Overflow horizontal / scroll lateral en cualquier ruta.
  3. Elementos cortados, recortados o que se salen del viewport.
  4. Elementos solapados que tapan contenido o bloquean interacción (solapes `-mt-*`/`z-*` rotos).
  5. Texto que desborda su contenedor o queda ilegible por tamaño (títulos que rompen el layout).
  6. Márgenes/padding rotos: contenido pegado al borde, o padding fijo desktop (p.ej. 64px) aplicándose en mobile y rompiendo el layout.
  7. Grids multicolumna que no colapsan y se apretujan/desbordan en mobile.
  8. Carruseles/sliders que desbordan el viewport o pierden drag/flechas.
  9. Imágenes / Spline / iframes que desbordan su contenedor.
- **Breakpoints de QA:** 375, 390, 768, 1024, 1280 y 1440 px (mismo set que SPEC 19). Referencias: las de `references/` (mobile) + la captura de Figma del Home **como guía visual aproximada** (proporciones, no valores exactos).

**Fuera de alcance (para futuras specs):**

- **Re-tunear tamaños que ya funcionan** para igualarlos al pixel con Figma. La captura es guía aproximada; si un tamaño encaja y no rompe nada, no se toca aunque difiera unos px del diseño.
- **Rediseñar** layout, jerarquía o composición de cualquier página.
- Rehacer la escala tipográfica o los cimientos `clamp()` (ya son de SPEC 19).
- Nuevas secciones, features o cambios de contenido/copys.
- Cambios en el schema o el contenido de TinaCMS (`src/content/`).
- Crear referencias de diseño de tablet (768/1024 se resuelven por criterio, interpolando desktop↔mobile).
- Accesibilidad más allá de los controles a11y ya existentes.
- Regresión desktop: a ~1440px el sitio se mantiene idéntico; laptop (1024–1439) solo se ajusta donde haya un bug funcional.

---

## Modelo de datos

Esta feature **no introduce colecciones, campos de TinaCMS ni estructuras de estado**, y **no re-define tokens** (eso fue SPEC 19). Es una pasada correctiva de presentación. El único "artefacto de datos" que produce es un **registro de hallazgos de QA** (efímero, no versionado como contenido): una lista de bugs encontrados por ruta × breakpoint que guía los commits. Se materializa como screenshots de QA en `.playwright-screens/` (antes/después de los fixes relevantes), no como archivos en `src/content/`.

Formato del registro de hallazgos (solo para trabajar; no es un entregable de schema):

```
ruta · breakpoint · tipo-de-bug (1–9 del Alcance) · descripción · archivo/componente · estado (abierto/corregido)
```

---

## Plan de implementación

> Prioridad 0 primero (scroll del Home), luego cimientos compartidos, luego una pasada por página/grupo (cada uno commiteable y verificable por separado). Tras cada paso: `npm run dev` levanta, no hay scroll horizontal nuevo y el scroll vertical funciona. QA con el navegador a 375/390/768/1024/1280/1440 px contra las referencias de `references/` + Figma (guía aproximada). Solo se corrigen los 9 tipos de bug del Alcance; los tamaños que ya funcionan no se tocan.

1. **P0 — Scroll bloqueado del Home en mobile.** Reproducir en el navegador a 375/390px. Confirmar la causa (preloader dejando `html.overflow: hidden`, evento `fbx:hero-scene-loaded` que no llega en mobile, interacción con Lenis, o hero `100svh`). Arreglar de forma robusta: garantizar que el overflow **siempre** se libere (incluso si el 3D no carga o el evento no dispara en touch), sin romper el wipe del preloader ni la caza de scroll horizontal. *Test:* en mobile real/emulado se scrollea de arriba a abajo del Home; el preloader sigue cerrando bien; sin scroll horizontal.

2. **Cimientos compartidos.** Verificar/corregir bugs en los componentes que se repiten en todo el sitio: `HeaderV2` (+ topbar empresas/negocios de SPEC 33), `Footer`, y las primitivas de formulario. Comprobar que `.section`/`.container-*` de SPEC 19 no quedaron con padding fijo desktop en algún override posterior. *Test:* header/topbar sin cortes ni overflow a 375; footer coincide con `references/footer.png`; sin padding lateral de 64px en mobile.

3. **Sliders compartidos.** `SolucionesSlider` (SPEC 35), `TestimonialSlider`, `CertificacionesSlider` (SPEC 34) y `Rubros`: que no desborden el viewport en mobile, conserven drag/flechas y hagan snap; revisar el peek de la card siguiente y los solapes `-mt-*`/`z-*` con secciones vecinas. *Test:* los 4 sliders sin overflow horizontal a 375/768; drag y flechas funcionan; sin solapes que corten contenido.

4. **Home** (`index.astro` + `components/home` + `Stats` + `BlogPreview`). Hero `100svh`/Spline, stats, secciones y los solapes negativos entre bloques. *Test:* coincide razonablemente con `references/mobile.png` y la guía de Figma; hero sin recorte, stats en columna, sin solapes rotos, scroll fluido de punta a punta.

5. **Nosotros** (`nosotros/index.astro` + `components/nosotros`). Hero, misión/visión, valores, timeline (SPEC 03/04), rubros (SPEC 05), stats. *Test:* coincide con `nosotros-historia-mob.png` y `rubros-mobile.jpg`; timeline y carruseles sin overflow.

6. **Soluciones (index)** (`soluciones/index.astro`). *Test:* coincide con `soluciones-mob.png`/`servicios-mobile.png`; sin overflow ni grids apretados.

7. **Plantilla solución** (`soluciones/[solucion].astro` + heros/catálogo/beneficios/casos/valor). *Test:* coincide con `conectividad-empresarial-mobile.jpg`; grids colapsan a 1 columna; sin overflow.

8. **Plantilla subservicio** (`soluciones/[solucion]/[subservicio].astro`). Sin referencia mobile → por criterio, coherente con la plantilla solución. *Test:* sin overflow a 375/768; jerarquía intacta; botón "Conocer más" (SPEC 29) usable.

9. **Soporte técnico** (`soporte-tecnico/index.astro` + `components/soporte`). *Test:* coincide con `soporte-tecnico-mob.png`; canales en columna; slider de soluciones (compartido) sin overflow.

10. **Contacto** (`contacto/index.astro` + `components/contact` + form `contacto`). *Test:* coincide con `Contacto mobile.png`; formulario a ancho completo, campos legibles, sin desbordes por `style` inline.

11. **Blog** (`blog/index.astro` + `blog/[slug].astro` + `components/blog`). *Test:* coincide con `blog-mobile.jpg`; grid de posts 1 columna, detalle con ancho de lectura correcto.

12. **Casos de éxito** (`casos-de-exito/index.astro`). *Test:* coincide con `casos-de-exito-mob.jpg`; sin overflow.

13. **Formas de pago** (`formas-de-pago/index.astro`). *Test:* coincide con `Formas de pago mobile.jpg`; bancos/métodos (SPEC 32) sin apretujarse.

14. **Reclamos + formularios dinámicos** (`reclamos/index` + `reclamo`/`queja`/`apelacion` + `DynamicFormReact` + estilos inline). Sin referencia mobile → por criterio, apoyándose en `references/formularios.png`. *Test:* formularios usables a 375px; sin campos cortados ni desbordes por `style` inline.

15. **Legales + información de abonados** (`legales/libro-reclamaciones`, `derechos-arco`, `tratamiento-datos`, `informacion-abonados`). Tema claro (SPEC 16/17). Sin referencia mobile → por criterio (ancho de lectura). *Test:* texto legible a 375px, sin overflow, tablas/listas contenidas.

16. **QA final + build.** Repaso a 375/390/768/1024/1280/1440 en todas las rutas; confirmar scroll vertical y ausencia de scroll horizontal en cada una; `astro build` sin errores. Screenshots de QA (mobile + una tablet) en `.playwright-screens/`. *Test:* checklist de aceptación completo en verde.

---

## Criterios de aceptación

- [ ] En **mobile** (375/390) se puede **scrollear de arriba a abajo del Home** sin quedar bloqueado; el preloader sigue cerrando correctamente.
- [ ] **Sin scroll horizontal** en ninguna ruta a 375, 390, 768, 1024, 1280 y 1440 px.
- [ ] Ningún elemento queda **cortado, recortado o fuera del viewport** en los breakpoints auditados.
- [ ] Ningún **solape** (`-mt-*`/`z-*`) tapa contenido ni bloquea interacción en ninguna ruta.
- [ ] Ningún título/texto **desborda su contenedor** ni rompe el layout en mobile.
- [ ] Ningún contenedor aplica **padding fijo de desktop** (p.ej. 64px lateral) en mobile; el contenido no queda pegado al borde.
- [ ] Los **grids multicolumna** (stats, cards, listados, casos, formas de pago, catálogo) colapsan a 1 columna en mobile sin apretujarse.
- [ ] Los **carruseles/sliders** (soluciones, testimonios, certificaciones, rubros) no desbordan el viewport en mobile y conservan drag/flechas.
- [ ] **Imágenes / Spline / iframes** no desbordan su contenedor en ningún breakpoint.
- [ ] Los **formularios** (contacto, reclamos, dinámicos con `style` inline) son usables a 375px: campos a ancho completo, sin cortes.
- [ ] `npm run dev` y `astro build` terminan **sin errores** ni warnings nuevos.
- [ ] **Regresión desktop:** a ~1440px el sitio se ve idéntico al actual; laptop (1024–1439) solo se ajustó donde había un bug funcional.
- [ ] **No** se re-tunearon tamaños que ya funcionaban solo para igualar Figma; **no** se rediseñó ningún layout; **no** se tocó el schema ni el contenido de Tina.
- [ ] Hay screenshots de QA (mobile + una tablet) en `.playwright-screens/`.

---

## Decisiones tomadas y descartadas

- **Sí:** alcance = **todo el sitio**, cada página/grupo un paso commiteable. El usuario lo eligió sobre limitarse al Home. Se hace tractable porque la profundidad es solo-bugs, no re-tuneo.
- **Sí:** profundidad = **solo bugs funcionales**. El usuario descartó re-tunear tamaños contra Figma. La captura de Figma queda como **guía visual aproximada**, no como contrato de medidas. Esto define el límite que evita una auditoría infinita.
- **No:** fijar medidas exactas del nodo de Figma como contrato. Descartado por el usuario; se usa como referencia proporcional.
- **Sí:** el **scroll bloqueado del Home** es Prioridad 0 y arranca el plan; es el único bug reportado explícitamente y es un bloqueo funcional.
- **Sí:** reutilizar los **breakpoints y referencias de SPEC 19** (375/390/768/1024/1280/1440 + `references/`). Ya es lo que asume el proyecto; no se crean referencias de tablet.
- **Sí:** este spec **depende de SPEC 19** y es **correctivo** (regresiones de SPEC 20–35 + lo que 19 dejó pasar), no rehace cimientos ni la escala `clamp()`.
- **No:** rediseñar layouts/jerarquía ni cambiar contenido/schema. Es adaptación correctiva de presentación; cualquier rediseño va en su propio spec.
- **Definición semi-rápida:** Modelo, Plan, Criterios, Decisiones y Riesgos se redactaron asumiendo defaults razonables tras cerrar las 3 decisiones clave (alcance, uso de Figma, profundidad) por preguntas, a pedido del usuario ("asume el resto y guarda el spec").

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El fix del scroll del Home rompe el wipe del preloader o el prefetch del 3D. | Garantizar la liberación del overflow por varias vías (evento, tope de tiempo, cleanup, listener touch) sin tocar la secuencia de reveal; QA del preloader tras el fix (paso 1). |
| La causa del scroll no es el preloader sino Lenis / hero `100svh` / un ancestro con `overflow`. | Diagnóstico en vivo con el navegador antes de tocar código (medir `html.overflow`, `body` height, y si Lenis está capturando touch) para atacar la causa real, no el síntoma. |
| "Bug funcional vs. re-tuneo de tamaño" es una línea difusa; se termina rediseñando. | Los 9 tipos de bug del Alcance son la definición operativa; si un ajuste no cae en uno de ellos, queda fuera y va a otro spec. |
| La pasada por ~15 grupos de páginas es larga y arriesga regresiones cruzadas. | Cada página/grupo es un commit independiente; P0 y cimientos compartidos (pasos 1–3) se validan antes de tocar páginas individuales. |
| Regresión en desktop al corregir mobile (medidas compartidas sin prefijo de breakpoint). | Los fixes usan prefijos responsive (`md:`/`lg:`) para no tocar ≥1024; QA de regresión a 1440 en el paso 16. |
| Componentes con `style={{…}}` inline (reclamos/formularios) no aceptan clases responsive. | Migrar esos `style` a clases utilitarias o usar `clamp()`/`%` dentro del propio `style`; se aborda en los pasos 10 y 14. |
| Tablet (768/1024) sin referencia queda subjetivo. | Criterio documentado (interpolar desktop↔mobile); QA a 768 y 1024 en el paso 16; solo se corrige lo que sea bug funcional, no estética. |
| Staleness del JIT de Tailwind con clases nuevas (memoria del proyecto). | Reiniciar el dev server y correr `astro build` desde la raíz ante cualquier clase que no aplique. |

---

## Qué **NO** entra en este spec

- Re-tunear tamaños que ya funcionan para igualarlos al pixel con Figma.
- Rediseñar layout, jerarquía o composición de cualquier página.
- Rehacer la escala tipográfica o los cimientos `clamp()` (SPEC 19).
- Nuevas secciones, features o cambios de contenido/copys.
- Cambios en el schema o el contenido de TinaCMS.
- Crear referencias de diseño de tablet.
- Accesibilidad más allá de los controles a11y ya existentes.

Cada uno de estos, si aterriza, va en su propio spec.
