# SPEC 91 — Heros de Nosotros y Casos de éxito con fondo FlowEffect

> **Status:** Implementado
> **Depends on:** commit `e7236e9` (componentes de fondo animado: `FlowEffect`), SPEC 13 (página casos de éxito), SPEC 47 (fondo imagen hero Nosotros)
> **Date:** 2026-08-03
> **Objective:** Reemplazar el fondo de los heros de `/nosotros` y `/casos-de-exito` por el canvas animado `FlowEffect` (gradiente líquido magenta WebGL2), manteniendo la imagen actual como fallback cuando no hay WebGL2.

---

## Scope

**Dentro:**

- Montar `<FlowEffect />` como fondo en `HeroNosotrosReact.tsx` y `HeroCasosReact.tsx` (ambos ya son islas `client:load`, el canvas hidrata con la isla).
- **Capas (z-index):** capa 0 = imagen actual (fallback), capa 0+ = canvas `FlowEffect` `absolute inset-0` encima de la imagen, capa 10 = contenido (breadcrumb, título, texto). Si WebGL2 falla, el canvas no dibuja y queda visible la imagen.
- **Sin overlay** de legibilidad sobre el flow: el texto blanco va directo sobre el canvas (decisión del cliente).
- **Full intensidad:** el canvas a opacidad 100%, shader original (magenta vivo).
- **Desktop y móvil:** el flow corre en todos los anchos (WebGL2 ampliamente soportado; el componente ya pausa fuera de viewport y respeta `prefers-reduced-motion`).
- En `HeroCasosReact`: **retirar** el degradado oscuro izquierdo de legibilidad (era para la imagen; con el flow sin overlay ya no aplica). Conservar la imagen magenta como fallback.
- En `HeroNosotrosReact`: conservar `.hero-nosotros-bg` (imagen circular) como fallback debajo del canvas.
- Verificar que el canvas cubre toda la sección del hero (incluida la zona bajo el header por el `-mt-16`).

**Fuera (para otros specs):**

- Aplicar el flow en otros heros (home, soluciones, soporte, fiberlux-app) u otras secciones.
- Hacer el color/parámetros del flow editables desde el CMS.
- Refactor/arreglo de los warnings de tipos preexistentes de `FlowEffect.tsx` (`canvas`/`gl` possibly null) — el build los tolera; se dejan como están.
- Reintroducir un overlay de legibilidad (se descartó; si luego el texto no se lee, va en otro spec).
- Coordinar `signalReady`/preloader (solo lo usa el hero del home; aquí se omite).

---

## Modelo de datos

**No introduce datos nuevos.** Usa el componente existente `FlowEffect` (sin props de contenido) y las imágenes de fondo ya presentes (`/images/nosotros/circular-gradient-bg.avif` y el backdrop magenta de casos) como fallback. Ningún cambio en schema Tina ni en contenido.

---

## Plan de implementación

1. **Import + montaje en Nosotros.** En `HeroNosotrosReact.tsx` importar `FlowEffect` y renderizarlo `absolute inset-0 z-0` **encima** de `.hero-nosotros-bg` (que se mantiene como fallback) y **debajo** del contenido (`z-10`). Estado: el hero de Nosotros muestra el flow animado, con la imagen de respaldo si no hay WebGL2.

2. **Montaje en Casos.** En `HeroCasosReact.tsx` importar `FlowEffect` y renderizarlo `absolute inset-0 z-0` encima de la imagen backdrop (fallback) y debajo del contenido. **Retirar** el `<div>` del degradado oscuro de legibilidad. Estado: el hero de Casos muestra el flow, sin overlay, imagen de respaldo si no hay WebGL2.

3. **Cobertura del canvas.** Asegurar que `FlowEffect` recibe `className="absolute inset-0 w-full h-full"` y que el `<section>` mantiene `relative overflow-hidden` para recortar el canvas al hero. Verificar la zona bajo el header (por `-mt-16` en ambos). Estado: el flow llena exactamente el área del hero.

4. **Fallback WebGL2.** Confirmar que al fallar el contexto WebGL2 (o forzando su ausencia) el canvas queda transparente y se ve la imagen de fondo debajo, con el texto legible. Estado: degradación correcta sin pantalla negra.

5. **Reduced-motion + viewport.** Verificar que con `prefers-reduced-motion: reduce` el flow queda en frame estático y que al salir del viewport el rAF se pausa (comportamiento ya implementado en `FlowEffect`). Estado: sin animación si el usuario lo pidió; sin gasto de GPU fuera de pantalla.

6. **QA responsive.** Revisar `/nosotros` y `/casos-de-exito` (+ sus `/en`) en desktop, 1024, 768 y móvil: el flow cubre el hero, el texto se lee, no hay scroll horizontal. Estado: correcto en los 4 anchos y en ES/EN.

---

## Criterios de aceptación

- [x] El hero de `/nosotros` muestra el fondo `FlowEffect` animado (magenta líquido) detrás del breadcrumb/título/subtítulo.
- [x] El hero de `/casos-de-exito` muestra el fondo `FlowEffect` animado detrás del breadcrumb/heading/intro, **sin** el degradado oscuro de legibilidad.
- [x] El canvas cubre toda el área del hero (incluida la franja bajo el header) y no genera scroll horizontal.
- [x] Si WebGL2 no está disponible, se ve la imagen de fondo actual como fallback (no pantalla negra) y el texto sigue legible.
- [x] El flow corre en desktop y móvil; fuera de viewport se pausa.
- [x] Con `prefers-reduced-motion: reduce`, el flow queda estático (sin animación).
- [x] `/en/nosotros` y `/en/casos-de-exito` muestran el mismo fondo flow.
- [x] `npm run build` pasa sin errores nuevos.

---

## Decisiones

- **Sí:** el flow **reemplaza** el fondo visible, con la **imagen actual como fallback** debajo del canvas (robusto ante navegadores sin WebGL2).
- **Sí:** **sin overlay** de legibilidad — el texto blanco va directo sobre el flow (pedido del cliente).
- **Sí:** **full intensidad** (canvas opacidad 100%, shader original).
- **Sí:** activo en **desktop y móvil** (WebGL2 soportado; el componente ya pausa fuera de viewport).
- **Sí:** montar `FlowEffect` **dentro** de cada hero React (islas `client:load`) en vez de wrappers Astro nuevos.
- **No:** editabilidad CMS del color/parámetros del flow (fuera de alcance).
- **No:** arreglar los warnings de tipos preexistentes de `FlowEffect.tsx` (el build los tolera).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Legibilidad del texto sobre un flow magenta vivo (sin overlay) | Decisión explícita del cliente. El shader tiene zonas oscuras; si luego no se lee, se añade overlay en otro spec. El fallback (imagen) sí mantiene su contraste natural. |
| Rendimiento WebGL en móviles de gama baja | El componente pausa fuera de viewport y respeta reduced-motion; el hero es una sola instancia por página. |
| El `-mt-16` deja una franja del canvas bajo el header | El canvas es `absolute inset-0` sobre el `<section>` con ese margen negativo, así que cubre la franja; se verifica en QA. |
| Fallback sin overlay en Casos deja el texto sobre imagen clara | Aceptable (caso raro: sin WebGL2). La imagen backdrop tiene zonas oscuras a la izquierda donde va el texto. |
