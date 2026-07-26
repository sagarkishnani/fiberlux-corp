# SPEC 74 — Heros con video en loop (reemplaza el 3D de Spline): Soporte y Soluciones

> **Estado:** Implementado
> **Depende de:** SPEC 06 (soporte técnico), SPEC 10 (página soluciones/servicios), SPEC 18/31 (Spline hero / rendimiento)
> **Fecha:** 2026-07-26
> **Objetivo:** Reemplazar el elemento 3D de Spline del hero de Soporte Técnico (video `router-soporte-tecnico.mp4`) y del hero de Soluciones (video `cubos-soluciones.mp4`) por video en loop con `mix-blend-mode: screen`, editable desde Tina y visible en desktop y mobile, aligerando esas páginas.

> **Ampliación (2026-07-26):** el spec cubría solo Soporte. Se extiende al hero de **Soluciones/Servicios** (`HeroServiciosReact`, collection `servicios`) con el video `cubos-soluciones.mp4`, aplicando el mismo componente y criterios. Home queda fuera (sigue con Spline).

---

## Scope

**In:**

- Reemplazar en el hero de `soporte-tecnico` la escena de Spline (`<SplineScene>`) por un elemento `<video>`:
  - `autoplay`, `loop`, `muted`, `playsInline` (requisitos para autoplay silencioso, incl. iOS).
  - `mix-blend-mode: screen` para fundir el fondo oscuro del video con las gradientes/glow del hero.
  - **Poster estático** de respaldo mientras carga y para `prefers-reduced-motion` (no reproduce; muestra el poster).
  - Visible en **desktop y mobile** (el video es liviano, ~850 KB).
- **Fuente editable en Tina:** reemplazar los campos `splineSceneUrl` + `splinePosterUrl` del collection `soporteTecnico` por `heroVideo` (media) + `heroVideoPoster` (media), con `router-soporte-tecnico.mp4` como valor por defecto en el contenido.
- Quitar de `HeroSoporteReact` el import y uso de `SplineScene` → la página de soporte **ya no carga el runtime/escena de Spline** (mejora de rendimiento en esa ruta).
- Respetar `prefers-reduced-motion`.

**Out of scope (futuro):**

- Home sigue usando Spline; **no** se elimina la dependencia `@splinetool` (Home no cambia). Soluciones/Servicios SÍ pasa a video (ver ampliación).
- Auditoría/pase general de rendimiento del sitio (lazy-load global, imágenes, Lenis, bundles) → su propio spec.
- Nuevos assets de video para Home/Servicios.
- Cambiar el layout/copys del hero de soporte (solo se sustituye el elemento visual de la derecha).

---

## Data model

Cambios en el collection `soporteTecnico` (`tina/config.ts`) y su contenido JSON. Los tipos/cliente en `tina/__generated__/` se regeneran en build (no se editan a mano).

**1. Tina — reemplazo de campos del hero (`tina/config.ts`, ~líneas 1123–1135):**

```
- splineSceneUrl   (string)   → ELIMINAR
- splinePosterUrl  (image)    → ELIMINAR
+ heroVideo        (image/media)  label "Video del hero (loop)"
                                   description: mp4 corto en loop; se mezcla con
                                   mix-blend-mode: screen. Vacío = sin video.
+ heroVideoPoster  (image)        label "Poster del video (respaldo)"
                                   description: imagen que se muestra mientras
                                   carga y en reduce-motion.
```

**2. Contenido (`src/content/soporte-tecnico/index.json`):**

```
- "splineSceneUrl": "https://prod.spline.design/.../scene.splinecode"
- "splinePosterUrl": "/models/hero-soporte.webp"
+ "heroVideo": "/videos/router-soporte-tecnico.mp4"
+ "heroVideoPoster": "/models/hero-soporte.webp"
```

**3. Componente nuevo (`src/components/shared/HeroVideo.tsx`):** islote pequeño reutilizable que encapsula el `<video>` (loop/autoplay/muted/playsInline), el `mix-blend-mode: screen`, el poster y el guard de `prefers-reduced-motion`. Props: `src`, `poster?`, `className?`. Usa `mediaUrl()` para normalizar la ruta (assets.tina.io → public en prod, igual que `heroImage` del subservicio).

---

## Implementation plan

1. **Schema Tina + contenido.**
   En `tina/config.ts` (collection `soporteTecnico`) sustituir `splineSceneUrl`/`splinePosterUrl` por `heroVideo` (media) y `heroVideoPoster` (image) con sus descripciones. En `src/content/soporte-tecnico/index.json` reemplazar los valores por `heroVideo: "/videos/router-soporte-tecnico.mp4"` y `heroVideoPoster: "/models/hero-soporte.webp"`. Prueba: `tinacms build` regenera tipos sin error.

