# SPEC 39 — Logo animado del hero home (vuela al header con el scroll)

> **Estado:** Implementado
> **Depende de:**
> - **SPEC 33** (HeaderV2: top bar + navbar inline; el logo vive en `HeaderV2React.tsx`).
> - **SPEC 25** (inicialización de `scrolled`/scroll al montar; se reutiliza el mismo `useEffect` de scroll).
> - Interactúa con **SPEC 18 / 31** (hero 3D de la home): el logo se superpone a la escena Spline del hero.
> - No introduce dependencias nuevas ni de datos ni de librerías.
>
> **Fecha:** 2026-07-16
>
> **Objetivo:** En la home de **desktop**, hacer que el logo de Fiberlux del header arranque **grande y alineado a la izquierda encima del texto del hero** y, a medida que se hace scroll, **se encoja y reposicione de forma continua (scrubbed y reversible)** hasta su lugar normal en el header — siendo **el mismo y único logo** que viaja (sin dos logos ni crossfade), y sin afectar mobile ni el resto de páginas.

> Referencia de comportamiento: codepen `grizhlie/pen/eYarOMW` (logo que escala/desplaza ligado al scroll).

---

## Alcance

**Dentro:**

- **Un solo logo que viaja.** El logo del header (`HeaderV2React.tsx`, el `<a href="/">` con la `<img>`) es el mismo elemento en los dos estados: grande sobre el hero (scroll = 0) y pequeño en su slot del header (scroll ≥ distancia de viaje). No hay dos logos ni crossfade.
- **Solo home + solo desktop (`≥1024px`).** El efecto se activa únicamente cuando el header sabe que está en la home y el viewport es desktop. En cualquier otra página, o en mobile/tablet (`<1024px`), el logo se comporta como hoy (pequeño, arriba-izquierda, estático).
- **Animación scrubbed y reversible.** Una `progress` de `0` a `1` calculada a partir de `window.scrollY` sobre una distancia de viaje configurable (`LOGO_TRAVEL_DISTANCE`). En `progress = 0` el logo está grande y desplazado hacia abajo (encima del texto del hero); en `progress = 1` está en su tamaño/posición nativos del header. Al subir vuelve a agrandarse de forma continua.
- **Alineación a la izquierda con el texto del hero.** Header y hero comparten `site-container`, por lo que el borde izquierdo del logo grande coincide con el borde izquierdo del `h1` del hero sin cálculo horizontal (solo se interpola escala y `translateY`, `transform-origin` a la izquierda).
- **Perf.** La interpolación se aplica al DOM vía `ref` + `requestAnimationFrame` dentro del handler de scroll ya existente, para no re-renderizar React en cada frame de scroll.
- **`prefers-reduced-motion`.** Si el usuario lo tiene activo, se omite el estado grande: el logo se muestra directamente en su tamaño/posición normal del header (equivale a `progress = 1` fijo).
- **Threading del flag de home.** `BaseLayout.astro` calcula si la ruta es la home y lo pasa como prop (`heroLogo`) por `HeaderV2.astro` → `HeaderV2React.tsx`.
- **Espacio en el hero.** Ajustar, si hace falta, el `padding-top` desktop del texto del hero (`HeroHomeReact.tsx`) para que el logo grande no se solape con el `h1`. Validado visualmente.

**Fuera (para futuros specs):**

- Mostrar el logo grande (estático o animado) en **mobile/tablet**.
- Aplicar el mismo efecto en heros de otras páginas (soluciones, nosotros, etc.).
- Hacer el tamaño/offset del logo grande **editables desde el CMS** (se resuelve con constantes en código en este spec).
- Cambios en la escena 3D del hero, en el navbar inline o en el overlay del hamburguesa.
- Animar también el fondo/altura del header al scrollear (el fondo con opacidad ya existe por SPEC 25/16).

---

## Modelo de datos

**Esta feature no introduce ni modifica datos, colecciones ni campos del CMS.** El tamaño y el desplazamiento se resuelven con **constantes en `HeaderV2React.tsx`** (`LOGO_TRAVEL_DISTANCE`, `LOGO_HEADER_H`, `LOGO_HERO_H`, `LOGO_START_OFFSET_Y`), afinadas visualmente. El único dato que fluye nuevo es un **prop booleano de UI** (`heroLogo`), no contenido.

