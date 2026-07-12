# SPEC 20 — Renombrar "Servicios" a "Soluciones" (visible + rutas)

> **Estado:** Implementado
> **Depende de:** SPEC 09 (menú desplegable del header), SPEC 10 (página `/servicios`), SPEC 11 (plantilla solución), SPEC 12 (plantilla subservicio). Toca su superficie visible y sus rutas.
> **Fecha:** 2026-07-12
> **Objetivo:** Renombrar en todo el sitio el concepto de navegación "Servicios" a "Soluciones" —etiquetas visibles y rutas públicas (`/servicios` → `/soluciones`)— dejando intactos los identificadores internos, el copy natural y la categoría propia "Servicios gestionados".

---

## Por qué existe este spec

El sitio usa "Servicios" como nombre del concepto de navegación (ítem de menú, breadcrumbs, H1 de la landing), pero la marca ya se comunica en términos de "Soluciones" en varias secciones ("Nuestras soluciones", plantilla `[solucion]`, componentes `HeroSolucion`). Este spec unifica la capa visible y las rutas hacia "Soluciones", sin reescribir los identificadores internos del código (que ya conviven con ambas palabras) ni el copy en lenguaje natural donde "servicio" es gramaticalmente correcto.

---

## Alcance

**Dentro:**

- **Etiquetas visibles del concepto de navegación** → "Soluciones":
  - Ítem de menú del header "Servicios" y su columna en el footer (`src/content/global/index.json`: `nav[].text` y la columna de footer con `title: "Servicios"`).
  - Breadcrumbs "Servicios": el texto del CMS `servicios.breadcrumb` (`src/content/servicios/index.json`) y el texto hardcodeado "Servicios" en `src/components/servicios/HeroSolucionReact.tsx` y `src/components/servicios/HeroSubservicioReact.tsx`.
  - Título de página / SEO donde "Servicios" es el nombre de sección: `title="Servicios"` en `src/pages/servicios/index.astro`, y el fallback `"Servicios"` en `src/pages/servicios/[solucion].astro`.
  - H1 e intro de la landing: `servicios.heading` "Conoce nuestros servicios" → "Conoce nuestras soluciones", y ajuste de la meta-description de `index.astro` que arranca con "Conoce nuestros servicios".
- **Rutas públicas** `/servicios` → `/soluciones` (solo el segmento base; los slugs de categoría/subservicio **no** cambian):
  - Renombrar el directorio `src/pages/servicios/` → `src/pages/soluciones/` (con `index.astro`, `[solucion].astro`, `[solucion]/[subservicio].astro`).
  - Actualizar **todas** las URLs `/servicios...` en `src/content/global/index.json` (nav + footer, ~60 enlaces) a `/soluciones...`.
  - Actualizar los enlaces internos hardcodeados a `/servicios` en componentes (`HeroSolucionReact.tsx` `serviciosHref` y su breadcrumb, breadcrumb de `HeroSubservicioReact.tsx`, y cualquier `<a href="/servicios">`).
  - **Redirects 301** de `/servicios` y `/servicios/*` → equivalente en `/soluciones/*`, vía la opción `redirects` de `astro.config.mjs` (sitio SSG, sin adapter).
- **QA:** el nav muestra "Soluciones", la landing carga en `/soluciones`, las páginas de categoría y subservicio cargan en `/soluciones/...`, las URLs viejas `/servicios/*` redirigen sin 404, y "Servicios gestionados" sigue diciendo "Servicios gestionados".

**Fuera de alcance (para futuras specs):**

