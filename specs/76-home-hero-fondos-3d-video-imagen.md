# SPEC 76 — Hero del Home: escena 3D nueva + modos de fondo (video / imagen con opacidad)

> **Estado:** Implementado
> **Depende de:** SPEC 18/31 (Spline + preloader home), SPEC 39 (logo hero→header), SPEC 44 (fondo estático mobile), SPEC 46/50 (patrón `heroBackground`/`heroMode`)
> **Fecha:** 2026-07-26
> **Objetivo:** Actualizar la escena 3D del hero del Home y añadir dos modos de fondo seleccionables desde Tina —video a sangre e imagen a sangre, ambos con opacidad configurable— manteniendo el texto legible y el preloader.

---

## Scope

**In:**
- **Modo 3D:** reemplazar la URL de Spline por la nueva (`NPf6t5Aswe3I4AKw`) como default; el modo 3D conserva su comportamiento (desktop-only + imagen estática en mobile, SPEC 44).
- **Selector `heroBackground`** en Tina (home hero): `3d` | `video` | `imagen`, default `3d`.
- **Modo video:** video a sangre detrás del texto (`object-cover`, `autoplay muted loop playsInline`), en **desktop y mobile**, con **opacidad del propio video** configurable (0–100%).
- **Modo imagen:** imagen a sangre detrás del texto (`object-cover`) con la misma **opacidad configurable**.
- Los 3 modos disparan `fbx:hero-scene-loaded` al estar listos (para ocultar el `SitePreloader`).
- Se conservan los vignettes/scrim actuales del hero (ayudan a la legibilidad).

**Out of scope:**
- **No** reutiliza `HeroVideo` (ese usa `mix-blend-mode: screen` para chips sobre negro; aquí es un fondo normal a sangre con opacidad).
- Parallax de mouse (era del SPEC 75, descartado) — no aplica.
- Poster/scrim extra para el modo video (se usa la opacidad del medio + vignettes existentes).
- Otros heroes (soporte/soluciones/servicios) — no se tocan.

---

## Data model

Tina — home hero (`tina/config.ts`, collection `home` → objeto `hero`):
```
+ heroBackground   (string select)  "3d" | "video" | "imagen"   default "3d"
  splineSceneUrl   (string)         modo 3d — default = nueva URL Spline
  splinePosterUrl  (image)          imagen estática mobile del modo 3d (existente)
+ heroBgVideo      (image/media)    video a sangre (modo video)
+ heroBgImage      (image)          imagen a sangre (modo imagen)
+ heroBgOpacity    (number 0–100)   opacidad del medio (video/imagen)  default 60
```

Contenido (`src/content/home/index.json` → hero):
```
+ "heroBackground": "3d"
  "splineSceneUrl": "https://prod.spline.design/NPf6t5Aswe3I4AKw/scene.splinecode"
+ "heroBgOpacity": 60
  (heroBgVideo / heroBgImage vacíos hasta que el editor los cargue)
```

---

## Implementation plan

1. **Tina + contenido.**
   Añadir `heroBackground` (select), `heroBgVideo`, `heroBgImage`, `heroBgOpacity` al hero del home; actualizar `splineSceneUrl` (default = nueva URL) y conservar `splinePosterUrl`. En `index.json`: `heroBackground: "3d"`, `splineSceneUrl` = URL nueva, `heroBgOpacity: 60`. `tinacms build` regenera tipos.

2. **`HeroHomeReact` — render por modo.**
   - `3d`: comportamiento actual con la escena nueva (Spline desktop-only + imagen estática mobile).
   - `video`: `<video>` a sangre `absolute inset-0 object-cover`, `autoplay muted loop playsInline`, `style opacity = heroBgOpacity/100`, en desktop y mobile; dispara `fbx:hero-scene-loaded` en `canplay`; respeta `prefers-reduced-motion` (pausa/estático).
   - `imagen`: `<img>` a sangre `absolute inset-0 object-cover`, `opacity` configurable; dispara el evento en `onLoad`.
   - Mantener vignettes (z-[1]) y contenido (z-10) por encima del fondo (z-0).

3. **Verificación + build.**
   Cambiar `heroBackground` entre los 3 modos y comprobar: 3D con escena nueva; video a sangre en loop (desktop+mobile) con opacidad que afecta al video; imagen a sangre con opacidad; texto legible; preloader se oculta en cada modo; sin overflow ni salto de layout; `npm run build` compila.

---

## Acceptance criteria

- [ ] El modo 3D renderiza la escena nueva (`NPf6t5Aswe3I4AKw`).
- [ ] Existe el selector `heroBackground` en Tina (3d/video/imagen); cambiarlo cambia el fondo del hero.
- [ ] Modo video: video a sangre en loop (desktop y mobile), con opacidad configurable que afecta al propio video; el texto se lee.
- [ ] Modo imagen: imagen a sangre con opacidad configurable; el texto se lee.
- [ ] El `SitePreloader` se oculta en los 3 modos (evento `fbx:hero-scene-loaded`).
- [ ] Sin overflow horizontal ni salto de layout en el hero (desktop y mobile).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** opacidad = opacidad del **propio medio** (0–100%), se funde con el `#0a0a0a`.
- **Sí:** video/imagen **a sangre** detrás de todo el hero; el texto va encima.
- **Sí:** el video de fondo se reproduce **también en mobile**.
- **Sí:** el modo 3D sigue disponible (desktop-only + imagen mobile) con la escena nueva.
- **Sí:** una sola `heroBgOpacity` compartida (solo hay un modo activo a la vez).
- **No:** reutilizar `HeroVideo` (semántica de blend distinta).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Video de fondo pesado en mobile | Recomendar mp4 liviano; respeta `prefers-reduced-motion`. |
| Texto poco legible si la opacidad es alta | Vignettes existentes + control de opacidad (default 60). |
| El preloader se cuelga si el modo no señala listo | Cada modo dispara `fbx:hero-scene-loaded`; fallback de 6s ya existe. |
| Cambiar el default de Spline afecta a quien tenía la escena vieja | Es un campo editable; se documenta el cambio. |

---

## Lo que **no** está en este spec

- Reutilización de `HeroVideo` (mix-blend-mode screen).
- Parallax de mouse (SPEC 75, descartado).
- Otros heroes del sitio.
