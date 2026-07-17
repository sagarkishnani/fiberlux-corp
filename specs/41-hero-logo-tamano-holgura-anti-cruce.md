# SPEC 41 — Logo del hero home: tamaño y holgura anti-cruce

> **Estado:** Implementado
> **Depende de:** SPEC 39 (logo animado hero→header; se afinan sus constantes)
> **Fecha:** 2026-07-17
> **Objetivo:** Reducir levemente el logo grande del hero en home desktop y darle más aire sobre el `h1`, de modo que quede un poco más grande que el texto del hero y no se cruce con él en ningún ancho de desktop.

---

## Alcance

**Dentro:**

- **Logo más chico.** Bajar `LOGO_HERO_H` de `80px` a **~64px** en `HeaderV2React.tsx` — "ligeramente más pequeño", pero aún un poco más grande que el `h1` (que mide ~49–56px en desktop).
- **Más distancia con el `h1`.** Aumentar el aire entre el borde inferior del logo grande y la primera línea del `h1`, subiendo el logo (reducir `LOGO_START_OFFSET_Y`, hoy `230px`) y/o ajustando el `padding-top` desktop del hero (`lg:pt-40` en `HeroHomeReact.tsx`).
- **Sin cruce en desktop.** El logo grande **no se solapa ni pasa por encima** del `h1` en `1024 / 1280 / 1440 / 1920 / 2560 px`, validado visualmente.
- **Solo home + desktop (`≥1024px`).** Se reutiliza toda la maquinaria de SPEC 39; el resto de estados (mobile/tablet, no-home, reduced-motion) queda intacto.
- **Valores como constantes en código** (no CMS), igual que SPEC 39.

**Fuera (para futuros specs):**

- Hacer el tamaño/offset editables desde el CMS.
- Aplicar el efecto o el ajuste a los heros de otras páginas.
- Reemplazar la geometría por un modelo de **holgura calculada** que garantice no-cruce por cálculo (se evaluó y se descarta; ver Decisiones).
- Cualquier cambio en mobile/tablet, en la curva de scroll (`LOGO_TRAVEL_DISTANCE`) o en el comportamiento de aterrizaje del logo.

---

## Modelo de datos

**No introduce ni modifica datos, colecciones ni props.** Solo afina constantes ya existentes en `HeaderV2React.tsx` (`LOGO_HERO_H`, `LOGO_START_OFFSET_Y`) y, si hace falta, el `padding-top` desktop del hero en `HeroHomeReact.tsx`. La interpolación de altura (`LOGO_HEADER_H + (LOGO_HERO_H − LOGO_HEADER_H)·inv`) absorbe el nuevo tamaño automáticamente.

---

## Plan de implementación

1. **Reducir el tamaño del logo.** En `HeaderV2React.tsx:81`, `LOGO_HERO_H = 80 → 64`. *Test:* en home desktop con scroll al tope, el logo grande se ve más chico, apenas mayor que el `h1`; al scrollear sigue encogiendo hasta 20px sin saltos. Commit.

2. **Ganar aire sobre el `h1`.** En `HeaderV2React.tsx:82`, bajar `LOGO_START_OFFSET_Y` (arranque ~`195`, rango de tuning ~`180–205`) para que el logo suba; si aún falta aire, subir el `lg:pt-40` del hero (`HeroHomeReact.tsx:86`) un escalón. *Test:* hay un gap visible entre el borde inferior del logo y la primera línea del `h1`. Commit.

3. **Validación anti-cruce por ancho.** Revisar `1024 / 1280 / 1440 / 1920 / 2560 px` y ajustar `LOGO_START_OFFSET_Y` (y/o el `pt` del hero) dentro del rango hasta que el logo no toque el `h1` en ninguno. *Test:* en los 5 anchos, el logo queda claramente por encima del `h1`, sin solaparse. Commit.

4. **Regresión.** Confirmar que mobile/tablet (`<1024px`), las páginas que no son home y `prefers-reduced-motion` siguen igual; que la animación sigue siendo continua y reversible; y que `astro build` termina sin errores ni warnings nuevos. Commit.

---

## Criterios de aceptación

- [x] En home desktop con scroll al tope, el logo grande mide ~64px (más chico que antes, pero mayor que el `h1`).
- [x] Existe un gap vertical visible entre el borde inferior del logo grande y la primera línea del `h1`.
- [x] El logo grande **no se solapa ni pasa por encima** del `h1` en `1024`, `1280`, `1440`, `1920` y `2560 px`.
- [x] Al scrollear, el logo sigue encogiendo/reposicionando de forma continua y reversible hasta su slot del header (20px).
- [x] Mobile/tablet, páginas no-home y `prefers-reduced-motion` se comportan igual que antes.
- [x] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí:** `LOGO_HERO_H ≈ 64px`. Se lee "un poco más grande" que el `h1` (máx 56px) y "ligeramente más pequeño" que los 80px actuales.
- **No:** `~56px`. Queda igual que el `h1` y deja de leerse "más grande que el texto" en pantallas anchas.
- **Sí:** ganar aire subiendo el logo (reducir `LOGO_START_OFFSET_Y`), complementado con el `pt` del hero si hace falta.
- **No:** garantía de no-cruce **por cálculo** (derivar la holgura real contra el `h1`). Más lógica en el componente para un caso que se resuelve tuneando y validando 5 anchos; se deja como alcance de otro spec si reaparece.
- **Sí:** mantener los valores como constantes en código, no CMS, coherente con SPEC 39.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Si el título del hero cambia de largo/nº de líneas a futuro, el `h1` se recoloca (va centrado en `min-h`) y el cruce podría reaparecer a algún ancho. | Los valores quedan documentados y afinables; se valida el rango de anchos. Si se vuelve recurrente, se pasa a la "garantía por cálculo" en un spec propio. |
| Subir el logo demasiado lo acerca al top bar / navbar del header. | El rango de tuning de `LOGO_START_OFFSET_Y` se valida para que el logo grande siga claramente dentro del hero, por debajo del navbar. |

---

## Lo que **no** entra en este spec

- Tamaño/offset editables por CMS.
- Efecto o ajuste en heros de otras páginas.
- Geometría de no-cruce por cálculo.
- Cambios en mobile/tablet o en la curva de scroll del logo.
