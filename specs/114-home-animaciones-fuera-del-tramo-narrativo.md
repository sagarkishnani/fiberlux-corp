# SPEC 114 — Home: animaciones de scroll fuera del tramo narrativo

> **Estado:** Aprobado
> **Depende de:** SPEC 113 (motor de capítulos y `spanProgress`, que es lo que ata el contador al progreso de una sección; y el tramo narrativo, que termina justo donde empieza esta spec), SPEC 71 (`data-reveal-stagger`, `data-parallax`, `useStatCounter` y `fx.ts`), SPEC 69 (`data-reveal` y el anti-FOUC gateado por `.reveal-js`), SPEC 110 (limpieza de listeners con View Transitions), SPEC 54/22 (las cifras "¿Por qué Fiberlux?") y SPEC 49 (el panel claro de testimonios), que juntas son hoy `EmpresasRed`, SPEC 100 (hallazgo: todas las secciones del home pintan su propio fondo opaco)
> **Fecha:** 2026-09-11
> **Objetivo:** Completar las animaciones de scroll de la Home fuera del tramo narrativo — cifras de `EmpresasRed` atadas al progreso de su sección y entrada en cascada con parallax en los bloques restantes — sin añadir capítulos sticky.

---

## Sección 1 — Por qué existe este spec

La SPEC 113 dejó la Home partida en dos mitades desiguales. Las primeras **7 pantallas** son scroll-telling: paneles clavados, revelados por línea atados al scroll, cortes entre capítulos. A partir de ahí, siete bloques que entran todos igual, en bloque, con un `data-reveal="up"` en su wrapper. El contraste se nota justo donde la página tiene que sostener la atención.

Medido en el build de la 113, a 1440×900:

| Bloque | Alto | Pantallas |
| --- | --- | --- |
| Tramo narrativo (hero + frases) | 6300 px | 7,00 |
| `SolucionesStack` | 2875 px | 3,19 |
| `HomePartners` | 586 px | 0,65 |
| `EmpresasRed` | 1194 px | **1,33** |
| `CertificacionesSlider` | 578 px | 0,64 |
| `BannerApp` | 414 px | 0,46 |
| `BlogPreview` | 752 px | 0,84 |

**Tres hallazgos del terreno acotan el trabajo**, y los tres contradicen lo que la 113 dejó apuntado como plan para esta spec:

1. **Los bloques no son de la Home.** `EmpresasRed` se usa en **7 páginas**, `BlogPreview` en 4, `CertificacionesSlider` en 3 y `HomePartners` en 2. Solo `BannerApp` es exclusivo de Home. Cualquier cambio dentro del componente se propaga.
2. **`EmpresasRed` mide 1,33 pantallas: no cabe clavado en un panel de 100svh.** La 113 anticipaba convertirlo en capítulo y partirlo en dos (cifras / testimonio). Un panel sticky lo recortaría, y partirlo toca las otras 6 páginas. **Se descarta el capítulo**: las cifras se atan al progreso de la propia sección, sin sticky.
3. **`EmpresasRed` tiene un diseño propio ya aprobado**, y cambiarlo no es animar. Los círculos concéntricos del prototipo son un rediseño de una decisión visual cerrada.

   > **Corrección de hecho (durante la implementación).** Esta spec afirmaba que el bloque es "un panel claro, magenta sobre rosa". **No lo es**: su `<section>` pinta un plano sólido `#47113C` (ciruela oscuro) con el texto en blanco. La descripción venía del docstring del componente, que es histórico (SPEC 49 fue el panel claro; el diseño cambió después). La decisión de no rediseñarlo no cambia —era del cliente y se sostiene—, pero la justificación original era incorrecta y queda corregida aquí.

Y dos de los cuatro bloques restantes **ya tienen parte del tratamiento**: `CertificacionesSlider` lleva 2 `data-parallax` internos (el glow de la SPEC 52) y `BannerApp` 4 `data-reveal` internos. Entran a esta spec **solo para revisión**, no para rehacerse.

---

## Sección 2 — Alcance

**Dentro:**

