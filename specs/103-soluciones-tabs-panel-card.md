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
- **Tira de chips de categoría** (tabs) arriba del panel: ícono + nombre corto (`tabLabel`, con fallback al `title`), estado activo destacado con borde magenta e **indicador deslizante** entre chips. Scroll horizontal con máscara en mobile.
- **Encabezado de sección:** eyebrow `[ SOLUCIONES ]` (string de UI, localizado) + título grande `h2` con `services.title` del CMS.
- **Panel de detalle** presentado como **stack de tarjetas**: dos capas redondeadas, casi tan altas como la activa, escalonadas +22px y +44px a la derecha (la más lejana más apagada), asoman detrás del panel. Panel partido en dos mitades **56/44** en `lg+`, con alto mínimo (`min-h-[620px]`, el de la categoría más larga) y contenido centrado verticalmente para que el alto no salte entre categorías:
  - **Izquierda:** título de la categoría (`title`), descripción corta (`description`), subservicios como **chips** (píldora plum con punto rosado `brand-purple-light`) y CTA **tipo link rosado** "Conoce más →" (no botón relleno) → `url` de la categoría.
  - **Derecha:** mitad **a sangre** con degradado magenta, capas de cuadrados rotados translúcidos y el ícono de la categoría en un tile claro. Sin textos dentro de la card.
- **Flechas circulares a los costados** de la card, centradas verticalmente y superpuestas sobre sus bordes, reusando `shared/SliderSideArrows.tsx` (SPEC 94). Con wrap (de la última vuelve a la primera).
- **Arrastre horizontal** (pointer drag) sobre el panel para cambiar de categoría, además de tabs y flechas. Soporte de teclado: flechas ←/→ sobre la tira de tabs (`role="tablist"`).
- **Animaciones de cambio de categoría (nivel completo, direccional):**
  - Indicador deslizante de la píldora activa.
  - **Barrido de luz (scan)**: al cambiar de categoría una línea de luz con glow magenta y estela cruza el panel; la tarjeta anterior se mantiene encima, opaca, y se **recorta** (`clip-path`) exactamente sobre el borde del barrido, revelando la nueva que ya está debajo, quieta. La dirección se invierte al retroceder. Sin crossfade: nunca se ven los dos textos superpuestos.
  - **Pulso del ícono** cuando el barrido llega a la mitad visual.
  - Chips de subservicio: entrada en **stagger**.
  - Mitad visual: **dos** cuadrados rotados translúcidos detrás del ícono (no más); el cúmulo **flota** de forma continua y hace **tilt 3D** siguiendo al cursor (solo `pointer: fine`).
  - Todo bajo `prefers-reduced-motion: reduce` → cambio instantáneo sin animación, sin flotación ni tilt.
