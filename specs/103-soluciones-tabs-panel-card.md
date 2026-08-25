# SPEC 103 — Soluciones: panel de categorías con tabs, flechas laterales y card visual

> **Estado:** Implementado
> **Depende de:** SPEC 89 (bloque scroll-jack actual y modelo `home.services.items[].bullets`), SPEC 94 (`SliderSideArrows` compartido), SPEC 90 (patrón de íconos con set fijo → `react-icons`), SPEC 80 (i18n `_en` + `tField`), SPEC 99 (ajustes QA del bloque actual)
> **Fecha:** 2026-08-25
> **Objetivo:** Reemplazar el bloque scroll-jack de soluciones por una sección de alto normal con píldoras de categoría con ícono, panel de detalle animado (título, tagline, descripción, checklist de subservicios en dos columnas y CTA) y card visual a la derecha, navegable por tabs, flechas circulares a los costados y arrastre, en las 3 pantallas que hoy montan `SolucionesScroll`.

---

## Sección 1 — Por qué existe este spec

El bloque actual (`SolucionesScroll`, SPEC 89 + ajustes de SPEC 99) ancla el scroll (scroll-jack) para recorrer las 4 categorías. Aun con los ajustes de agilidad de la SPEC 99, sigue secuestrando el scroll en tres pantallas distintas (Home, `/soluciones`, `/soporte-tecnico`) y obliga al usuario a atravesar todas las categorías para pasar a la siguiente sección.

El cliente trajo una referencia visual (captura adjunta al pedido): píldoras de categoría con ícono arriba, una card grande con el detalle de la categoría activa a la izquierda (título, línea de color, párrafo, checklist de subservicios en dos columnas y botón "Conoce más") y una card visual a la derecha (ícono grande sobre degradado, eyebrow monoespaciado y nombre de la categoría), con **flechas circulares superpuestas a los costados** de la card. Este spec replica ese **layout y sus animaciones**, no su paleta: la referencia es verde sobre fondo claro y aquí se adapta a la identidad Fiberlux (near-black + magenta).

## Alcance

**Dentro:**

- **Componente nuevo** `src/components/shared/SolucionesPanel.astro` + `SolucionesPanelReact.tsx`, alimentado por la misma query `home` (`home.services`) y con la misma firma de props que `SolucionesScroll` (`query` / `variables` / `data` / `locale`).
- **Montaje en las 3 pantallas** que hoy usan `SolucionesScroll`: `src/pages/index.astro`, `src/pages/soluciones/index.astro`, `src/pages/soporte-tecnico/index.astro`. Los wrappers `/en` heredan el cambio (reexportan la página ES).
- **Sección de alto normal:** se elimina el scroll-jack (track alto + panel `sticky`). La sección ocupa su alto natural y el scroll de la página nunca queda anclado.
- **Tira de píldoras de categoría** (tabs) arriba del panel: ícono + nombre de la categoría, estado activo destacado (magenta) con **indicador deslizante** entre píldoras. Scroll horizontal con máscara en mobile.
- **Panel de detalle** (card oscura/glass, esquinas redondeadas grandes) en dos columnas en `lg+`:
  - **Izquierda:** título de la categoría (`title`), tagline en magenta (`description`), párrafo (`body`, campo nuevo), checklist de subservicios en **dos columnas** con ícono de check, y botón "Conoce más" → `url` de la categoría.
  - **Derecha:** card visual con degradado magenta, capas de cuadrados rotados de fondo, ícono grande de la categoría, eyebrow monoespaciado (`eyebrow`, campo nuevo) y nombre de la categoría.
- **Flechas circulares a los costados** de la card, centradas verticalmente y superpuestas sobre sus bordes, reusando `shared/SliderSideArrows.tsx` (SPEC 94). Con wrap (de la última vuelve a la primera).
- **Arrastre horizontal** (pointer drag) sobre el panel para cambiar de categoría, además de tabs y flechas. Soporte de teclado: flechas ←/→ sobre la tira de tabs (`role="tablist"`).
- **Animaciones de cambio de categoría (nivel completo, direccional):**
  - Indicador deslizante de la píldora activa.
  - Columna izquierda: crossfade + slide **según la dirección** del cambio (título, tagline, párrafo).
  - Checklist: entrada en **stagger** de cada ítem.
  - Card visual: entrada con escala + blur, **flotación** continua sutil y **tilt 3D** siguiendo al cursor (solo `pointer: fine`).
  - Todo bajo `prefers-reduced-motion: reduce` → cambio instantáneo sin animación, sin flotación ni tilt.
