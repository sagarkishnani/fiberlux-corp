# SPEC 54 — "¿Por qué Fiberlux?": rediseño sin cards, números lila y título con marca en negrita

> **Estado:** Implementado
> **Depende de:** Spec 22 (misma sección; la reemplaza en render). Spec 21 (`.site-container`). No los reabre.
> **Fecha:** 2026-07-21
> **Objetivo:** Rediseñar la sección "¿Por qué Fiberlux?" para que coincida con el Figma (Imagen #1): eliminar las cards de vidrio dejando número+texto sueltos sobre el fondo, pintar los números en lila malva con degradé, poner "Fiberlux" en negrita dentro del título y ajustar el fondo degradado.

## Alcance

**Dentro:**

- **Eliminar las cards.** Se quita el recuadro `border + bg-white/[0.06] + backdrop-blur + shadow + rounded-2xl + min-h` de cada stat. El número y su descripción quedan directamente sobre el fondo de la sección, como en la Imagen #1.
- **Números en lila malva con degradé.** El número (prefijo `+`, valor y sufijo `km`/`%`) pasa del gradiente blanco→rosa actual a un **lila malva** con degradé vertical sutil (más claro arriba): `linear-gradient(180deg, #E3C9DF 0%, #B98CB0 100%)` con `bg-clip-text`. El sufijo se mantiene más pequeño y en el mismo tono.
- **Título con marca en negrita.** El render detecta la palabra **"Fiberlux"** dentro de `stats.title` y la pinta en `font-bold`, dejando el resto (`¿Por qué …?`) en peso normal. El título sigue siendo **un solo campo editable** en el CMS (sin campos nuevos). Si el texto no contiene "Fiberlux", se pinta completo en peso normal (fallback seguro).
- **Fondo degradado más fiel al Figma.** Ajustar el `background` de la sección a una base aubergine oscura con brillo magenta arriba-derecha (Imagen #1), en vez del `linear-gradient(118deg, …)` actual.
- **Aplica en todos lados.** Un solo componente rediseñado; se ve igual en el home y en las páginas de solución que lo reusan vía `titleOverride`.
- **Se conserva:** el contador animado (`useCounter` + `IntersectionObserver`), el parseo de `number` (`parseStat`/`formatNumber`), el grid 1/2/4 columnas, `.site-container`, `rounded-t-3xl`, los `data-tina-field` para edición visual y el copy actual de los `description`.

**Fuera de alcance:**

- Cambiar el copy de los `description` o los valores de `number` (spec 22 ya los fijó).
- Tocar el schema/tipos de TinaCMS (`home.stats` queda intacto; `label` sigue huérfano de render).
- Cambiar la lógica del contador, su timing o el easing.
- Reabrir tipografía global o contenedor (specs 19/21).

---

## Modelo de datos

No introduce colecciones ni campos nuevos, ni cambia contenido. Usa `home.stats` tal cual (`title`, `items[]` con `number`/`label`/`description`). El resaltado de "Fiberlux" se resuelve **en render** por coincidencia de string, no con datos nuevos.

---

## Plan de implementación

> Cada paso deja el sitio funcional. Tras cada paso: `npm run dev` levanta sin errores.

1. **Título con marca en negrita** (`StatsReact.tsx`, `<h2>`): reemplazar `{heading}` por un render que parte el string en la palabra "Fiberlux" (case-insensitive) y envuelve esa palabra en `<strong className="font-bold">`; el resto queda en el peso normal actual. Mantener `data-tina-field={tinaField(stats,'title')}`. *Test:* "¿Por qué **Fiberlux**?" con solo la marca en negrita; sigue editable en `/admin`.
2. **Quitar las cards** (`StatCard`): eliminar el `<div>` contenedor con `border/glass/blur/shadow/rounded-2xl/min-h`; dejar el número y la `description` como hijos directos del wrapper de columna. Ajustar espaciados para el layout suelto de la Imagen #1. *Test:* no hay recuadros; número y texto sobre el fondo.
3. **Color lila del número** (`StatCard`): cambiar el gradiente del `<p>` del número a `linear-gradient(180deg,#E3C9DF,#B98CB0)` (vía clases/`style` con `bg-clip-text text-transparent`). Prefijo, valor y sufijo comparten el tono. *Test:* números en lila malva, no blanco→rosa.
4. **Fondo de la sección** (`<section>`): sustituir el `background` por la base aubergine + brillo magenta arriba-derecha del Figma. *Test:* el fondo coincide con la Imagen #1 (oscuro a la izquierda, glow magenta arriba-derecha).
5. **QA visual** (Chrome MCP) en `/` y una página de solución (reuso con `titleOverride`), a mobile (375px) y desktop. *Test:* checklist de aceptación en verde, sin scroll horizontal.

---

## Criterios de aceptación

- [ ] Ninguna stat muestra card/recuadro/borde/glass; número y descripción van directos sobre el fondo.
- [ ] Los números se ven en lila malva con degradé vertical (más claro arriba), incluyendo prefijo `+` y sufijos `km`/`%`.
- [ ] El título muestra "Fiberlux" en negrita y el resto en peso normal; sigue siendo un único campo editable en `/admin`.
- [ ] El fondo de la sección coincide con la Imagen #1 (base oscura + glow magenta arriba-derecha).
- [ ] El rediseño se ve igual en el home y en páginas de solución (`titleOverride`).
- [ ] El contador sigue animando al entrar en viewport y aterriza en +5,500 / +17,000 km / 99 / 100%.
- [ ] Sin scroll horizontal ni regresión en `.site-container`; `npm run dev` sin errores nuevos.

## Decisiones

- **Quitar cards del todo.** Confirmado por el usuario; es lo que muestra el Figma.
- **Lila malva con degradé (`#E3C9DF → #B98CB0`)** para los números. Elegido sobre lila plano; valores propuestos a partir de la Imagen #1 (ajustables en QA).
- **"Fiberlux" en negrita por detección de string**, sin campos nuevos ni tocar el schema/tipos de Tina. Elegido sobre campo aparte o título hardcodeado.
- **Aplica en todos lados** (un solo componente) en vez de una variante solo-home. Menos mantenimiento.
- **No** cambiar copy, valores, contador ni schema. Fuera de alcance (ya cubiertos por spec 22).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El hex del lila no calza exacto con el Figma. | Valores parametrizados en un solo lugar; se afinan en el QA visual. |
| El `titleOverride` de páginas de solución no contiene "Fiberlux" y no se resalta nada. | El fallback pinta el título completo en peso normal; es el comportamiento esperado. |
| Sin `min-h`, las columnas del grid se desalinean si las descripciones tienen distinto alto. | El grid reparte columnas; alinear por `items-start`; QA a desktop/mobile. |

## QA realizada

- **Home (`/`)** a desktop (1440px) y mobile (375px): sin cards, número en lila malva con degradé (`#E3C9DF → #B98CB0`), descripción debajo, "¿Por qué **Fiberlux**?" con la marca en negrita (`<strong class="font-bold">`), fondo con base aubergine + glow magenta arriba-derecha. Sin scroll horizontal (`scrollWidth == innerWidth == 375`).
- **Página de solución (`/soluciones/conectividad-empresarial`)**: reuso vía `whyUsTitle`/`titleOverride` renderiza idéntico, con "Fiberlux" en negrita (el override contiene la marca).
- **Consola** sin errores (0 errores).
- Grid actualizado a `gap-x-6 gap-y-10 items-start` para el layout suelto.
