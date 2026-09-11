# SPEC 115 — Piso de animación de scroll en el resto del sitio

> **Estado:** Aprobado
> **Depende de:** SPEC 114 (prop `scrubCounters` de `EmpresasRed` y la ventana `enterProgress`, que es lo que aquí se enciende página por página), SPEC 113 (`src/scripts/chapters.ts`, donde vive `enterProgress`), SPEC 71 (repertorio `data-reveal` / `data-reveal-stagger` / `data-parallax` y `useStatCounter`), SPEC 69 (`data-reveal` y el anti-FOUC gateado por `.reveal-js`), SPEC 110 (limpieza de listeners con View Transitions), SPEC 80 (i18n: los wrappers `/en` heredan sin tocarse). Frontera declarada, no dependencia: SPECs 91, 98, 101, 102 y 104 — los heros con efecto propio, que esta spec no toca.
> **Fecha:** 2026-09-11
> **Objetivo:** Llevar el piso de animación de scroll al resto del sitio — ninguna página de marketing por debajo de 6 reveals y 2 cascadas, con los contadores atados al scroll donde haya cifras — sin añadir capítulos ni tocar heros, formularios ni legales.

---

## Sección 1 — Por qué existe este spec

Las SPECs 113 y 114 dejaron la Home con scroll-telling en la apertura y un piso de animación decente en el resto. El problema es que **el sitio quedó desparejo**: se pasa de una Home que respira a páginas donde no se mueve absolutamente nada.

Inventario medido en el DOM a 1440×900, recorriendo cada página entera para hidratar las islas `client:visible`:

| Página | Pantallas | reveals | stagger | parallax | canvas |
| --- | --- | --- | --- | --- | --- |
| `/` | 14,8 | 14 | 4 | 1 | 2 |
| `/nosotros` | 7,3 | 12 | 2 | 1 | **4** |
| `/soluciones` | 7,3 | 11 | 3 | 1 | 2 |
| `/soluciones/conectividad` | 7,3 | 8 | 3 | 0 | 3 |
| `…/internet-dedicado` | 6,0 | 7 | 3 | 0 | 0 |
| `/soporte-tecnico` | 7,2 | 9 | **1** | 0 | **4** |
| `/fiberlux-app` | 5,2 | 6 | 3 | 0 | 0 |
| `/casos-de-exito` | 3,8 | **3** | **0** | 0 | 0 |
| `/blog` | 2,6 | **2** | **0** | 0 | 1 |
| `/formas-de-pago` | 4,3 | **2** | **0** | 0 | 0 |
| `/informacion-abonados` | 2,1 | 4 | 3 | 0 | 0 |
| `/contacto` | 1,9 | **0** | 0 | 0 | 0 |
| `/reclamos` | 1,9 | **0** | 0 | 0 | 0 |
| `/reclamos/reclamo` | 3,3 | **0** | 0 | 0 | 0 |
| `/legales/tratamiento-datos` | 2,2 | **0** | 0 | 0 | 0 |

Salen tres grupos con criterios distintos:

1. **Seis ya servidas** (7–12 reveals): nosotros, soluciones, categorías, subservicios, soporte y fiberlux-app. No necesitan más volumen; necesitan **auditoría**, porque tener el atributo puesto no garantiza que dispare — y porque `/soporte-tecnico` tiene 9 reveals con **una sola cascada**.
2. **Tres por debajo del piso**: casos de éxito, blog y formas de pago. Son las que justifican la spec.
3. **Ocho en cero**: contacto, los cuatro de reclamos y los tres legales. **Se quedan en cero a propósito** (ver alcance).

---

## Sección 2 — Alcance

**Dentro (11 rutas, 46 páginas contando las plantillas):**

