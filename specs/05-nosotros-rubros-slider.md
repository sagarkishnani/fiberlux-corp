# SPEC 05 — Sección "Rubros con los que trabajamos" (carrusel) en Nosotros

> **Status:** Implementado
> **Depends on:** SPEC 03 / 04 (reutiliza el patrón de carrusel + autoplay + flechas del Timeline de Nosotros)
> **Date:** 2026-06-30
> **Objective:** Añadir en `/nosotros`, **debajo de los counters (`StatsReact`)**, una sección "Rubros con los que trabajamos" con un carrusel de tarjetas (ícono magenta + nombre del rubro) navegable por flechas con autoplay, totalmente editable desde TinaCMS (colección `about`, lista de rubros con ícono elegido de un set predefinido), replicando los frames de Figma desktop y mobile.

---

## Scope

**In:**

- **Nuevo island `src/components/nosotros/RubrosReact.tsx`** (patrón de islas que ya usa la página `nosotros`, igual que `TimelineReact`):
  - Recibe `{ query, variables, data }` de `aboutQuery` (ya resuelto en `nosotros/index.astro`) y envuelve el contenido en `useTina()` para edición visual.
  - Renderiza el panel oscuro (`#0a0a0a`, `rounded-t-[16px]`), el título "Rubros con los que trabajamos", las flechas prev/next (estilo Figma: prev tenue `#141223`/borde `#282445`, next magenta `#96237a`) y el carrusel de tarjetas.
  - Si `rubros.items` está vacío, retorna `null` (no rompe la página), igual que el fallback de `ValuesReact`/`TimelineReact`.
- **Montaje en `src/pages/nosotros/index.astro`:** insertar `<RubrosReact client:visible ... />` **debajo de `<StatsReact>`** (último bloque antes del footer), alimentado con `aboutQuery`.
- **Modelo de datos editable** en la colección `about` (`tina/config.ts` + `src/content/about/index.json`): nuevo objeto `rubros` con `title` y una lista `items[]` de `{ icon, label }`, donde `icon` es un **select** de claves predefinidas.
- **Set de íconos curado (ampliado):** un mapa en el componente que asocia cada clave del select a un componente de `react-icons`. Set inicial: los 4 del Figma (Minería, Restaurantes, Educación, Hotelería) más extras para tener variedad — Salud/Clínicas, Retail/Comercio, Banca y Finanzas, Industria/Manufactura, Logística y Transporte, Gobierno/Sector público, Construcción/Inmobiliaria, Agroindustria, Tecnología/Software, Energía, Telecomunicaciones, Turismo, Entretenimiento, Corporativo/Oficinas. Tile del ícono en magenta claro (`#b565a2`), `rounded-[12.31px]`, ícono blanco ~28px.
- **Tarjetas:** fondo `rgba(42,42,42,0.5)` con `backdrop-blur`, `rounded-[24.62px]`, ícono arriba y nombre del rubro abajo (20px semibold blanco), `min-height` ~295px; `data-tina-field` en el nombre para edición visual. **No navegables** (sin link/click).
- **Carrusel funcional con autoplay + drag** (reusando la mecánica del Timeline donde aplique):
  - Flechas prev/next que desplazan el track entre rubros con wrap-around.
  - **Drag/swipe con puntero (mouse y touch) en desktop y mobile:** arrastrar mueve el track como un slider normal; al soltar, se asienta en la posición/tarjeta más cercana (snap). Un drag real **no** dispara un "click" accidental en la tarjeta (umbral de movimiento).
  - Autoplay cada ~5 s en bucle; **pausa** al hover/foco, al usar las flechas y **mientras se arrastra**, reanuda al salir/soltar.
  - Respeta `prefers-reduced-motion`: sin autoplay; el desplazamiento por flechas es instantáneo (sin transición). El drag sigue disponible (es interacción directa del usuario).
- **Responsive según los dos frames de Figma:**
  - **Desktop:** 4 tarjetas visibles en fila, flechas arriba-derecha junto al título.
  - **Mobile:** ~1.2–1.5 tarjetas visibles con la siguiente "asomando" (peek), flechas abajo-izquierda.

**Out of scope (para futuras specs):**

