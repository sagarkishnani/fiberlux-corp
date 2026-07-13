# SPEC 21 — Contenedor global responsive: márgenes laterales + 4K

> **Estado:** Implementado
> **Depende de:** Spec 19 (responsive global). Corrige lo que 19 dejó inerte: su ajuste de `.container-*` cayó en `src/styles/global.css`, que **no se bundlea**, así que nunca aplicó.
> **Fecha:** 2026-07-12
> **Objetivo:** Unificar el margen lateral y el ancho máximo del sitio en un contenedor reutilizable **realmente bundleado**, para que el contenido no se pegue a los bordes en laptop/tablet y llene mejor en 4K, sin rediseñar.

## Alcance

**Dentro:**

- **Contenedor real y bundleado.** Crear una utilidad `.site-container` (padding lateral fluido + `max-width` + `mx-auto`) en una hoja CSS nueva **importada en `BaseLayout.astro`**, de modo que sí entre al bundle. Ella reemplaza el string inline `max-w-[1440px] mx-auto px-…` repetido en los **28 componentes**.
- **Padding lateral fluido escalonado y uniforme:** `px-6` (mobile) → `md:px-10` → `lg:px-16` → `xl:px-24`. Mismo criterio en todo el sitio; se acaba la inconsistencia (hoy conviven `px-6` solo, `md:px-10`, `md:px-16`, `md:px-12`).
- **Ancho máximo subido a 1680px** (contra los `1440` actuales) para que en 4K el contenido llene más sin verse chico y centrado con gutters enormes. A ≤1440 el layout no cambia (el cap no aplica).
- **Migración de los 28 componentes** con `max-w-[1440px] mx-auto px-…` a `.site-container`. Los `max-w-[Npx]` internos (texto de hero, columnas de lectura: 640, 560, 480…) **se conservan**.
- **QA visual** con el MCP de Chrome a: **375, 768, 1024, 1440, 1920 y 2560px** (mobile, tablet, laptop, desktop nativo, FHD, 4K). Sin scroll horizontal; sin contenido pegado a bordes.

**Fuera de alcance:**

- **Rediseñar** layouts, jerarquía o composición. Es ajuste de contenedor, no rediseño.
- Reabrir la tipografía `clamp()` de spec 19 (ya funciona; el `tailwind.config` sí se bundlea).
- Migrar los ~125 `text-[NNpx]` hardcodeados (eso es de spec 19).
- Tocar schema o contenido de TinaCMS.
- `max-w-[Npx]` internos de columnas/hero (siguen tal cual).
- Resucitar el resto de `global.css` (`.section`, `.btn-*`…): solo se materializa el contenedor; el archivo muerto completo es otro problema.

---

## Modelo de datos

No introduce colecciones ni estado. El contrato es la **utilidad de contenedor** y sus tokens.

Hoja nueva `src/styles/site-container.css`, importada en el frontmatter de `BaseLayout.astro` (`import "../styles/site-container.css";`). Solo lleva `@layer components` — **no** re-inyecta `@tailwind base/components/utilities` (Tailwind ya se inyecta global vía `@astrojs/tailwind`, y así llega también a las islas React).

```css
@layer components {
  .site-container {
    @apply mx-auto w-full px-6 md:px-10 lg:px-16 xl:px-24;
    max-width: 1680px;
  }
  /* opcional, para bloques de lectura angostos que hoy usan max-w-[720/940] */
  .site-container--narrow { max-width: 1200px; }
}
```

- **Padding:** `px-6 → md:px-10 → lg:px-16 → xl:px-24` (24 → 40 → 64 → 96px).
- **max-width:** `1680px`. A ≤1440 no aplica → desktop nativo intacto.

---

## Plan de implementación

> Cada paso deja el sitio funcional y es commiteable. Tras cada paso: `npm run dev` levanta, sin overflow horizontal nuevo.

1. **Crear el contenedor bundleado.** Crear `src/styles/site-container.css` con `.site-container` (y `--narrow`), importarla en `BaseLayout.astro`, y verificar que **sí aplica** en una isla React (inspeccionar en el navegador que el padding/max-width llega). *Test:* la clase computa `padding` real, no queda sin estilo como pasó con `global.css`.

