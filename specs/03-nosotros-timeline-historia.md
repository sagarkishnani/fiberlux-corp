# SPEC 03 — Sección Historia (timeline animado) en Nosotros

> **Status:** Aprobado
> **Depends on:** —
> **Date:** 2026-06-30
> **Objective:** Construir una sección "Historia" en `/nosotros` (entre Valores y Stats) que recorra los hitos de la empresa con un año gigante de fondo animado (count-up), barra de progreso proporcional y navegación por flechas con autoplay, replicando el frame de Figma con fondo aproximado en CSS y todos los hitos editables en TinaCMS.

---

## Scope

**In:**

- **Componente de página (patrón dual).** Crear `src/components/nosotros/Timeline.astro` + `TimelineReact.tsx`:
  - `Timeline.astro` consulta la colección `about` (`relativePath: 'index.json'`) vía `client` y pasa `{ query, variables, data }`.
  - `TimelineReact.tsx` envuelve el contenido en `useTina()` (edición visual) y renderiza el slider interactivo.
- **Inserción en la página.** Modificar `src/pages/nosotros/index.astro` para montar `<TimelineReact />` **entre** `ValuesReact` y `StatsReact`, con `client:visible` (sección below-fold).
- **Modelo de datos editable.** Extender el objeto `timeline` en la colección `about`:
  - `tina/config.ts` (objeto `timeline`, ~línea 540): mantener `startYear` / `endYear`, añadir un array `milestones[]` con `{ year, heading }` por hito. El `title` actual se reusa como antítulo/eyebrow opcional de la sección.
  - `src/content/about/index.json`: sembrar 3–4 hitos placeholder (p. ej. 2006, 2012, 2019, 2025) con texto provisional editable.
- **Slider con flechas + autoplay.**
  - Flechas prev/next (estilo Figma: prev tenue, next magenta) que avanzan/retroceden entre hitos.
  - Autoplay cada ~5 s en bucle; se **pausa** al hover y al usar las flechas, y reanuda al salir.
- **Animaciones.**
  - Número de año gigante de fondo con **count-up** numérico al cambiar de hito.
  - Barra de progreso que se llena **proporcional** a la posición del año actual dentro del rango `startYear`–`endYear`.
  - Transición (fade/slide) del heading entre hitos.
  - Respeto de `prefers-reduced-motion`: sin autoplay ni count-up; el año cambia instantáneo y la barra salta.
- **Fondo aproximado en CSS.** Recrear los rayos de luz magenta y el degradado del Figma con gradientes radiales/cónicos + blur (sin replicar las decenas de capas/máscaras), dentro de un contenedor oscuro redondeado (`rounded-[16px]`, fondo `#080618`).
- **Responsive según los dos frames de Figma.**
  - Desktop: año gigante arriba, heading debajo, barra, etiquetas de año, flechas arriba-izquierda.
  - Mobile: heading arriba, año gigante debajo, barra, etiquetas de año, flechas abajo.
- **Etiquetas de extremos** de la barra (`startYear` a la izquierda, `endYear` a la derecha).

**Out of scope (para futuras specs):**

- **Réplica fiel al pixel del fondo de Figma** (todas las capas, máscaras y blends): se hace una aproximación CSS, no la copia exacta.
- **Navegación scroll-driven / pin (efecto scroll de effortel):** se descartó a favor de flechas + autoplay.
- **Contenido histórico real definitivo:** se siembran placeholders; el copy final se carga luego desde el CMS.
- **Campo `description` por hito** (párrafo largo): el Figma solo muestra `year` + `heading`; si se necesita después, va en otra spec.
- **Cálculo automático del "X años"** en el heading: el texto del heading es libre en el CMS (el editor escribe el número que quiera).
- **Animar también la página Home u otras secciones** con este patrón: esta spec solo toca `/nosotros`.

---

## Data model

Esta spec **no crea una colección nueva**: extiende el objeto `timeline` dentro de la colección `about` (ya existente en `tina/config.ts` y `src/content/about/index.json`). El único dato nuevo es el array `milestones[]`.

### 1. Schema en `tina/config.ts` (objeto `timeline`, ~línea 540)

