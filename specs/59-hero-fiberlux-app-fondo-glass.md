# SPEC 59 — Hero fiberlux-app: fondo responsive estilo hero de solución

> **Estado:** Aprobado
> **Depende de:** SPEC 37 (página fiberlux-app), SPEC 46 (hero de solución imagen/form), SPEC 50 (subservicios hero fondo imagen), SPEC 44 (assets app)
> **Fecha:** 2026-07-22
> **Objetivo:** Rediseñar el hero de `/fiberlux-app` para usar 3 imágenes responsive de fondo (mobile/tablet/desktop) con el mismo tratamiento del hero de las páginas de solución (imagen a sangre + degradé de contraste), manteniendo el texto y botones de descarga editables encima.

---

## Por qué este spec existe

El hero actual de `/fiberlux-app` arma la escena con un backdrop genérico (`hero-img.png`) + una columna derecha con el mockup del teléfono. El cliente entregó 3 imágenes ya diseñadas (teléfono sobre escritorio con luz magenta, lado izquierdo oscuro para el copy), una por breakpoint, y quiere que el banner se vea como el hero de las páginas de solución (ej. Conectividad Empresarial): imagen a sangre de fondo, degradé oscuro a la izquierda para legibilidad del copy, y fade inferior para fundir con la sección de abajo. Además entregó los links reales de descarga (Google Play y App Store) que hoy están en `#`.

---

## Scope

**In:**

- Reemplazar el fondo del hero (`HeroFiberluxAppReact`) por las 3 imágenes responsive a sangre (cover), art-directed por breakpoint vía `<picture>` con `media`:
  - `images/fiberlux-app/banner-app-300.png` → mobile (≤600px)
  - `images/fiberlux-app/banner-app-600.png` → tablet (601–1024px)
  - `images/fiberlux-app/banner-app.png` → desktop (>1024px)
- Quitar la columna derecha del mockup (la foto ya incluye el teléfono): el hero pasa a **imagen full-bleed + copy a la izquierda** (una sola columna).
- Aplicar el **tratamiento del hero de solución** (`HeroSolucionReact`, modo imagen, SPEC 46/50): sección `-mt-16` con `min-h` (≈560/620px), degradé oscuro `linear-gradient(90deg, #0a0a0a → transparent)` a la izquierda en desktop (vertical en mobile) para legibilidad, y fade inferior a `#0a0a0a` para fundir con la siguiente sección. Sin glass ni card.
- Mantener el contenido editable del CMS (`heading`, `description`, `note`, `downloads`).
- **Apuntar los botones de descarga** a las tiendas (en `src/content/fiberlux-app/index.json`):
  - App Store → `https://apps.apple.com/pe/app/fiberlux-app/id6754546726`
  - Google Play → `https://play.google.com/store/apps/details?id=com.fiberlux.app&hl=es_PE`

**Out of scope (futuro):**

- Editabilidad de las 3 imágenes desde Tina (van como assets estáticos, igual que el backdrop actual `hero-img.png`).
- Cambiar el `BannerApp` de home/nosotros (su `androidUrl`/`iosUrl` siguen vacíos; se pueden llenar aparte).
- Cambiar `hero.mockup` o su uso en otros componentes.
- Rediseñar el resto de la página `/fiberlux-app` (beneficios, casos de uso, etc.).
- Agregar breadcrumb (el hero de solución lo tiene por estar bajo `/soluciones`; fiberlux-app no lo lleva).

---

## Data model

No hay colección ni campo nuevo. Solo se rellenan URLs existentes en `src/content/fiberlux-app/index.json`:

```
hero.downloads[0] (store: "appstore")   url: "#" → "https://apps.apple.com/pe/app/fiberlux-app/id6754546726"
hero.downloads[1] (store: "googleplay") url: "#" → "https://play.google.com/store/apps/details?id=com.fiberlux.app&hl=es_PE"
```

Las 3 imágenes son assets estáticos ya presentes en `public/images/fiberlux-app/` (no van al CMS).

---

## Implementation plan

