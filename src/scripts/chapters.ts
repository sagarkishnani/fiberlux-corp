/**
 * Motor de capítulos de scroll (SPEC 113).
 *
 * Un "capítulo" es un wrapper alto con un hijo `position: sticky` dentro
 * (`ScrollChapter.astro`). El wrapper genera el recorrido; el hijo es lo que el
 * usuario ve clavado; y las animaciones van atadas al progreso del wrapper.
 *
 * Es el patrón de las dos referencias del cliente (`o-scs.com`,
 * `incredibles.dev`): **nada de `pin`**. De los 79 ScrollTriggers de o-scs, 73
 * llevan `scrub` y ninguno lleva `pin`; lo que parece pineado es sticky de CSS.
 * El `pin` reescribe el layout y compite con Lenis; el sticky no.
 *
 * Se construye sobre `motion`, que ya es el motor de scroll del repo
 * (`heroOverlap.ts` usa exactamente `scroll(animate(…, { ease: "linear" }))`,
 * que es el `scrub` de ScrollTrigger).
 *
 * ── LA REGLA QUE HAY QUE TENER PRESENTE ────────────────────────────────────
 * El tramo realmente clavado de un capítulo de `len` pantallas es
 * `(len − 1) × 100svh`, NO `len`. La última pantalla es el traspaso: el panel
 * ya se está yendo. Una animación cuyo final esté en el borde del wrapper
 * termina fuera de pantalla y el usuario nunca ve su estado final.
 *
 * Por eso `act()` escala las fracciones por `k = (len − 1) / len`: así
 * `to: 1` significa "cuando el panel se suelta", que es lo que uno quiere decir,
 * y no "cuando el wrapper termina". Es el mismo descuento de alturas de
 * viewport que hacen los `end` de o-scs (`bottom-=1800 bottom`).
 */
import { scroll, animate } from "motion";

type Stop = () => void;

/** Opciones de `scroll()` acotadas a la ventana de un acto. */
export interface ActWindow {
  target: HTMLElement;
  offset: [string, string];
}

/**
 * ¿Están activos los capítulos?
 *
 * Con `prefers-reduced-motion` el CSS deja el wrapper en `height: auto` y el
 * panel deja de ser sticky: no hay recorrido que medir, así que ninguna
 * animación de scroll debe registrarse y el contenido tiene que quedar en su
 * estado final. Cada consumidor comprueba esto antes de atar nada.
 */
export function chaptersEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Lee la longitud del capítulo (`--len`) escrita por `ScrollChapter.astro`. */
export function chapterLen(wrapper: HTMLElement): number {
  const raw = parseFloat(getComputedStyle(wrapper).getPropertyValue("--len"));
  return Number.isFinite(raw) && raw > 0 ? raw : 1;
}

/**
 * Ventana de un acto dentro del capítulo, en fracciones del tramo clavado.
 *
 *   act(wrap, 3, 0, 0.4)   → del inicio al 40 % del recorrido útil
 *   act(wrap, 3, 0.6, 1)   → del 60 % hasta que el panel se suelta
 */
export function act(
  wrapper: HTMLElement,
  len: number,
  from: number,
  to: number
): ActWindow {
  const k = len > 1 ? (len - 1) / len : 1;
  const a = Math.max(0, Math.min(1, from)) * k * 100;
  const b = Math.max(0, Math.min(1, to)) * k * 100;
  return { target: wrapper, offset: [`${a}% start`, `${b}% start`] };
}

/**
 * Ata una animación de Motion a un acto. `ease: "linear"` es lo que convierte
 * la animación en scrub: el progreso lo manda el scroll, no el tiempo.
 *
 * Devuelve la función de parada, que el llamante DEBE registrar en el
 * `cleanup` de `onEachPage`: `scroll()` deja un listener global vivo que
 * sobrevive al swap de View Transitions (SPEC 110).
 */
export function actAnimate(
  wrapper: HTMLElement,
  len: number,
  from: number,
  to: number,
  el: Element | Element[],
  keyframes: Record<string, unknown>
): Stop {
  return scroll(
    animate(el as never, keyframes as never, { ease: "linear" }),
    act(wrapper, len, from, to) as never
  );
}

/**
 * Progreso (0→1) a lo largo de un contenedor entero — el tramo narrativo
 * completo, por ejemplo, que abarca varios capítulos.
 *
 * `end end` es el instante en que el borde inferior del contenedor toca el
 * fondo del viewport, es decir: cuando el ÚLTIMO panel sticky se suelta. Es el
 * mismo criterio que `act()` aplica dentro de un capítulo.
 */
export function spanProgress(
  el: HTMLElement,
  onProgress: (p: number) => void
): Stop {
  return scroll(
    (progress: number) => onProgress(progress),
    { target: el, offset: ["start start", "end end"] } as never
  );
}

/**
 * Progreso (0→1) de la ENTRADA de un elemento: desde que su borde superior
 * asoma por el fondo del viewport hasta que su borde inferior lo alcanza.
 *
 * Es la ventana ANCHA, y la diferencia con `spanProgress` no es cosmética:
 * `spanProgress` recorre `alto − viewport`, que para una sección apenas más
 * alta que la pantalla son un par de cientos de píxeles. Sirve para encadenar
 * capítulos (donde el panel está clavado y el recorrido es el wrapper entero),
 * pero se queda corto para algo que el usuario tiene que poder leer mientras
 * scrollea — una cuenta, por ejemplo. Aquí el recorrido es el alto completo del
 * elemento (SPEC 114).
 */
export function enterProgress(
  el: HTMLElement,
  onProgress: (p: number) => void
): Stop {
  return scroll(
    (progress: number) => onProgress(progress),
    { target: el, offset: ["start end", "end end"] } as never
  );
}

/**
 * Ventana (en fracciones del capítulo) del turno de la frase `i` de `n`.
 *
 * Vive aquí y no en el componente porque la consumen DOS sitios: el revelado de
 * las frases (`ManifiestoReact`) y los elementos que se encienden con cada una
 * (SPEC 116). Si cada uno calculara su reparto, bastaría con que uno cambiara
 * para que los elementos se encendieran con la frase equivocada.
 */
export function slotWindow(i: number, n: number): [number, number] {
  const slot = 1 / Math.max(1, n);
  return [i * slot, (i + 1) * slot];
}

/**
 * Progreso crudo (0→1) de un acto. Para lo que no es una animación de CSS:
 * uniforms de un shader, contadores, clases de estado.
 */
export function actProgress(
  wrapper: HTMLElement,
  len: number,
  from: number,
  to: number,
  onProgress: (p: number) => void
): Stop {
  return scroll(
    (progress: number) => onProgress(progress),
    act(wrapper, len, from, to) as never
  );
}