```js
// Antes:
{
  name: "timeline",
  // ...
  fields: [
    { name: "title", label: "Título", type: "string" },
    { name: "startYear", label: "Año inicio", type: "string" },
    { name: "endYear", label: "Año fin", type: "string" },
  ],
}

// Después: se conservan title/startYear/endYear y se añade milestones[]
{
  name: "timeline",
  // ...
  fields: [
    { name: "title", label: "Antítulo (eyebrow)", type: "string" }, // reusado
    { name: "startYear", label: "Año inicio (etiqueta barra)", type: "string" },
    { name: "endYear", label: "Año fin (etiqueta barra)", type: "string" },
    {
      name: "milestones",
      label: "Hitos",
      type: "object",
      list: true,
      ui: { itemProps: (i) => ({ label: i?.year || "Hito" }) },
      fields: [
        { name: "year", label: "Año", type: "string" },
        { name: "heading", label: "Texto del hito", type: "string", ui: { component: "textarea" } },
      ],
    },
  ],
}
```

### 2. Contenido en `src/content/about/index.json` (objeto `timeline`)

```jsonc
"timeline": {
  "title": "Nuestra historia",            // antítulo/eyebrow (opcional)
  "startYear": "2006",                     // etiqueta izquierda de la barra
  "endYear": "2025",                       // etiqueta derecha de la barra
  "milestones": [
    { "year": "2006", "heading": "Más de X años construyendo la red que conecta a las empresas del Perú" },
    { "year": "2012", "heading": "Placeholder: expansión de la red de fibra óptica a nivel nacional" },
    { "year": "2019", "heading": "Placeholder: consolidación como referente B2B en conectividad" },
    { "year": "2025", "heading": "Placeholder: red propia presente en 92 ciudades del Perú" }
  ]
}
```

### 3. Tipos en runtime (`TimelineReact.tsx`)

```ts
interface Milestone {
  year?: string | null;
  heading?: string | null;
}

interface TimelineProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
}
```

**Convenciones:**

- `year` se guarda como `string` en el CMS (coherente con `startYear`/`endYear`), pero el count-up lo parsea a `number` con `parseInt`; si no es numérico, se muestra tal cual sin animar.
- **Posición de la barra** = `(yearActual − startYear) / (endYear − startYear)`, recortada a `[0, 1]`.
- Fallback chain como en `ValuesReact`: `useTina` data → `initialData`; si `milestones` está vacío, el componente retorna `null` (no rompe la página).
- Índice activo en estado local (`useState`), arranca en `0`.

---

## Implementation plan

1. **Extender el schema `timeline` en `tina/config.ts`.** Añadir el array `milestones[]` (`{ year, heading }`) y reetiquetar `title`/`startYear`/`endYear` como en el modelo de datos. Test manual: `npm run dev` levanta sin errores y en `/admin` → colección About → Timeline aparecen los campos nuevos.

2. **Sembrar los hitos en `src/content/about/index.json`.** Añadir el array `milestones[]` con los 3–4 placeholders. Test manual: el JSON valida contra el schema (sin warnings de Tina en consola).

3. **Crear `src/components/nosotros/Timeline.astro` (esqueleto).** Copiar el patrón de `Values.astro`: consulta `client.queries.about({ relativePath: 'index.json' })` y renderiza `<TimelineReact client:visible ... />`. Test manual: importable sin error.

4. **Crear `src/components/nosotros/TimelineReact.tsx` — estructura estática.** `useTina()` + fallback chain, leer `timeline` y `milestones`, retornar `null` si no hay hitos. Renderizar el layout del primer hito **sin interacción**: contenedor oscuro, año gigante de fondo, heading, barra de progreso (posición fija del hito 0), etiquetas `startYear`/`endYear`, flechas. Aplicar `data-tina-field` en heading/año para edición visual. Test manual: la sección se ve estática y parecida al Figma (desktop).

5. **Montar la sección en `src/pages/nosotros/index.astro`.** Insertar `<TimelineReact client:visible ... />` entre `ValuesReact` y `StatsReact`, pasando el `aboutQuery`. Test manual: en `/nosotros` la sección aparece en su posición, debajo de Valores.

6. **Estado activo + navegación por flechas.** `useState` para el índice; flechas prev/next que incrementan/decrementan con wrap-around; barra y heading reaccionan al índice. Estilos de flecha del Figma (prev tenue, next magenta). Test manual: clic en flechas cambia hito, año y posición de barra.