- **La categoría "Servicios gestionados"** (uno de los 4 pilares): su etiqueta visible y su slug `servicios-gestionados` se mantienen tal cual (es nombre propio de producto). Su URL será `/soluciones/servicios-gestionados`.
- **Copy en lenguaje natural** que usa la palabra "servicio": descripciones de subservicios, blogs ("servicio de internet"), "cancelación de servicio", "suspensión temporal del servicio", etc. No se toca.
- **Identificadores internos:** nombre de la colección Tina `servicios` y su `path`, nombres de archivos/componentes (`HeroServicios.astro`, `ServiciosForm.tsx`…), clases CSS (`servicios-hero-glow`), IDs de ancla (`#contacto-servicios`), tipos/queries generados (`ServiciosQuery`), `formType`/`formSlug` `servicios`. Todo permanece.
- **Labels del panel Tina** (p.ej. "Servicios (página)"): son de admin, no del sitio público. Opcionalmente se pueden alinear, pero no es obligatorio aquí.
- **Redirects a nivel de servidor** (`.htaccess`): se resuelve dentro del repo con Astro; la config del servidor queda fuera.

---

## Modelo de datos

Esta spec **no introduce colecciones ni campos nuevos de TinaCMS ni estructuras de estado**. Reutiliza el contenido existente (colección `servicios`, `global`) y solo cambia valores de texto/URL dentro de ese contenido ya modelado.

El único elemento estructural nuevo es la **tabla de redirects** en `astro.config.mjs`:

```js
// astro.config.mjs
export default defineConfig({
  redirects: {
    '/servicios': '/soluciones',
    '/servicios/[...rest]': '/soluciones/[...rest]',
  },
  // integrations: [...] (sin cambios)
});
```

Regla de mapeo de URL: solo el **primer segmento** `servicios` → `soluciones`. Los slugs anidados (`conectividad-empresarial`, `ciberseguridad-gestionada`, `data-center-cloud`, `servicios-gestionados` y todos los subservicios) se conservan idénticos.

---

## Plan de implementación

Cada paso deja el sitio compilando y navegable.

1. **Rutas físicas.** Renombrar el directorio `src/pages/servicios/` → `src/pages/soluciones/` (git mv de `index.astro`, `[solucion].astro`, `[solucion]/[subservicio].astro`). Prueba manual: `npm run dev`, abrir `/soluciones`, `/soluciones/conectividad-empresarial` y un subservicio; cargan sin 404. (En este punto `/servicios` da 404: se resuelve en el paso 5.)

2. **Enlaces internos en componentes.** En `src/components/servicios/`: cambiar `serviciosHref` y el breadcrumb href de `HeroSolucionReact.tsx`, el breadcrumb href de `HeroSubservicioReact.tsx`, y cualquier `href="/servicios"` restante a `/soluciones`. Prueba: los breadcrumbs de una categoría/subservicio enlazan a `/soluciones`.

3. **Etiquetas visibles hardcodeadas.** Cambiar el texto "Servicios" → "Soluciones" en los breadcrumbs de `HeroSolucionReact.tsx` y `HeroSubservicioReact.tsx`, el `title="Servicios"` de `src/pages/soluciones/index.astro` y el fallback `"Servicios"` de `[solucion].astro`. Ajustar la meta-description de `index.astro` ("Conoce nuestros servicios" → "Conoce nuestras soluciones", conservando el resto del copy). Prueba: el `<title>` y los breadcrumbs muestran "Soluciones".

4. **Contenido editable (CMS).** En `src/content/servicios/index.json`: `breadcrumb` "Servicios" → "Soluciones" y `heading` "Conoce nuestros servicios" → "Conoce nuestras soluciones" (mantener `intro`, `ctaLabel`, textos de formulario). En `src/content/global/index.json`: `nav[].text` "Servicios" → "Soluciones", el `title` "Servicios" de la columna de footer → "Soluciones", y reemplazar **todas** las URLs `/servicios` → `/soluciones` (nav + footer). **No** tocar "Servicios gestionados" (label) ni el copy natural. Prueba: el header y footer muestran "Soluciones" y todos sus enlaces apuntan a `/soluciones/...`.

5. **Redirects.** Añadir la tabla `redirects` a `astro.config.mjs` (ver Modelo de datos). Prueba: `npm run build && npm run preview`; navegar a `/servicios` y `/servicios/ciberseguridad-gestionada/waf` redirige a la ruta `/soluciones/...` equivalente.