- **Sección Rubros en Home u otras páginas:** esta spec solo toca `/nosotros`.
- **Enlace/click en cada tarjeta** (que cada rubro lleve a una página o filtro): las tarjetas son informativas, no navegables.
- **Subida de íconos personalizados / íconos por imagen:** se usa el select predefinido mapeado a `react-icons`; ampliar el set es editar el mapa en código (no es contenido CMS).
- **Descripción o texto largo por rubro:** el Figma solo muestra ícono + nombre; si luego se necesita, va en otra spec.
- **Indicadores de paginación (dots):** la navegación es por flechas + autoplay + drag, sin dots.
- **Inercia/momentum físico al soltar el drag** (estilo "flick" con desaceleración): al soltar se hace snap a la tarjeta más cercana, sin física de inercia.

---

## Data model

Esta spec **no crea una colección nueva**: extiende la colección `about` (igual que hizo el SPEC 03 con `timeline`). El único dato nuevo es el objeto `rubros`.

### 1. Schema en `tina/config.ts` (colección `about`, junto a `timeline`)

```js
{
  name: "rubros",
  label: "Rubros (sección Nosotros)",
  type: "object",
  fields: [
    { name: "title", label: "Título", type: "string" }, // "Rubros con los que trabajamos"
    {
      name: "items",
      label: "Rubros",
      type: "object",
      list: true,
      ui: { itemProps: (i) => ({ label: i?.label || "Rubro" }) },
      fields: [
        {
          name: "icon",
          label: "Ícono",
          type: "string",
          options: [
            { value: "mineria",        label: "Minería" },
            { value: "restaurantes",   label: "Restaurantes" },
            { value: "educacion",      label: "Educación" },
            { value: "hoteleria",      label: "Hotelería" },
            { value: "salud",          label: "Salud / Clínicas" },
            { value: "retail",         label: "Retail / Comercio" },
            { value: "banca",          label: "Banca y Finanzas" },
            { value: "industria",      label: "Industria / Manufactura" },
            { value: "logistica",      label: "Logística y Transporte" },
            { value: "gobierno",       label: "Gobierno / Sector público" },
            { value: "construccion",   label: "Construcción / Inmobiliaria" },
            { value: "agroindustria",  label: "Agroindustria" },
            { value: "tecnologia",     label: "Tecnología / Software" },
            { value: "energia",        label: "Energía" },
            { value: "telecomunicaciones", label: "Telecomunicaciones" },
            { value: "turismo",        label: "Turismo" },
            { value: "entretenimiento",label: "Entretenimiento" },
            { value: "corporativo",    label: "Corporativo / Oficinas" },
          ],
        },
        { name: "label", label: "Nombre del rubro", type: "string" },
      ],
    },
  ],
}
```

### 2. Contenido en `src/content/about/index.json` (objeto `rubros`)

```jsonc
"rubros": {
  "title": "Rubros con los que trabajamos",
  "items": [
    { "icon": "mineria",      "label": "Minería" },
    { "icon": "restaurantes", "label": "Restaurantes" },
    { "icon": "educacion",    "label": "Educación" },
    { "icon": "hoteleria",    "label": "Hotelería" },
    { "icon": "salud",        "label": "Salud" },
    { "icon": "retail",       "label": "Retail" }
  ]
}
```

(Se siembran 6 para que el carrusel tenga overflow real y las flechas/drag se aprecien; el editor agrega/quita libremente.)

### 3. Mapa de íconos en runtime (`RubrosReact.tsx`)

Un objeto que traduce cada `icon` (clave del select) a un componente de `react-icons`. Se prefiere el set Font Awesome 6 (`react-icons/fa6`, ya usado en el proyecto); para rubros sin equivalente claro en fa6 se usa otro set de `react-icons` (la dependencia ya trae todos los sets). Ejemplo de forma:

```ts
import { FaPersonDigging, FaUtensils, FaGraduationCap, FaBed, /* … */ } from "react-icons/fa6";

const ICONS: Record<string, IconType> = {
  mineria: FaPersonDigging,
  restaurantes: FaUtensils,
  educacion: FaGraduationCap,
  hoteleria: FaBed,
  // …resto del set
};
const FALLBACK_ICON = FaBuilding; // si la clave no existe en el mapa
```

### 4. Tipos en runtime (`RubrosReact.tsx`)

