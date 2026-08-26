# SPEC 108 — Soluciones: cards apiladas con rail sticky y fondo aurora

> **Estado:** Implementado
> **Depende de:** SPEC 103 (`SolucionesPanel` actual y campos `tabIcon`/`tabLabel` en `home.services.items[]`), SPEC 89 (modelo `bullets[] = {label, label_en, url}` y tooltip "Ver más"), SPEC 97/98 (patrón de fondo WebGL autocontenido: `CinematicBackground` / `CinematicRays`, pausa fuera de viewport y fallback), SPEC 105/107 (sistema de ilustraciones `Escena`/`Lienzo` con unidades `--u` en `servicios/beneficios/base.tsx`), SPEC 88 (radio de 8 px en botones/chips), SPEC 80 (i18n `_en` + `tField` + `t()`), SPEC 71/69 (`data-reveal`)
> **Fecha:** 2026-08-26
> **Objetivo:** Reemplazar el panel de soluciones por un bloque de cuatro cards apiladas con rail de categorías sticky, fondo aurora WebGL morado replicado de `agentflow.framer.ai` y un visual animado propio por categoría, en Home, `/soluciones` y `/soporte-tecnico`.

---

## Sección 1 — Por qué existe este spec

El bloque vigente (`SolucionesPanel`, SPEC 103) muestra una sola categoría a la vez tras chips y flechas: hay que interactuar para descubrir que existen cuatro soluciones, y la mitad visual es siempre el mismo ícono sobre degradado magenta. El cliente trajo una propuesta nueva de su diseñador (cuatro mockups adjuntos al pedido) construida sobre la sección *Solutions* de `agentflow.framer.ai`: rail vertical de categorías a la izquierda que se mantiene fijo mientras las cards pasan con el scroll, cada card partida por una línea vertical (texto a la izquierda, mock animado a la derecha) y un fondo de cintas de luz.

La referencia se inspeccionó en vivo: el rail es `sticky` y marca la solución activa, las cards son secciones apiladas y el fondo es un `canvas` **WebGL2** que cubre la sección. Este spec replica ese layout, ese scroll y esas animaciones **con la paleta Fiberlux** (near-black + magenta), no con el verde de la referencia, y sustituye el ícono genérico por cuatro escenas propias —órbita, bitácora SOC, subida a nube y waveform con avatares— tomadas de los mockups del diseñador.

---

## Sección 2 — Alcance

**Dentro:**

- **Componente nuevo** `src/components/shared/SolucionesStack.astro` + `SolucionesStackReact.tsx`, alimentado por la misma query `home` (`home.services`) y con la misma firma de props que `SolucionesPanel` (`query` / `variables` / `data` / `locale`).
- **Encabezado de sección:** eyebrow `[ SOLUCIONES ]` (string de UI localizado) + `h2` con `services.title` del CMS.
- **Rail de categorías sticky** (desktop `lg+`): lista vertical de las 4 categorías, cada una con su ícono de trazo (`tabIcon`) y su nombre corto, separadas por una línea horizontal. La activa va en blanco con el ícono magenta y su línea teñida de magenta; las demás al 35 % de opacidad. Queda `sticky` bajo el header mientras las cards pasan; **click** en un ítem hace scroll suave a esa card (vía `window.__lenis`, con el offset de header ya usado en `BaseLayout`).
- **Cuatro cards apiladas verticalmente** (una por categoría, la sección mide ~4 pantallas): caja con borde de 1 px, partida por un divisor vertical en dos mitades:
  - **Izquierda:** título de la categoría, descripción corta, **cuatro chips** de subservicio y CTA tipo link magenta "Conoce más →" con la flecha desplazándose en hover.
  - **Derecha:** la **escena animada** de la categoría (ver más abajo), centrada y a sangre dentro de su mitad.
