# SPEC 08 — Sección "Nuestras soluciones": rediseño y sticky-stacking estilo effortel

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-06-30
> **Objetivo:** Rehacer la sección de soluciones del home con el diseño del Figma (4 cards, info izquierda / visual derecha) y reemplazar la animación por un apilamiento sticky (sticky-stacking) estilo effortel.com, donde cada card se fija arriba y las siguientes se encaiman sobre ella al hacer scroll.

---

## Contexto: referencia effortel (verificada con Playwright)

La sección "Intuitive Interface and Effortless Self-Management" de effortel.com **no usa scroll horizontal**. Cada card está envuelta en un contenedor `position: sticky; top: ~98px`: al hacer scroll, cada card **se fija cerca del tope del viewport y las siguientes se apilan sobre ella** (sticky-stacking), con un pequeño offset por card para que se vea el borde superior de las que quedan debajo (efecto pila). No hay escala ni overlay oscuro sobre las cards apiladas — es un apilamiento limpio. Este spec adopta ese apilamiento, manteniendo el diseño del Figma de Fiberlux: **todos los cards con la misma orientación** (info rosa izquierda / visual morado derecha), sin alternar de lado, con **SVG estático del CMS** más una micro-animación sutil del visual.

---

## Alcance

**Dentro:**

- Reescribir la animación de `src/components/shared/StickyCardsReact.tsx`: **sticky-stacking** en desktop (cada card `position: sticky; top: STICK_TOP + index·PEEK`, con `z-index` creciente para que la siguiente cubra a la anterior), sin escala ni overlay oscuro.
- Cada card apilada deja ver el **borde superior** de las que quedan debajo (offset `PEEK` por card), como effortel.
- **Micro-animación sutil del visual** de cada card: flotación leve del glifo SVG sobre el panel morado. Es decorativa y continua; no es un mockup en vivo.
- Replicar el **layout desktop del Figma**: card horizontal con panel de info rosa a la izquierda y panel visual morado a la derecha, **misma orientación en los 4 cards** (no alterna de lado como effortel).
- En **mobile (<768px)**: card vertical con **visual morado arriba, panel de info abajo** (layout del Figma mobile), en **stack normal sin sticky** (el apilamiento se siente tosco en touch).
- Actualizar el contenido en `src/content/home/index.json`: título de sección a **"Nuestras soluciones"** y reemplazar los 5 items actuales por los **4 del Figma** (Conectividad empresarial · Ciberseguridad · Data Center, Cloud y Continuidad de Negocio · Servicios gestionados), con sus descripciones y bullets.
- El **glifo/visual** de cada card se sirve desde el campo `icon` (imagen/SVG) ya existente en el CMS; se extraen los 4 SVGs desde Figma y se dejan cargados en `public/uploads/soluciones/`.
- La sección se **adapta a N cards** (no fija en 4): el apilamiento se aplica a todos los items del CMS.
- Respetar `prefers-reduced-motion`: si está activo, degradar a stack vertical normal sin sticky ni micro-animación.

**Fuera de alcance (para futuros specs):**

- Visuales animados "en vivo" tipo mockup de effortel (barras que crecen, marquee de tags, etc.). Aquí el visual es un SVG estático con micro-animación sutil.
- Alternar la orientación de los cards de lado a lado como effortel. Se mantiene la orientación uniforme del Figma.
- Scroll horizontal o pin/scroll-jacking de la sección completa.
- Escala o overlay oscuro sobre las cards apiladas (el original los tenía; se descartan por un apilamiento limpio).
- Editar los anillos o el color del panel morado como campos independientes del CMS.
- Cambiar el resto de secciones del home (Hero, Stats, Testimonios, Blog).

---

## Modelo de datos

Esta feature **no introduce estructuras nuevas**: reutiliza el objeto `home.services` que ya existe en `tina/config.ts` y en `src/content/home/index.json`. El schema no cambia; solo se reescribe el contenido.

Forma actual (se conserva tal cual):

```js
// home.services (tina/config.ts, líneas 100–136)
services: {
  title: string,          // → "Nuestras soluciones"
  items: [                 // lista, se adapta a N (aquí serán 4)
    {
      number: string,      // "01" … "04"
      title: string,       // "Conectividad empresarial", …
      description: string, // textarea
      icon: string,        // ruta al SVG en /uploads (visual completo del panel)
      bullets: string[],   // lista de viñetas
      url: string,         // opcional, no usado por la animación
    },
  ],
}
```