- `/nosotros`, `/soluciones`, las **5 categorías** (`/soluciones/[solucion]`), los **30 subservicios** (`/soluciones/[solucion]/[subservicio]`), `/soporte-tecnico`, `/casos-de-exito`, `/blog`, `/fiberlux-app`, `/formas-de-pago` e `/informacion-abonados`.
- **Llevar al umbral** las tres que están por debajo: `/casos-de-exito`, `/blog`, `/formas-de-pago`.
- **Auditar y nivelar** las seis ya servidas: comprobar que lo que tienen dispara de verdad, y subir las cascadas donde se queden cortas (caso concreto: `/soporte-tecnico`).
- **Encender `scrubCounters`** (SPEC 114) en las páginas del alcance que montan `EmpresasRed`: `/fiberlux-app`, `/soporte-tecnico`, `/casos-de-exito`, las 5 categorías y los 30 subservicios. Es la revisión deliberada de la decisión "solo la Home la enciende" de la 114: ahí se apagó por defecto para acotar el radio, y aquí se abre con criterio, página por página.
- **Parallax** donde el bloque tenga un fondo propio que lo admita — **auditado, no forzado**. La lección de la 114: inventarle una capa a un bloque de color plano es introducir un fondo nuevo, no animar.
- **Accesibilidad**: `prefers-reduced-motion` deja todo visible y quieto, por el mecanismo que ya existe (`.reveal-js` + la media query de `BaseLayout`).
- **Ciclo de vida**: nada que registre listeners puede sobrevivir a un swap de View Transitions (SPEC 110).

**Fuera de alcance:**

- **Las 8 páginas de formulario y legales**: `/contacto`, `/reclamos` y sus 3 subpáginas, y los 3 `/legales`. Decisión explícita del cliente: **se quedan en cero**. Animar el scroll de una página a la que se llega a rellenar un formulario o a leer un texto legal estorba a quien vino a hacer eso.
- **`/blog/[slug]`** (los posts). Lectura larga; las animaciones de scroll molestan al leer.
- **Los heros.** Ninguno se toca: los de nosotros, soporte, casos, categorías y subservicios tienen efecto propio resuelto en las SPECs 91, 98, 101, 102 y 104, cada una con sus decisiones cerradas.
- **Capítulos narrativos** (sticky + scrub). Ninguno, en ninguna página.
- **La Home.** Ya la cubrieron la 113 y la 114.
- **Añadir canvas WebGL.** Ver decisiones.
- **Rediseñar nada.** Esta spec anima lo que ya existe; no cambia layout, color ni copy.

---

## Sección 3 — Modelo de datos

**No se introduce ningún campo nuevo en Tina, ninguna colección y ninguna prop nueva.** Todo el trabajo usa el repertorio que ya existe: los atributos `data-reveal`, `data-reveal-stagger`, `data-reveal-distance` y `data-parallax` de la SPEC 71, y la prop `scrubCounters` que la SPEC 114 ya dejó implementada en `EmpresasRedReact`.

---

## Sección 4 — El umbral, y cómo se mide

**Piso: ninguna ruta del alcance por debajo de 6 `data-reveal` y 2 `data-reveal-stagger`.**

La medición no es sobre el HTML construido: `grep` sobre `dist/` cuenta también los props serializados dentro de `<astro-island>` y da números inflados (hasta 4× en las pruebas). **Se mide en el DOM**, dentro de `<main>`, y **después de recorrer la página entera**, porque las islas `client:visible` no existen hasta que se las visita:

```js
const main = document.querySelector('main');
main.querySelectorAll('[data-reveal]').length          // ≥ 6
main.querySelectorAll('[data-reveal-stagger]').length  // ≥ 2
```

El umbral es un **piso, no una cuota**: no se trata de salpicar atributos hasta llegar a seis, sino de que los bloques que componen la página entren como entra el resto del sitio. Si una página llega a 6 con dos bloques bien tratados, está terminada.

**Los contadores** se consideran atados al scroll cuando la cifra llega a su valor exacto durante la entrada de la sección y se queda quieta, tal como se verificó en la 114.

---

## Sección 5 — Plan de implementación

Cada paso deja el sitio compilando y funcionando.

1. **Auditoría medida** de las 11 rutas: registrar el baseline real en la spec (reveals, staggers, parallax, canvas y alto), y anotar cuáles de los atributos existentes **no disparan**.
2. **`/casos-de-exito` al umbral.** Componentes en juego: `CasosSlider` y `RubrosReact` (el hero, `HeroCasos`, no se toca).
3. **`/blog` al umbral.** Componente en juego: `BlogGrid` (el hero, `BlogHero`, no se toca).
4. **`/formas-de-pago` al umbral.** Componente en juego: `FormasPagoSelector` (el hero, `HeroFormasPago`, no se toca).
5. **Nivelar `/soporte-tecnico`**, que tiene 9 reveals y una sola cascada.
6. **Encender `scrubCounters`** en las páginas del alcance que montan `EmpresasRed`.
7. **Parallax** donde la auditoría del paso 1 haya identificado un fondo que lo admita. Si no hay ninguno, no se añade y se registra — como en la 114.
8. **QA**: build; las 11 rutas del alcance medidas de nuevo; las 8 excluidas verificadas en cero; `prefers-reduced-motion`; móvil a 390×844; y una navegación con View Transitions.

