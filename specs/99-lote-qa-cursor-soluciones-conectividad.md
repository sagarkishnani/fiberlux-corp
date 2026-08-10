# SPEC 99 — Lote QA cliente: cursor, Soluciones (scroll/mobile), conectividad, header/footer e íconos

> **Estado:** Implementado
> **Depende de:** SPEC 89/62/40 (scroll-jack + motor soluciones), SPEC 96/97 (hero home globo COBE `CinematicBackground`), SPEC 98 (hero soluciones `CinematicRays`), SPEC 95/93 ("El desafío"), SPEC 34/52 (Certificaciones), SPEC 07/16/33 (footer + header), SPEC 28/43 (partners), SPEC 71 (base de animaciones)
> **Fecha:** 2026-08-09
> **Objetivo:** Resolver en un solo lote desplegable diez observaciones de QA del cliente sobre el cursor, la sección Soluciones (desktop y mobile), el globo de conectividad del hero, el header/footer, los íconos y el footer, con cambios acotados por componente.

---

## Por qué existe este spec

Lote de observaciones del cliente (mismo criterio que SPEC 36/56/78): bugs y ajustes visuales/contenido aislables por componente, agrupados para un solo deploy. Se registra también en `specs/observaciones-cliente.md`. Las ambigüedades se cerraron con el cliente: cursor con selector en Tina (default estela), scroll-jack portado a mobile con feedback de avance, obs7 = íconos flotantes del hero, obs5 = uniformizar estela + hover morado.

---

## Alcance

**Dentro:**

- **obs1 — Cursor configurable (Tina) + menos glow.** Bajar el glow de la estela (`CursorTrail.tsx`); quitar los cursores a medida retícula/punto (`CursorShapes` vía `data-cursor`) de las secciones; agregar en Tina (colección `global`) un selector de cursor global: **Ninguno / Estela / Retícula / Punto** + control de intensidad del glow. Default = **Estela** (el actual, con glow reducido).
- **obs2 — "Grupo Fiberlux" con G mayúscula** en la sección Certificaciones.
- **obs3 — Scroll-jack de "Nuestras Soluciones" en mobile.** Portar el scroll-jack anclado (hoy solo desktop) a mobile en una columna, **con feedback visual claro de avance** (odómetro de número + indicador de progreso de categoría), porque el cliente lo ve "como si no avanzara".
- **obs4 — Impulso/snap en Soluciones.** Afinar el motor (`SolucionesScrollReact.tsx`): reducir el recorrido por categoría y el snap por proximidad para que "empuje" a la siguiente y no se sienta lento. Aplica a desktop y mobile.
- **obs5 — Uniformizar la estela del mouse + selección de texto morada.** Igualar cómo se ve la estela sobre header y footer (hoy difiere por `mixBlendMode`); el color de **selección de texto** (`::selection`, al resaltar texto con el mouse — NO hover) debe ser **morado** (color distinto donde el fondo ya es morado, p.ej. footer en modo `purple`). Aclarado por el cliente en implementación: es la selección de texto, no el hover.
- **obs6 — Íconos de "El desafío" a la línea gráfica.** Reemplazar los tiles blancos (`DesafioWidget.tsx`) por el estilo de la línea gráfica (outline/morado de marca, sin desentonar); en Conectividad quitar el "3" y dejar solo "sedes conectadas".
- **obs7 — Íconos flotantes del hero con reveal de color.** En `CinematicRays.tsx` (hero soluciones): que los tiles/íconos empiecen **más oscuros** y muestren su color de marca al alejarse (rampa por profundidad/posición).
- **obs8 — Degradado del footer en negro.** El footer arranca en negro arriba y funde hacia su color, en todas las páginas, para suavizar la transición desde la sección negra anterior (independiente del `mode`).
- **obs9 — Quitar sombreado de partners.** Eliminar las reglas de opacidad 0.55/hover en `PartnersMarquee.tsx` → logos siempre al 100%.
- **obs10 — Globo de conectividad del hero home.** En `CinematicBackground.tsx`: **más líneas de conexión** (`ROUTES`), **halo más grande**, **planeta más oscuro** y que se vea **50% en vez de 60%**.

**Fuera de alcance (para futuros specs):**

- Rediseño del motor de sliders (`useDragSlider`/Embla) más allá del tuning de obs4.
- Nuevos assets/íconos SVG a medida para "El desafío" (obs6 reusa el set `react-icons` ya presente, cambiando estilo/color).
- La "Nueva propuesta para el hero de Soluciones" (fila 4 de la hoja) — es un rediseño aparte, no entra en este lote.
- Traducción EN de textos nuevos (fallback ES; el cliente rellena `_en` en Tina).
- Editabilidad en Tina de los parámetros del globo COBE (`CinematicBackground`) o del efecto `CinematicRays` (siguen horneados).