> **Nota de nitidez (post-implementación):** en vez de escalar (`transform: scale`) un logo renderizado a `h-5`, que estira una textura pequeña y **pixela el SVG**, se anima la `height` real del `<img>` (el SVG se re-rasteriza nítido a cada tamaño) y el `transform` solo desplaza en Y. El `<img>` va en `position:absolute` dentro de un `<a>` de tamaño fijo (`h-5 w-[140px]`) para no alterar el layout del header. Estado en reposo/SSR = `height:20px` (sin flash del logo grande).

---

## Plan de implementación

> Todo el trabajo vive en `HeaderV2React.tsx`, `HeaderV2.astro`, `BaseLayout.astro` y, si hace falta, `HeroHomeReact.tsx`. Cada paso deja el proyecto ejecutable (`npm run dev`).

1. **Threading del flag `heroLogo`.** En `BaseLayout.astro` calcular `isHome` a partir de `Astro.url.pathname` normalizado contra `import.meta.env.BASE_URL` (raíz del sitio). Pasar `heroLogo={isHome}` a `<HeaderV2 />`. En `HeaderV2.astro` añadir el prop `heroLogo?: boolean` (default `false`) y reenviarlo a `HeaderV2React`. En `HeaderV2React.tsx` recibirlo en `HeaderProps`. *Test:* la app compila; en cualquier página el logo se ve igual que hoy (aún sin lógica de animación). Commit.

2. **Estado grande + interpolación por scroll (desktop/home).** En `HeaderV2React.tsx`:
   - Añadir un `ref` al `<a>`/`<img>` del logo.
   - Definir las constantes (`LOGO_TRAVEL_DISTANCE`, `LOGO_MAX_SCALE`, `LOGO_START_OFFSET_Y`).
   - En `handleScroll` (o un handler dedicado enganchado al mismo listener), cuando `heroLogo && !isMobile.current && !prefers-reduced-motion`, calcular `progress = clamp(scrollY / LOGO_TRAVEL_DISTANCE, 0, 1)` y aplicar por `ref`, dentro de `requestAnimationFrame`, `transform: translateY(offsetY·(1-progress)) scale(1 + (MAX_SCALE-1)·(1-progress))` con `transform-origin` izquierda. En el resto de casos, limpiar cualquier transform (logo normal).
   - Inicializar el estado al montar (reutilizando la llamada a `handleScroll()` que ya existe por SPEC 25), para que un reload a mitad de página muestre el tamaño correcto sin esperar un evento de scroll.
   - *Test:* en home desktop, al tope el logo se ve grande sobre el texto del hero; al scrollear se encoge y reposiciona de forma continua hasta su slot; al subir revierte. Commit.

3. **Ajuste de espacio en el hero.** Si el logo grande se solapa con el `h1`, aumentar el `padding-top` desktop del bloque de texto del hero (`HeroHomeReact.tsx`, `lg:pt-40`) o el `LOGO_START_OFFSET_Y` hasta que haya aire suficiente, validado contra la referencia. *Test:* el logo grande queda claramente encima del `h1`, alineado a la izquierda, sin taparlo. Commit.

4. **Guardas de desktop/mobile y reduced-motion.** Verificar que al cruzar el breakpoint (`handleResize`) se limpia el transform del logo (mobile = logo normal) y que con `prefers-reduced-motion` el logo arranca ya en `progress = 1`. *Test:* redimensionar de desktop a mobile con el logo grande no deja residuo; con reduced-motion no hay animación. Commit.

5. **Regresión.** Confirmar que en páginas que no son home el logo es el de siempre; que el hide-on-scroll de mobile, el overlay del hamburguesa y el fondo con opacidad del header (SPEC 25) siguen igual; y que `astro build` termina sin errores ni warnings nuevos. Commit.

---

## Criterios de aceptación