Contenido nuevo que se escribirá en `src/content/home/index.json` (copiado del Figma desktop):

| # | title | description | bullets |
|---|---|---|---|
| 01 | Conectividad empresarial | Conectividad de Fibra Óptica Real para Empresas con Visión. | Internet Dedicado (Simétrico) · Lan2Lan (Transmisión de Datos) · Fibra Oscura · Accesos Satelitales |
| 02 | Ciberseguridad | Protege tu operación crítica con ciberseguridad. | Seguridad Perimetral y de Red · Seguridad de Endpoints y Servidores · Respaldo Crítico · Gestión de identidad · Programas de concientización · Seguridad en el desarrollo de aplicaciones |
| 03 | Data Center, Cloud y Continuidad de Negocio | Infraestructura de Clase Mundial para el corazón de tu Negocio. | Colocación y Hosting (Housing) · Servidor en la Nube (Cloud Privada) · Recuperación ante Desastres (Disaster Recovery) · Privacidad y Auditoría |
| 04 | Servicios gestionados | Soluciones de Infraestructura Tecnológica para Empresas de Alto Nivel. | Videovigilancia y Seguridad Electrónica (CCTV) · Networking y Conectividad Inalámbrica · Equipamiento Core y Almacenamiento |

Cada item apunta su `icon` a un SVG en `public/uploads/soluciones/` (`conectividad.svg`, `ciberseguridad.svg`, `datacenter.svg`, `servicios-gestionados.svg`), extraídos desde Figma. Cada SVG contiene el **panel morado completo** (fondo magenta + anillos + glifo + chips); el componente solo lo muestra a sangre en la celda del visual.

Los **SVGs hardcodeados** (`CARD_VISUALS[]`) que existían en `StickyCardsReact.tsx` se eliminan: el visual siempre viene del campo `icon`.

---

## Plan de implementación

1. **Extraer y cargar los 4 SVGs desde Figma** a `public/uploads/soluciones/`. Verificación: los 4 archivos existen y renderizan el panel morado completo.

2. **Reescribir el contenido** en `src/content/home/index.json`: título `"Nuestras soluciones"` y los 4 items de la tabla del modelo de datos, cada uno con su `icon`. Verificación: la sección muestra los 4 títulos, descripciones, bullets y visuales correctos.

3. **Refactor del layout de la card** al Figma: eliminar los `CARD_VISUALS[]` hardcodeados; el visual sale de `item.icon` a sangre sobre la celda morada. Desktop: info izquierda / visual derecha (misma orientación en todos). Mobile: visual arriba / info abajo, card vertical. Verificación: en desktop y mobile los cards se ven como el Figma.

4. **Sticky-stacking en desktop**: cada card se envuelve/posiciona con `position: sticky; top: STICK_TOP + index·PEEK` y `z-index: index+1`, con `margin-bottom` que da distancia de scroll entre fijados. Verificación: al hacer scroll, cada card se fija arriba y la siguiente la cubre; se ve el borde superior de las apiladas.

5. **Mobile / reduced-motion sin sticky**: en `<768px` o con `prefers-reduced-motion: reduce`, las cards usan `position: relative` (stack normal, sin apilamiento). Verificación: en mobile y con reduce-motion la sección es un stack navegable sin sticky.

6. **Micro-animación sutil del visual**: flotación leve del SVG mediante CSS `@keyframes`, desactivada bajo `prefers-reduced-motion`. Verificación: el visual tiene vida sutil sin distraer.

7. **Ajustar el wrapper en `src/pages/index.astro`** si el apilamiento rompe los solapes `-mt-*`/`z-*` con Hero, Testimonios y Stats. Verificación: no hay solapes ni cortes al hacer scroll por todo el home.

---

## Criterios de aceptación

