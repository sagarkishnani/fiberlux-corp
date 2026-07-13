# SPEC 22 — "¿Por qué Fiberlux?": número protagonista, secciones más compactas y contador más rápido

> **Estado:** Implementado
> **Depende de:** Spec 21 (usa `.site-container`, ya migrado). No lo reabre.
> **Fecha:** 2026-07-13
> **Objetivo:** Rediseñar las cards de cifras de la sección "¿Por qué Fiberlux?" para que el número sea el protagonista con su texto debajo, eliminando la etiqueta superior redundante, compactando alturas y espacios, y acelerando el contador a ~2–2.5s.

## Alcance

**Dentro:**

- **Quitar la etiqueta superior** (`label`) del render de cada card. El campo **se conserva** en el schema de TinaCMS y en el contenido (decisión (a)) — solo deja de pintarse.
- **Número protagonista + texto debajo.** La card muestra el `number` grande y, debajo, la `description` como texto de apoyo. Se elimina el layout actual de "label arriba / número abajo del recuadro".
- **Copy nuevo** en `home/index.json` (los 4 `description`), incluida la subida **`92 → 99`** en el número de ciudades:
  - `+5,500` → "clientes satisfechos que confían en nuestra red en todo el Perú"
  - `+17,000 km` → "de infraestructura de fibra óptica desplegada"
  - `99` → "ciudades en cobertura en todo el Perú"
  - `100%` → "red privada de fibra óptica de última generación"
- **Compactar espacios y altura:**
  - Título de sección: `mb-12` → `mb-6`.
  - Card wrapper: quitar `md:mt-16 md:mb-16` (deja `mt-4 mb-4`).
  - Altura de card: `min-h-[200px] md:min-h-[380px]` → `md:min-h-[240px]` (mobile sin `min-h` fijo, se ajusta al contenido).
- **Contador más rápido:** `useCounter` de `3500 + index*250` ms → `2000 + index*150` ms (≈2.0–2.45s en las 4 cards). Se mantiene el easing `easeOutQuad` y el trigger por `IntersectionObserver`.

**Fuera de alcance:**

- Eliminar el campo `label` del schema/tipos (se decidió conservarlo).
- Tocar el resto de la sección (fondo `bg-brand-purple`, `rounded-t-3xl`, grid 1/2/4 columnas, `.site-container`).
- Reabrir tipografía global o contenedor de spec 19/21.
- Cambiar el reuso de esta sección en las páginas de solución (`titleOverride` sigue igual).

---

## Modelo de datos

No introduce colecciones ni campos nuevos. El schema `home.stats.items[]` (`number`, `label`, `description`) **se mantiene intacto**; `label` queda huérfano de render pero editable en el CMS. Solo cambian **valores de contenido** (`description` de los 4 items + `number` de ciudades a `99`).

---

## Plan de implementación

> Cada paso deja el sitio funcional. Tras cada paso: `npm run dev` levanta sin errores.

1. **Contenido.** En `src/content/home/index.json` → `stats.items`: actualizar los 4 `description` al copy nuevo y `number` de ciudades `92 → 99`. *Test:* el JSON valida; el CMS muestra los textos nuevos.
2. **Render de la card** (`StatsReact.tsx` → `StatCard`): eliminar el `<p>` del `label`; reordenar a **número grande arriba, `description` debajo**; ajustar wrapper (`mt-4 mb-4`, sin `md:mt-16/mb-16`) y altura (`md:min-h-[240px]`, sin `min-h` fijo en mobile). *Test:* la card ya no muestra etiqueta; número domina; descripción debajo; sin recuadro sobredimensionado.
3. **Título de sección:** `mb-12` → `mb-6`. *Test:* menos aire entre "¿Por qué Fiberlux?" y las cards.
4. **Contador:** en `StatCard`, `useCounter(value, 3500 + index*250, …)` → `2000 + index*150`. *Test:* la animación dura ~2–2.5s de principio a fin.
5. **QA visual** (Chrome MCP) en `/` y una página de solución (que reusa la sección con `titleOverride`), a mobile y desktop. *Test:* checklist de aceptación en verde.

---

## Criterios de aceptación

- [ ] Ninguna card muestra la etiqueta superior (`label`); el campo sigue existiendo y editable en `/admin`.
- [ ] Cada card muestra `number` como elemento dominante y `description` como texto de apoyo debajo.
- [ ] Los 4 `description` coinciden con el copy nuevo; el número de ciudades es `99`.
- [ ] Menos espacio entre el título de sección y las cards (`mb-6`) y entre cards (`mt-4 mb-4`, sin salto de 64px en desktop).
- [ ] La altura de la card ya no es `380px` en desktop; se ajusta al contenido (tope `~240px`).
- [ ] El contador tarda ~2–2.5s (no ~4–5s) y sigue disparándose al entrar en viewport.
- [ ] La sección se ve correcta reusada en páginas de solución (con `titleOverride`).
- [ ] Sin scroll horizontal ni regresión en `.site-container`; `npm run dev` sin errores nuevos.

## Decisiones

- **(a) Conservar `label` en schema, solo dejar de renderizar.** Cero riesgo, menos superficie de cambio; no regenera tipos. Elegido por el usuario sobre eliminarlo.
- **Número protagonista + texto debajo**, quitando la etiqueta superior por redundante. Pedido del usuario.
- **`92 → 99` ciudades.** Cambio de dato explícito confirmado por el usuario.
- **Timing `2000 + index*150`** (≈2–2.45s), manteniendo easing e IntersectionObserver. Valores propuestos y aceptados.
- **No** tocar fondo, grid ni contenedor global (spec 21). Fuera de alcance.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Quitar `min-h` desalinea alturas de card en la fila del grid. | El grid ya reparte columnas; QA a desktop/mobile; si desalinea feo, fijar `md:min-h-[240px]` uniforme (ya contemplado). |
| El copy más largo en `description` desborda o descuadra en mobile. | QA a 375px; `leading-snug` ya está; ajustar tamaño si hace falta. |

## QA realizada

- **Home (`/`) y página de solución (`/soluciones/conectividad-empresarial`)** verificadas en vivo (Chrome MCP). Ambas: número protagonista arriba, `description` debajo, **sin etiqueta superior** (`hasLabel: false`).
- **Contador** anima con scroll natural del usuario y aterriza en los valores finales correctos: **+5,500 / +17,000 km / 99 / 100%** en ~2–2.5s. (Nota: al posicionar la sección con `scrollIntoView` por JS el contador queda en 0 — es artefacto del `IntersectionObserver` + `client:visible`, no un bug; con scroll real anima siempre.)
- **Espaciado:** título `margin-bottom: 24px` (`mb-6`) confirmado en ambas páginas; card `min-height: 240px` (`md:min-h-[240px]`), sin `min-h` fijo en mobile.
- **Copy nuevo** y `92 → 99` reflejados en las 4 cards.
- **Build standalone** no se pudo correr aislado por el datalayer de Tina ya activo en :9000 (dev server en marcha); cambios validados en vivo por HMR. No se tocó schema/tipos, así que la parte Tina del build no cambia.