- **Cuatro escenas animadas propias**, una por categoría, siguiendo los mockups: `orbita` (anillos punteados + tile magenta con rayo + punto orbitando), `bitacora` (seis filas hora · badge · evento con banda de realce que las recorre), `nube` (tile claro con nube, línea punteada, paquetes que suben y tres barras de rack que se encienden) y `waveform` (ecualizador de barras magenta + tres avatares superpuestos). Dibujadas en HTML/CSS con las unidades `--u` del sistema de ilustraciones (SPEC 107) y en **bucle continuo** mientras la card está en pantalla.
- **Fondo aurora WebGL** de la sección: componente nuevo `src/components/effects/AuroraRibbons.tsx`, réplica del shader de la referencia **retintada a morado de marca**, sobre `greyscale-darkest`, con grano encima. Autocontenido y con las mismas garantías que los otros efectos del repo: cap de DPR, rAF pausado fuera de viewport, frame estático con `prefers-reduced-motion` y fallback CSS (glow radial morado + grano) si no hay WebGL2.
- **Extracción del shader** de `agentflow.framer.ai` con el hook de `gl.shaderSource`/`uniform*` vía Playwright `addInitScript`; el GLSL crudo se archiva en `references/aurora-agentflow.frag.txt` como material de referencia y la versión retintada vive en el componente.
- **Montaje en las 3 pantallas** que hoy usan `SolucionesPanel`: `src/pages/index.astro`, `src/pages/soluciones/index.astro`, `src/pages/soporte-tecnico/index.astro` (los wrappers `/en` heredan el cambio).
- **Mobile:** el rail se convierte en una **tira horizontal de chips sticky** bajo el header, con máscara de scroll, que marca la categoría activa y arrastra el chip activo a la vista; las cards se apilan en una columna (título → descripción → chips → escena → CTA).
- **Chips de subservicio:** los **primeros 4 bullets** de cada categoría; cada chip con `url` navega a la página del subservicio y conserva el **tooltip "Ver más" con delay que persigue al cursor** (SPEC 89/103, solo `pointer: fine`).
- **Contenido:** `services.title` pasa a "Soluciones para tu negocio" (`title_en`: "Solutions for your business") y se siembran los `tabLabel` / `tabLabel_en` cortos de las 4 categorías.
- **i18n:** todo el texto del CMS con `tField`; los strings fijos (eyebrow, "Conoce más", "Ver más", textos dentro de las escenas, `aria-label`s) en `src/i18n/ui.ts` vía `t()`.
- **Accesibilidad:** el rail es una lista de enlaces reales a la card (`aria-current` en la activa); las escenas y el fondo son decorativos (`aria-hidden`); entrada de cada card con `data-reveal="up"`.
- **`SolucionesPanel.astro` / `SolucionesPanelReact.tsx` se conservan en el repo** (compilando, sin montar), igual que se hizo con `SolucionesScroll` y `SolucionesSlider`.

**Fuera de alcance (specs futuros):**

- Rediseñar las páginas de categoría (`/soluciones/*`) ni las de subservicio.
- Leer los subservicios del catálogo real (`src/content/services/*.json`); se sigue usando `home.services.items[].bullets`.
- Hacer editables en Tina las escenas (qué escena usa cada categoría, sus textos internos o sus parámetros): quedan horneadas en código.
- Editabilidad en Tina de los parámetros del fondo aurora (colores, velocidad, densidad): viven en un `PARAMS` del componente.
- Extender el fondo aurora a otras secciones o páginas.
- Eliminar `SolucionesPanel`, `SolucionesScroll`, `SolucionesSlider` o `StickyCards` del repo.
- Traducir a EN los `tabLabel_en` que el cliente decida cambiar después (los sembrados van con traducción).
- Autoplay por tiempo o navegación con flechas laterales (`SliderSideArrows` deja de usarse en este bloque; sigue en uso en otros sliders).

---

## Sección 3 — Modelo de datos

