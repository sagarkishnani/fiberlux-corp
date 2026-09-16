# SPEC 116 — Home: tramo narrativo con el planeta (modo `planeta` + elementos por frase)

> **Estado:** Aprobado
> **Depende de:** SPEC 113 (motor de capítulos `ScrollChapter`/`chapters.ts`, capítulo de frases `Manifiesto`, velo de corte, portal `[data-narrative-bg]`), SPEC 97 + SPEC 100 (modo `cinematic` = planeta punteado COBE, el fondo que se conduce), SPEC 112 (`CINE_MODES` duplicado en `HeroHomeReact` y `BaseLayout`), SPEC 88 (patrón aditivo de modos `heroBackground`), SPEC 39/96 (wordmark FIBERLUX y coreografía de entrada), SPEC 80 (i18n `_en`/`tField`), SPEC 110 (ciclo de vida de listeners con View Transitions)
> **Fecha:** 2026-09-15
> **Objetivo:** Añadir un modo de fondo `planeta` que lleva el tramo narrativo de la SPEC 113 —capítulos sticky, salida del hero con el wordmark y capítulo de frases— al globo punteado, con el planeta rodando hasta quedar como horizonte y elementos editables desde Tina que se encienden frase a frase.

---

## Sección 1 — Por qué existe este spec

La SPEC 113 dejó la Home abierta con un tramo narrativo: el hero se sostiene clavado, sus satélites se apagan, el titular retrocede y el fondo —el túnel de filamentos de `fiber`— sigue vivo por detrás mientras entran las frases del manifiesto. El cliente valida ese recorrido y pide **la misma pieza con el planeta**: la referencia le gusta, pero quiere ver el globo punteado (`cinematic`, SPEC 97/100) haciendo de fondo continuo en lugar del túnel.

El hallazgo que gobierna esta spec salió de revisar cómo quedó implementada la 113: **el motor es agnóstico del modo, el montaje no**. `ScrollChapter`, `chapters.ts`, `narrativeCut.ts` y `Manifiesto`/`ManifiestoReact` no saben nada del shader de fibra —solo dependen de que existan `[data-narrative]` y `[data-chapter]`—, pero `src/pages/index.astro:43` monta el tramo únicamente cuando `heroBackground === "fiber"`, y `HeroHomeReact` ata todos los actos a `fiber` y empuja el progreso a un handle (`FiberTunnelHandle`) que **el planeta no tiene**: `CinematicBackground` se funde solo, leyendo `window.scrollY` contra la altura del hero.

Así que el trabajo real no es rehacer la narrativa, sino **generalizar el montaje** (que el tramo se encienda para cualquier modo narrativo) y **darle al planeta el mismo mando** que tiene la fibra. Encima de eso va lo único verdaderamente nuevo que pidió el cliente: elementos que aparecen con cada frase, y que se editan desde Tina.

---

## Sección 2 — Concepto

**Un solo plano continuo, como en la 113.** El planeta no se corta entre el hero y las frases: es un canvas `fixed` montado por portal en `[data-narrative-bg]`, fuera de los `overflow: hidden` del capítulo (la razón es de WebKit y está documentada en el Corolario 2 de la SPEC 113: en iOS un `fixed` se recorta contra un ancestro que lo contiene, y el fondo se partía a media pantalla).

**Coreografía del hero — el horizonte.** El capítulo del hero (`--len: 3`) mantiene los actos de la 113 y cambia solo lo que hace el fondo:

1. Se apagan los satélites: subtítulo y botones se van hacia abajo con fundido.
2. El titular se sostiene y retrocede con fundido; el wordmark FIBERLUX no se toca (lo acopla la SPEC 39 en sus primeros 320 px de scroll, y animarlo aquí sería pelearse con un movimiento contrario). Esto queda **igual que en `fiber`**.
3. **El planeta desciende y rueda**: crece, baja su centro fuera del encuadre y sube su `theta` hasta quedar como un **horizonte curvo al pie de la pantalla**, con la rotación acelerando. Las frases del capítulo siguiente pasan por delante, sobre el cielo oscuro.