---

## Sección 6 — Criterios de aceptación

- [ ] `npx tinacms dev -c "astro build"` termina con exit 0 y 108 páginas.
- [ ] **Las 11 rutas del alcance** dan ≥ 6 `data-reveal` y ≥ 2 `data-reveal-stagger`, medido en el DOM dentro de `<main>` tras recorrer la página entera.
- [ ] **Las 8 páginas excluidas siguen exactamente en 0 `data-reveal`**: `/contacto`, `/reclamos`, `/reclamos/reclamo`, `/reclamos/queja`, `/reclamos/apelacion` y los 3 `/legales`.
- [ ] `/blog/[slug]` no cambia: mismo conteo de reveals que antes de la spec.
- [ ] **Ningún hero modificado**: `git diff` no toca `HeroCasos`, `BlogHero`, `HeroFormasPago` ni los componentes de hero de las SPECs 91/98/101/102/104.
- [ ] En las páginas del alcance que montan `EmpresasRed`, las cifras llegan a su valor exacto durante la entrada de la sección y se quedan quietas.
- [ ] **No hay capítulos nuevos**: `[data-chapter]` devuelve 0 en todas las rutas salvo la Home, que sigue en 2.
- [ ] **No hay canvas nuevos**: el conteo de `<canvas>` por página no sube respecto al baseline del paso 1.
- [ ] La altura de cada página del alcance no crece más de un 5 % respecto al baseline.
- [ ] Con `prefers-reduced-motion: reduce`, todo el contenido de las 11 rutas se lee sin scrollear y sin animación.
- [ ] Cada ruta del alcance no suma errores de consola nuevos respecto a su baseline (el mismatch de hidratación pre-existente de `/nosotros` no cuenta y no debe empeorar).
- [ ] Tras navegar con View Transitions no queda ningún listener del alcance escuchando.
- [ ] `SolucionesStack` sigue sin tocarse.

---

## Sección 7 — Decisiones tomadas y descartadas

| Decisión | Por qué |
| --- | --- |
| **Una sola spec, excluyendo formularios y legales** | Al sacar las 8 páginas de formulario y legales, lo que queda es homogéneo: un mismo tratamiento aplicado a páginas de marketing. Ya no hacen falta dos specs. |
| **Las 8 excluidas se quedan en cero** | Se llega a ellas a rellenar un formulario o a leer un texto legal. Animar el scroll ahí estorba a quien vino a hacer eso. |
| **Sin capítulos narrativos** | Los capítulos alargan la página: la Home pasó de 7,7 a 14,8 pantallas al meter dos. Estas ya miden 6–7, y multiplicarlo por 35 rutas de soluciones es mucho scroll para páginas que existen para convertir, no para narrar. |
| **Umbral 6 reveals / 2 cascadas, medido en el DOM** | "Nivelar" sin número no es verificable. Y medirlo sobre `dist/` con `grep` da hasta 4× de más, porque cuenta los props serializados de las islas. |
| **El umbral es un piso, no una cuota** | Para que nadie salpique atributos hasta llegar a seis. Lo que se busca es que los bloques entren bien, no que el contador dé un número. |
| **Los heros no se tocan** | Cinco specs previas los resolvieron uno a uno, cada una con sus decisiones cerradas. |
| **`/blog/[slug]` fuera** | Lectura larga. |
| **`/informacion-abonados` dentro** | Es regulatoria de OSIPTEL pero informativa, sin formulario, y ya tiene 4 reveals y 3 cascadas: está a un paso del piso. Se trata como informativa sobria. |
| **No se añaden canvas** | El cliente no lo prohibió de forma absoluta, pero sí pidió no cargar la web. El tratamiento de esta spec no necesita ninguno, y `/nosotros` y `/soporte-tecnico` ya montan cuatro cada una. Si en la implementación apareciera un caso que lo justifique, se para y se consulta en vez de añadirlo. |
| **`scrubCounters` se extiende a más páginas** | Revisa a propósito la decisión "solo la Home la enciende" de la SPEC 114. Allí se apagó por defecto para que el radio fuera cero mientras se validaba; validado, se abre con criterio página por página. |
| **Parallax auditado, no forzado** | Lección literal de la 114: no hubo ni un bloque que lo admitiera, y se registró en vez de inventarle un fondo a un bloque plano. |
| **Descartado: dos specs (marketing / formularios)** | Al decidir que los formularios no se animan, la segunda spec se quedaba sin contenido. |
| **Descartado: tratamiento completo en formularios y legales** | Mismo motivo que la decisión de dejarlas en cero. |