**No se introducen campos nuevos en Tina ni colecciones nuevas.** El bloque reusa el modelo que ya dejaron la SPEC 89 y la SPEC 103 en `home.services.items[]`:

| Campo | Rol en el bloque nuevo |
| --- | --- |
| `title` / `title_en` | Título de la card cuando no hay `tabLabel` |
| `tabLabel` / `tabLabel_en` | Nombre corto: rail **y** título de la card (fallback → `title`) |
| `description` / `description_en` | Descripción corta bajo el título |
| `tabIcon` | Ícono del rail **y** clave que elige la escena de la card |
| `bullets[]` (`label` / `label_en` / `url`) | Chips de subservicio (se muestran los 4 primeros) |
| `url` | Destino del CTA "Conoce más" |
| `icon`, `number` | Sin uso en este bloque (se conservan para los componentes viejos) |

**Mapa `tabIcon` → escena**, hardcodeado en `soluciones-escenas/index.ts`, con fallback por índice si la clave no está en el mapa:

```ts
const ESCENAS = { rayo: Orbita, escudo: Bitacora, nube: Nube, personas: Waveform, engranaje: Waveform } as const;
// clave ausente/desconocida → la escena que toque por índice (0→Orbita, 1→Bitacora, 2→Nube, 3→Waveform)
```

**Contenido a modificar** en `src/content/home/index.json` (editable después en Tina):

```json
"services": {
  "title": "Soluciones para tu negocio",
  "title_en": "Solutions for your business",
  "items": [
    { "tabLabel": "Conectividad empresarial",  "tabLabel_en": "Business connectivity" },
    { "tabLabel": "Ciberseguridad gestionada", "tabLabel_en": "Managed cybersecurity" },
    { "tabLabel": "Data Center & Cloud",       "tabLabel_en": "Data Center & Cloud" },
    { "tabLabel": "Servicios gestionados",     "tabLabel_en": "Managed services" }
  ]
}
```

(El `title` completo de la categoría 03 —"Data Center, Cloud y Continuidad de Negocio"— se conserva intacto; el bloque muestra el corto.)

**Strings nuevos en `src/i18n/ui.ts`** (ES + EN), con el prefijo `sol.`:

- `sol.eyebrow` → `[ SOLUCIONES ]` / `[ SOLUTIONS ]`
- `sol.cta` → `Conoce más` / `Learn more`; `sol.vermas` → `Ver más` / `See more`
- `sol.rail.aria` → `Categorías de solución` / `Solution categories`
- Textos dentro de las escenas: `sol.esc.ciber.r1…r6` (los seis eventos de la bitácora), `sol.esc.nube.pie`, `sol.esc.gest.pie`. Los acrónimos de badge (MFA, WAF, EDR, ZTNA, DDoS, SOC), las horas (`09:41`…) y las iniciales de los avatares (CM, JR, LP) son constantes, no se traducen.

---

## Sección 4 — Diseño de las cuatro escenas

Viven en `src/components/shared/soluciones-escenas/`. Reusan de `servicios/beneficios/base.tsx` la paleta `C`, los helpers `u()` / `ret()` y `useReducido()`; el wrapper es propio (`EscenaSol`) porque la caja aquí no es la de una card de beneficios:

- **Lienzo 400 × 320** (`aspect-ratio: 400/320`), contenedor de consulta con `--u: calc(100cqw / 400)`, de modo que la escena escala igual en la mitad de una card de 640 px que en el ancho completo de un móvil.
- Todo el movimiento es **CSS** (`@keyframes` en una constante `CSS_SOLUCIONES` que inyecta el bloque, patrón de `CSS_BENEFICIOS`), sin rAF por escena.
- **Bucle continuo** mientras la card está en viewport; al salir, `animation-play-state: paused`. Con `prefers-reduced-motion: reduce` la escena queda en su frame inicial.