- **Cifras atadas al scroll.** Prop nueva `scrubCounters` en `EmpresasRedReact` (**apagada por defecto**). Con ella encendida, las cuatro cifras se construyen siguiendo el progreso de su propia sección vía `spanProgress` (SPEC 113) en vez de dispararse al entrar en viewport con `useCounter`. **Solo la Home la enciende**; las otras 6 páginas que usan el bloque siguen con el comportamiento actual, sin tocar el hook `useStatCounter`.
- **Cascada de entrada en `HomePartners` y `BlogPreview`**: sus hijos entran escalonados (`data-reveal-stagger`, SPEC 71) en vez de todos a la vez. Se aplica **dentro del componente**, y por tanto **también en las otras páginas que los usan** (`/soluciones`, `/fiberlux-app`, categorías y subservicios): es aditivo, y es el estado al que la SPEC 115 va a llegar igual.
- **Parallax sutil** (`data-parallax`, SPEC 71) en los bloques que tengan un fondo propio que lo admita, sin introducir fondos nuevos.
- **Revisión —no reescritura— de `BannerApp` y `CertificacionesSlider`**: se comprueba que su entrada y su parallax funcionan tras los cambios de la 113 y se registra el resultado. Si están bien, no se tocan.
- **Accesibilidad**: con `prefers-reduced-motion` no se registra ningún scrub ni cascada; las cifras quedan en su valor final y los bloques visibles, que es el comportamiento que ya tienen hoy.
- **Ciclo de vida**: todo `spanProgress` devuelve su función de parada y se registra en el cleanup correspondiente, o sobrevive al swap de View Transitions (SPEC 110).

**Fuera de alcance (specs futuras):**

- **El resto de las páginas del sitio** → **SPEC 115**. Son 20 páginas más sus espejos `/en`, con heros y estructuras muy distintas; las de formulario (reclamos, legales) piden un tratamiento aparte del de las páginas de marketing.
- **Capítulos sticky nuevos.** Ninguno. La Home se queda con los dos de la 113.
- **Tocar `SolucionesStack`** (SPEC 108). Decisión sostenida del cliente.
- **Partir `EmpresasRed`** en dos componentes.
- **Rediseñar las cifras** a círculos concéntricos o pasar ese bloque a fondo oscuro.
- **Extender el fondo de fibra** más allá del tramo narrativo. Hoy muere al entrar en Soluciones y eso es lo que garantiza que no haya dos canvas WebGL vivos; además la SPEC 100 ya documentó que todas las secciones del home pintan su propio fondo opaco, así que un telón común exige tocarlas todas — se intentó y se revirtió.
- **Cortes de película fuera del tramo narrativo.** El corte marca cambio de capítulo; fuera del tramo no hay capítulos y sería decoración.
- **Modificar `useStatCounter`**: lo usan Nosotros, Soluciones, Soporte y Casos de éxito.

---

## Sección 3 — Modelo de datos

**No se introduce ningún campo nuevo en Tina ni ninguna colección.** El contenido de las cuatro cifras sigue siendo `home.stats.items[]` tal como está.

Lo único que se añade es **una prop de componente**:

```ts
// EmpresasRedReact.tsx
interface EmpresasRedProps {
  // …props existentes…
  /** Ata las cifras al progreso de la sección en vez de dispararlas al entrar
      en viewport. Solo la Home la enciende (SPEC 114). */
  scrubCounters?: boolean;   // default: false
}
```

`EmpresasRed.astro` la acepta y la reenvía; `src/pages/index.astro` es el único sitio que la pasa en `true`.

---

## Sección 4 — Mecánica

**El scrub de las cifras.** `spanProgress(section, p => …)` entrega 0→1 desde que el borde superior de la sección toca el tope del viewport hasta que su borde inferior toca el fondo. Cada cifra se interpola desde 0 hasta el valor que ya extrae `parseStat` (que resuelve prefijo, sufijo, decimales y separador de miles: `+5,500`, `+17,000 km`, `99`, `100%`).

**Las cifras llegan a su valor al 55 % del recorrido**, no al 100 %. Es la misma lección de la 113 que costó una corrección en QA: si el valor final coincide con el final del recorrido, el usuario nunca lo ve quieto. Con la sección midiendo 1,33 pantallas, el 55 % deja aproximadamente media pantalla de lectura con la cifra ya completa.

**Ir hacia atrás desanda la cifra.** Es inherente al scrub y es deseable: la cifra está atada a la posición, no a un evento. Sustituye al `rebobinar` de `useCounter`, que hacía lo mismo de forma discreta.

**La cascada** no necesita mecánica nueva: `data-reveal-stagger` (SPEC 71) ya escalona los hijos directos del contenedor que lo lleva. El trabajo es colocarlo en el contenedor correcto dentro de cada componente — desde el wrapper de página no sirve, porque ahí el único hijo es la isla.