7. **Animación de la barra de progreso.** Transición CSS de `width` según `(year − startYear)/(endYear − startYear)`, con degradado magenta. Test manual: al navegar, la barra se desplaza suavemente a la nueva posición.

8. **Count-up del año gigante.** Hook que interpola el número del hito anterior al nuevo con `requestAnimationFrame` (o equivalente); fade/slide del heading en paralelo. Test manual: al cambiar de hito el número cuenta (2006→2012) y el heading transiciona.

9. **Autoplay con pausa.** `setInterval` ~5 s que avanza al siguiente hito; se pausa en `mouseenter` y al usar flechas, reanuda en `mouseleave`; limpieza en `useEffect`. Test manual: la sección avanza sola; hover la detiene; salir del hover la reanuda.

10. **`prefers-reduced-motion`.** Detectar la media query; si está activa: desactivar autoplay y count-up, cambiar año/heading instantáneo y barra sin transición. Test manual: con reduce-motion activado en el SO, no hay autoplay ni conteo.

11. **Fondo aproximado en CSS.** Recrear rayos de luz magenta + degradado con gradientes radiales/cónicos y blur dentro del contenedor redondeado. Test manual: comparar contra `references/nosotros-historia.png` (desktop). **Punto de decisión del fondo:** si el parecido no es aceptable, aplicar el Plan B (imagen exportada de Figma; ver Decisiones/Riesgos).

12. **Responsive mobile.** Reordenar a layout del frame mobile (heading arriba, año debajo, barra, etiquetas, flechas abajo) con utilidades Tailwind. Test manual: en viewport ~390px coincide con `references/nosotros-historia-mob.png`.

**Notas del plan:**

- Cada paso deja el sitio ejecutable (`npm run dev`) y es commitable por separado.
- Los pasos 1–5 dejan la sección visible aunque estática; 6–12 añaden interacción/animación de forma incremental.
- La verificación visual contra Figma se hace con Playwright MCP (screenshots en `.playwright-screens/`) según convención del proyecto.

---

## Acceptance criteria

- [ ] `npm run dev` y `npm run build` terminan sin errores ni warnings nuevos en consola.
- [ ] En `/admin` → colección **About** → **Timeline** aparecen `startYear`, `endYear`, el antítulo y la lista editable de **Hitos**, cada uno con **Año** y **Texto del hito**.
- [ ] Agregar, reordenar o eliminar un hito en el CMS se refleja en la sección sin tocar código.
- [ ] La sección Historia aparece en `/nosotros` **entre** Valores y Stats.
- [ ] Si `milestones` está vacío, la sección no se renderiza (la página no rompe).
- [ ] Al cargar, se muestra el primer hito: año gigante de fondo, su heading, barra en la posición correspondiente y etiquetas `startYear`/`endYear` en los extremos.
- [ ] Clic en la flecha **next** avanza al siguiente hito; en la **última** posición vuelve al primero (wrap-around).
- [ ] Clic en la flecha **prev** retrocede; en el **primer** hito salta al último.
- [ ] Al cambiar de hito, el número de año hace **count-up** desde el valor anterior hasta el nuevo.
- [ ] La barra de progreso se posiciona proporcional a `(year − startYear)/(endYear − startYear)` y anima su ancho al navegar.
- [ ] El heading transiciona (fade/slide) al cambiar de hito.
- [ ] El **autoplay** avanza solo cada ~5 s en bucle.
- [ ] El autoplay se **pausa** al hacer hover sobre la sección o al usar las flechas, y **reanuda** al salir del hover.
- [ ] Con `prefers-reduced-motion: reduce` activo: no hay autoplay ni count-up; el año y el heading cambian instantáneo y la barra no anima.
- [ ] En desktop el layout coincide con `references/nosotros-historia.png` (año arriba, heading debajo, barra, etiquetas, flechas arriba-izquierda).
- [ ] En mobile (~390px) el layout coincide con `references/nosotros-historia-mob.png` (heading arriba, año debajo, barra, etiquetas, flechas abajo).
- [ ] El fondo (rayos magenta + degradado) se aproxima visualmente al Figma sin usar imágenes exportadas (o, si se activó el Plan B, usa la imagen exportada y luce fiel a la referencia).
- [ ] El heading y el año son editables visualmente desde el panel de Tina (`data-tina-field`).

---

## Decisiones