| Escena | Qué dibuja | Movimiento |
| --- | --- | --- |
| `Orbita` (conectividad) | Dos anillos concéntricos punteados y un halo; al centro, tile redondeado magenta (radio 16 u) con el rayo en blanco y glow | Un punto magenta recorre el anillo exterior (12 s lineal); el halo del tile respira (4 s) |
| `Bitacora` (ciberseguridad) | Seis filas: hora en Space Mono, badge en píldora de borde magenta, texto del evento | Una banda de realce baja fila por fila (1.4 s por fila): la fila activa sube su fondo y enciende su badge; loop |
| `Nube` (data center) | Tile claro (degradado blanco→rosa) con la nube y glow rosado arriba; línea vertical punteada; tres barras redondeadas (racks) abajo | Píldoras magenta suben por la línea (2.6 s, en stagger); cada llegada enciende la barra que le toca |
| `Waveform` (gestionados) | ~22 barras verticales con degradado magenta; debajo, tres avatares circulares superpuestos (CM · JR · LP) con el central magenta | Las barras laten como ecualizador (cada una con su duración y retraso); un anillo de foco rota entre los tres avatares |

---

## Sección 5 — Plan de implementación

1. **Extraer el shader de la referencia.** Script Playwright en el scratchpad con `addInitScript` que envuelve `WebGL2RenderingContext.prototype.shaderSource` y las `uniform*` para volcar el GLSL y los valores de `agentflow.framer.ai`. Guardar el volcado en `references/aurora-agentflow.frag.txt`. Estado: material de referencia archivado, sin tocar el sitio.

2. **`AuroraRibbons.tsx`.** Componente autocontenido en `src/components/effects/`: canvas WebGL2 con quad a pantalla completa, el fragment shader retintado a `#96237A` / `#c65fac` / `#650F50`, uniforms `u_time` / `u_res`, cap de DPR a 1.5, rAF pausado por `IntersectionObserver`, frame único con `prefers-reduced-motion`, `onUnsupported` → fallback CSS (glow radial morado + grano). Grano como overlay tileado (`feTurbulence` en data-URI). Estado: efecto montable y verificable en aislamiento.

3. **Base de escenas.** `soluciones-escenas/base.tsx` con `EscenaSol`, las unidades `--u` sobre 400×320 y la constante `CSS_SOLUCIONES`. Estado: wrapper listo, sin escenas.

4. **Las cuatro escenas.** `Orbita.tsx`, `Bitacora.tsx`, `Nube.tsx`, `Waveform.tsx` + `index.ts` con el mapa `tabIcon` → escena y el fallback por índice. Estado: cada escena se renderiza y anima por sí sola.

5. **Íconos compartidos.** Extraer el mapa `ICONS` / `iconFor` de `SolucionesPanelReact.tsx` a `src/components/shared/solucionesIcons.ts` y consumirlo desde los dos componentes. Estado: sin duplicar el set de Lucide.

6. **Esqueleto del bloque.** `SolucionesStack.astro` (resuelve `home` + `locale`, calcado de `SolucionesPanel.astro`) y `SolucionesStackReact.tsx` con encabezado, rail y las 4 cards apiladas, **estático**: sin sticky, sin escenas animadas. Estado: layout correcto en desktop.

7. **Rail sticky + categoría activa.** `sticky` bajo el header; `IntersectionObserver` con `rootMargin: "-45% 0px -45% 0px"` sobre cada card para derivar el índice activo; click en un ítem → scroll suave con `window.__lenis.scrollTo(target, { offset: -80 })` y fallback a `scrollIntoView`. Estado: el rail acompaña el scroll y marca la card en pantalla.

8. **Chips, tooltip y CTA.** Primeros 4 bullets como chips (radio 8 px, SPEC 88), enlace al subservicio, tooltip "Ver más" con delay + lag portado de `SolucionesPanelReact` (solo `pointer: fine`), y CTA "Conoce más →" con la flecha desplazándose en hover. Estado: la card es navegable.