Se eligió el horizonte y no la inmersión ni el alejamiento por una razón verificada en la 113: el núcleo brillante del túnel caía justo donde va el texto y hubo que hacerle decaer el fogonazo para que no quemara las frases. Con el planeta al pie, la mitad superior del encuadre queda casi negra y el texto no compite con nada.

**Elementos por frase.** Mientras corre el capítulo de frases, cada frase puede traer dos tipos de elemento, ambos editables desde Tina:

- **Puntos** que se encienden sobre el planeta —un hub con su etiqueta y un arco de fibra hacia otro punto—, dibujados con la misma proyección que ya usan los hubs de `CinematicBackground`, así que giran pegados al globo y se cortan por detrás del limbo.
- **Cifras** que acompañan al texto: un número que se cuenta con el scroll dentro del turno de su frase, con sufijo y etiqueta.

Cada elemento declara a qué frase pertenece. Los que no tienen frase asignada no se muestran.

---

## Sección 3 — Alcance

**Dentro:**

- **Nuevo modo `heroBackground: "planeta"`**, aditivo. `cinematic` (el planeta actual, sin capítulos) y `fiber` quedan intactos y seleccionables.
- **Generalización del montaje del tramo narrativo**: `index.astro` deja de comprobar `=== "fiber"` y pasa a comprobar pertenencia a una lista `NARRATIVE_MODES = ["fiber", "planeta"]`. El markup del tramo (`[data-narrative]`, `[data-narrative-bg]`, `[data-narrative-cut]`, `ScrollChapter` del hero, `Manifiesto`) no cambia.
- **`CinematicBackground` gana un handle imperativo** (`PlanetHandle`: `setHero`, `setTravel`, `setOpacity`, `setPoints`, `setPhrase`) y dos props nuevas (`fixed`, `driven`). **Gateado**: sin `driven` el componente se comporta exactamente como hoy (auto-fundido por `window.scrollY`), de modo que el modo `cinematic` en producción no cambia ni un frame.
- **Coreografía de salida del hero en modo `planeta`** (Sección 2), montada sobre `actAnimate`/`actProgress`/`spanProgress` de `chapters.ts`. Los actos 1 y 2 son los mismos de `fiber`; el 3 conduce el planeta.
- **Apagado del canvas al final del tramo** con el mismo perfil que `fiber` (`setOpacity` a 0 antes de entrar en `SolucionesStack`), para garantizar **un solo canvas WebGL vivo** — COBE también es WebGL.
- **Grupo nuevo en Tina `home.planeta`** con `puntos[]` y `cifras[]`, cada elemento atado a una frase por número, con sus `_en`.
- **Puntos sobre el globo**: nodo encendido + etiqueta + arco de fibra hacia otro punto (o hacia Lima, el centro de red ya horneado). Aparecen y se apagan con el turno de su frase.
- **Cifras junto a la frase**: renderizadas por `ManifiestoReact` dentro del acto de cada frase, con el número contado por scroll. Aditivo: si no hay `cifras` el componente renderiza lo mismo que hoy, así que el modo `fiber` no se ve afectado.
- **Reutilización de las frases**: el capítulo consume `home.manifiesto` tal cual. No se duplica copy.
- **Velo de legibilidad propio del modo**: con el planeta al pie, el velo radial centrado de `ManifiestoReact` sobra; en modo `planeta` el apoyo va en la mitad inferior, sobre el limbo.
- **Accesibilidad**: `prefers-reduced-motion` → sin capítulos (las frases se apilan y se leen sin scroll), planeta en un frame fijo montado dentro de la sección (no hay panel que recorte), elementos por frase visibles en su estado final, velo de corte desactivado. Canvas `aria-hidden`. Señal `fbx:hero-scene-loaded`.
- **Alta del modo en las DOS listas `CINE_MODES`** (`HeroHomeReact.tsx:44` y `BaseLayout.astro`): darlo de alta en una sola reproduce el bug de los dos logos de la SPEC 112.
- **i18n**: etiquetas de puntos y cifras con `tField`; nada de copy fijo nuevo fuera del CMS.