```ts
interface Rubro {
  icon?: string | null;
  label?: string | null;
}

interface RubrosProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}
```

**Convenciones:**

- Fallback chain como en `ValuesReact`/`TimelineReact`: `useTina` data → `initialData`; si `items` está vacío, el componente retorna `null`.
- Si una clave `icon` no existe en el mapa `ICONS`, se usa `FALLBACK_ICON` (no rompe el render).
- Índice/posición activa del carrusel en estado local (`useState`), arranca en `0`.
- El panel de sección usa `rounded-t-[16px]` (radio superior, como `StatsReact` y demás secciones); las tarjetas usan `rounded-[24.62px]` y el tile del ícono `rounded-[12.31px]`, según Figma.

---

## Implementation plan

> Todo el trabajo nuevo vive en `src/components/nosotros/RubrosReact.tsx`, más la inserción en `src/pages/nosotros/index.astro` y el schema/seed en `tina/config.ts` + `src/content/about/index.json`. Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.

1. **Extender el schema `about` en `tina/config.ts`.** Añadir el objeto `rubros` (`title` + `items[]` con `icon` (select) y `label`), junto a `timeline`. *Test:* `npm run dev` levanta sin errores y en `/admin` → colección **About** → **Rubros** aparecen el título y la lista editable, con el `icon` como desplegable de opciones.

2. **Sembrar `rubros` en `src/content/about/index.json`.** Añadir el `title` y los ~6 items placeholder. *Test:* el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Crear `RubrosReact.tsx` — estructura estática.** `useTina()` + fallback chain; leer `rubros`/`items`; retornar `null` si no hay items. Definir el mapa `ICONS` (clave→`react-icons`) + `FALLBACK_ICON`. Renderizar el panel oscuro `#0a0a0a` con `rounded-t-[16px]`, el título, las flechas (estáticas) y la fila de tarjetas (ícono en tile `#b565a2` + nombre), **sin interacción**. `data-tina-field` en `title` y en cada `label`. *Test:* importable sin error.

4. **Montar la sección en `src/pages/nosotros/index.astro`.** Insertar `<RubrosReact client:visible ... />` **debajo de `<StatsReact>`**, pasando `aboutQuery`. *Test:* en `/nosotros` la sección aparece debajo de los counters, estática y parecida al Figma desktop.

5. **Layout del track (carrusel) + responsive.** Estructurar las tarjetas en un track horizontal (flex) con una "ventana" `overflow-hidden`; desktop muestra 4 tarjetas, mobile ~1.2–1.5 con peek y flechas abajo-izquierda. *Test:* en ~1440px se ven 4 tarjetas; en ~390px se ve ~1.5 con la siguiente asomando; flechas en la posición del Figma en cada breakpoint.

6. **Navegación por flechas + estado activo.** `useState` para la posición; flechas prev/next que avanzan/retroceden con **wrap-around**; el track se desplaza con `transform: translateX` y transición CSS. Estilos de flecha del Figma (prev tenue, next magenta). *Test:* clic en flechas desplaza el carrusel; en los extremos hace wrap-around.

7. **Drag con puntero (mouse + touch).** Handlers `pointerdown`/`pointermove`/`pointerup` (Pointer Events cubre mouse y touch): arrastrar mueve el track siguiendo el puntero; al soltar, **snap** a la tarjeta más cercana. Umbral de movimiento para distinguir drag de click (las tarjetas no navegan, pero el umbral evita "saltos" por micro-movimientos). Capturar el puntero (`setPointerCapture`) y prevenir selección de texto al arrastrar. *Test:* arrastrar con mouse en desktop y con el dedo/touch en mobile mueve el slider y asienta en la tarjeta más cercana al soltar; un clic seco no descuadra el carrusel.

8. **Autoplay con pausa.** `setInterval` ~5 s que avanza a la siguiente posición en bucle; se **pausa** en `mouseenter`/foco, al usar flechas y **mientras se arrastra** (`pointerdown`→pausa, `pointerup`→reanuda si procede); limpieza en `useEffect`. *Test:* el carrusel avanza solo; hover/drag lo detienen; al salir/soltar se reanuda.

