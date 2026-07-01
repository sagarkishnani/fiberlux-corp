# SPEC 08 — Sección "Nuestras soluciones": rediseño y reveal vertical estilo effortel

> **Estado:** Implementado
> **Depende de:** —
> **Fecha:** 2026-06-30
> **Objetivo:** Rehacer la sección de soluciones del home con el diseño del Figma (4 cards apilados verticalmente, info izquierda / visual derecha) y reemplazar la animación de cards apiladas por un reveal de entrada suave estilo effortel.com, con una micro-animación sutil del visual SVG de cada card.

---

## Contexto: referencia effortel (verificada con Playwright)

La sección "Intuitive Interface and Effortless Self-Management" de effortel.com **no usa scroll horizontal ni pin/scroll-jacking**. Es un **stack vertical** de cards a lo ancho, con scroll normal. Cada card entra en viewport con un reveal sutil (fade + slide-up) y su gracia está en el **visual animado interno** (mockups de UI en loop). Este spec adopta ese patrón de entrada, pero manteniendo el diseño del Figma de Fiberlux: **todos los cards con la misma orientación** (info rosa izquierda / visual morado derecha), sin alternar de lado, y con **SVG estático del CMS** más una micro-animación sutil (no mockups en vivo).

---

## Alcance

**Dentro:**

- Reescribir la animación de `src/components/shared/StickyCardsReact.tsx`: eliminar el `position: sticky` + escala + overlay negro actuales; los cards pasan a un **stack vertical normal** en desktop y mobile.
- **Reveal de entrada** por card: cada card aparece con fade + slide-up al entrar en viewport (una sola vez), estilo effortel.
- **Micro-animación sutil del visual** de cada card: flotación/parallax leve del glifo SVG sobre el panel morado (los anillos concéntricos pueden tener un pulso/rotación muy leve). Es decorativa y continua; no es un mockup en vivo.
- Replicar el **layout desktop del Figma**: card horizontal con panel de info rosa a la izquierda y panel visual morado a la derecha, **misma orientación en los 4 cards** (no alterna de lado como effortel).
- En **mobile (<768px)**: card vertical con **visual morado arriba, panel de info abajo** (layout del Figma mobile), con el mismo reveal de entrada.
- Actualizar el contenido en `src/content/home/index.json`: título de sección a **"Nuestras soluciones"** y reemplazar los 5 items actuales por los **4 del Figma** (Conectividad empresarial · Ciberseguridad · Data Center, Cloud y Continuidad de Negocio · Servicios gestionados), con sus descripciones y bullets.
- El **glifo central** de cada card se sirve desde el campo `icon` (imagen/SVG) ya existente en el CMS; se extraen los 4 SVGs desde Figma y se dejan cargados en `public/uploads/soluciones/`.
- Los **anillos concéntricos** del panel morado quedan como chrome fijo dibujado en el componente (no editables).
- La sección se **adapta a N cards** (no fija en 4): si el CMS agrega o quita items, el stack y los reveals se aplican a todos.
- Respetar `prefers-reduced-motion`: si está activo, degradar a stack vertical estático (sin reveal ni micro-animación del visual).

**Fuera de alcance (para futuros specs):**

- Visuales animados "en vivo" tipo mockup de effortel (barras que crecen, marquee de tags, etc.). Aquí el visual es un SVG estático con micro-animación sutil.
- Alternar la orientación de los cards de lado a lado como effortel. Se mantiene la orientación uniforme del Figma.
- Scroll horizontal o pin/scroll-jacking de la sección.
- Editar los **chips flotantes** con iconos del Figma como elementos independientes: si un SVG los trae dentro, se muestran; no se modelan por separado en el CMS.
- Hacer los **anillos concéntricos** o el color del panel morado editables desde el CMS.
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
      icon: string,        // ruta al SVG en /uploads (glifo central)
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

