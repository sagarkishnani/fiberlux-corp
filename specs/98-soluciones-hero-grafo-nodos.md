# SPEC 98 — Hero Soluciones: fondo cinematic (god-rays + iconos de categoría flotantes)

> **Estado:** Implementado
> **Depende de:** SPEC 97 (versión **pre-planeta** del `CinematicBackground` — god-rays WebGL + iconos flotantes + polvo, recuperada del commit `919c5d1`), SPEC 92 (`NodeField`, fallback sin WebGL), SPEC 69/71 (sistema `data-reveal` de animaciones de entrada), SPEC 80 (i18n `_en`/`tField`), SPEC 10 (página soluciones), SPEC 03 (hero Nosotros — referencia de breadcrumb)
> **Fecha:** 2026-08-07
> **Objetivo:** Reemplazar el hero de la página de soluciones (`HeroServicios`, dos columnas con video) por un banner full-bleed a **alto de pantalla** con el fondo "cinematic" del hero home pre-planeta —god-rays morados, tiles con los iconos de las categorías de solución flotando y polvo de luz— y titular/intro/CTA centrados con **animación de entrada escalonada**.

---

## Sección 1 — Por qué existe este spec

El banner anterior (`HeroServicios`, dos columnas: texto + video en loop) no transmitía la energía del hero home. Se probaron dos enfoques descartados (ver Decisiones): un grafo SVG de nodos hub+satélites (se sintió "genérico/IA") y el globo de partículas `MorphSolutions`. El cliente pidió recuperar el **fondo cinematic que tuvo el hero home antes de convertirse en planeta** (estética tipo FXology: rayos de luz + iconos de categoría flotando + partículas), que ya estaba en el historial de git y respeta el requisito de rendimiento.

---

## Sección 2 — Alcance

**Dentro:**

- **Recuperar** del historial de git (commit `919c5d1`, el último antes de `e1747fa feat.replace floating icons with dotted fiber-planet globe`) la versión **pre-planeta** de `CinematicBackground` y guardarla como **componente nuevo `src/components/effects/CinematicRays.tsx`** (renombrado para no pisar el `CinematicBackground` actual, que hoy es el planeta COBE del home). Es WebGL autocontenido (Three.js): god-rays (shader) + haze + polvo GPU + tiles con iconos (react-icons/fa6) flotando, `iconKeys` para elegir los iconos, respeta `prefers-reduced-motion` y pausa el rAF fuera de viewport.
- **Reescribir `HeroServiciosReact.tsx`** a un banner full-bleed a **alto de pantalla** (`min-h-[100svh]`, `-mt-16` bajo el header): fondo `CinematicRays` (con las 4 claves de categoría vía `iconKeys`), velo radial sutil para legibilidad, y titular (`heading`) + intro + CTA centrados sobre el fondo. Titular con leve glow neón magenta.
- **Animación de entrada escalonada** de los textos con el sistema `data-reveal` del sitio: el bloque usa `data-reveal="up" data-reveal-stagger="0.12"`, así breadcrumb → h1 → intro → CTA entran en cascada.
- **Breadcrumb con el mismo tamaño que el de Nosotros** (`text-sm`, estructura `ol/li`, colores `text-white/50` · `/30` · `text-white font-medium`), centrado; el crumb actual sigue editable en Tina (`breadcrumb`) y localizado con `tField`.
- **Fallback sin WebGL:** si `CinematicRays` no inicializa (`onUnsupported`), se cae a `NodeField` (plexus ligero, SPEC 92).
- **Contenido reutilizado, sin datos nuevos:** titular/intro/CTA de la colección `servicios` (`heading`/`intro`/`ctaLabel`). `HeroServicios.astro` sigue consultando `home` para exponer las 4 categorías (usadas hoy solo como `iconKeys`).
- **Accesibilidad:** el fondo es decorativo (`aria-hidden`); `prefers-reduced-motion` → frame estático del efecto y textos visibles sin animar (el CSS del reveal los muestra tal cual). Señal `fbx:hero-scene-loaded` para el `SitePreloader`.
- **i18n:** titular/intro/CTA/breadcrumb vía `tField`.

**Fuera de alcance (otros specs):**

- Interacción de "conectar categorías" / click-en-nodo → scroll (el enfoque de grafo se descartó; el fondo cinematic es decorativo). El CTA "Conoce más" sigue bajando a `#soluciones-scroll`.
- Tocar el `CinematicBackground` actual (planeta COBE) del home ni el `MorphSolutions`.
- Bloques inferiores de la página (`SolucionesScroll`, `HomePartners`, `CertificacionesSlider`, `ServiciosForm`) quedan intactos.
- Editabilidad en Tina de colores/parámetros/iconos del efecto (horneados en su `PARAMS`).
- Eliminar el campo `heroVideo` de `servicios` (queda sin usar en el schema).

---

## Sección 3 — Modelo de datos

**No introduce datos persistidos ni contenido CMS nuevo.** Reutiliza:

- Titular/intro/CTA: `servicios/index.json` (`heading`, `intro`, `ctaLabel`, con sus `_en`).
- Iconos flotantes: constante fija `ICON_KEYS = ["conectividad", "ciberseguridad", "datacenter", "gestionados"]` (claves mapeadas a glifos fa6 dentro de `CinematicRays`; el efecto las mezcla con iconos extra horneados para dar variedad).