- **Enlaces del checklist:** cada ítem con `url` navega a la página del subservicio y conserva el **tooltip "Ver más" con delay que persigue al cursor** (SPEC 89, solo `pointer: fine`). Ítem sin `url` = texto plano no clicable, sin tooltip.
- **Campos nuevos en Tina** (ver Modelo de datos): `items[].tabIcon`, `items[].body` / `body_en`, `items[].eyebrow` / `eyebrow_en`, con contenido sembrado para las 4 categorías.
- **i18n:** todo el texto se lee con `tField` (`_en` con fallback ES); los strings fijos de UI ("Conoce más", "Ver más", `aria-label` de las flechas) vía `t()` de `src/i18n/ui.ts` o el patrón local ya usado en el bloque actual.
- **`SolucionesScroll.astro` / `SolucionesScrollReact.tsx` se conservan en el repo** (compilando, sin montar), igual que se hizo con `SolucionesSlider` en la SPEC 89.

**Fuera de alcance (specs futuros):**

- Rediseñar las páginas de categoría (`/soluciones/*`) o de subservicio destino.
- Leer los subservicios del catálogo real (`src/content/services/*.json`); se sigue usando `home.services.items[].bullets`.
- Autoplay por tiempo del panel.
- Traducir los `_en` de los campos nuevos (`body_en`, `eyebrow_en`): se dejan sembrados o vacíos y los completa el cliente en Tina.
- Eliminar `SolucionesScroll`, `SolucionesSlider` o `StickyCards` del repo.
- Cambiar la paleta de la sección a fondo claro como la referencia.
- Editabilidad en Tina de los parámetros de animación (viven en un `PARAMS` del componente).

---

## Modelo de datos

Se **extiende** `home.services.items[]` con tres campos nuevos. No se crean colecciones ni se migra nada existente: `number`, `title`, `description`, `icon`, `bullets` y `url` se mantienen tal cual.

Reasignación de roles (sin renombrar campos):

| Campo | Rol en el bloque nuevo |
| --- | --- |
| `title` / `title_en` | Título grande de la categoría (izquierda) y nombre en la card visual |
| `description` / `description_en` | **Tagline** magenta bajo el título (frase corta, ya lo es hoy) |
| `body` / `body_en` (**nuevo**) | Párrafo descriptivo bajo el tagline |
| `eyebrow` / `eyebrow_en` (**nuevo**) | Texto monoespaciado en la card visual (ej. `RED · NOC 24/7`) |
| `tabIcon` (**nuevo**) | Ícono de la píldora y de la card visual (set fijo → `react-icons/fa6`) |
| `icon` | Sin uso en este bloque (se conserva para `SolucionesScroll`/`SolucionesSlider`) |
| `number` | Sin uso visible en este bloque (se conserva) |
| `bullets[]` | Checklist de subservicios (`label` / `label_en` / `url`) |

Schema en `tina/config.ts` — se añaden dentro de `home.services.items[]`:

```js
{
  name: "tabIcon",
  label: "Ícono de categoría",
  type: "string",
  options: [
    { value: "rayo",      label: "Rayo / Conectividad" },
    { value: "escudo",    label: "Escudo / Seguridad" },
    { value: "nube",      label: "Nube / Cloud" },
    { value: "engranaje", label: "Engranajes / Servicios gestionados" },
    { value: "red",       label: "Red / Nodos" },
    { value: "servidor",  label: "Servidor / Data Center" },
    { value: "globo",     label: "Globo / Cobertura" },
    { value: "soporte",   label: "Soporte / NOC" },
    { value: "datos",     label: "Datos / Base de datos" },
    { value: "wifi",      label: "Wi-Fi / Inalámbrico" },
  ],
},
{ name: "body",    label: "Descripción larga",      type: "string", ui: { component: "textarea" } },
{ name: "body_en", label: "Descripción larga (EN)", type: "string", ui: { component: "textarea" } },
{ name: "eyebrow",    label: "Etiqueta de la card (mono)",      type: "string" },
{ name: "eyebrow_en", label: "Etiqueta de la card (mono) (EN)", type: "string" },
```

Mapa `tabIcon` → glifo, hardcodeado en el componente (patrón de `RubrosReact`, SPEC 90):

```ts
const ICONS = {
  rayo: FaBolt, escudo: FaShieldHalved, nube: FaCloud, engranaje: FaGears,
  red: FaNetworkWired, servidor: FaServer, globo: FaGlobe,
  soporte: FaHeadset, datos: FaDatabase, wifi: FaWifi,
} as const;
// valor ausente o desconocido → FaBolt
```

Contenido sembrado en `src/content/home/index.json` (4 categorías):