9. **`prefers-reduced-motion`.** Detectar la media query; si está activa: sin autoplay y sin transición de `translateX` en el avance por flechas (cambio instantáneo). El **drag sigue activo** (interacción directa). *Test:* con reduce-motion en el SO, no hay autoplay y las flechas saltan sin animar; el drag funciona.

10. **QA visual desktop + mobile.** Comparar contra `references/rubros.jpg` (desktop) y `references/rubros-mobile.jpg` (mobile, ~390px) con Playwright MCP (screenshots en `.playwright-screens/`). Ajustar paddings, tamaños de tarjeta, peek y posiciones de flecha hasta coincidir. *Test:* `npm run build` sin errores/warnings nuevos y QA visual aprobado en ambos breakpoints.

**Notas del plan:**

- Pasos 1–4 dejan la sección visible aunque estática; 5–9 añaden carrusel, drag, autoplay y accesibilidad de forma incremental.
- El mapeo fino `icon`→componente de `react-icons` se resuelve en el paso 3 (tile por tile), tomando el ícono más parecido cuando fa6 no tenga uno exacto.
- La verificación visual usa Playwright MCP según convención del proyecto (screenshots en `.playwright-screens/`).

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] En `/admin` → colección **About** → **Rubros** aparecen el **Título** y la lista editable de **Rubros**, cada uno con un **Ícono** (desplegable de opciones predefinidas) y un **Nombre del rubro**.
- [ ] Agregar, reordenar o eliminar un rubro en el CMS se refleja en la sección sin tocar código.
- [ ] La sección "Rubros con los que trabajamos" aparece en `/nosotros` **debajo de los counters (`StatsReact`)**, como último bloque antes del footer.
- [ ] Si `rubros.items` está vacío, la sección **no se renderiza** (la página no rompe).
- [ ] El panel de la sección usa el **`rounded-t-[16px]`** superior, consistente con las demás secciones; las tarjetas usan `rounded-[24.62px]` y el tile del ícono `rounded-[12.31px]`.
- [ ] Cada tarjeta muestra el **ícono** (en tile magenta `#b565a2`, ícono blanco) según la clave elegida en el CMS, y el **nombre** del rubro debajo.
- [ ] Si una clave `icon` no tiene mapeo, se usa el **ícono de fallback** sin romper el render.
- [ ] Las tarjetas **no son navegables** (no hay link ni navegación al hacer click).
- [ ] La flecha **next** avanza el carrusel y la **prev** retrocede, ambas con **wrap-around** en los extremos.
- [ ] Se puede **arrastrar el carrusel con el mouse** (desktop) y con **touch** (mobile); al soltar hace **snap** a la tarjeta más cercana.
- [ ] Un **drag real no dispara un click** accidental ni descuadra el carrusel (umbral de movimiento).
- [ ] El **autoplay** avanza solo cada ~5 s en bucle.
- [ ] El autoplay se **pausa** al hover/foco, al usar las flechas y **mientras se arrastra**, y **reanuda** al salir/soltar.
- [ ] Con `prefers-reduced-motion: reduce` activo: **no hay autoplay** y el avance por flechas es **instantáneo** (sin transición); el **drag sigue funcionando**.
- [ ] En **desktop (~1440px)** el layout coincide con `references/rubros.jpg` (título arriba-izquierda, flechas arriba-derecha, 4 tarjetas visibles en fila).
- [ ] En **mobile (~390px)** el layout coincide con `references/rubros-mobile.jpg` (título arriba, ~1.2–1.5 tarjetas con la siguiente asomando, flechas abajo-izquierda).
- [ ] El **título** y cada **nombre de rubro** son editables visualmente desde el panel de Tina (`data-tina-field`).
- [ ] No se modificó `StatsReact`, el Timeline ni otras secciones (solo se insertó la nueva sección).

---

## Decisiones