---

## Modelo de datos

El **único cambio de schema** es el cursor (obs1). El resto son cambios de contenido (obs2) o de props/constantes locales.

**obs1 — Tina, colección `global` (`tina/config.ts`), nuevo objeto `cursor`:**

```js
{
  name: "cursor",
  label: "Cursor del sitio",
  type: "object",
  fields: [
    {
      name: "type", label: "Tipo de cursor", type: "string",
      options: [
        { value: "none",    label: "Ninguno (cursor del sistema)" },
        { value: "trail",   label: "Estela luminosa (por defecto)" },
        { value: "reticle", label: "Retícula técnica" },
        { value: "dot",     label: "Punto minimal" },
      ],
    },
    {
      name: "glow", label: "Intensidad del glow (estela)", type: "string",
      options: [
        { value: "low",  label: "Bajo" },
        { value: "med",  label: "Medio (por defecto)" },
        { value: "high", label: "Alto" },
      ],
    },
  ],
}
```

- Resolución en código (fallbacks): `type = "trail"`, `glow = "med"` si el CMS viene vacío.
- `BaseLayout.astro` lee `global.cursor` y monta según `type`: `trail` → `<CursorTrail intensity={glow} />`; `reticle`/`dot` → `<CursorShapes shape={type} />` aplicado a **todo el sitio**; `none` → no monta nada.
- Se **eliminan** los atributos `data-cursor` por sección; `CursorShapes` deja de depender de ellos y usa la forma global (prop `shape`).

**obs2 — Contenido (`src/content/certificaciones/index.json:2`):**

```
"sectionTitle": "Certificaciones del grupo Fiberlux"  →  "Certificaciones del Grupo Fiberlux"
```

(y el string de fallback en `CertificacionesSliderReact.tsx:45`.)

**Resto (obs3–obs10):** sin datos nuevos. Constantes/props locales:

- `SolucionesScrollReact.tsx`: `VH_PER_CATEGORY` (hoy `1.15`, línea 30), duración/umbral del snap (líneas 134, 146, 151), rama `isMobile` (48-60, 78, 312-400).
- `CinematicBackground.tsx`: `ROUTES` (48-55), `HUBS` (39-47), `topPx` (209), halo `boxShadow` (242), colores del globo.
- `CinematicRays.tsx`: color de ícono (`rgb(255,236,251)`, 336), z de tiles (`rand(-4.0,-2.0)`, 501), opacidad.
- `DesafioWidget.tsx`: tiles blancos (189, 274, 277, 380, 389), texto "3 sedes conectadas" (397).
- `PartnersMarquee.tsx`: reglas de opacidad (134-138).
- `FooterReact.tsx`: banda de degradado superior (estilos 180-209 / modo purple 129); links (161). `HeaderV2React.tsx`: `.nav-link-hover` (1136-1147).

---

## Plan de implementación

Cada paso es commiteable y deja el sitio funcional.

1. **obs1a — Schema cursor.** Agregar el objeto `cursor` a `global` en `tina/config.ts` (ver Modelo de datos). Correr `npm run dev` una vez para regenerar tipos/cliente en `tina/__generated__/`. *Estado:* compila; el admin muestra el selector de cursor.

2. **obs1b — Estela con menos glow + parametrizada.** En `CursorTrail.tsx`: aceptar prop `intensity: "low"|"med"|"high"` y mapearla a factores; **reducir** los valores base del glow (halo `rgba(150,35,122,0.28)`→~`0.18` y blur `22`→~`14` en 109-113; núcleo blur `8`→~`6`; `GLOW_WIDTH 16`→~`12`) manteniendo el núcleo visible. *Test:* la estela se nota pero con menos "glow"; el nivel cambia con la prop.

3. **obs1c — Quitar cursores por sección + cursor global.** Quitar `data-cursor` de `HeroHomeReact.tsx:280`, `HeroServiciosReact.tsx:49`, `SolucionesScrollReact.tsx:407`, `PartnersMarquee.tsx:84`. En `CursorShapes.tsx` aceptar prop `shape` y dibujar esa forma en todo el viewport (sin depender de `[data-cursor]`). En `BaseLayout.astro` (343-346) leer `global.cursor` y montar según `type` (`trail`/`reticle`/`dot`/`none`), pasando `intensity`. *Test:* por defecto solo estela; cambiar `type` en Tina cambia el cursor en toda la web; `none` deja el del sistema.