**Con `prefers-reduced-motion`** no se registra nada: las cifras se pintan en su valor final y los bloques entran sin animación, que es exactamente lo que hacen hoy.

---

## Sección 5 — Plan de implementación

Cada paso deja el sitio compilando y funcionando.

1. **Revisión de `BannerApp` y `CertificacionesSlider`.** Comprobar en navegador que su entrada escalonada y su parallax siguen funcionando tras la 113. Registrar el resultado en la spec. Sin cambios si están correctos.
2. **`scrubCounters` en `EmpresasRedReact`**, apagada por defecto: implementación del scrub, rama de `prefers-reduced-motion` y parada registrada en el cleanup. Nada cambia todavía en ninguna página.
3. **Encenderla en la Home**: `EmpresasRed.astro` acepta y reenvía la prop; `index.astro` la pasa en `true`.
4. **Cascada en `HomePartners`**.
5. **Cascada en `BlogPreview`**.
6. **Parallax sutil** donde el bloque tenga fondo propio que lo admita.
7. **QA**: build; Home a 1440×900 y 390×844; `prefers-reduced-motion`; las 6 páginas que comparten bloques (`/soluciones`, `/nosotros`, `/soporte-tecnico`, `/casos-de-exito`, `/fiberlux-app`, una categoría y un subservicio); y una navegación con View Transitions.

---

## Sección 6 — Criterios de aceptación

- [ ] `npx tinacms dev -c "astro build"` termina con exit 0 y 108 páginas.
- [ ] En la Home, las cuatro cifras están en su valor inicial antes de que la sección entre en pantalla, y alcanzan **exactamente** `+5,500`, `+17,000 km`, `99` y `100%` antes de que la sección salga — verificado leyendo el DOM en varias posiciones de scroll, no a ojo.
- [ ] Scrollear hacia atrás sobre esa sección desanda las cifras.
- [ ] La cifra final se mantiene quieta en pantalla al menos media pantalla de scroll antes de que la sección salga.
- [ ] En `/nosotros`, `/soluciones`, `/soporte-tecnico`, `/casos-de-exito`, `/fiberlux-app` y una página de subservicio, las cifras siguen disparándose al entrar en viewport: el comportamiento anterior queda intacto.
- [ ] `HomePartners` y `BlogPreview` entran escalonados: a mitad de la entrada, sus hijos **no** comparten la misma opacidad.
- [ ] Con `prefers-reduced-motion: reduce`, las cifras se leen en su valor final sin scrollear y no hay cascada ni parallax.
- [ ] La Home **no gana capítulos**: `[data-chapter]` sigue devolviendo 2.
- [ ] **No hay cortes de película fuera del tramo narrativo**: `[data-narrative-cut]` sigue existiendo una sola vez y dentro de `[data-narrative]`.
- [ ] La altura de la Home no crece más de media pantalla respecto a las 14,4 pantallas actuales (13.002 px a 1440×900).
- [ ] Home sigue con **0 errores de consola** (el mismatch pre-existente de `/nosotros` no cuenta y no debe empeorar).
- [ ] Tras navegar con View Transitions no queda ningún `spanProgress` escuchando.
- [ ] `git diff` no toca ningún archivo de `SolucionesStack`.

---

## Sección 7 — Decisiones tomadas y descartadas

| Decisión | Por qué |
| --- | --- |
| **Sin capítulo sticky para `EmpresasRed`** | Mide 1,33 pantallas: clavado en 100svh se recortaría. Es la corrección de lo que la 113 había anticipado. |
| **Scrub sobre la sección, no sobre un panel clavado** | Entrega lo que se pedía —que la cifra se construya mientras scrolleas— sin recortar nada, sin partir el componente y sin tocar las otras 6 páginas. |
| **Prop opt-in `scrubCounters`, apagada por defecto** | `EmpresasRed` está en 7 páginas. Una prop apagada deja el radio de impacto en cero hasta que la Home la enciende. La alternativa —un script externo escribiendo el DOM— es justo lo que produjo el mismatch de hidratación en la 113. |
| **Se conserva el panel claro** | Los círculos del prototipo eran sobre negro. Llevarlos al panel claro es rediseñar una decisión visual aprobada, no animar. |
| **La cascada va dentro de los componentes, y se acepta que aplica en las otras páginas** | Desde el wrapper de página el único hijo es la isla: no hay nada que escalonar. Es aditivo, y la SPEC 115 llegaría al mismo sitio; hacerlo ahora evita el trabajo doble. |
| **`BannerApp` y `CertificacionesSlider` solo se revisan** | Ya tienen reveals y parallax respectivamente. Rehacer lo que funciona es gasto sin retorno. |
| **Cada bloque conserva su fondo** | La SPEC 100 ya documentó que todas las secciones del home pintan su propio fondo opaco, e intentó y revirtió un telón común. Extender el de fibra además rompería la garantía de un solo canvas WebGL vivo. |
| **Sin cortes fuera del tramo narrativo** | El corte marca cambio de capítulo. Fuera del tramo no hay capítulos. |
| **Sin tocar `useStatCounter`** | Lo usan otras cuatro páginas; el cambio vive en el componente, no en el hook. |
| **Descartado: partir `EmpresasRed` en Cifras / Testimonios** | Toca las 7 páginas que lo usan para resolver un problema de una sola. |
| **Descartado: los cinco bloques como capítulos** | Llevaría la Home de 14,4 a ~28 pantallas — la dosis "de agencia" que ya se había acotado a propósito. |