**Fuera de alcance (specs futuras):**

- Tocar `SolucionesStack` (SPEC 108) o cualquier bloque posterior al tramo: la SPEC 114 ya los trató y aquí no se revisan.
- Retirar o reescribir `fiber`, `cinematic`, `dotfield`, `lattice` o los demás modos.
- El corte con isotipo (el cliente lo descartó "por ahora" en la 113).
- Aplicar el fondo `planeta` a los heros de otras páginas.
- Exponer en Tina la paleta, la densidad de puntos, la velocidad de rotación o la geografía de los hubs base: viven en el código del componente.
- Elementos por frase de otros tipos (vídeo, imagen, tarjetas): solo puntos y cifras.
- Hacer continuo el canvas del planeta a lo largo de toda la Home.
- Traducir contenido que ya cubre la SPEC 80 fuera de los campos nuevos definidos aquí.

---

## Sección 4 — Modelo de datos

```js
// tina/config.ts — heroBackground: nuevo valor (junto a los 10 existentes)
{ value: "planeta", label: "Planeta narrativo (globo + frases por scroll)" },

// home → grupo nuevo, hermano de `manifiesto`
{ type: "object", name: "planeta", label: "Home — Planeta (tramo narrativo)",
  fields: [
    { type: "object", name: "puntos", label: "Puntos que se encienden sobre el planeta", list: true,
      ui: { itemProps: (i) => ({ label: i?.label || "Punto" }) },
      fields: [
        { type: "number", name: "frase",       label: "Frase a la que acompaña (1, 2, 3…)" },
        { type: "string", name: "label",       label: "Etiqueta" },
        { type: "string", name: "label_en",    label: "Etiqueta (EN)" },
        { type: "number", name: "lat",         label: "Latitud" },
        { type: "number", name: "lng",         label: "Longitud" },
        { type: "string", name: "conectaCon",  label: "Traza un arco hasta (etiqueta de otro punto)",
          description: "Vacío ⇒ conecta con Lima, el centro de la red." },
      ] },
    { type: "object", name: "cifras", label: "Cifras que acompañan a la frase", list: true,
      ui: { itemProps: (i) => ({ label: i?.label || "Cifra" }) },
      fields: [
        { type: "number", name: "frase",    label: "Frase a la que acompaña (1, 2, 3…)" },
        { type: "number", name: "valor",    label: "Valor final (se cuenta con el scroll)" },
        { type: "string", name: "sufijo",   label: "Sufijo (%, +, km…)" },
        { type: "string", name: "label",    label: "Etiqueta" },
        { type: "string", name: "label_en", label: "Etiqueta (EN)" },
      ] },
  ] },
```

- **`frase` es un número 1-based**, no una referencia: las frases de `home.manifiesto` no tienen id y añadirles uno obligaría a migrar contenido ya publicado. Un elemento con `frase` vacía o fuera de rango no se renderiza (y eso es lo que hace que el modo `fiber`, que no lee este grupo, no se entere de nada).
- **`conectaCon` empareja por etiqueta**, con Lima como destino por defecto: es el centro de la red ya horneado en `CinematicBackground` (`LIMA`, `HUBS`, `ROUTES`).
- Los `_en` vacíos caen a ES vía `tField` (convención SPEC 80).
- Contenido sembrado en `src/content/home/index.json`: `heroBackground: "planeta"` y un `planeta` inicial construido con datos que **ya existen en el CMS** (`stats.items[]`), no inventados — p. ej. un punto *Lima* y un arco a *Arequipa* para la frase 2, y la cifra *99 ciudades* para la frase 3. Las frases siguen siendo las tres de `home.manifiesto`.

**Estado en runtime (no persistido):**

