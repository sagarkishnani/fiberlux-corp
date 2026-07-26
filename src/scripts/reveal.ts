/**
 * Animaciones de entrada por atributos (SPEC 69, ampliado en SPEC 71) — Motion.
 *
 *   <div data-reveal="up">…</div>
 *   <div data-reveal="left" data-reveal-repeat>…</div>   ← re-anima al entrar/salir
 *   <ul  data-reveal="up" data-reveal-stagger="0.08"> <li>…</li> … </ul>
 *   <svg data-svg-draw>…</svg>                            ← dibuja su trazo
 *
 * Atributos: data-reveal (up|down|left|right|fade|scale, default "up"),
 * data-reveal-delay, data-reveal-duration, data-reveal-distance (px),
 * data-reveal-stagger (cascada de hijos), data-reveal-repeat (re-dispara),
 * data-svg-draw + data-draw-duration.
 *
 * Accesibilidad: con prefers-reduced-motion no anima (el CSS los muestra tal cual).
 * Anti-FOUC: el estado oculto lo pone el CSS gated por `.reveal-js` (solo con JS).
 */
import { animate, inView, scroll } from "motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DEFAULT_DURATION = 1;
const DEFAULT_DISTANCE = 40;

type Kf = { opacity: number[]; x?: number[]; y?: number[]; scale?: number[] };
type Target = { opacity: number; x?: number; y?: number; scale?: number };

function enterKeyframes(dir: string, dist: number): Kf {
  const kf: Kf = { opacity: [0, 1] };
  switch (dir) {
    case "down": kf.y = [-dist, 0]; break;
    case "left": kf.x = [-dist, 0]; break;
    case "right": kf.x = [dist, 0]; break;
    case "scale": kf.scale = [0.94, 1]; break;
    case "fade": break;
    default: kf.y = [dist, 0];
  }
  return kf;
}

function hiddenTarget(dir: string, dist: number): Target {
  const t: Target = { opacity: 0 };
  switch (dir) {
    case "down": t.y = -dist; break;
    case "left": t.x = -dist; break;
    case "right": t.x = dist; break;
    case "scale": t.scale = 0.94; break;
    case "fade": break;
    default: t.y = dist;
  }
  return t;
}

function revealIn(el: HTMLElement, dir: string, dist: number, dur: number, delay: number) {
  const c = animate(el, enterKeyframes(dir, dist) as any, { duration: dur, delay, ease: EASE });
  c.finished.then(() => { el.style.willChange = "auto"; }).catch(() => {});
}

function revealOut(el: HTMLElement, dir: string, dist: number, dur: number) {
  animate(el, hiddenTarget(dir, dist) as any, { duration: dur * 0.6, ease: [0.4, 0, 1, 1] });
}

/* Scrub: fade + desplazamiento ligados al scroll. Entra (desde su lado) al
   aparecer y se desvanece al salir; simétrico al subir. Para bloques de 2
   columnas (ej. Misión/Visión). */
function initScrub() {
  document.querySelectorAll<HTMLElement>("[data-reveal-scrub]").forEach((el) => {
    const dir = (el.dataset.reveal || "up").toLowerCase();
    const dist = Number(el.dataset.revealDistance || DEFAULT_DISTANCE);
    const kf: Record<string, number[]> = { opacity: [0, 1, 1, 0] };
    let enter = 0;
    let axis: "x" | "y" = "y";
    switch (dir) {
      case "left": axis = "x"; enter = -dist; break;
      case "right": axis = "x"; enter = dist; break;
      case "down": axis = "y"; enter = -dist; break;
      case "fade": enter = 0; break;
      default: axis = "y"; enter = dist; // up
    }
    if (enter !== 0) kf[axis] = [enter, 0, 0, 0];
    scroll(
      animate(el, kf as any, { times: [0, 0.28, 0.72, 1], ease: "linear" }),
      { target: el, offset: ["start end", "end start"] }
    );
  });
}

function initReveal() {
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    if (el.dataset.revealScrub != null) return; // lo maneja initScrub
    const dir = (el.dataset.reveal || "up").toLowerCase();
    const dist = Number(el.dataset.revealDistance || DEFAULT_DISTANCE);
    const dur = Number(el.dataset.revealDuration || DEFAULT_DURATION);
    const delay = Number(el.dataset.revealDelay || 0);
    const hasStagger = el.dataset.revealStagger != null;
    const stagger = hasStagger ? Number(el.dataset.revealStagger) : 0;
    const repeat = el.dataset.revealRepeat != null;

    let stop: (() => void) | undefined;
    const onEnter = () => {
      if (hasStagger) {
        Array.from(el.children).forEach((kid, i) =>
          revealIn(kid as HTMLElement, dir, dist, dur, delay + i * stagger)
        );
      } else {
        revealIn(el, dir, dist, dur, delay);
      }
      if (!repeat) {
        stop?.(); // una sola vez
        return;
      }
      // Repeat: al salir del viewport, volver al estado oculto (re-anima al re-entrar).
      return () => {
        if (hasStagger) {
          Array.from(el.children).forEach((kid) => revealOut(kid as HTMLElement, dir, dist, dur));
        } else {
          revealOut(el, dir, dist, dur);
        }
      };
    };
    stop = inView(el, onEnter, { amount: 0.2 });
  });
}

function initSvgDraw() {
  document.querySelectorAll<SVGSVGElement>("[data-svg-draw]").forEach((svg) => {
    const dur = Number(svg.dataset.drawDuration || 1.2);
    const shapes: SVGGeometryElement[] = [];
    svg.querySelectorAll<SVGGeometryElement>("path, line, polyline, polygon, circle, ellipse, rect").forEach((s) => {
      try {
        const len = s.getTotalLength?.();
        if (!len || !isFinite(len)) return;
        s.style.strokeDasharray = String(len);
        s.style.strokeDashoffset = String(len);
        shapes.push(s);
      } catch {}
    });
    if (!shapes.length) return;
    let stop: (() => void) | undefined;
    stop = inView(
      svg,
      () => {
        shapes.forEach((s) => animate(s, { strokeDashoffset: 0 } as any, { duration: dur, ease: EASE }));
        stop?.();
      },
      { amount: 0.2 }
    );
  });
}

function init() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  initReveal();
  initScrub();
  initSvgDraw();
}

if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