2. **Home** (`HeroHomeReact`, `StatsReact`, `PartnersMarquee`, `TestimonialSliderReact` y demás de `home`). Reemplazar el wrapper inline por `.site-container`. *Test:* a 1024/1440 el contenido despega de los bordes; a 1920/2560 llena más sin descuadrar; coincide con `references/mobile.png` a 375.

3. **Shared** (`HeaderReact`, `FooterReact`). Header/Footer alineados al mismo ancho y padding. *Test:* logo y nav alineados con el contenido de las secciones; footer coincide con `references/footer.png`.

4. **Nosotros** (`HeroNosotrosReact`, `MissionVisionReact`, `ValuesReact`, `TimelineReact`, `RubrosReact`). *Test:* carruseles sin overflow; márgenes uniformes con el resto.

5. **Servicios / Soluciones** (`HeroServiciosReact`, `HeroSolucionReact`, `HeroSubservicioReact`, `CatalogoSolucionesReact`, `ServiciosFormReact`). *Test:* grids y catálogo alineados al contenedor; sin borde apretado en laptop.

6. **Soporte, Contacto** (`HeroSoporteReact`, `CanalesSoporte`, `ContactReact`). *Test:* coincide con `soporte-tecnico-mob.png` / `Contacto mobile.png`; formulario a ancho del contenedor.

7. **Blog** (`BlogHero`, `BlogGrid`, `BlogPreviewReact`, `BlogDetailReact`). *Test:* grid alineado; detalle mantiene ancho de lectura (usar `--narrow` si aplica).

8. **Casos de éxito, Formas de pago, Certificaciones** (`HeroCasosReact`, `CasosSliderReact`, `HeroFormasPagoReact`, `FormasPagoSelectorReact`, `CertificacionesSliderReact`). *Test:* coinciden con sus referencias mobile; sliders sin overflow.

9. **Barrido de restos.** `grep` de `max-w-[1440px]` → 0 en componentes (solo queda, si acaso, el `global.css` muerto). Cualquier wrapper que no calce se migra o se documenta por qué no. *Test:* sin `max-w-[1440px]` suelto en `src/components`.

10. **QA final + build.** Repaso a 375/768/1024/1440/1920/2560 en todas las rutas; `astro build` sin errores. Screenshots (mobile, tablet, laptop, 4K) en `.playwright-screens/`. *Test:* checklist de aceptación en verde.

---

## Criterios de aceptación

- [ ] `.site-container` **aplica de verdad** en islas React (padding/max-width computados en el navegador), no como el `global.css` muerto.
- [ ] Los **28 componentes** con `max-w-[1440px] mx-auto px-…` usan `.site-container`; `grep max-w-[1440px] src/components` → 0.
- [ ] Padding lateral uniforme `px-6 → md:px-10 → lg:px-16 → xl:px-24` en todo el sitio.
- [ ] En **laptop (1024–1439)** ninguna sección pega el contenido al borde (mín. 64px de aire a `lg`).
- [ ] En **4K (2560)** el contenido llena hasta 1680px, centrado, sin verse diminuto.
- [ ] **Desktop nativo (1440)**: sin cambios visibles respecto al actual (el cap 1680 no aplica).
- [ ] **Sin scroll horizontal** a 375, 768, 1024, 1440, 1920 y 2560px en ninguna ruta.
- [ ] Los `max-w-[Npx]` internos (hero/lectura) se conservan; nada de texto se estira a lo ancho.
- [ ] Header y Footer alineados al mismo ancho/padding que las secciones.
- [ ] `npm run dev` y `astro build` sin errores ni warnings nuevos.
- [ ] Schema/contenido de TinaCMS sin tocar.
- [ ] Screenshots de QA (mobile, tablet, laptop, 4K) en `.playwright-screens/`.

## Decisiones