Cada item apuntará su `icon` a un SVG en `public/uploads/soluciones/` (ej. `conectividad.svg`, `ciberseguridad.svg`, `datacenter.svg`, `servicios-gestionados.svg`), extraídos desde Figma.

Los **SVGs hardcodeados** (`CARD_VISUALS[]`) que hoy existen en `StickyCardsReact.tsx` se eliminan: el glifo siempre viene del campo `icon`.

---

## Plan de implementación

1. **Extraer y cargar los 4 SVGs desde Figma** a `public/uploads/soluciones/` (`conectividad.svg`, `ciberseguridad.svg`, `datacenter.svg`, `servicios-gestionados.svg`). Verificación: los 4 archivos existen y abren en el navegador.

2. **Reescribir el contenido** en `src/content/home/index.json`: título `"Nuestras soluciones"` y los 4 items de la tabla del modelo de datos, cada uno con su `icon` apuntando al SVG correspondiente. Verificación: `npm run dev`, la sección muestra los 4 títulos, descripciones, bullets y glifos correctos (aún con la animación vieja).

3. **Quitar la animación de sticky/scale/overlay** actual en `StickyCardsReact.tsx` (refs `currentScales`, `currentOverlays`, `position: sticky`, overlay negro, y el loop `requestAnimationFrame` asociado). Dejar los cards en un stack vertical plano. Verificación: la sección renderiza en scroll vertical normal, sin apilarse ni escalar; sistema funcional.

4. **Refactor del layout de la card** al Figma: eliminar los `CARD_VISUALS[]` hardcodeados; el glifo siempre sale de `item.icon` sobre el panel morado con anillos concéntricos (chrome fijo). Desktop: info izquierda / visual derecha (misma orientación en todos). Mobile: visual arriba / info abajo, card vertical. Verificación: en desktop y mobile los cards se ven como el Figma.

5. **Reveal de entrada** por card: con `IntersectionObserver`, cada card pasa de `opacity:0` + `translateY` a su estado final (fade + slide-up) una sola vez al entrar en viewport. Verificación: al hacer scroll, cada card aparece con la transición suave; al volver a subir no se re-dispara de forma molesta.

6. **Micro-animación sutil del visual**: flotación/parallax leve del glifo SVG (y pulso/rotación muy leve de los anillos) mediante CSS `@keyframes` o transform continuo. Verificación: el visual tiene vida sutil sin distraer ni cargar la CPU.

7. **Respetar `prefers-reduced-motion`**: si está activo, degradar a stack vertical estático (sin reveal ni micro-animación). Verificación: con reduce-motion activo, la sección es un stack estático navegable.

8. **Ajustar el wrapper en `src/pages/index.astro`** si el nuevo alto/flujo de la sección rompe los solapes `-mt-*`/`z-*` con Hero, Testimonios y Stats. Verificación: no hay solapes ni cortes entre secciones al hacer scroll por todo el home.

---

## Criterios de aceptación

- [ ] La sección muestra el título **"Nuestras soluciones"**.
- [ ] Se renderizan exactamente las **4 cards** del Figma con sus títulos, descripciones y bullets correctos.
- [ ] Cada card muestra su **glifo SVG** (desde `item.icon`) centrado sobre el panel morado con los anillos concéntricos de fondo.
- [ ] Los cards se apilan en **vertical** con scroll normal; **no** hay scroll horizontal, pin ni sticky-scale.
- [ ] En **desktop (≥768px)** cada card es **info a la izquierda / visual morado a la derecha**, con la **misma orientación** en los 4.
- [ ] En **mobile (<768px)** cada card es vertical con **visual arriba e info abajo**.
- [ ] Cada card entra con un **reveal fade + slide-up** al aparecer en viewport (una sola vez).
- [ ] El **visual** de cada card tiene una **micro-animación sutil** continua (flotación/parallax leve).
- [ ] Si el CMS agrega o quita un item, el stack y los reveals se aplican al nuevo número de cards sin romperse.
- [ ] Con **`prefers-reduced-motion: reduce`** activo, la sección es un **stack vertical estático** (sin reveal ni micro-animación).
- [ ] No quedan referencias a los `CARD_VISUALS[]` hardcodeados ni al sticky-scale/overlay en `StickyCardsReact.tsx`.
- [ ] Al hacer scroll por todo el home no hay **solapes ni cortes** entre esta sección y Hero / Testimonios / Stats.
- [ ] No hay errores en la consola del navegador al cargar y hacer scroll por la sección.