- `tabIcon`: `conectividad → rayo`, `ciberseguridad → escudo`, `cloud/data center → nube`, `servicios gestionados → engranaje`.
- `body`: se siembra desde `src/content/services/<categoria>.json → hero.intro` (y `body_en` desde `hero.intro_en`, que ya existe traducido).
- `eyebrow`: frase corta técnica por categoría (ej. `RED · NOC 24/7`); `eyebrow_en` se deja vacío (fallback ES) salvo que la traducción sea obvia.

Convenciones que se mantienen de la SPEC 89: las `url` se prefijan con `BASE_URL` (`withBase`); el ítem sin `url` no es clicable; la lectura i18n es siempre por `tField`.

---

## Plan de implementación

Cada paso deja el sitio compilando y funcional.

1. **Schema Tina.** Añadir `tabIcon`, `body`/`body_en` y `eyebrow`/`eyebrow_en` en `home.services.items[]` de `tina/config.ts`. Correr `npm run dev` una vez para regenerar `tina/__generated__/`. *Estado: admin muestra los campos nuevos; nada cambia en pantalla.*

2. **Sembrar contenido.** Rellenar los tres campos en las 4 categorías de `src/content/home/index.json` según el Modelo de datos (`body` desde `services/*.json → hero.intro`). *Estado: contenido válido, aún sin consumidor.*

3. **Esqueleto del panel.** Crear `SolucionesPanel.astro` (resuelve la query `home` + `locale`, copia de `SolucionesScroll.astro`, `client:visible`) y `SolucionesPanelReact.tsx` que renderiza estático la **categoría 0**: tira de píldoras, card oscura con dos columnas (texto + checklist a la izquierda, card visual a la derecha) y botón "Conoce más". Sin navegación ni animación. *Estado: bloque correcto para una categoría, todavía no montado.*

4. **Navegación por tabs.** Estado `activeIndex` + `dir` (dirección del último cambio, `+1` / `-1`). Click en píldora cambia de categoría; `role="tablist"` / `role="tab"` con `aria-selected` y navegación por ←/→. *Estado: las 4 categorías se pueden recorrer por tabs.*

5. **Flechas laterales.** Montar `SliderSideArrows` como hermano del panel dentro de un wrapper `relative` (no hijo de ningún `overflow-hidden`), con wrap circular (`canPrev`/`canNext` siempre `true`) y `aria-label` localizados. En `<lg` las flechas no se muestran (comportamiento del componente); ahí navegan tabs y arrastre. *Estado: navegación por flechas en desktop.*

6. **Arrastre horizontal.** Handlers de `pointerdown/move/up` sobre el panel: umbral (~60px) para disparar el cambio de categoría, sin bloquear el scroll vertical (`touch-action: pan-y`). *Estado: se puede pasar de categoría arrastrando.*

7. **Animaciones de cambio (direccionales).** Indicador deslizante de la píldora activa (medición del `offsetLeft`/`offsetWidth` del tab activo), crossfade + slide direccional de título/tagline/párrafo (`key={activeIndex}` + `dir`), stagger del checklist, y entrada de la card visual con escala + blur. Palancas en un objeto `PARAMS` del componente. *Estado: el cambio se percibe animado y con dirección.*

8. **Vida de la card visual.** Flotación continua sutil y tilt 3D siguiendo al cursor (solo `matchMedia('(pointer: fine)')`), con capas de cuadrados rotados de fondo y glow magenta. *Estado: la card visual tiene vida propia.*

9. **Tooltip "Ver más".** Portar el tooltip con delay (~140ms) y persecución del cursor con lerp desde `SolucionesScrollReact`, aplicado a los ítems del checklist con `url` y solo en `pointer: fine`. *Estado: paridad con el bloque anterior.*

10. **`prefers-reduced-motion`.** Guardar todas las animaciones (slide, stagger, flotación, tilt, indicador) tras el media query; con `reduce` el cambio es instantáneo y no queda ningún `rAF` corriendo. *Estado: accesible.*

11. **Responsive.** `<lg`: una columna — tabs con scroll horizontal y máscara de degradado, card visual arriba o debajo del texto según legibilidad, checklist a una columna, flechas ocultas (navegación por tabs/arrastre). Verificar que las flechas de desktop no generen scroll horizontal en anchos grandes. *Estado: funciona en mobile y tablet.*

12. **Montaje y limpieza.** Reemplazar `SolucionesScroll` por `SolucionesPanel` en `src/pages/index.astro`, `src/pages/soluciones/index.astro` y `src/pages/soporte-tecnico/index.astro`, dejando el comentario de trazabilidad (`StickyCards → SolucionesSlider (35) → SolucionesScroll (89) → SolucionesPanel (103)`). `SolucionesScroll(.astro/React)` queda en el repo sin montar. *Estado: las 3 pantallas muestran el bloque nuevo.*