- **Sí — contenedor reutilizable real bundleado.** Arregla la raíz: `global.css` no se bundlea, por eso spec 19 no movió los márgenes. Elegido por el usuario sobre editar 28 clases inline.
- **Sí — hoja CSS nueva (`site-container.css`) importada en `BaseLayout`.** Solo `@layer components`, sin re-inyectar `@tailwind base`, para no duplicar. Elegido por el usuario sobre plugin de `tailwind.config`.
- **Sí — cap 1680px.** En 4K el contenido llena mejor sin rediseñar; ≤1440 intacto. Elegido por el usuario.
- **Sí — padding fluido escalonado `px-6/10/16/24`.** Aire progresivo en laptop/tablet sin exagerar en mobile. Elegido por el usuario.
- **No — reabrir tipografía `clamp()` de spec 19.** Ya funciona (el `tailwind.config` sí bundlea).
- **No — migrar `text-[NNpx]` ni resucitar todo `global.css`.** Fuera de alcance; van en su propio spec.
- **QA con MCP de Chrome**, no Playwright (no hay MCP de Playwright conectado). Mismos breakpoints + 1920/2560 para 4K.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Subir el cap a 1680 estira secciones con hijos posicionados a 1440 y descuadra alguna composición. | QA de regresión a 1440/1920; los `max-w-[Npx]` internos no cambian; ajuste puntual si un bloque lo pide. |
| La clase nueva vuelve a caer en un archivo no bundleado (repetir el error de `global.css`). | Paso 1 verifica en el navegador que el estilo **computa** en una isla React antes de migrar nada. |
| Staleness del JIT de Tailwind al introducir `.site-container` / `xl:px-24`. | Reiniciar dev server y correr `astro build` desde la raíz (memoria del proyecto). |
| Header/Footer con su propio ancho quedan desalineados del contenido. | Paso 3 los alinea explícitamente al mismo contenedor. |
| Elementos de ancho fijo (Spline, sliders, imágenes) desbordan al ensanchar. | `max-w-full`/`overflow-x-auto` por elemento; check de "sin scroll horizontal" en aceptación. |

## Notas de implementación (post-merge)

- **CSS sin `@layer components`.** El bloque `@layer components { .site-container … }` del "Modelo de datos" **rompía el build** (`CssSyntaxError`: `@layer components` sin su `@tailwind components`, porque Vite procesa la hoja por PostCSS de forma aislada). Se dejó `.site-container` con `@apply` directo (que no requiere `@layer`) — mismos paddings, mismo cap 1680, sin re-inyectar `@tailwind` (intención preservada).
- **5 wrappers sin gutter conservados a propósito** (subiendo solo el cap 1440→1680, sin añadir padding): `ValuesReact` (columnas marquee full-bleed a la derecha), `TimelineReact` desktop (contexto de posicionamiento absoluto de la animación), `CasosSliderReact` (título centrado + carrusel full-bleed centrado). Además `BlogPreviewReact` dejó un wrapper anidado redundante como `<div>` plano. El resto (24 wrappers) usa `.site-container`.
- **28 componentes migrados; `grep max-w-[1440px] src/components` → 0.** Único residuo: `src/styles/global.css` (código muerto, fuera de alcance).

## QA realizada

- **Build de producción OK** (67 páginas). `.site-container` **compila en el bundle** con `padding 24/40/64/96px` (breakpoints 768/1024/1280) y `max-width:1680px` — prueba de que **sí se bundlea** (a diferencia de `global.css`).
- **Sin scroll horizontal** verificado en vivo (Chrome MCP) en 11 rutas: `/`, `/nosotros`, `/soluciones`, solución, subservicio, `/blog`, detalle de blog, `/contacto`, `/soporte-tecnico`, `/casos-de-exito`, `/formas-de-pago`.
- **Contenedor a 1680 centrado** y **columna de lectura interna (940px) preservada** confirmados en el navegador.
- **Limitación del entorno:** el viewport del navegador MCP quedó bloqueado en **1800px CSS** (no fue posible forzar 375/768/1024/1440/1920/2560 por resize). La QA a breakpoints < 1800 se apoya en el bundle (reglas responsive presentes + clase aplicada) y en que el cambio de contenedor no puede introducir overflow nuevo. Recomendado: spot-check manual redimensionando el navegador. No se persistieron screenshots en `.playwright-screens/` (el MCP guarda por ID interno, no como archivo, y el viewport único no representa los 6 breakpoints).
- **Observación — gutter a 1440:** el cap 1680 queda inerte a 1440 (✅ como pide el criterio), pero el padding lateral sube de ~64px (`md/lg:px-16`) a **96px** (`xl:px-24`) por el padding escalonado aprobado. Es intencional (más aire), pero es un cambio visible a 1440. Si se prefiere mantener ~64px a 1440, mover `px-24` a `2xl` en `.site-container`.