4. **obs2 — "Grupo Fiberlux".** Editar `certificaciones/index.json:2` y el fallback en `CertificacionesSliderReact.tsx:45`. *Test:* la sección muestra "Certificaciones del Grupo Fiberlux".

5. **obs9 — Quitar sombreado de partners.** En `PartnersMarquee.tsx` eliminar las reglas del `@media (min-width:768px)` que ponen `.partner-logo { opacity:0.55 }` y `:hover { opacity:1 }` (134-138) → logos a `opacity:1` fijo en todos los breakpoints. *Test:* los logos ya no se atenúan ni cambian al hover.

6. **obs6 — Íconos "El desafío" a línea gráfica.** En `DesafioWidget.tsx` reemplazar los tiles `bg-white text-[#96237A]` (189, 274, 277, 380, 389) por el estilo de la línea gráfica (contenedor sutil translúcido/borde + ícono en morado de marca / outline), sin desentonar con el fondo. Cambiar el texto de 397 `"3 sedes conectadas"` → `"Sedes conectadas"`. *Test:* no quedan íconos blancos duros en El desafío; Conectividad dice "Sedes conectadas".

7. **obs8 — Footer arranca en negro.** En `FooterReact.tsx` añadir una **banda de degradado superior** (`linear-gradient(to bottom, #0A0A0A, transparent)`) sobre el fondo del footer, **independiente del `mode`** (aplica en `purple` y en `dark-glow`), para fundir con la sección negra anterior. *Test:* en todas las páginas el borde superior del footer entra desde negro sin corte brusco.

8. **obs5 — Uniformizar estela + selección de texto morada.** (a) En `CursorTrail.tsx` quitar `mixBlendMode: "screen"` del canvas para que la estela componga igual sobre cualquier fondo (header oscuro / footer morado). (b) Definir `::selection`/`::-moz-selection` en el `<style is:global>` de `BaseLayout.astro` (global.css no se bundlea) con morado de marca `rgba(150,35,122,0.3)` + texto blanco (el look "que estaba antes"); en el footer en `mode:purple` sobreescribir la selección con un resaltado claro para que se note. *Test:* la estela se ve igual en header y footer; al seleccionar/resaltar texto el sombreado es morado (u otro donde el fondo ya es morado).

9. **obs7 — Íconos flotantes del hero (reveal de color).** En `CinematicRays.tsx`: que los tiles/íconos entren **más oscuros** (menor brillo/opacidad cerca de su spawn) y **ganen su color de marca** al alejarse, mapeando brillo/opacidad a la profundidad `z` (501) o a la distancia recorrida. *Test:* los íconos flotantes arrancan oscuros y muestran su color al alejarse.

10. **obs10 — Globo de conectividad.** En `CinematicBackground.tsx`: (a) agregar más pares a `ROUTES` (48-55) —y hubs en 39-47 si hace falta— para que la lógica de conectividad sea más evidente; (b) **halo más grande** subiendo `blur`/`spread` del `boxShadow` del anillo (242); (c) **planeta más oscuro** bajando el brillo de los colores base/marcadores del globo; (d) mostrar **50% en vez de 60%** ajustando `topPx` (209) para que asome menos. Actualizar el comentario "~60%" (11). *Test:* se ven más líneas entre puntos, halo mayor, planeta más oscuro y menos globo visible.

11. **obs4 + obs3 — Soluciones más ágil + scroll-jack en mobile.** En `SolucionesScrollReact.tsx`: (a) **obs4:** bajar `VH_PER_CATEGORY` (30) y afinar el snap por proximidad (134/146/151) para que empuje a la siguiente categoría; (b) **obs3:** habilitar el motor en mobile (quitar/ajustar el early-return `if (isMobile) return;` de 78) y usar el layout de una columna con **pin**, `100svh/dvh`, agregando **indicador de progreso** (dots/barra de categoría) + odómetro de número para que el avance se note. *Test:* en desktop cada categoría avanza más rápido con impulso; en mobile la sección queda anclada, cambia de categoría al scrollear y se ve claramente el avance.

---

## Criterios de aceptación

