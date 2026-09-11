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

/* Negro máximo del corte. Dos valores, porque las dos costuras no son la misma
   cosa:

   - ENTRE CAPÍTULOS (hero → frases) el fondo es el MISMO canvas a los dos lados
     y, desde que el pie del panel del hero dejó de cortar, no hay costura de
     fondo que tapar: los titulares tampoco se solapan (el del hero ya se fue en
     el 0.92 de su capítulo, las frases entran después). Un velo casi opaco ahí
     deja una pantalla entera de scroll en negro — en un teléfono, donde ese
     traspaso se recorre con el dedo, se lee como que el efecto se apagó. Basta
     con marcar el cambio de capítulo.
   - AL FINAL del tramo sí hay dos titulares a la vez (la última frase saliendo
     y "Soluciones para tu negocio" entrando) y además cambia el fondo. Ahí el
     velo sigue siendo lo que hace limpio el traspaso. */
const PEAK_CAPITULO = 0.4;
const PEAK_FINAL = 0.92;

onEachPage((cleanup) => {
  if (typeof window === "undefined" || !chaptersEnabled()) return;

  const narrative = document.querySelector<HTMLElement>("[data-narrative]");
  const veil = narrative?.querySelector<HTMLElement>("[data-narrative-cut]");
  if (!narrative || !veil) return;

  const chapters = Array.from(narrative.querySelectorAll<HTMLElement>("[data-chapter]"));
  if (!chapters.length) return;

  /* UN velo por costura, no uno compartido.
     Motion cancela la animación anterior al lanzar otra sobre la misma
     propiedad del mismo elemento: con un solo velo, el corte del final mataba
     al del medio y solo funcionaba uno. Cada costura recibe su propia capa
     dentro del contenedor. */
  const cut = (target: HTMLElement, offset: [string, string], peak: number) => {
    const layer = document.createElement("div");
    layer.style.cssText =
      "position:absolute; inset:0; background:#0A0A0A; opacity:0; pointer-events:none;";
    veil.appendChild(layer);
    cleanup(() => layer.remove());
    // `scroll()` deja un listener global vivo: se cancela antes del swap de la
    // siguiente navegación (SPEC 110).
    cleanup(
      scroll(
        animate(layer, { opacity: [0, peak, 0] }, { ease: "linear" }),
        { target, offset } as never
      )
    );
  };

  // Un corte por cada traspaso interno (hero → frases, frases → …).
  chapters
    .slice(1)
    .forEach((chapter) => cut(chapter, ["start end", "start start"], PEAK_CAPITULO));

  // Y uno al final, cuando el último panel suelta y entra la sección siguiente
  // (SolucionesStack, que trae su propio fondo).
  cut(narrative, ["end end", "end start"], PEAK_FINAL);
});