13. **Build y QA visual.** `npm run build` en verde; revisar Home, `/soluciones`, `/soporte-tecnico` y sus `/en` en desktop y mobile.

---

## Criterios de aceptación

- [ ] `npm run build` pasa sin errores ni warnings de tipos de Tina. *(Pendiente: `tinacms build` hace cloud-check contra TinaCloud y falla hasta que el schema nuevo llegue a GitHub. Verificado el equivalente local, ver nota.)*
- [x] Home, `/soluciones` y `/soporte-tecnico` (y sus `/en`) muestran el bloque nuevo; ninguna monta ya `SolucionesScroll`.
- [x] Al hacer scroll sobre la sección, **el scroll nunca queda anclado**: la página atraviesa la sección de corrido.
- [x] La tira de píldoras muestra las 4 categorías, cada una con su ícono según `tabIcon`, y la activa está destacada con un indicador que **se desliza** al cambiar.
- [x] Click en una píldora cambia la categoría mostrada en el panel (título, tagline, párrafo, checklist, CTA y card visual).
- [x] En `lg+` hay dos flechas circulares magenta superpuestas a los costados del panel, centradas verticalmente, que avanzan/retroceden con wrap (de la 4ª a la 1ª y viceversa).
- [x] Las flechas no quedan recortadas ni generan scroll horizontal en pantallas anchas.
- [x] Arrastrar horizontalmente el panel cambia de categoría; el arrastre no bloquea el scroll vertical en táctil.
- [x] Con la tira de tabs enfocada, ←/→ cambian de categoría (`role="tablist"`, `aria-selected` correcto).
- [x] El cambio de categoría es **direccional**: al ir hacia adelante el contenido entra desde el lado opuesto que al ir hacia atrás.
- [x] Los ítems del checklist entran en stagger (no todos a la vez) y se muestran en dos columnas en `lg+`.
- [x] La card visual muestra ícono grande, `eyebrow` en tipografía mono y el nombre de la categoría; flota sutilmente y hace tilt 3D siguiendo al cursor en punteros finos.
- [x] En táctil (`pointer: coarse`) no hay tilt ni tooltip.
- [x] Hover en un ítem del checklist con `url` muestra el tooltip "Ver más" tras un breve delay y persigue al cursor con retraso; click navega al subservicio (con `BASE_URL`).
- [ ] Un ítem sin `url` se renderiza como texto plano no clicable y sin tooltip. *(Solo verificado en código: las 4 categorías tienen `url` en todos sus subservicios, no hay caso real que observar.)*
- [x] "Conoce más" navega a la `url` de la categoría activa.
- [x] En `/en/...` todos los textos leen `_en` con fallback a ES; el tooltip dice "See more" y el CTA "Learn more".
- [x] Con `prefers-reduced-motion: reduce` el cambio de categoría es instantáneo y no hay flotación, tilt ni `rAF` activos.
- [x] En mobile el bloque es de una columna, las tabs scrollean horizontalmente y todo es legible sin cortes.
- [x] `SolucionesScroll(.astro/React)` y `SolucionesSlider(.astro/React)` siguen en el repo y compilan.

**Verificación (25/08/2026).** Build local en verde con `npx tinacms dev -c "astro build"` (116 páginas, exit 0; los warnings de `glob-loader` son preexistentes). `npm run build` **no** se pudo correr: su `tinacms build` hace cloud-check contra TinaCloud y falla con "local GraphQL schema doesn't match remote" hasta que los campos nuevos llegan a GitHub — hay que verificarlo en el CI tras el push.

QA sobre el build de producción servido con `astro preview`, en 1440×900, 1920×1000 y 390×844: tabs, flechas, teclado y arrastre con wrap en ambos sentidos; indicador deslizante alineado al `offsetLeft` del tab activo; tooltip oculto antes del delay, visible con "Ver más" y persiguiendo al cursor después, oculto al salir; tilt 3D que se aplica y se resetea; sin scroll horizontal a 1920px. En un contexto táctil (`pointer: coarse`, iPad 820×1180): sin tilt y con el tooltip en opacidad 0; el clic en un ítem del checklist navega a la página del subservicio. Con `prefers-reduced-motion: reduce` emulado: todas las animaciones en `animation-name: none`, indicador sin transición, tilt sin aplicar y el cambio de categoría sigue funcionando. La sección mide 991px de alto en un viewport de 1000px y el único elemento `fixed` es el tooltip: no hay pin.