- [ ] La sección muestra el título **"Nuestras soluciones"**.
- [ ] Se renderizan exactamente las **4 cards** del Figma con sus títulos, descripciones y bullets correctos.
- [ ] Cada card muestra su **visual SVG** (desde `item.icon`) en el panel morado.
- [ ] En **desktop (≥768px)** las cards hacen **sticky-stacking**: cada una se fija arriba y las siguientes se apilan sobre ella al hacer scroll.
- [ ] Se ve el **borde superior** de las cards apiladas (offset por card), como effortel; sin escala ni overlay oscuro.
- [ ] En **desktop** cada card es **info a la izquierda / visual morado a la derecha**, con la **misma orientación** en las 4.
- [ ] En **mobile (<768px)** cada card es vertical con **visual arriba e info abajo**, en stack normal sin sticky.
- [ ] El **visual** de cada card tiene una **micro-animación sutil** continua (flotación).
- [ ] Si el CMS agrega o quita un item, el apilamiento se aplica al nuevo número de cards sin romperse.
- [ ] Con **`prefers-reduced-motion: reduce`** activo, la sección es un **stack vertical normal** (sin sticky ni micro-animación).
- [ ] No quedan referencias a los `CARD_VISUALS[]` hardcodeados en `StickyCardsReact.tsx`.
- [ ] Al hacer scroll por todo el home no hay **solapes ni cortes** entre esta sección y Hero / Testimonios / Stats.
- [ ] No hay errores en la consola del navegador al cargar y hacer scroll por la sección.

---

## Decisiones tomadas y discartadas

- **Sí:** sticky-stacking (apilamiento con `position: sticky`) en desktop. Se verificó con Playwright que la sección de effortel usa exactamente ese mecanismo (cards envueltas en `sticky; top: ~98px` que se apilan al scrollear).
- **No:** scroll horizontal fijado (pin + `translateX`). Descartado: effortel no hace eso. Corrige una versión anterior de este spec.
- **No:** lista vertical con reveal fade + slide-up (sin apilamiento). Descartado: el efecto de effortel es una **pila** de cards, no una simple aparición al entrar en viewport. Corrige una versión intermedia de este spec.
- **Sí:** apilamiento limpio, sin escala ni overlay oscuro. El componente original de Fiberlux tenía ambos y se sentía recargado; effortel apila limpio.
- **Sí:** mantener la orientación uniforme del Figma (info izquierda / visual derecha en las 4 cards). No se alterna de lado como effortel.
- **Sí:** visual = SVG del CMS (panel morado completo) + micro-animación sutil. Editable desde el CMS.
- **No:** visuales animados "en vivo" tipo mockup de effortel. Más trabajo y no editables; se difieren.
- **Sí:** mobile y `prefers-reduced-motion` sin sticky (stack normal). El apilamiento se siente tosco en touch y va contra la preferencia de menos movimiento.
- **Sí:** contenido del Figma desktop (4 cards, "Nuestras soluciones") como fuente de verdad.
- **Sí:** los 4 SVGs se extraen desde Figma y se cargan en `public/uploads/soluciones/`. Incluyó sanear un fondo gris `#232323` que Figma metía por contexto de ancestros, reemplazándolo por magenta.
- **Sí:** eliminar los `CARD_VISUALS[]` hardcodeados. Con el visual desde el CMS dejan de tener sentido.

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El sticky-stacking puede pelearse con el smooth-scroll de Lenis ya activo en `BaseLayout.astro`. | `position: sticky` es CSS puro (no depende de JS de scroll); verificar el apilamiento con Lenis activo. |
| El apilamiento puede romper los solapes `-mt-*`/`z-*` del home en `index.astro`. | Paso 7 del plan valida y ajusta los solapes con Hero, Testimonios y Stats. |
| Con muchos bullets (Ciberseguridad tiene 6) el panel de info puede desbordar la altura de la card. | Altura mínima de card contra el contenido del Figma; permitir que el panel crezca si desborda. |
| Cards de distinta altura hacen que el fijado se sienta irregular. | Altura mínima uniforme (`min-height`) en desktop para que la pila se vea consistente. |
| Un ancestro con `overflow: hidden` rompería el `position: sticky`. | Mantener el contenedor de las cards sin `overflow` que corte el sticky; verificar en el paso 4. |

---

## Qué **NO** entra en este spec

- Scroll horizontal, pin o scroll-jacking de la sección completa.
- Escala u overlay oscuro sobre las cards apiladas.
- Visuales animados "en vivo" tipo mockup de effortel.
- Alternar la orientación de los cards de lado a lado.
- Anillos o color del panel morado editables como campos del CMS.
- Cambios en otras secciones del home (Hero, Stats, Testimonios, Blog).

Cada uno de estos, si aterriza, va en su propio spec.
