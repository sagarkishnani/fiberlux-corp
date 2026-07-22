# SPEC 61 — Header: icono de búsqueda + dropdowns claros en tema claro

> **Estado:** Aprobado
> **Depende de:** SPEC 09 (menú desplegable), SPEC 16 (header tema claro), SPEC 33 (topbar)
> **Fecha:** 2026-07-22
> **Objetivo:** Agregar un icono de búsqueda (placeholder, sin función) al header en desktop y mobile con color según tema, y hacer que los dropdowns de submenú se muestren claros en el header de tema claro.

---

## Por qué este spec existe

La referencia de diseño del header incluye un icono de lupa (búsqueda) al final de la navegación, que hoy no existe. Además, en el header de tema claro (páginas de legales/reclamos), los dropdowns de submenú aparecen oscuros (`bg-greyscale-darkest`) y desentonan con el header blanco: deberían ser claros. La búsqueda como funcionalidad no existe en el sitio y no entra en este spec (solo el icono visual).

---

## Scope

**In:**

- Icono de **lupa** (búsqueda) en `HeaderV2React`:
  - Desktop: al final de la barra de navegación (después de "Contacto").
  - Mobile: en la barra principal, a la derecha.
  - Color según tema vía `controlText`: **blanco** en header oscuro, **oscuro** en header blanco.
  - **Sin función**: botón placeholder (`type="button"`, `aria-label="Buscar"`) que no dispara nada.
- Dropdowns de submenú **theme-aware**: en el header de **tema claro** (`isLight`), los paneles pasan a claros (fondo blanco/translúcido + borde negro tenue + texto oscuro + hover suave). En el header **oscuro** siguen como están. Aplica a submenús y sub-submenús (grandchild).

**Out of scope (futuro):**

- Funcionalidad real de búsqueda (indexado, overlay/página de resultados) → spec aparte.
- Cambios al menú overlay morado (hamburguesa) y a la topbar.
- Cualquier componente que no sea `HeaderV2React`.

---

## Data model

Este spec no introduce estructuras de datos ni cambios de schema. Es solo presentación en `src/components/shared/HeaderV2React.tsx`.

---

## Implementation plan

1. **Icono de búsqueda (desktop + mobile).**
   En `HeaderV2React.tsx`: importar `FaMagnifyingGlass` de `react-icons/fa6`. Agrupar el `<nav>` desktop y un nuevo botón de búsqueda en un contenedor a la derecha de la barra principal (`flex items-center`), de modo que:
   - En desktop, el botón queda después de la navegación.
   - En mobile (nav oculto con `hidden lg:flex`), el botón queda visible a la derecha de la barra.
   El botón es `<button type="button" aria-label="Buscar" className="... ${controlText} ...">` con la lupa; sin `onClick` (placeholder). Prueba manual: la lupa se ve en desktop y mobile, blanca en header oscuro y oscura en header blanco.

2. **Dropdowns claros en tema claro.**
   En el render de los dropdowns (panel de submenú y de grandchild), condicionar las clases a `isLight`:
   - Panel: oscuro → `bg-greyscale-darkest/95 border-white/10`; claro → `bg-white/95 border-black/10`.
   - Items: oscuro → `text-white/80 hover:text-white hover:bg-white/5` (activo `text-white bg-white/5`); claro → `text-greyscale-darkest/80 hover:text-greyscale-darkest hover:bg-black/5` (activo `text-greyscale-darkest bg-black/5`).
   - Grandchild igual patrón.
   Prueba manual: en una página de tema claro (ej. `/reclamos`), al hacer hover en un item con submenú, el dropdown se ve claro; en una página oscura sigue oscuro.

---

## Acceptance criteria

- [ ] El header muestra un icono de lupa en desktop (al final del nav) y en mobile (a la derecha de la barra).
- [ ] El icono es blanco en el header oscuro y oscuro en el header blanco.
- [ ] El icono no dispara ninguna acción (placeholder), sin errores en consola.
- [ ] En el header de tema claro, los dropdowns de submenú se ven claros (fondo blanco + texto oscuro).
- [ ] En el header oscuro, los dropdowns siguen oscuros como antes.
- [ ] El comportamiento de hover/apertura de submenús no cambia (solo el color).
- [ ] `npm run build` compila sin errores.

---

## Decisions

- **Sí:** el icono usa `controlText`, así hereda el color correcto por tema sin lógica extra.
- **Sí:** el icono es un placeholder sin función; la búsqueda real es un spec aparte (no hay buscador en el sitio).
- **Sí:** el icono va en desktop y mobile (según la referencia).
- **Sí:** los dropdowns se condicionan a `isLight` (theme-aware); el header oscuro no cambia.
- **No:** tocar el menú overlay morado ni la topbar.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Reordenar el nav + botón rompe el `justify-between` de la barra | Agrupar nav + búsqueda en un contenedor derecho; el grupo izquierdo (logo/hamburguesa) no se toca. |
| Un botón sin acción confunde | `aria-label="Buscar"`; queda claramente como placeholder hasta el spec de búsqueda. |
| Contraste del dropdown claro sobre el header blanco | Fondo `bg-white/95` + borde `black/10` + texto `greyscale-darkest`, como el resto del tema claro. |

---

## Lo que **no** está en este spec

- Funcionalidad de búsqueda.
- Menú overlay morado y topbar.
- Otros componentes.

Cada uno, si aterriza, va en su propio spec.