6. **Barrido de residuos.** Grep de `"/servicios"` y de la etiqueta visible "Servicios" (fuera de "Servicios gestionados") en `src/` para confirmar que no quedan enlaces ni labels sin migrar. Revisar `src/content/home/index.json` por si hay un heading/CTA navegacional "Servicios" (sin tocar títulos de categoría ni copy). Prueba: el grep no arroja enlaces `/servicios` vivos fuera de la tabla de redirects.

---

## Criterios de aceptación

- [x] El ítem de menú del header dice "Soluciones" (no "Servicios").
- [x] La columna equivalente del footer dice "Soluciones".
- [x] La landing carga en `/soluciones` con H1 "Conoce nuestras soluciones".
- [x] `/soluciones/conectividad-empresarial` (categoría) y `/soluciones/conectividad-empresarial/internet-corporativo` (subservicio) cargan sin error.
- [x] Los breadcrumbs de categoría y subservicio muestran "Soluciones" y enlazan a `/soluciones`.
- [x] `/servicios` redirige a `/soluciones`.
- [x] `/servicios/ciberseguridad-gestionada/waf` redirige a `/soluciones/ciberseguridad-gestionada/waf`.
- [x] La categoría sigue mostrándose como "Servicios gestionados" y su URL es `/soluciones/servicios-gestionados`.
- [x] El copy natural (blogs, "cancelación de servicio", descripciones) permanece sin cambios.
- [x] `npm run build` completa sin errores y `grep -rn "\"/servicios" src/` no devuelve enlaces vivos (solo, si acaso, la clave de la tabla de redirects).

---

## Decisiones tomadas y descartadas

- **Sí:** cambiar también las URLs (`/servicios` → `/soluciones`), no solo las etiquetas. Consistencia total entre lo que se ve y la barra de direcciones.
- **Sí:** limitar el rename al "concepto de navegación" (menú, títulos de hero, breadcrumbs, encabezados de sección). Evita frases raras en copy natural ("cancelación de solución").
- **No:** renombrar la categoría "Servicios gestionados" a "Soluciones gestionadas". Es nombre propio de producto (managed services); cambiarlo altera su significado. Su slug `servicios-gestionados` también se conserva.
- **No:** tocar identificadores internos (colección Tina `servicios`, nombres de componentes/archivos, clases CSS, IDs de ancla, queries generadas, `formType`). No son visibles y el código ya convive con ambas palabras; renombrarlos multiplicaría el diff y el riesgo sin beneficio visible.
- **Sí:** redirects vía `astro.config.mjs` (`redirects`) en lugar de `.htaccess`. Portable, versionado en el repo y funciona en el build SSG sin depender de la config del servidor.
- **No:** renombrar los slugs de categoría/subservicio. Fuera de alcance y sin pedido; solo cambia el primer segmento de la ruta.

---

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Enlaces externos/SEO antiguos apuntando a `/servicios/*` | Redirects 301 desde `/servicios` y `/servicios/[...rest]`; se validan en `preview` (criterio de aceptación). |
| Redirects SSG generan páginas meta-refresh (no 301 real si el host no lo soporta) | Aceptable para un sitio estático; si el servidor lo permite, se puede reforzar con `.htaccess` en otra spec (fuera de alcance). |
| Quede un enlace `/servicios` hardcodeado sin migrar → 404 encubierto | Paso 6 (barrido con grep) + los redirects lo atrapan igual, evitando 404 al usuario. |
| Romper accidentalmente "Servicios gestionados" al hacer reemplazos masivos | Los reemplazos de label son dirigidos (no un find/replace global); "Servicios gestionados" está explícitamente fuera de alcance y en criterios de aceptación. |

---

## Lo que **no** entra en este spec

- Renombrar la categoría "Servicios gestionados" ni su slug `servicios-gestionados`.
- Cambiar copy en lenguaje natural donde "servicio" es correcto (blogs, descripciones, solicitudes de cancelación/suspensión).
- Renombrar identificadores internos: colección Tina, componentes, archivos, clases CSS, IDs de ancla, tipos/queries, `formType`/`formSlug`.
- Redirects a nivel de servidor (`.htaccess`) y labels del panel Tina.

Cada uno, si algún día se decide, va en su propio spec.
