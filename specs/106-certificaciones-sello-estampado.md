# SPEC 106 — Certificaciones: sello ISO estampado

## Objetivo

Reemplazar la sección de Certificaciones (cards con ícono) por un **panel con sello
ISO animado**, según la referencia del cliente y el bloque equivalente de NEXTNET
(`fiberlux/Web/nextnet` → `src/components/home/ComplianceReact.tsx`). La animación
de entrada —el "estampado"— debe sentirse igual que la de NEXTNET, pero en el
magenta de Fiberlux.

## Layout

Dos columnas en `lg+` (una encima de otra en mobile/tablet):

- **Izquierda (`lg:w-[46%]`)** — título de la sección y un párrafo de descripción
  nuevo (`sectionDescription`), ambos editables desde Tina.
- **Derecha (`lg:flex-1`)** — carrusel de una card por vista. La card contiene el
  sello, la norma completa y el alcance. Debajo, los dots de progreso; a los
  costados, las flechas laterales de SPEC 94 (desktop) y la píldora de flechas
  centrada en mobile.

Se retiran el *peek* de cards vecinas y la máscara horizontal de la versión
anterior: la referencia muestra una sola card ocupando toda la columna.

El viewport lleva `-mx-3` y cada slide compensa con `px-3`, de modo que queda un
canal de 24 px **entre** cards al pasar de una a otra sin que la card pierda ancho
—sigue llegando a los dos bordes de la columna—. Con `px-3` a secas la card se
encogería 24 px y quedaría descuadrada respecto de los dots y las flechas.

## El sello (`CertSeal.tsx`)

SVG `viewBox="0 0 240 240"`, centro `(120,120)`:

| Elemento          | Radio | Descripción                                            |
| ----------------- | ----- | ------------------------------------------------------ |
| Halo del estampado| 118   | Destello radial que se enciende y apaga una sola vez    |
| Anillo exterior   | 112   | Trazo continuo que **se dibuja** desde las 12, horario  |
| Ticks radiales    | 104→110 | 12 marcas que se encienden en secuencia detrás del trazo |
| Anillo punteado   | 98    | Gira 360° en 60 s, sentido horario, para siempre        |
| Texto curvo       | 84    | Gira 360° en 90 s, **sentido contrario**; oculto bajo `md` |
| Centro            | —     | `code` (46 px, bold) + `label` (Space Mono, 10 px)      |

El texto curvo repite `ringText` con ` · ` el número **entero** de veces que mejor
se acerca a la circunferencia; el ajuste fino lo hace `textLength` +
`lengthAdjust="spacing"` sobre el `<textPath>`. Así la vuelta cierra exacta y la
costura cae siempre en un separador, nunca a mitad de palabra (el original de
NEXTNET recorta con `slice()` y deja una palabra partida).

## Tiempos del estampado

Arranca cuando la sección entra en pantalla (`IntersectionObserver`, `threshold 0.25`,
una sola vez). `--cs-base` = 0.3 s (0.05 s en las repeticiones), `--cs-after` = base + 0.9 s.

| t                   | Qué pasa                                            |
| ------------------- | --------------------------------------------------- |
| 0 → 0.3 s           | Revelado en escalera: título, párrafo, panel        |
| `--cs-base`         | El anillo exterior se dibuja (0.9 s, `ease-in-out`) |
| `--cs-base` + i·75ms| Se enciende el tick `i` (12 en total)               |
| `--cs-after`        | Halo (0.7 s), centro (0.4 s, escala 0.9→1), barrido de luz sobre el panel (0.9 s), norma y alcance |
| `--cs-after`        | Arrancan los dos giros perpetuos                    |

Al cambiar de card el sello **se vuelve a estampar**: el slider lleva un contador
por índice (`cycles`) que se usa como `key`, así React remonta la card y las
animaciones CSS arrancan de cero. El primer estampado no cuenta (si no, se perdería
la escalera de entrada).

## Rendimiento y accesibilidad

Todo el movimiento es **CSS puro** (keyframes + `animation-delay`): este repo usa el
`motion` vanilla, no `motion/react`, y el requisito del cliente es que la animación
no pese en dispositivos ligeros. El disparo es un único atributo `data-stamp` en la
card:

- sin atributo (SSR o `prefers-reduced-motion`) ⇒ el sello se pinta **en su estado final**;
- `"idle"` ⇒ estado inicial oculto;
- `"go"` ⇒ reproduce el estampado.

`pathLength={1}` normaliza la longitud del trazo del anillo, así el CSS anima
`stroke-dashoffset` de 1 a 0 sin calcular la circunferencia. El `stroke-dasharray`
sólo se aplica bajo `[data-stamp]`: en reposo el anillo debe verse entero.

El eje de giro usa `transform-box: view-box` + `transform-origin: 120px 120px` — sin
eso el origen se resuelve contra el bbox del elemento y el sello orbita fuera de eje
en vez de girar sobre sí mismo.

## Contenido (Tina — colección `certificaciones`)

Nuevos campos de sección: `sectionDescription` / `sectionDescription_en`.

Los `items[]` cambian de `{ year, icon, title, heading, description }` a:

| Campo      | Ejemplo                                                     |
| ---------- | ----------------------------------------------------------- |
| `code`     | `37001`                                                     |
| `label`    | `ISO ANTISOBORNO`                                           |
| `ringText` | `CERTIFICACIÓN ISO 37001 · SISTEMA DE GESTIÓN ANTISOBORNO`   |
| `norm`     | `ISO 37001:2016 — Sistemas de gestión antisoborno`          |
| `scope`    | `Alcance: toda la operación del Grupo Fiberlux.`            |

Todos con su `_en` salvo `code` (SPEC 80). El autoplay del slider baja de 3.5 s a
7 s en `global.sliders.certificaciones` para que el sello se lea sin prisa.

El autoplay **no** es un `setInterval` de `intervalMs` a secas: el reloj se mide
contra el último cambio de card, venga de donde venga (flecha, dot o arrastre), con
un sondeo corto que sólo compara timestamps. Con un intervalo fijo, navegar a mano
justo antes de que venciera hacía saltar una card de más un instante después. Con el
cursor sobre el carrusel el reloj no corre: se empuja el origen.

## Archivos

- `src/components/certificaciones/CertSeal.tsx` — **nuevo** (reemplaza `CertCard.tsx`, eliminado)
- `src/components/certificaciones/CertificacionesSliderReact.tsx` — layout, disparo y keyframes
- `tina/config.ts` — colección `certificaciones`
- `src/content/certificaciones/index.json`, `src/content/global/index.json`

La sección se reutiliza tal cual en `/`, `/nosotros` y `/soluciones` (y sus `/en`).