- [x] En **home desktop (`≥1024px`)** y con el scroll al tope, el logo se ve **grande, alineado a la izquierda, encima del texto del hero**, sin taparlo.
- [x] Al hacer scroll hacia abajo, **el mismo logo** se encoge y reposiciona de forma **continua (scrubbed)** hasta quedar en su tamaño/posición nativos del header; al subir, **revierte** de forma continua.
- [x] **No hay dos logos** simultáneos ni crossfade en ningún momento del recorrido.
- [x] En **mobile/tablet (`<1024px`)** el logo se comporta como hoy (pequeño, arriba-izquierda, estático); no aparece el logo grande. *(Verificado por lógica: guarda `!isMobile.current` con `innerWidth < 1024` + sin transform en SSR; no se pudo reducir el viewport bajo 1024 en la sesión de QA.)*
- [x] En **cualquier página que no sea la home**, el logo se comporta como hoy en todos los breakpoints. *(Verificado en `/nosotros`.)*
- [x] Con **`prefers-reduced-motion: reduce`** el logo se muestra directo en su tamaño/posición normal del header (sin animación de vuelo). *(Verificado por lógica: guarda `prefersReducedMotion.current`.)*
- [x] Al **recargar la home desktop a mitad de página**, el logo aparece ya en el estado correcto (interpolado según el scroll), sin esperar un evento de scroll. *(Se reutiliza el `handleScroll()` en el montaje de SPEC 25.)*
- [x] El **hide-on-scroll de mobile**, el **overlay del hamburguesa** y el **fondo con opacidad del header** (SPEC 25/16) funcionan igual que antes.
- [x] No se introducen campos de CMS ni props nuevos más allá de `heroLogo`.
- [x] `astro build` termina sin errores ni warnings nuevos.

---

## Decisiones

- **Sí: renderizar el logo que viaja dentro del header** (`HeaderV2React.tsx`), no en el hero. El header ya es fixed, ya escucha scroll y su slot es la posición de reposo del logo (cero cálculo al aterrizar). Así el logo es literalmente el mismo elemento en ambos estados, cumpliendo "un solo logo" y "oculto hasta que aterrice" sin coordinar dos islands.
- **No: renderizar el logo grande en el hero** y ocultar el del header hasta que aterrice. Sería coordinar dos islands y calcular la geometría del header desde el hero; más frágil y más cercano a un crossfade, que se descartó.
- **Sí: scrubbed ligado a `scrollY`** (interpolación continua), reversible, como el codepen de referencia. El usuario lo pidió explícitamente frente a un umbral de un solo sentido.
- **Sí: aplicar el transform por `ref` + `requestAnimationFrame`** en vez de estado de React por frame, para evitar re-render en cada evento de scroll.
- **Sí: alinear a la izquierda reutilizando `site-container`** (solo se interpola escala + `translateY`), en vez de centrar. El texto del hero es left-aligned y así el logo comparte su eje sin cálculo horizontal.
- **Sí: tamaño/offset como constantes en código**, no editables por CMS. Es una parametrización visual fina, no contenido; abrirla al CMS es alcance de otro spec si se pide.
- **Sí: desactivar el efecto en mobile y en no-home**, dejando el logo actual intacto, para no arriesgar regresiones fuera del caso pedido.
- **Sí: honrar `prefers-reduced-motion`** mostrando el logo en su estado final, coherente con el resto del sitio.

---

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| El logo grande se solapa con el `h1` del hero según la resolución. | `LOGO_START_OFFSET_Y` y el `padding-top` desktop del hero son afinables; se valida visualmente contra la referencia en el paso 3. |
| Jank de scroll al recalcular el transform en cada frame. | Se aplica vía `ref` + `requestAnimationFrame`, sin re-render de React; el listener de scroll ya es `passive`. |
| Al cruzar el breakpoint desktop→mobile con el logo grande, queda un transform residual. | `handleResize` limpia el transform (y resetea a estado normal) al pasar a `<1024px`; se valida en el paso 4. |
| El header es global; activar el efecto donde no toca rompería otras páginas. | El efecto está guardado tras `heroLogo` (solo home) y el chequeo de desktop; en el resto todo queda como hoy. |
| El logo grande (z del header) podría quedar por debajo/encima de capas del hero de forma inesperada. | El header es `z-[80]`, muy por encima del contenido del hero (`z` máx 10); el logo queda por encima de la escena y del texto sin cambios de stacking. |
| El transform del logo grande podría verse recortado por algún `overflow`. | El header no tiene `overflow: hidden`; el transform desborda visible hacia el hero. Se verifica en QA. |