- **Enlaces de los chips:** cada chip con `url` navega a la página del subservicio y conserva el **tooltip "Ver más" con delay que persigue al cursor** (SPEC 89, solo `pointer: fine`). Chip sin `url` = chip no clicable, sin tooltip.
- **Campos nuevos en Tina** (ver Modelo de datos): `items[].tabIcon` (sembrado para las 4 categorías) y `items[].tabLabel` / `tabLabel_en` (nombre corto del chip, opcional, lo rellena el cliente; vacío ⇒ título completo).
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
| `description` / `description_en` | Descripción corta bajo el título |
| `tabLabel` / `tabLabel_en` (**nuevo**) | Nombre corto del chip de categoría; vacío ⇒ se usa `title` |
| `tabIcon` (**nuevo**) | Ícono del chip y de la mitad visual (set fijo → `react-icons/fa6`) |
| `icon` | Sin uso en este bloque (se conserva para `SolucionesScroll`/`SolucionesSlider`) |
| `number` | Sin uso visible en este bloque (se conserva) |
| `bullets[]` | Chips de subservicio (`label` / `label_en` / `url`) |

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
  { value: "personas", label: "Personas / Equipo gestionado" },
    { value: "red",       label: "Red / Nodos" },
    { value: "servidor",  label: "Servidor / Data Center" },
    { value: "globo",     label: "Globo / Cobertura" },
    { value: "soporte",   label: "Soporte / NOC" },
    { value: "datos",     label: "Datos / Base de datos" },
    { value: "wifi",      label: "Wi-Fi / Inalámbrico" },
  ],
},
{
  name: "tabLabel",
  label: "Nombre corto (chip)",
  type: "string",
  description: "Nombre corto para el chip de categoría. Si se deja vacío se usa el título.",
},
{ name: "tabLabel_en", label: "Nombre corto (chip) (EN)", type: "string" },
```

Mapa `tabIcon` → glifo **de trazo (Lucide, `react-icons/lu`)**, hardcodeado en el componente (patrón de `RubrosReact`, SPEC 90). Se usa Lucide y no Font Awesome sólido porque la referencia dibuja los íconos en outline:

```ts
const ICONS = {
  rayo: LuZap, escudo: LuShield, nube: LuCloud, engranaje: LuSettings,
  personas: LuUsersRound, red: LuNetwork, servidor: LuServer, globo: LuGlobe,
  soporte: LuHeadset, datos: LuDatabase, wifi: LuWifi,
} as const;
// valor ausente o desconocido → LuZap
```

Contenido sembrado en `src/content/home/index.json` (4 categorías): solo `tabIcon` (`conectividad → rayo`, `ciberseguridad → escudo`, `cloud/data center → nube`, `servicios gestionados → engranaje`). **No se escribe ningún texto nuevo:** `tabLabel` queda vacío y el cliente decide el nombre corto en Tina.

Convenciones que se mantienen de la SPEC 89: las `url` se prefijan con `BASE_URL` (`withBase`); el ítem sin `url` no es clicable; la lectura i18n es siempre por `tField`.

---

## Plan de implementación

Cada paso deja el sitio compilando y funcional.

1. **Schema Tina.** Añadir `tabIcon` y `tabLabel`/`tabLabel_en` en `home.services.items[]` de `tina/config.ts`. Correr `npm run dev` una vez para regenerar `tina/__generated__/`. *Estado: admin muestra los campos nuevos; nada cambia en pantalla.*

2. **Sembrar contenido.** Rellenar `tabIcon` en las 4 categorías de `src/content/home/index.json`. *Estado: contenido válido, aún sin consumidor.*

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
- [x] La tira de chips muestra las 4 categorías con su ícono según `tabIcon` y el nombre corto (`tabLabel`, con fallback al título), y la activa está destacada con un indicador que **se desliza** al cambiar.
- [x] Click en una píldora cambia la categoría mostrada en el panel (título, tagline, párrafo, checklist, CTA y card visual).
- [x] En `lg+` hay dos flechas circulares magenta superpuestas a los costados del panel, centradas verticalmente, que avanzan/retroceden con wrap (de la 4ª a la 1ª y viceversa).
- [x] Las flechas no quedan recortadas ni generan scroll horizontal en pantallas anchas.
- [x] Arrastrar horizontalmente el panel cambia de categoría; el arrastre no bloquea el scroll vertical en táctil.
- [x] Con la tira de tabs enfocada, ←/→ cambian de categoría (`role="tablist"`, `aria-selected` correcto).
- [x] El cambio de categoría se ve como un **barrido de luz**: la línea cruza el panel y el recorte de la tarjeta anterior la sigue exactamente (a 120ms la línea va en 153px y el recorte en 11.8%; a 360ms, 1277px y 98.7%). La dirección se invierte al retroceder.
- [x] Durante la transición no se superponen los textos de dos categorías.
- [x] Detrás del ícono hay exactamente **2** formas translúcidas.
- [x] Los subservicios se muestran como **chips** (píldora con punto magenta) que fluyen en varias filas, y entran en stagger.
- [x] El CTA "Conoce más" es un **link con flecha**, no un botón relleno.
- [x] El panel se ve como un **stack**: dos capas redondeadas y casi tan altas como la activa asoman escalonadas por la derecha.
- [x] El alto del panel no salta al cambiar de categoría: las 4 miden 622px en desktop.
- [x] Los puntos de los chips y el CTA "Conoce más" usan el rosado de marca (`brand-purple-light`, `#D5A7CA`).
- [x] Los íconos de categoría son de **trazo**, no sólidos.
- [x] La mitad derecha va **a sangre** (sin padding) y **no** contiene textos.
- [x] La mitad visual muestra el ícono de la categoría sobre el degradado; el cúmulo flota sutilmente y hace tilt 3D siguiendo al cursor en punteros finos.
- [x] En táctil (`pointer: coarse`) no hay tilt ni tooltip.
- [x] Hover en un chip con `url` muestra el tooltip "Ver más" tras un breve delay y persigue al cursor con retraso; click navega al subservicio (con `BASE_URL`).
- [ ] Un chip sin `url` se renderiza no clicable y sin tooltip. *(Solo verificado en código: las 4 categorías tienen `url` en todos sus subservicios, no hay caso real que observar.)*
- [x] "Conoce más" navega a la `url` de la categoría activa.
- [x] En `/en/...` todos los textos leen `_en` con fallback a ES; el tooltip dice "See more" y el CTA "Learn more".
- [x] Con `prefers-reduced-motion: reduce` el cambio de categoría es instantáneo y no hay flotación, tilt ni `rAF` activos.
- [x] En mobile el bloque es de una columna (mitad visual arriba, contenido debajo), los chips de categoría scrollean horizontalmente y todo es legible sin cortes.
- [x] `SolucionesScroll(.astro/React)` y `SolucionesSlider(.astro/React)` siguen en el repo y compilan.
- [x] No hay ningún texto escrito por el agente: todo sale del CMS o del diccionario de UI ("Conoce más", "Ver más", `[ SOLUCIONES ]`).

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
- **Sí:** usar solo `title` + `description` del CMS en la columna izquierda. La primera versión añadía un párrafo `body` y un pie `eyebrow` en la card (`RED · NOC 24/7`) — texto inventado por el agente que la referencia no tiene; ambos campos se eliminaron del schema.
- **Sí:** subservicios como **chips** y CTA **tipo link con flecha** (referencia), en vez del checklist con checks en dos columnas y el botón relleno de la primera versión.
- **Sí:** panel como **stack de tarjetas** (dos capas asomando a la derecha) y mitad visual **a sangre**, en vez de una card inset con padding. Las capas se recortan a partir de la mitad del panel para no meterse bajo la columna de texto, y se ocultan bajo `sm` (no hay ancho para escalonarlas).
- **Sí:** íconos **Lucide (outline)** en vez de Font Awesome sólido; el CLAUDE.md fija `react-icons/fa6` como set del sitio, pero la referencia de esta sección dibuja los íconos en trazo. Se mantiene `react-icons` como librería.
- **Sí:** transición de **barrido de luz** (scan). Se probaron antes un crossfade direccional (se leían los dos textos a la vez) y un reparto de baraja (descartado por el cliente: buscaba algo que transmitiera tecnología). El barrido reusa el lenguaje de luz que ya tiene el sitio (god-rays, plexus, waveform) y es CSS puro: `clip-path` sobre la tarjeta saliente + una línea con glow desplazada por `transform`. Descartados en la propuesta: glitch de bandas (se lee como error de render), slices con flip 3D (más mecánico que red) y disolución en píxeles (~120 nodos extra por cambio).
- **Sí:** con `prefers-reduced-motion` no se montan ni la línea ni la tarjeta saliente (`display: none`) y el cambio es instantáneo.
- **Sí:** alto mínimo del panel + contenido centrado verticalmente. Sin eso el alto saltaba entre categorías (8 vs 13 subservicios) al navegar con las flechas.
- **Sí:** `tabLabel` opcional para el nombre corto del chip, con fallback al título. Evita que el agente acorte por su cuenta los títulos del cliente.
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
