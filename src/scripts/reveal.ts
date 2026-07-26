/**
 * Animaciones de entrada por atributos (SPEC 69) — Motion vanilla.
 *
 * Marca un elemento con `data-reveal` y se anima UNA vez al entrar en viewport:
 *
 *   <div data-reveal="up">…</div>
 *   <div data-reveal="down" data-reveal-delay="0.1">…</div>
 *   <ul data-reveal="up" data-reveal-stagger="0.08"> <li>…</li> … </ul>
 *
 * Atributos: data-reveal (up|down|left|right|fade|scale, default "up"),
 * data-reveal-delay, data-reveal-duration, data-reveal-distance (px),
 * data-reveal-stagger (cascada de hijos directos).
 *
 * Accesibilidad: con prefers-reduced-motion no anima (el CSS los muestra tal cual).
 * Anti-FOUC: el estado oculto lo pone el CSS gated por `.reveal-js` (solo con JS).
 */
import { animate, inView } from "motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DEFAULT_DURATION = 1;
const DEFAULT_DISTANCE = 40;

type Keyframes = { opacity: number[]; x?: number[]; y?: number[]; scale?: number[] };

function keyframesFor(dir: string, dist: number): Keyframes {
  const kf: Keyframes = { opacity: [0, 1] };
  switch (dir) {
    case "down":
      kf.y = [-dist, 0];
      break;
    case "left":
      kf.x = [-dist, 0];
      break;
    case "right":
      kf.x = [dist, 0];
      break;
    case "scale":
      kf.scale = [0.94, 1];
      break;
    case "fade":
      break;
    case "up":
    default:
      kf.y = [dist, 0];
  }
  return kf;
}

function revealOne(el: HTMLElement, dir: string, dist: number, dur: number, delay: number) {
  const controls = animate(el, keyframesFor(dir, dist) as any, {
    duration: dur,
    delay,
    ease: EASE,
  });
  // Liberar will-change al terminar (evita retener capas de composición).
  controls.finished
    .then(() => {
      el.style.willChange = "auto";
    })
    .catch(() => {});
}

function init() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    const dir = (el.dataset.reveal || "up").toLowerCase();
    const dist = Number(el.dataset.revealDistance || DEFAULT_DISTANCE);
    const dur = Number(el.dataset.revealDuration || DEFAULT_DURATION);
    const delay = Number(el.dataset.revealDelay || 0);
    const hasStagger = el.dataset.revealStagger != null;
    const stagger = hasStagger ? Number(el.dataset.revealStagger) : 0;

    let stop: (() => void) | undefined;
    const onEnter = () => {
      if (hasStagger) {
        Array.from(el.children).forEach((kid, i) => {
          revealOne(kid as HTMLElement, dir, dist, dur, delay + i * stagger);
        });
      } else {
        revealOne(el, dir, dist, dur, delay);
      }
      stop?.(); // una sola vez
    };
    stop = inView(el, onEnter, { amount: 0.2 });
  });
}

if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