- [x] obs1: por defecto solo se ve la estela (con menos glow); en Tina se puede elegir Ninguno/Estela/Retícula/Punto y la intensidad del glow, y aplica en toda la web.
- [x] obs1: ninguna sección fuerza ya un cursor propio vía `data-cursor`.
- [x] obs2: la sección Certificaciones dice "Certificaciones del Grupo Fiberlux" (G mayúscula).
- [x] obs3: en mobile "Nuestras Soluciones" queda anclada, cambia de categoría al scrollear y muestra un indicador de avance (no se siente estática).
- [x] obs4: en desktop y mobile el paso entre categorías se siente más ágil y "empuja" a la siguiente (snap).
- [x] obs5: la estela del mouse se ve igual sobre header y footer; al seleccionar/resaltar texto el sombreado es morado (color distinto donde el fondo ya es morado).
- [x] obs6: no quedan íconos blancos duros en "El desafío"; usan el estilo de la línea gráfica; Conectividad muestra "Sedes conectadas" (sin el "3").
- [x] obs7: los íconos flotantes del hero empiezan más oscuros y muestran su color al alejarse.
- [x] obs8: en todas las páginas el footer arranca en negro arriba y funde hacia su color, sin corte brusco desde la sección anterior.
- [x] obs9: los logos de partners no se atenúan ni cambian al hover (opacidad 100% siempre).
- [x] obs10: el globo del hero home muestra más líneas de conexión, halo más grande, planeta más oscuro y ~50% visible.
- [x] `npm run build` compila: build local (Tina en modo local) verde con 116 páginas y 0 errores. El `npm run build` contra TinaCloud requiere pushear primero (el schema remoto reindexará el tipo nuevo `GlobalCursor`), como todo cambio de schema (ver CLAUDE.md, sección Deployment).

---

## Decisiones

- **Sí:** un solo spec de lote (precedente 36/56/78); un deploy.
- **obs1:** default = estela (el cursor "original" que el cliente quiere mantener), con glow reducido; retícula/punto solo si se eligen en Tina, aplicados globalmente. Se quitan los `data-cursor` por sección (el cliente no quiere "el resto de cursores" salvo por Tina).
- **obs3:** portar el scroll-jack anclado a mobile (lo pidió el cliente: "me gusta lo del scroll-jack"), con feedback de avance para resolver el "como si no avanzara". No se opta por el reveal ligero.
- **obs5:** el "haz de luz del mouse" es la misma estela global; "uniformizar" = quitar `mixBlendMode:"screen"` para que no cambie según el fondo. "Sombrear el texto" = **selección de texto** (`::selection`), no hover (aclarado por el cliente en implementación); el color moraba estaba en `global.css` pero ese archivo no se bundlea, por eso se define en `BaseLayout`.
- **obs6:** "línea gráfica" = outline/morado de marca reusando `react-icons`; no se crean SVG nuevos.
- **obs7:** interpretación acordada = íconos flotantes del hero (la imagen #11 adjunta no correspondía); reveal por profundidad, best-effort.
- **obs8:** banda superior negra en el footer independiente del `mode`, en vez de forzar un solo modo; cubre `purple` y `dark-glow`.
- **obs10:** es el globo COBE del hero home (`CinematicBackground`), no el `planet.svg` de Certificaciones (SPEC 52); es el único con puntos+líneas.
- **No:** tocar el motor de sliders más allá del tuning; ni la propuesta de rediseño del hero de Soluciones (va aparte).

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| obs1: aplicar retícula/punto en toda la web puede sentirse invasivo. | Default = estela; retícula/punto solo si el cliente los elige en Tina; respetar `prefers-reduced-motion`/touch como hoy. |
| obs3: pin en mobile + barra de direcciones cambiante causa saltos. | `100svh/100dvh`, medir el wrapper por su rect; probar con Lenis activo (mismo aprendizaje del SPEC 89). |
| obs4: bajar `VH_PER_CATEGORY` puede pasar categorías de más rápido. | Ajuste incremental + snap por proximidad; QA en desktop y mobile. |
| obs5: "uniformizar" y "morado" son subjetivos. | Best-effort; valores a afinar en device; el hover morado queda como token reutilizable. |
| obs7: reveal por profundidad puede quedar sutil o ruidoso. | Rampa acotada; QA visual; best-effort. |
| obs10: más líneas pueden saturar el globo o afectar rendimiento. | Agregar pares con criterio (hub-and-spoke desde Lima); mantener el cap de segmentos/DPR actual; QA en dispositivo ligero (requisito duro del cliente). |

---

## Lo que **no** entra en este spec

- Rediseño del motor `useDragSlider`/Embla.
- Assets/íconos SVG nuevos para "El desafío".
- La nueva propuesta del hero de Soluciones (fila 4 de la hoja).
- Traducción EN de textos nuevos y editabilidad en Tina de los parámetros del globo/`CinematicRays`.

Cada uno de esos, si aterriza, va en su propio spec.