9. **Escenas dentro de las cards.** Montar la escena de cada categoría en la mitad derecha, con el flag `activo` cableado al `IntersectionObserver` de la card (entra en viewport → anima; sale → pausa). Estado: las cuatro cards tienen vida.

10. **Fondo.** Montar `AuroraRibbons` detrás de toda la sección (una sola instancia por página) con el grano encima y el velo de legibilidad. Estado: la sección se ve como la referencia, en morado.

11. **Contenido e i18n.** Actualizar `services.title` / `title_en`, sembrar `tabLabel` / `tabLabel_en` de las 4 categorías y añadir las claves `sol.*` a `src/i18n/ui.ts`. Estado: ES y EN completos.

12. **Mobile.** Tira de chips sticky bajo el header con máscara y auto-scroll del chip activo; cards en una columna (título → descripción → chips → escena → CTA); alturas con `svh` para evitar saltos por la barra del navegador. Estado: el bloque funciona en móvil.

13. **Montaje.** Sustituir `SolucionesPanel` por `SolucionesStack` en `src/pages/index.astro`, `src/pages/soluciones/index.astro` y `src/pages/soporte-tecnico/index.astro`, dejando el comentario de linaje (`… → SolucionesPanel (SPEC 103) → SolucionesStack (SPEC 108)`). Estado: las 3 pantallas muestran el bloque nuevo.

14. **QA.** `npm run build` verde; pasada de rendimiento en Home (que ya carga el globo del hero) con el canvas y las cuatro escenas; revisión de `prefers-reduced-motion`, `/en`, móvil real y sin WebGL. Estado: listo para PR.

---

## Sección 6 — Criterios de aceptación

- [ ] `npm run build` pasa sin errores ni warnings de tipos de Tina.
- [ ] Home, `/soluciones` y `/soporte-tecnico` (y sus `/en`) montan `SolucionesStack`; ninguna monta ya `SolucionesPanel`.
- [ ] La sección muestra el eyebrow `[ SOLUCIONES ]` y el título "Soluciones para tu negocio" desde el CMS.
- [ ] Las cuatro categorías se muestran como cards apiladas: se ven las cuatro haciendo scroll normal, sin que la página quede anclada en ningún momento.
- [ ] El rail izquierdo queda fijo mientras pasan las cards y marca la categoría de la card que está en pantalla (blanco + ícono magenta; las demás atenuadas).
- [ ] Click en un ítem del rail lleva con scroll suave a su card, sin que el header la tape.
- [ ] Cada card muestra título corto, descripción, **4** chips de subservicio y "Conoce más →" apuntando a la página de la categoría.
- [ ] Cada categoría muestra su escena propia (órbita / bitácora / nube / waveform) animada en bucle mientras está en pantalla, y pausada cuando sale del viewport.
- [ ] El fondo de la sección son cintas de luz **moradas** animadas sobre negro, con grano, sin barras negras ni recortes a 1280, 1440 y 1920 px de ancho.
- [ ] Sin soporte WebGL2 la sección cae al fondo CSS (glow morado + grano) y todo lo demás sigue funcionando.
- [ ] Con `prefers-reduced-motion: reduce` el fondo queda en un frame estático, las escenas congeladas y el rail cambia sin animación.
- [ ] En móvil la tira de categorías queda pegada bajo el header, marca la activa y arrastra el chip activo a la vista; cada card se apila en una columna con su escena visible y sin scroll horizontal en la página.
- [ ] Hover sobre un chip con `url` muestra el tooltip "Ver más" tras un breve delay siguiendo al cursor con lag; en táctil (`pointer: coarse`) no aparece.
- [ ] En `/en/...` rail, títulos, descripciones, chips, CTA y textos dentro de las escenas leen `_en` con fallback a ES.
- [ ] En Home, con el hero ya cargado, la sección no introduce jank perceptible al scrollear (60 fps en un portátil de gama media).
- [ ] `SolucionesPanel(.astro/React)` sigue en el repo y compila.

