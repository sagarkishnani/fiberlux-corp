/**
 * Corte de película entre capítulos del tramo narrativo (SPEC 113).
 *
 * Entre un panel sticky que se va y el que llega hay una costura: durante una
 * pantalla entera conviven los dos, el saliente subiendo y el entrante bajando.
 * Un velo que va a negro y vuelve la tapa, y de paso marca el cambio de
 * capítulo. Es el recurso de los `trans-bg` de `o-scs.com`.
 *
 * **Sin marca dentro**: el cliente pidió explícitamente no poner el isotipo
 * ("por ahora no agregues el isotipo"). El velo es solo negro.
 *
 * La ventana del corte se ancla a la ENTRADA del capítulo siguiente:
 *
 *   offset: ["start end", "start start"]   sobre el capítulo que llega
 *
 * es decir, desde que su borde superior toca el fondo del viewport hasta que
 * toca el tope — que es exactamente cuando el panel anterior se suelta. Anclarlo
 * a la SALIDA del capítulo anterior lo dispara demasiado pronto y el velo se
 * come una sección que todavía está en pantalla.
 *
 * No hace nada fuera de la home en modo `fiber`: solo ahí existe
 * `[data-narrative]`. Con `prefers-reduced-motion` tampoco, porque entonces los
 * capítulos no son altos ni sticky y no hay costura que tapar.
 */
import { scroll, animate } from "motion";
import { onEachPage } from "./lifecycle";
import { chaptersEnabled } from "./chapters";

/** Negro máximo del corte. No llega a 1: un resto de fondo mantiene la
    continuidad y evita que el corte se sienta como un apagón. */
const PEAK = 0.92;

onEachPage((cleanup) => {
  if (typeof window === "undefined" || !chaptersEnabled()) return;

  const narrative = document.querySelector<HTMLElement>("[data-narrative]");
  const veil = narrative?.querySelector<HTMLElement>("[data-narrative-cut]");
  if (!narrative || !veil) return;

  const chapters = Array.from(narrative.querySelectorAll<HTMLElement>("[data-chapter]"));
  if (!chapters.length) return;

  const cut = (target: HTMLElement, offset: [string, string]) =>
    // `scroll()` deja un listener global vivo: se cancela antes del swap de la
    // siguiente navegación (SPEC 110).
    cleanup(
      scroll(
        animate(veil, { opacity: [0, PEAK, 0] }, { ease: "linear" }),
        { target, offset } as never
      )
    );

  // Un corte por cada traspaso interno (hero → frases, frases → …).
  chapters.slice(1).forEach((chapter) => cut(chapter, ["start end", "start start"]));

  // Y uno al final, cuando el último panel suelta y entra la sección siguiente
  // (SolucionesStack, que trae su propio fondo).
  cut(narrative, ["end end", "end start"]);
});