1. **Fondo responsive full-bleed.**
   En `HeroFiberluxAppReact.tsx`, reemplazar el `div` de `backgroundImage: hero-img.png` por un `<picture>` con 3 `<source media>` (600 / 1024) e `<img>` fallback = `banner-app.png`, con `object-cover` a sangre cubriendo el `<section>`. Añadir `min-h-[560px] lg:min-h-[620px]` a la sección. Prueba manual: en mobile/tablet/desktop se carga la imagen correspondiente y cubre a sangre.

2. **Una sola columna: quitar el mockup derecho.**
   Eliminar la columna derecha (`RIGHT — app mockup` con su glow y `mockupSrc`) y el grid de 2 columnas; el contenido (heading/description/note/downloads) queda en una columna a la izquierda (`max-w-[560px]`). Prueba manual: no hay mockup duplicado; el copy queda a la izquierda.

3. **Degradés estilo hero de solución.**
   Replicar los overlays de `HeroSolucionReact` (modo imagen): degradé horizontal oscuro a la izquierda en desktop (`linear-gradient(90deg, #0a0a0a 0%, rgba(10,10,10,0.85) 30%, rgba(10,10,10,0.35) 56%, transparent 82%)`), degradé vertical en mobile, y fade inferior (`h-48`, a `#0a0a0a`) para fundir con la sección siguiente. Prueba manual: el copy se lee bien sobre la foto y el borde inferior se funde sin corte.

4. **Links de descarga.**
   En `src/content/fiberlux-app/index.json`, poner las URLs de App Store y Google Play en `hero.downloads[0].url` y `hero.downloads[1].url`. Prueba manual: los botones abren las tiendas correctas.

---

## Acceptance criteria

- [ ] En ≤600px se muestra `banner-app-300.png`; en 601–1024px `banner-app-600.png`; en >1024px `banner-app.png`.
- [ ] La imagen va a sangre (cover) cubriendo el hero y el texto/CTA queda a la izquierda, legible.
- [ ] No hay una columna/mockup de teléfono separada (la foto ya lo incluye).
- [ ] El hero tiene el mismo tratamiento que el hero de solución: degradé oscuro a la izquierda + fade inferior que funde con la sección de abajo (sin glass ni card).
- [ ] El botón de App Store abre `https://apps.apple.com/pe/app/fiberlux-app/id6754546726`.
- [ ] El botón de Google Play abre `https://play.google.com/store/apps/details?id=com.fiberlux.app&hl=es_PE`.
- [ ] El contenido (heading/description/note/labels) sigue siendo editable desde Tina.
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** el banner objetivo es el **hero de `/fiberlux-app`** (`HeroFiberluxApp`), no el `BannerApp` de home/nosotros.
- **Sí:** efecto = **tratamiento del hero de solución** (`HeroSolucionReact`, modo imagen, SPEC 46/50): imagen a sangre + degradé de contraste + fade inferior. **NO** es el glass del slider (SPEC 55).
- **Sí:** las 3 imágenes son **fondo** y el texto/CTA va encima (el lado oscuro de la foto es el espacio del copy).
- **Sí:** breakpoints 600 / 1024; mapeo `banner-app-300` → mobile, `banner-app-600` → tablet, `banner-app.png` → desktop.
- **Sí:** las imágenes van **hardcodeadas** como assets (no CMS), igual que el backdrop actual.
- **No:** tocar el `BannerApp` de home/nosotros en este spec.
- **Sí:** el link de App Store usa la región `/pe/` (Perú).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Poco contraste del texto según la zona de la foto | Degradé oscuro a la izquierda (como el hero de solución) sobre la columna del copy. |
| Las 3 imágenes con relaciones de aspecto distintas recortan mal en algún breakpoint | `object-cover` + `object-position` ajustado por breakpoint; se afina contra las 3 imágenes reales. |
| El borde inferior de la foto corta en seco contra la sección de abajo | Fade inferior a `#0a0a0a` (como el hero de solución en desktop). |

---

## Lo que **no** está en este spec

- Editabilidad de las 3 imágenes desde Tina.
- El `BannerApp` de home/nosotros.
- El `hero.mockup` y su uso en otros componentes.
- El resto de secciones de `/fiberlux-app`.

Cada uno, si aterriza, va en su propio spec.