```ts
// CinematicBackground.tsx — mando del tramo narrativo.
export interface PlanetHandle {
  /** 0→1 dentro del capítulo del hero: el planeta desciende hasta horizonte. */
  setHero(p: number): void;
  /** 0→1 a lo largo de TODO el tramo: deriva y aceleración de la rotación. */
  setTravel(p: number): void;
  /** Opacidad global; en 0 el rAF se detiene (garantía de un solo WebGL vivo). */
  setOpacity(v: number): void;
  /** Puntos del CMS, ya normalizados y resueltos sus arcos. */
  setPoints(points: PlanetPoint[]): void;
  /** Frase activa (0-based) y su progreso 0→1: enciende/apaga sus puntos. */
  setPhrase(index: number, p: number): void;
}

interface PlanetPoint {
  phrase: number;              // índice 0-based de la frase
  label: string;               // ya localizado por tField
  loc: [number, number];       // lat, lng
  to: [number, number] | null; // destino del arco (null ⇒ Lima)
}
```

---

## Sección 5 — Plan de implementación

Cada paso deja el sitio compilando y funcionando.

1. **Handle del planeta.** En `CinematicBackground.tsx`: `forwardRef` + `useImperativeHandle` con `PlanetHandle`, props `fixed` y `driven`, y refs internas para `hero`/`travel`/`opacity`. Con `driven` en `false` el `frame()` sigue leyendo `window.scrollY` como hoy; con `true` usa los valores del handle y **no** lee el scroll. **Estado:** el modo `cinematic` se comporta igual que antes; nadie usa el handle todavía.
2. **Coreografía del horizonte.** Dentro del componente, traducir `hero`/`travel` a los parámetros de COBE y del overlay: `theta` (rueda), escala del globo, desplazamiento vertical del centro, velocidad de `phi` y atenuación del halo. **Estado:** verificable moviendo el handle a mano desde la consola; el sitio no cambia.
3. **Modo `planeta`.** Nuevo valor en el enum de `tina/config.ts`, alta en **las dos** listas `CINE_MODES`, y wiring en `HeroHomeReact`: `const planeta = mode === "planeta"`, `bgTarget` (portal a `[data-narrative-bg]` o `inline` sin capítulos) y render del fondo con `fixed`/`driven`. **Estado:** el modo es seleccionable desde Tina y pinta el planeta a pantalla completa; todavía sin capítulo.
4. **Montaje generalizado del tramo.** En `index.astro`, sustituir `heroFiber` por `NARRATIVE_MODES.includes(mode)`. **Estado:** en modo `planeta` el hero ya va dentro de `ScrollChapter` y el capítulo de frases se monta detrás.
5. **Capítulo del hero.** En `HeroHomeReact`, efecto hermano del de `fiber`: actos 1 y 2 idénticos (satélites y titular) y acto 3 empujando `setHero`; `spanProgress` sobre `[data-narrative]` para `setTravel`/`setOpacity` con el apagado al 86 %. Refactor mínimo: los dos efectos comparten los actos 1–2, que se extraen a una función local. **Estado:** el tramo narrativo completo funciona con el planeta; sin elementos por frase.
6. **Contenido.** Grupo `planeta` en Tina y sembrado inicial en `index.json` con los datos de `stats`. **Estado:** los campos se editan en `/admin` y no rompen nada.
7. **Puntos sobre el globo.** `setPoints`/`setPhrase` en `HeroHomeReact` (lee `data.home.planeta.puntos`, localiza con `tField`, resuelve `conectaCon`) y dibujo en el overlay 2D del componente reutilizando `project()`, `slerp` y el sprite de glow existentes: nodo + etiqueta + arco, con entrada y salida atadas al turno de la frase. La ventana por frase se calcula con la **misma** fórmula que `ManifiestoReact` (`slot = 1 / items.length` sobre el capítulo `#ch-frases`). **Estado:** los puntos del CMS se encienden con su frase y giran pegados al planeta.
8. **Cifras junto a la frase.** En `ManifiestoReact`, render opcional de las cifras de cada acto y cuenta por scroll con `actProgress` dentro del mismo turno. Sin cifras, el markup es el de hoy. **Estado:** las cifras se cuentan y terminan su valor **antes** de que el panel se suelte (la regla `(len−1)/len`).
9. **Velos y remates.** Velo de legibilidad propio del modo `planeta` (apoyo bajo, no radial centrado), `edgeFade` del hero como en `fiber` para que no aparezca el escalón del borde del panel, y comprobación de que el fallback del hero no deja negro al soltarse. **Estado:** sin costuras horizontales en ningún punto del recorrido.
10. **QA**: build, navegador a 1440×900 y 390×844, `prefers-reduced-motion`, iOS real, y los modos `fiber`, `cinematic`, `dotfield`, `lattice`, `morph`, `3d`, `video` e `imagen` sin residuos.

