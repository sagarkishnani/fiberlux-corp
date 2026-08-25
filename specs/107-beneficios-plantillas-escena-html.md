# SPEC 107 — Beneficios: escenas HTML y ocho animaciones del canvas

## Objetivo

Llevar a las ilustraciones de las cards de "Beneficios" (SPEC 105) el lenguaje del
canvas que envió el cliente (*Animaciones Soluciones*, generado en Claude Design):
ocho conceptos —`8a` flujo conectado, `8b` lista apilada, `8c` panel NOC, `8d`
escudo trazado, `8e` túnel cifrado, `8f` capas Zero Trust, `8g` bitácora SOC, `8h`
conmutación de respaldo— con movimiento tenue sobre negro + magenta.

Cinco de ellos ya tenían plantilla equivalente y se **reescriben**; los otros tres
se **añaden**. Las nueve plantillas restantes de SPEC 105 no se tocan.

| Canvas | Plantilla            | Qué pasa                                    |
| ------ | -------------------- | ------------------------------------------- |
| 8a     | `sedes`              | Reescrita: nodos que confluyen en un hub    |
| 8b     | `prioridad`          | Reescrita: foco que recorre la lista        |
| 8c     | `consola`            | Reescrita: panel en vivo (NOC)              |
| 8d     | `escudo`             | Reescrita: perímetro que se traza y valida  |
| 8h     | `conmutacion`        | Reescrita: principal ↔ respaldo             |
| 8e     | `tunel` **(nueva)**  | Carriles con paquetes y candado             |
| 8f     | `zerotrust` **(nueva)** | Anillos concéntricos que respiran        |
| 8g     | `bitacora` **(nueva)** | Eventos que aparecen uno a uno            |

## Escenas HTML (`Escena`, en `base.tsx`)

Los ocho conceptos son paneles con **texto que escribe el editor** (chips, filas,
píldoras, pies). En SVG eso obliga a estimar el ancho de cada cadena para que su
caja no quede corta —lo que hacen `anchoTexto` y `cajaEtiquetas`—; en HTML la caja
se ajusta sola. Por eso estas plantillas se dibujan con `div`s y sólo los trazos
van en un `<svg>` por debajo.

`Escena` es la hermana de `Lienzo` y mantiene su contrato:

- Misma caja: `aspect-ratio: 320 / 180`, `mt-6 w-full`, `aria-hidden`.
- Mismo interruptor: `.fbx-ben-on` cuando la card entra en viewport, una sola vez.
- **Mismas unidades**: la escena declara un contenedor de consulta y
  `--u: calc(100cqw / 320)`. El helper `u(n)` escribe en unidades del lienzo de
  320, así que una escena HTML escala con la card exactamente igual que un SVG
  (verificado a 292 px en móvil y a 307 px en desktop).
- `--u` vive en el `div` interior, no en el exterior: `cqw` se mide contra el
  contenedor más cercano, y en el propio elemento que lo declara ese contenedor
  sería el de fuera.
- Sin soporte de contenedores de consulta, `--u: 1px` (tamaño nominal).

**Truco de los cables:** los chips tienen fondo OPACO (`C.escena`,
`C.escenaActiva`) y se apoyan sobre el SVG. El cable se traza hasta *debajo* del
chip y es el chip el que le tapa la punta, así que no hace falta saber cuánto mide
la etiqueta para saber dónde termina el cable.

## Animaciones nuevas (`CSS_BENEFICIOS`)

Portadas del canvas con el prefijo del proyecto. Todas se activan sólo bajo
`.fbx-ben-on` y se apagan con `prefers-reduced-motion`, dejando el dibujo en su
estado final:

| Clase                 | Qué hace                                        |
| --------------------- | ----------------------------------------------- |
| `fbx-ben-dibuja`      | Trazo que se dibuja, se sostiene y se borra, en bucle |
| `fbx-ben-flota`       | Flotación de pocos píxeles (`--dy`)             |
| `fbx-ben-brilla`      | Halo que respira alrededor de un chip encendido |
| `fbx-ben-blip`        | Punto de estado que late en sitio               |
| `fbx-ben-barrido`     | Luz que recorre una fila                        |
| `fbx-ben-barrido-y`   | La misma banda, de arriba abajo sobre la escena |
| `fbx-ben-paquete`     | Paquete que cruza un carril de extremo a extremo |
| `fbx-ben-anillo`      | Anillo concéntrico que respira                  |
| `fbx-ben-pulso`       | Halo que crece y se apaga detrás de una figura  |

Diferencia con `fbx-ben-traza` (SPEC 105): aquella es la **entrada** y ocurre una
vez; `fbx-ben-dibuja` es la **vida** del dibujo y se repite.

## Paleta

Se mantiene la del proyecto (`C`), con cinco tokens nuevos para las escenas:
`acentoVivo` (`#e262c4`, el magenta encendido del canvas: puntos, halos, núcleos),
`escena` / `escenaBorde` / `escenaActiva` (los fondos opacos de filas y chips) y
`escenaTexto` / `escenaApagado`.

No se adopta el `#E262C4` del canvas como acento general: las otras nueve
plantillas usan `acentoClaro` (`#c65fac`) y mezclarlos haría que ocho ilustraciones
brillaran más que el resto de la sección.

## Datos (Tina)

Ninguna plantilla nueva añade campos: reutilizan los que ya existen en `datos`.

| Campo       | Quién lo usa ahora                                              |
| ----------- | --------------------------------------------------------------- |
| `etiqueta`  | Velocidad, **Panel en vivo** (cabecera), **Escudo** (pie), **Túnel** (pie) |
| `valor`     | Uptime, **Panel en vivo** (píldora; sin cifra dice "en vivo")    |
| `hilos`     | DWDM, **Túnel** (3–5 carriles)                                   |
| `filas`     | Tráfico, **Bitácora** (`label` = evento, `nivel` = etiqueta)     |
| `nodos`     | Sedes, **Panel en vivo**, **Zero Trust** (los nombra en su pie)  |

Los textos de reserva (`Perímetro verificado`, `AES-256 · extremo a extremo`,
`Identidad · Dispositivo · Red`, la bitácora completa) van **en los dos idiomas**
dentro de la plantilla: se dibujan aunque el editor no escriba nada, y en `/en`
tienen que salir en inglés (SPEC 80).

## Estados de reposo

Toda escena tiene que verse completa y quieta cuando no hay animación —movimiento
reducido, o si el `IntersectionObserver` no llegara a disparar—:

- `fbx-ben-dibuja` deja el trazo cerrado (`stroke-dashoffset: 0`).
- Los barridos se apagan (`opacity: 0`); si no, se quedarían plantados encima.
- El paquete del túnel descansa a media pista, no en el extremo invisible.
- La bitácora se pinta entera: `useReducido()` existe para esto, porque `useTurno`
  no emite ticks con movimiento reducido y el índice se quedaría en 0.

## Archivos

- `src/components/servicios/beneficios/base.tsx` — `Escena`, `u()`, `useReducido()`,
  tokens de paleta y las nueve animaciones nuevas.
- `Sedes.tsx`, `Prioridad.tsx`, `Consola.tsx`, `Escudo.tsx`, `Conmutacion.tsx` — reescritas.
- `Tunel.tsx`, `ZeroTrust.tsx`, `Bitacora.tsx` — nuevas.
- `IlustracionBeneficio.tsx` — registro (catorce → diecisiete).
- `tina/config.ts` — tres opciones nuevas, etiquetas y descripciones al día.