`CinematicRays` expone `Props { className?, iconKeys?, signalReady?, onUnsupported? }`; sus parámetros visuales (densidad de rayos/polvo, velocidad, colores de marca) viven en constantes internas.

---

## Sección 4 — Plan de implementación

1. **Recuperar el componente.** `git show 919c5d1:src/components/effects/CinematicBackground.tsx` → `src/components/effects/CinematicRays.tsx`, renombrando la función export a `CinematicRays`. Estado: componente disponible, sin cablear.

2. **Reescribir el hero.** `HeroServiciosReact.tsx`: sección `min-h-[100svh] -mt-16` con `CinematicRays` de fondo (z-0, `iconKeys=ICON_KEYS`, `signalReady`, `onUnsupported`→fallback `NodeField`), velo radial de legibilidad, y bloque de texto centrado (breadcrumb + h1 con glow + intro + CTA). Estado: nuevo hero cinematic a alto completo.

3. **Breadcrumb tamaño Nosotros.** Estructura `nav > ol > li` con `text-sm` y los colores de Nosotros, centrado; crumb actual editable en Tina.

4. **Entrada escalonada.** Envolver el bloque de texto en `data-reveal="up" data-reveal-stagger="0.12"` (breadcrumb, h1, intro, CTA como hijos directos → cascada).

5. **Limpieza.** Eliminar `SolucionesNodeGraph.tsx` (grafo descartado) y el código inerte del puente de scroll en `SolucionesScrollReact.tsx` (listener `fbx:goto-solucion` + ids `soluciones-cat-*`).

---

## Sección 5 — Criterios de aceptación

- [x] La página `/soluciones` carga el hero cinematic full-bleed **a alto de pantalla** (`100svh`), sin las dos columnas (texto+video) anteriores.
- [x] El fondo muestra god-rays morados, tiles con iconos de las categorías flotando y polvo de luz (estética del hero home pre-planeta).
- [x] Titular, intro, CTA y breadcrumb entran con animación escalonada al cargar.
- [x] El breadcrumb usa el mismo tamaño que el de Nosotros (`text-sm`).
- [x] El titular/intro/CTA muestran el contenido de `servicios` y respetan i18n ES/EN.
- [x] El CTA "Conoce más" baja a `#soluciones-scroll`.
- [x] Con `prefers-reduced-motion` el efecto queda estático y los textos se muestran sin animar.
- [x] Si WebGL no está disponible, el fondo cae a `NodeField` sin romper el hero.
- [x] `SolucionesScroll` y los bloques inferiores siguen funcionando igual que antes.

---

## Sección 6 — Decisiones tomadas y descartadas

- **Sí:** recuperar la versión pre-planeta de `CinematicBackground` (god-rays + iconos + polvo) como `CinematicRays`. El cliente la pidió explícitamente; ya estaba probada en rendimiento.
- **Sí:** componente nuevo con nombre distinto (`CinematicRays`) en vez de revertir el archivo actual — para no tocar el planeta COBE que hoy usa el home.
- **Sí:** hero a `100svh` con textos centrados y entrada escalonada (`data-reveal-stagger`), reutilizando el sistema de reveal del sitio (consistente con el resto).
- **Sí:** breadcrumb clonado del hero de Nosotros (tamaño/colores) por pedido del cliente.
- **Sí:** `NodeField` como fallback sin WebGL (ligero, ya en el proyecto).
- **No (descartado):** grafo SVG de nodos hub+satélites (primer intento de este spec). Se sintió "genérico/IA".
- **No (descartado):** globo de partículas `MorphSolutions` (Three.js). Más pesado y su gramática globo→morph no encaja con un banner siempre visible.
- **No:** interacción click-en-nodo → scroll a categoría (dependía del enfoque de grafo). Se quitó el puente de scroll asociado.
- **No:** editar iconos/colores/parámetros del efecto desde Tina (horneados).

---

## Sección 7 — Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El fondo WebGL afecta rendimiento en dispositivos ligeros (requisito duro del cliente). | Componente ya afinado (cap DPR, menos muestras en mobile, rAF pausado fuera de viewport); frame estático en `reduced-motion`; fallback a `NodeField`. |
| Los tiles/iconos flotantes restan legibilidad al titular. | Velo radial oscuro tras el texto + glow del titular; en mobile los tiles quedan más tenues. |
| El efecto no inicializa (sin WebGL / GPU bloqueada). | `onUnsupported` → fallback `NodeField`; el hero nunca queda vacío. |
| Hidratación: `data-reveal` dentro de una isla `client:load` genera un warning de mismatch. | Patrón ya usado en el hero de Nosotros; es cosmético y la animación funciona. |

---

## Lo que **no** está en este spec

- Interacción de nodos/scroll-a-categoría (enfoque de grafo descartado).
- Tocar el planeta COBE del home o el `MorphSolutions`.
- Editabilidad en Tina de los parámetros/iconos del efecto.
- Eliminar el campo `heroVideo` del schema de `servicios`.

Cada uno de esos, si llega, va en su propio spec.