Los 3 errores de consola en `/soluciones` son de Cloudflare Turnstile contra `localhost`, ajenos a este bloque. `SolucionesScrollReact` y `SolucionesSliderReact` siguen en el repo y transpilan (`esbuild`); no hay typecheck completo porque el proyecto no tiene `@astrojs/check` instalado.

**Pendiente para el cliente / próximo spec.** Los enlaces del checklist apuntan a la ruta ES incluso en `/en` (paridad con `SolucionesScroll`, que tampoco los localizaba); localizarlos con `localizeHref` queda fuera de este spec.

---

## Decisiones

- **Definición rápida sin ronda de aclaración extendida.** El cliente pidió asumir el resto tras dos bloques de preguntas; las decisiones abiertas se resolvieron con la recomendación por defecto y quedan registradas aquí.
- **Sí:** reemplazar en las **3 pantallas** con un único componente compartido. Mantener dos bloques distintos de soluciones conviviendo duplicaría el mantenimiento.
- **Sí:** **eliminar el scroll-jack**. Era el principal reclamo del bloque anterior (secuestra el scroll en tres pantallas) y la referencia no lo tiene.
- **No:** autoplay por tiempo. La sección tiene mucho texto por categoría; rotar sola obliga a leer contrarreloj.
- **Sí:** **reusar `description` como tagline** y añadir `body` para el párrafo, en vez de crear `tagline` + `body`. El `description` actual ya es una frase corta de una línea: encaja en el rol sin migrar contenido.
- **Sí:** `tabIcon` como **set cerrado de opciones** mapeado a `react-icons/fa6` (patrón de Rubros, SPEC 90), en vez de reusar `items[].icon` (hoy las 4 categorías apuntan al mismo `onda-magenta.svg`, se verían idénticas) y en vez de subir imágenes (el cliente tendría que producir 4 assets).
- **Sí:** adaptar a la **paleta de marca** (near-black + magenta, card glass) replicando el layout y las animaciones de la referencia, no su verde sobre fondo claro. Un bloque claro rompería la continuidad del Home.
- **Sí:** conservar el **tooltip "Ver más"** de la SPEC 89. Es un patrón ya establecido en el sitio y el checklist sigue siendo navegable.
- **Sí:** reusar `SliderSideArrows` (SPEC 94) en vez de flechas propias, para que el control se vea igual que en los 7 carruseles del sitio.
- **Sí:** conservar `SolucionesScroll` en el repo sin montar, como se hizo con `SolucionesSlider`. Revertir es cambiar un import.
- **No:** leer los subservicios del catálogo real (`services/*.json`). Se mantiene el criterio de la SPEC 89: el cliente edita todo desde `home.services`.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Al quitar el track alto, las 3 páginas pierden ~3 viewports de scroll y el ritmo de la página cambia | Revisar el espaciado vertical de las secciones vecinas en las 3 pantallas durante el QA visual (paso 13). |
| El arrastre horizontal compite con el scroll vertical en táctil | `touch-action: pan-y` y umbral de disparo por eje dominante (solo si `|dx| > |dy|`). |
| Categorías con listas de subservicios de distinto largo hacen "saltar" el alto del panel al cambiar | Fijar un `min-height` del panel calculado sobre la categoría más larga (o `grid` con áreas de alto estable). |
| Las flechas laterales generan scroll horizontal en anchos grandes | Reusar el `offset` responsive por `clamp()` de `SliderSideArrows` y verificar contra el contenedor global (criterio de aceptación explícito). |
| Los campos nuevos vacíos en Tina dejan huecos visibles | `body` vacío → se oculta el párrafo; `eyebrow` vacío → se oculta la línea mono; `tabIcon` ausente → glifo por defecto (`FaBolt`). |
| Tilt 3D + flotación + stagger en tres pantallas afectan el rendimiento | Todo por CSS transforms sobre pocos nodos, sin `rAF` continuo salvo el tilt (activo solo en hover y `pointer: fine`), y desactivado con `reduce`. |

---

## Lo que **no** entra en este spec

- Rediseñar las páginas de categoría o de subservicio destino.
- Leer los subservicios del catálogo real de cada solución.
- Autoplay por tiempo del panel.
- Traducir al inglés los campos nuevos (`body_en`, `eyebrow_en`) más allá de lo sembrado; los completa el cliente en Tina.
- Eliminar del repo `SolucionesScroll`, `SolucionesSlider` o `StickyCards`.
- Cambiar la sección a fondo claro como la referencia.
- Exponer los parámetros de animación en Tina.