---

## Sección 6 — Criterios de aceptación

- [ ] `npx tinacms dev -c "astro build"` termina con exit 0 y el mismo número de páginas que antes del cambio.
- [ ] Con `heroBackground: "planeta"`, el hero queda clavado, sus satélites y su titular salen según la coreografía, y el planeta **no se corta** al pasar al capítulo de frases (verificado a 1440×900, 390×844 y en un iPhone físico).
- [ ] Al final del capítulo del hero el planeta queda como horizonte al pie de la pantalla y las frases se leen sobre el cielo oscuro, sin competir con el brillo del limbo.
- [ ] Las frases del manifiesto son **las mismas** que en modo `fiber`: no hay copy duplicado en el CMS.
- [ ] Un punto declarado en `home.planeta.puntos` con `frase: 2` se enciende sobre el planeta durante la segunda frase, muestra su etiqueta, traza su arco y se apaga al pasar de frase.
- [ ] Un punto con `frase` vacía o fuera del rango de frases no se renderiza y no rompe el resto.
- [ ] Una cifra declarada con `frase: 3` termina de contar **antes** de que el panel sticky se suelte.
- [ ] Al entrar en `SolucionesStack`, el canvas del planeta ya no consume rAF y el aurora es el único canvas WebGL vivo.
- [ ] Con `prefers-reduced-motion: reduce`: un frame fijo del planeta, frases visibles sin scroll, elementos en su estado final y sin capítulos de altura extra.
- [ ] Cambiar `heroBackground` a `cinematic` restituye **exactamente** el hero anterior: sin capítulos, con su auto-fundido por scroll y sin residuos del tramo narrativo.
- [ ] Cambiar a `fiber` restituye el tramo narrativo de la SPEC 113 sin regresiones (frases, velo de corte, apagado del canvas).
- [ ] Las etiquetas de puntos y cifras y sus `_en` se editan desde Tina y se reflejan en `/` y en `/en`.
- [ ] Tras navegar a otra página con View Transitions, no queda ningún `scroll()` del tramo narrativo escuchando.
- [ ] No se ven dos logos a la vez durante el morph de entrada (regresión de `CINE_MODES` de la SPEC 112).
- [ ] No hay ninguna línea o escalón horizontal en el fondo durante todo el recorrido.

---

## Sección 7 — Decisiones tomadas y descartadas