- **Sí:** rubros editables como objeto `rubros` en la colección `about`. Es coherente con el proyecto CMS-driven y con el SPEC 03 (que ya extendió `about` con `timeline`); permite cargar/cambiar rubros sin deploy.
- **No:** rubros hardcodeados en el componente. Obligaría a un deploy por cada cambio de rubro; rompe el patrón del proyecto.
- **No:** colección nueva para rubros. El dato pertenece conceptualmente a "About"/Nosotros; extender `about` evita una colección y una query extra (la página ya resuelve `aboutQuery`).
- **Sí:** **ícono por select de claves predefinidas** mapeadas a `react-icons`. Da consistencia visual y evita errores de tipeo; el editor elige de una lista cerrada.
- **No:** nombre libre de ícono ni subida de imagen/SVG por rubro. El nombre libre es frágil (un typo rompe el ícono) y la subida de imágenes descuida la consistencia; ampliar el set es editar el mapa en código.
- **Sí:** **carrusel funcional con autoplay**, reusando la mecánica de flechas/autoplay/pausa del Timeline (SPEC 03/04). Aprovecha patrón ya probado en el proyecto.
- **Sí:** **drag con puntero (mouse + touch) en desktop y mobile**, con snap a la tarjeta más cercana al soltar. Lo pidió el usuario; Pointer Events cubre ambos dispositivos con un solo set de handlers.
- **No:** **inercia/momentum físico** al soltar el drag. Snap simple a la tarjeta más cercana; la física de "flick" añade complejidad que el Figma no exige.
- **Sí:** las flechas, el autoplay y el drag conviven; el drag y el hover **pausan** el autoplay para no competir con el usuario.
- **No:** tarjetas navegables (link por rubro). El usuario confirmó que son informativas; añadir navegación abriría definir destinos/rutas que no existen.
- **No:** indicadores de paginación (dots). El Figma no los muestra; la navegación es flechas + autoplay + drag.
- **Sí:** respetar `prefers-reduced-motion` (sin autoplay, avance instantáneo) manteniendo el drag activo. Accesibilidad, consistente con SPEC 03/04; el drag es interacción directa y no es "movimiento automático".
- **Sí:** `rounded-t-[16px]` superior en el panel, igual que las demás secciones. Mantiene la coherencia visual del stack de secciones (lo pidió el usuario).
- **Sí:** island `RubrosReact.tsx` alimentado por `aboutQuery` ya resuelto en la página, sin `.astro` wrapper. Es como la página `nosotros` monta hoy `MissionVisionReact`/`ValuesReact`/`TimelineReact`.
- **Sí:** solo `/nosotros` en esta spec. Home queda fuera para no acoplar dos páginas a la misma decisión de datos en una sola spec.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El **drag** entra en conflicto con el smooth-scroll Lenis (`BaseLayout`) o con el scroll vertical de la página en mobile. | El drag es horizontal sobre el track con `setPointerCapture`; usar `touch-action: pan-y` en la pista para no secuestrar el scroll vertical; QA en mobile real/emulado. |
| Un **drag** corto se interpreta como click (o un click como drag) y descuadra el carrusel. | Umbral de movimiento (px) para confirmar drag; por debajo del umbral se ignora. Como las tarjetas no navegan, no hay click destino que disparar. |
| El **autoplay** (`setInterval`) sigue corriendo tras desmontar o al cambiar de pestaña, o pelea con el drag/hover. | Limpiar el intervalo en `useEffect`; pausar en hover/foco/uso de flechas/drag y al perder visibilidad; reanudar solo si no hay `prefers-reduced-motion`. |
| El **snap** al soltar calcula mal la tarjeta más cercana con anchos variables o en el wrap-around. | Calcular el índice por desplazamiento/ancho de tarjeta y recortar al rango; verificar el comportamiento en los extremos (primer/último). |
| Un rubro con clave `icon` **sin mapeo** (o vacío) deja la tarjeta sin ícono. | `FALLBACK_ICON` cuando la clave no existe en `ICONS`; QA agregando un rubro con ícono no mapeado. |
| Algunos rubros (minería, hotelería) **no tienen ícono exacto** en Font Awesome 6. | Tomar el más parecido de fa6 u otro set de `react-icons` (la dependencia ya los trae); decidir tile por tile en el paso 3. |
| El **peek** mobile (~1.2–1.5 tarjetas) descuadra el ancho/paddings respecto al Figma. | Fijar ancho de tarjeta + gap por breakpoint y QA visual contra `references/rubros-mobile.jpg` (~390px) antes de cerrar. |
| El `backdrop-blur` de las tarjetas impacta el rendimiento o no se ve igual entre navegadores. | Es un detalle estético; si causa problemas, degradar a fondo sólido `rgba(42,42,42,0.5)` sin blur sin afectar el layout. |