---

## Decisiones tomadas y descartadas

- **No:** scroll horizontal fijado (pin + `translateX`). Se verificó con Playwright que effortel **no** hace eso; su sección es un stack vertical. Corrige la versión anterior de este spec.
- **Sí:** stack vertical con reveal de entrada (fade + slide-up) estilo effortel, en desktop y mobile.
- **Sí:** mantener la orientación uniforme del Figma (info izquierda / visual derecha en los 4 cards). No se alterna de lado como effortel, porque el Figma de Fiberlux no lo hace.
- **Sí:** visual = SVG estático del CMS + micro-animación sutil (flotación/parallax). Editable y simple.
- **No:** visuales animados "en vivo" tipo mockup de effortel. Más trabajo y no editables desde el CMS; se difieren.
- **Sí:** contenido del **Figma desktop** (4 cards, "Nuestras soluciones") como fuente de verdad. El Figma mobile mostraba 5 cards con otros nombres; se unifica con la versión desktop.
- **Sí:** el glifo central viene del campo `icon` (imagen/SVG) ya existente en el CMS, editable. Reutiliza el schema actual sin cambios.
- **No:** modelar los chips flotantes y los anillos como campos CMS independientes. Los anillos son chrome fijo; los chips, si existen, vienen dentro del SVG.
- **Sí:** los 4 SVGs se extraen desde Figma y se cargan en `public/uploads/soluciones/`, para no depender de la subida manual.
- **Sí:** eliminar los `CARD_VISUALS[]` hardcodeados y toda la lógica de sticky-scale/overlay. Con el glifo desde el CMS y el nuevo reveal, dejan de tener sentido.
- **Sí:** respetar `prefers-reduced-motion` degradando a stack estático. Consistente con el patrón ya usado en Rubros (SPEC 05).

---

## Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| El reveal y la micro-animación pueden pelearse con el smooth-scroll de Lenis ya activo en `BaseLayout.astro`. | Usar `IntersectionObserver` para el reveal (independiente de Lenis) y CSS `@keyframes` para la micro-animación; verificar que no hay saltos. |
| El nuevo flujo de la sección puede romper los solapes `-mt-*`/`z-*` del home en `index.astro`. | Paso 8 del plan valida y ajusta los solapes con Hero, Testimonios y Stats. |
| SVGs pesados o mal optimizados desde Figma pueden degradar el render. | Exportar SVGs limpios/optimizados a `public/uploads/soluciones/`. |
| Con muchos bullets (Ciberseguridad tiene 6) el panel de info puede desbordar la altura de la card. | Definir la altura de card contra el contenido real del Figma; permitir que el panel crezca si desborda. |
| Re-disparo del reveal al hacer scroll hacia arriba puede sentirse molesto. | Configurar el `IntersectionObserver` para disparar una sola vez (unobserve tras revelar). |

---

## Qué **NO** entra en este spec

- Scroll horizontal, pin o scroll-jacking de la sección.
- Visuales animados "en vivo" tipo mockup de effortel.
- Alternar la orientación de los cards de lado a lado.
- Chips flotantes modelados como campos CMS independientes.
- Anillos concéntricos o color del panel morado editables desde el CMS.
- Cambios en otras secciones del home (Hero, Stats, Testimonios, Blog).

Cada uno de estos, si aterriza, va en su propio spec.