| Decisión | Por qué |
| --- | --- |
| **Modo nuevo `planeta`, aditivo** | Convención del repo (SPEC 88/112/113). `cinematic` es el hero que hoy está validado: convertirlo en narrativo sería decidir por el cliente y perder el fondo actual. |
| **Coreografía "horizonte"** (descartadas inmersión y alejamiento) | Deja la mitad superior del encuadre casi negra, que es donde van las frases. La 113 ya pagó el precio contrario: el núcleo del túnel quemaba el texto y hubo que hacerle decaer el fogonazo. La inmersión repetiría el problema; el alejamiento deja las frases sobre vacío y tira el planeta, que es lo que el cliente quiere ver. |
| **Conducir `CinematicBackground`, no clonarlo** | Son 671 líneas de globo, arcos, estrellas y sprites ya calibrados contra la referencia del cliente. Un `PlanetTunnel.tsx` paralelo duplicaría todo eso y los dos se desincronizarían al primer retoque. El cambio va gateado por `driven`, así que el modo `cinematic` no se toca. |
| **Reutilizar `home.manifiesto`** | Las tres frases ya están escritas, validadas y traducidas. Un set propio del modo obligaría al cliente a mantener el mismo copy en dos sitios. |
| **Wordmark sin tocar** | La SPEC 39 ya lo acopla al scroll en sus primeros 320 px; animarlo desde el capítulo sería pelearse con un movimiento contrario. Es la misma decisión que tomó la 113. |
| **Elementos por frase editables en Tina** | Pedido explícito del cliente. La alternativa (hornearlos) obliga a tocar código para mover un punto de ciudad. |
| **`frase` como número 1-based, no como referencia** | Las frases del manifiesto no tienen id y añadírselo obligaría a migrar contenido ya publicado por una ganancia que el cliente no ve. |
| **Dos listas (`puntos`, `cifras`) y no una lista polimórfica** | Tina no tiene campos condicionales cómodos: una sola lista con `tipo` dejaría al editor con la mitad de los campos vacíos y sin saber cuáles aplican. |
| **Cifras en `ManifiestoReact`, puntos en el canvas** | Un punto tiene que girar pegado al globo, así que solo puede vivir en la proyección del componente; una cifra es tipografía y le toca compartir la caja de la frase. |
| **`motion`, sticky y `(len−1)/len`** | Se heredan de la 113 sin discusión: son el motor del repo y la regla que evita que una animación termine fuera de pantalla. |
| **Definición rápida** | El cliente aprobó el encabezado y delegó el resto ("asume el resto y guarda"): las decisiones de las secciones 2 a 7 las tomó quien escribe el spec y quedan aquí para que el cliente las revise antes de aprobarlo. |

---

## Sección 8 — Riesgos

1. **Tocar `CinematicBackground` rompe el hero de producción.** Es el componente del modo `cinematic`, vivo hoy. Mitigación: todo lo nuevo va detrás de `driven`/`fixed`, y hay criterio de aceptación explícito de que `cinematic` queda idéntico.
2. **Dos WebGL vivos.** COBE es WebGL igual que el shader de fibra: si el apagado llega tarde, el aurora de `SolucionesStack` convive con el planeta. Mitigación: mismo perfil de `setOpacity` que la 113 y rAF detenido en opacidad 0.
3. **Desincronía entre frases y elementos.** La ventana por frase se calcula en dos sitios (`ManifiestoReact` y el mando de los puntos). Si uno cambia el reparto, los puntos se encienden con la frase equivocada. Mitigación: extraer la fórmula del slot a `chapters.ts` y consumirla desde los dos.
4. **`CINE_MODES` duplicado.** Dar de alta el modo en una sola de las dos listas reproduce el bug de los dos logos de la SPEC 112. Va como criterio de aceptación.
5. **`scroll()` y View Transitions.** Deja listener global; sin registrar la parada en el `cleanup` se acumulan entre navegaciones (SPEC 110).
6. **iOS y el `fixed` recortado.** El portal a `[data-narrative-bg]` es obligatorio, no una preferencia: montado dentro del capítulo, Safari corta el canvas contra el panel (Corolario 2 de la 113). Verificación en dispositivo real, no en modo responsive.
7. **Longitud percibida.** El tramo añade ~5 pantallas antes del primer bloque de conversión, igual que en `fiber`. La palanca sigue siendo `--len` por capítulo.
8. **Equipo ligero.** Requisito duro del cliente y pendiente heredado de las SPEC 112/113: la medición de fps en una máquina modesta sigue sin hacerse.

---

## Qué **no** está en este spec

- Tocar `SolucionesStack` ni ningún bloque posterior al tramo narrativo.
- Retirar `fiber`, `cinematic`, `dotfield`, `lattice` ni ningún otro modo.
- El corte con isotipo.
- Llevar el fondo `planeta` a los heros de otras páginas.
- Exponer en Tina la paleta, la densidad, la rotación o los hubs base del planeta.
- Tipos de elemento por frase distintos de puntos y cifras.