- **Sí:** hitos editables como `milestones[]` en la colección `about`. Es lo que justifica el slider y permite cargar el copy histórico real luego sin tocar código.
- **No:** hitos hardcodeados en el componente. Obligaría a un deploy por cada cambio de texto; rompe el patrón CMS-driven del proyecto.
- **No:** colección nueva para la historia. El dato pertenece conceptualmente a "About"; extender `timeline` evita una colección extra y una query adicional.
- **Sí:** navegación por flechas + autoplay con pausa al hover/interacción. Coincide con el Figma, es accesible y no secuestra el scroll.
- **No:** navegación scroll-driven / pin (efecto de effortel). Choca con el smooth-scroll Lenis ya integrado en `BaseLayout`, es más frágil en mobile y aporta complejidad que el Figma no exige.
- **Sí:** count-up del año + barra proporcional al rango `startYear`–`endYear`. Reproduce la sensación de la referencia effortel.
- **Sí:** conservar `startYear`/`endYear` como etiquetas fijas de los extremos de la barra, separadas de los `year` de cada hito. Permite que la barra muestre el rango completo aunque el primer/último hito no coincidan con los extremos.
- **No:** derivar los extremos de la barra del primer/último hito. Acopla las etiquetas a los datos y quita control editorial sobre el rango mostrado.
- **Sí:** aproximación CSS del fondo (gradientes + blur) como **primera opción**. Mucho más liviana y mantenible que replicar capas o cargar un PNG.
- **Plan B:** si la aproximación CSS no alcanza un parecido aceptable contra `references/nosotros-historia.png`, exportar el fondo desde Figma como imagen (AVIF/WebP optimizado) y usarla como `background` del contenedor. Se evalúa en el paso 11 del plan.
- **No (a menos que falle el Plan B):** réplica fiel en código de todas las capas/máscaras del Figma. Solo se consideraría si ni el CSS ni la imagen exportada dan resultado, y aun así iría en otra spec por su costo.
- **Sí:** reusar `title` como antítulo/eyebrow opcional en lugar de eliminarlo. Evita una migración destructiva del JSON y deja un slot de texto útil.
- **Sí:** respetar `prefers-reduced-motion`. Accesibilidad; consistente con buenas prácticas de animación.
- **No:** campo `description` (párrafo) por hito en esta spec. El Figma solo muestra `year` + `heading`; añadirlo ahora sería diseñar a ciegas.
- **No:** cálculo automático del "X años" en el heading. El texto del hito es libre en el CMS; calcularlo añadiría lógica frágil por un detalle de copy.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La aproximación CSS del fondo no se parece lo suficiente al Figma. | Plan B definido: exportar el fondo desde Figma como imagen optimizada (AVIF/WebP) y usarla de `background`. Se decide en el paso 11 comparando contra `references/nosotros-historia.png`. |
| El autoplay (`setInterval`) sigue corriendo tras desmontar el componente o al cambiar de pestaña. | Limpiar el intervalo en el `useEffect` y pausar con la API de visibilidad / al perder hover; reanudar solo si no hay `prefers-reduced-motion`. |
| El count-up usa `requestAnimationFrame` y puede sumar instancias al navegar rápido entre hitos. | Cancelar el frame anterior antes de iniciar uno nuevo; si reduce-motion está activo, saltar directo al valor final. |
| Años no numéricos en el CMS (p. ej. "circa 2006") rompen el count-up o el cálculo de la barra. | `parseInt` con guarda: si `NaN`, mostrar el año tal cual sin animar y posicionar la barra en el extremo más cercano. |
| `endYear === startYear` (o mal configurados) provoca división por cero en la barra. | Recortar la posición a `[0, 1]` y, si el rango es 0, fijar la barra al 100%. |
| El autoplay puede competir con el smooth-scroll Lenis o resultar molesto. | Es solo cambio de contenido (no scroll), intervalo de ~5 s y pausa al hover; reduce-motion lo desactiva por completo. |

---

## Lo que **no** entra en esta spec

- Réplica fiel al pixel del fondo de Figma (capas/máscaras/blends exactos).
- Navegación scroll-driven / pin.
- Contenido histórico real definitivo (se usan placeholders).
- Campo `description` (párrafo) por hito.
- Cálculo automático del "X años" en el heading.
- Aplicar este patrón de timeline en Home u otras páginas.

Cada uno, si llega a hacerse, va en su propia spec.