2. **Componente `HeroVideo.tsx`.**
   Crear `src/components/shared/HeroVideo.tsx`: renderiza `<video autoplay loop muted playsinline preload="metadata" poster={poster}>` con `style={{ mixBlendMode: "screen" }}` y `object-cover`. Si `prefers-reduced-motion`, no reproduce (muestra el poster como imagen de fondo). `mediaUrl()` para `src`/`poster`. Sin dependencias nuevas.

3. **Cablear en `HeroSoporteReact`.**
   Quitar `import SplineScene` y el bloque `<SplineScene .../>`. En la columna derecha renderizar `<HeroVideo src={page.heroVideo} poster={page.heroVideoPoster} />` cuando `page.heroVideo` exista. Quitar la restricción `hidden lg:block` para que se vea también en mobile (ajustando el contenedor/alto para que quede bien en ambos). Mantener el glow del fondo. Prueba manual desktop + mobile: video en loop, se funde con las gradientes (screen), sin recuadro negro.

4. **Verificación + build.**
   Revisar hero de soporte en desktop y mobile: el video corre en loop, `mix-blend-mode: screen` funde el fondo, poster visible en reduce-motion, sin overflow ni salto de layout. Confirmar que soporte ya no descarga el chunk de Spline (network). Home sigue con su Spline intacto. `npm run build` compila.

5. **(Ampliación) Soluciones/Servicios.**
   Mismo tratamiento en `servicios` (collection Tina + `HeroServiciosReact`): campos `heroVideo`/`heroVideoPoster` (default `/videos/cubos-soluciones.mp4`), reemplazar `<SplineScene>` por `<HeroVideo>` reutilizando el componente de shared, quitar el `z-10` que aísla el blend, video a tamaño natural limitado a `max-w-[440px]` centrado, visible desktop+mobile. Verificar blend/loop/reduce-motion y build.

---

## Acceptance criteria

- [ ] El hero de Soporte Técnico muestra `router-soporte-tecnico.mp4` en loop, autoplay, silenciado, en desktop y mobile.
- [ ] El video usa `mix-blend-mode: screen` y se funde con las gradientes/glow del fondo (sin caja negra).
- [ ] El video/poster es editable desde Tina (`heroVideo` + `heroVideoPoster`); `router-soporte-tecnico.mp4` es el valor por defecto.
- [ ] Con `prefers-reduced-motion`: no reproduce; se ve el poster estático.
- [ ] `HeroSoporteReact` ya no importa `SplineScene`; la ruta de soporte no descarga el runtime/escena de Spline.
- [ ] Home y Servicios siguen mostrando su hero de Spline sin cambios; la dependencia `@splinetool` permanece.
- [ ] Sin salto de layout ni overflow horizontal en el hero (desktop y mobile).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** solo soporte en este spec (Home/Servicios y la dependencia Spline quedan intactos).
- **Sí:** fuente de video editable en Tina (coherente con el resto del sitio), default `router-soporte-tecnico.mp4`.
- **Sí:** video visible en desktop y mobile (es liviano); reduce-motion cae a poster.
- **Sí:** `mix-blend-mode: screen` (pedido del cliente) para integrarlo con el fondo.
- **No:** eliminar `@splinetool` ni tocar los otros heroes en este spec.
- **No:** pase general de rendimiento aquí (va en spec aparte).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| `mix-blend-mode: screen` sobre un fondo no-negro aclara zonas indebidas | El hero es near-black (`#0a0a0a`); el video trae fondo oscuro → screen lo vuelve casi transparente. Verificación en paso 4. |
| Autoplay bloqueado en algunos navegadores/mobile | `muted` + `playsInline` habilitan autoplay silencioso; si falla, queda el poster. |
| El campo media de Tina apunta a `public/videos` (fuera del root habitual) | Media root del proyecto es `public/`; el picker alcanza `public/videos/`. `mediaUrl()` normaliza en prod. |
| Peso del video en mobile | ~850 KB, `preload="metadata"`; aceptable y mucho menor que el runtime+escena de Spline. |
| Reduce-motion muestra hueco | Se renderiza el poster como respaldo, no vacío. |

---

## Lo que **no** está en este spec

- Home / Servicios (siguen con Spline) y eliminación de `@splinetool`.
- Auditoría general de rendimiento.
- Nuevos videos para otros heroes.