---

## Sección 7 — Decisiones tomadas y descartadas

| Decisión | Alternativa descartada | Por qué |
| --- | --- | --- |
| Cards apiladas + rail sticky | Scroll-jack con una sola card (SPEC 89) | El cliente ya rechazó el secuestro de scroll en la SPEC 99; y es lo que hace la referencia. |
| Cards apiladas + rail sticky | Rail como tabs por click (SPEC 103) | Con tabs hay que interactuar para ver que existen cuatro soluciones; los mockups muestran las cuatro pasando con el scroll. |
| Réplica fiel del shader de la referencia, retintada | Aproximación con gradientes CSS | El cliente pidió explícitamente "el fondo pero del color de Fiberlux"; la aproximación queda como fallback sin WebGL, así que no se pierde nada. |
| Réplica fiel del shader | Reusar `CinematicRays` / `NodeField` teñidos | Ya probados en rendimiento, pero su look (god-rays, plexus) no es el de las cintas de la referencia. |
| Escenas horneadas en código | Escenas editables en Tina | Son decoración, no contenido editorial; hacerlas editables multiplica el schema y deja que el cliente rompa el layout. |
| Escena elegida por `tabIcon` | Campo nuevo `escena` en Tina | Evita tocar el schema y sobrevive a que el cliente reordene categorías; el fallback por índice cubre claves desconocidas. |
| 4 chips por categoría | Mostrar los 8–13 bullets | Fidelidad al mockup y alto de card estable entre categorías; el listado completo ya vive en la página de la categoría. |
| Rail y título de card usan `tabLabel` con fallback a `title` | Usar siempre `title` | El `title` de Data Center son tres líneas; el mockup pide el nombre corto en ambos sitios y el `title` largo se conserva para los otros componentes. |
| Bucle continuo de las escenas | Animar una sola vez al entrar (SPEC 105) | La referencia se siente "viva"; se compensa pausando fuera de viewport y usando solo CSS. |
| Reemplazar en las 3 pantallas | Solo en `/soluciones` | El cliente pidió la sección de soluciones completa, no una variante por página. |
| Se conserva `SolucionesPanel` sin montar | Borrarlo | Misma convención que con `SolucionesScroll` y `SolucionesSlider`: el componente queda disponible por si se reutiliza. |

---

## Sección 8 — Riesgos identificados

- **Rendimiento en Home.** La página ya carga el globo COBE del hero; sumar un canvas WebGL2 más cuatro escenas en bucle puede costar frames en equipos ligeros —requisito duro del cliente—. Mitigación: una sola instancia del fondo por página, rAF pausado fuera de viewport, cap de DPR a 1.5, escenas resueltas solo con `transform`/`opacity` en CSS y `animation-play-state: paused` fuera de pantalla. Si aun así no rinde, la palanca es bajar densidad/velocidad en `PARAMS` o caer al fondo CSS en móvil.
- **Origen del shader.** El GLSL proviene de una plantilla comercial de Framer. Se usa como referencia técnica y se reescribe/retinta con la paleta de marca; conviene que quede así registrado y no copiar el resto de assets del sitio. Si el cliente prefiere evitar la dependencia, el fallback CSS ya especificado es reemplazo directo.
- **Sección larga en `/soporte-tecnico`.** Cuatro cards apiladas alargan bastante una página que no es la de soluciones. Se acepta por decisión del cliente; si molesta, la salida barata es montar ahí el `SolucionesPanel` conservado.
- **Sticky bajo header en móvil.** La tira de categorías compite con el header fijo y con la barra del navegador; se usa `svh` y se verifica en iOS Safari real antes de dar por cerrado el spec.
- **Escenas con texto del código en dos idiomas.** Los eventos de la bitácora cambian de largo entre ES y EN; las filas usan HTML (no SVG) justamente para que la caja se ajuste sola, pero hay que revisar el corte en la card angosta de móvil.