---

## Sección 8 — Resultado de la revisión (Step 1)

Verificado en navegador sobre el build de esta rama, a 1440×900:

- **`CertificacionesSlider` — correcto, no se toca.** Su `data-parallax="0.08"` sigue activo tras la 113: el `translateY` del nodo de fondo va de `−7,13 px` a `−2,26 px` y a `+2,61 px` conforme la sección cruza el viewport.
- **`BannerApp` — correcto en lo suyo, con un matiz que conviene dejar escrito.** Sus cuatro `data-reveal` internos pertenecen al **modo nativo** del bloque (SPEC 60), y la Home lo tiene configurado en `banner.mode: "imagen"`. En ese modo el componente renderiza solo la imagen enlazada, así que esos reveals **no llegan al DOM**: la entrada del bloque en Home es únicamente la del wrapper de página (`data-reveal="up"`). No es un fallo —es la consecuencia de una elección de contenido— y **queda fuera de alcance** por la decisión de "solo revisión, no reescritura". Si en algún momento se quiere una entrada más rica ahí, la palanca es el contenido (pasar el banner a modo nativo), no el código.

**Resultado del Step 6 (parallax).** Ningún bloque restante califica, y por eso **no se añade ninguno**:

| Bloque | Fondo | Veredicto |
| --- | --- | --- |
| `CertificacionesSlider` | glow radial decorativo | **ya tiene** `data-parallax="0.08"`, verificado |
| `EmpresasRed` | plano sólido `#47113C` | nada que desplazar |
| `HomePartners` | plano `bg-greyscale-darkest` | nada que desplazar |
| `BlogPreview` | plano `bg-greyscale-darkest` | nada que desplazar |
| `BannerApp` | imagen (modo `imagen`) | solo revisión, fuera de alcance |

El parallax necesita una capa que se mueva por detrás del contenido. Inventarle una a un bloque de color plano sería **introducir un fondo nuevo**, que es justo lo que el alcance excluye.

**Hallazgo de contexto que enmarca los pasos 4–6:** la Home entera tiene hoy **11 `data-reveal`, todos de tipo `up`, un solo `data-reveal-stagger` y un solo `data-parallax`**. El repertorio de la SPEC 71 está disponible pero apenas usado fuera del tramo narrativo.

---

## Sección 9 — Riesgos

1. **La cascada se propaga a 6 páginas.** Es la decisión de mayor radio de esta spec. `BlogPreview` aparece en 4 páginas y `HomePartners` en 2; hay que revisarlas todas, no solo la Home. Va como criterio de aceptación.
2. **Ventana de scrub corta.** La sección mide 1,33 pantallas y el recorrido útil para el contador es aún menor. Si las cifras se sienten apresuradas, la palanca es el 55 %, no alargar la sección.
3. **Rebobinado y scroll rápido.** Con Lenis el scroll es suave, pero un golpe de rueda grande hace que las cifras desanden visiblemente. Si molesta, la mitigación es limitar el rebobinado, no quitar el scrub.
4. **Mismatch de hidratación pre-existente en `/nosotros`.** Verificado que existe también en `staging`, así que no es de la 113 ni de ésta. Cualquier trabajo que toque islas compartidas debe comprobar que no lo empeora.
5. **`data-reveal-stagger` sobre listas largas.** `BlogPreview` y `HomePartners` renderizan colecciones; un stagger por hijo sobre una lista larga retrasa la entrada del último elemento más de lo tolerable. Hay que acotar el paso, no el número de hijos.