---

## Sección 8 — Auditoría (Step 1)

Medido en el DOM a 1440×900, recorriendo cada página entera. Umbral: **≥ 6 reveals y ≥ 2 cascadas**.

| Ruta | Alto | reveals | cascadas | parallax | canvas | errores | ¿Pasa? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/nosotros` | 6584 | 12 | 2 | 1 | 4 | 1 | ✅ |
| `/soluciones` | 6579 | 11 | 3 | 1 | 2 | 1 | ✅ |
| `/soluciones/conectividad` | 6609 | 8 | 3 | 0 | 3 | 2 | ✅ |
| `…/internet-dedicado` | 5379 | 7 | 3 | 0 | 0 | 3 | ✅ |
| `/fiberlux-app` | 4660 | 6 | 3 | 0 | 0 | 0 | ✅ (justo) |
| `/soporte-tecnico` | 6487 | 9 | **1** | 0 | 4 | 0 | ❌ cascadas |
| `/informacion-abonados` | 1904 | **4** | 3 | 0 | 0 | 0 | ❌ reveals |
| `/casos-de-exito` | 3447 | **3** | **0** | 0 | 0 | 1 | ❌ |
| `/blog` | 2331 | **2** | **0** | 0 | 1 | 0 | ❌ |
| `/formas-de-pago` | 3875 | **2** | **0** | 0 | 0 | 0 | ❌ |

**Cinco rutas por debajo del piso**, no cuatro: el plan olvidó `/informacion-abonados`, que tiene 3 cascadas pero solo 4 reveals. Se añade al trabajo.

### Dos correcciones a esta spec, salidas de la propia auditoría

1. **`/nosotros` y `/blog` no tienen `<main>`.** La Sección 4 prescribe medir dentro de `<main>`, lo que en esas dos rutas es imposible. Medido: **la cabecera y el pie aportan 0 reveals y 0 cascadas en todas las páginas**, así que contar sobre `<body>` da exactamente el mismo número. El criterio se lee: **dentro de `<main>` cuando existe, y sobre `<body>` cuando no** — son equivalentes.

2. **Ningún atributo está "mudo".** La auditoría buscaba reveals que no disparasen y encontró dos en `/nosotros` en opacidad 0 tras recorrer la página. **Falsa alarma**: son `data-reveal-scrub`, cuyos keyframes son `opacity: [0, 1, 1, 0]` sobre la ventana `["start end", "end start"]` — entran, se mantienen y **se desvanecen al salir**, por diseño (SPEC 73). Se midieron ya pasados de largo, que es justo donde valen 0. Verificado recorriendo su ventana: `0 → 1 → 1 → 1 → 0,43 → 0`. **Medir un scrub fuera de su ventana no dice nada**, y conviene tenerlo presente en el QA de esta spec.

---

## Sección 9 — Riesgos

1. **Componentes compartidos, otra vez.** Es el riesgo que ya mordió en la 114. `RubrosReact` lo usan `/casos-de-exito` **y** `/nosotros`; `EmpresasRed` está en 7 páginas. Cada cambio dentro de un componente hay que verificarlo en todas las páginas que lo montan, no solo en la que motivó el cambio.
2. **Una plantilla, 30 páginas.** El subservicio es un solo archivo que genera 30 rutas. Un acierto se multiplica por 30 y un error también; conviene verificar en más de un subservicio.
3. **`/nosotros` y `/soporte-tecnico` ya montan 4 canvas cada una.** Son las dos páginas más cargadas del sitio y las dos que menos margen tienen. Ahí el criterio es no sumar trabajo de main thread.
4. **Mismatch de hidratación pre-existente en `/nosotros`.** Verificado que existe también en `staging`, así que no viene de la 113 ni de la 114. Cualquier cambio que toque islas compartidas debe comprobar que no lo empeora.
5. **Cascadas sobre listas largas.** Riesgo heredado de la 114: un stagger por hijo sobre una lista larga retrasa la entrada del último elemento más de lo tolerable. `BlogGrid` y el catálogo de subservicios son listas largas. La palanca es acotar el paso, no el número de hijos.
6. **El umbral puede empujar a decorar.** Si una página llega justa a 6, la tentación es añadir atributos sin criterio. El piso está para detectar páginas olvidadas, no para rellenarlas.
