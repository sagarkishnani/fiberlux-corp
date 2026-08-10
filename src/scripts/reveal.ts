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
 * data-reveal-only ("mobile"|"desktop": limita el reveal a ese breakpoint; en el
 * otro el elemento se muestra sin animar), data-svg-draw + data-draw-duration.
 *
 * Accesibilidad: con prefers-reduced-motion no anima (el CSS los muestra tal cual).
 * Anti-FOUC: el estado oculto lo pone el CSS gated por `.reveal-js` (solo con JS).
 */
import { animate, inView, scroll } from "motion";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const DEFAULT_DURATION = 1;
const DEFAULT_DISTANCE = 80;

/** Offsets de entrada por dirección (para diagonales usa ambos ejes). */
function offsetsFor(dir: string, d: number): { x: number; y: number } {
  switch (dir) {
    case "down": return { x: 0, y: -d };
    case "left": return { x: -d, y: 0 };
    case "right": return { x: d, y: 0 };
    case "diag-ur": return { x: -d, y: d };
    case "diag-ul": return { x: d, y: d };
    case "diag-dr": return { x: -d, y: -d };
    case "diag-dl": return { x: d, y: -d };
    case "fade":
    case "scale": return { x: 0, y: 0 };
    default: return { x: 0, y: d }; // up
  }
}

type Kf = { opacity: number[]; x?: number[]; y?: number[]; scale?: number[] };
type Target = { opacity: number; x?: number; y?: number; scale?: number };

function enterKeyframes(dir: string, dist: number): Kf {
  const kf: Kf = { opacity: [0, 1] };
  if (dir === "scale") { kf.scale = [0.94, 1]; return kf; }
  const o = offsetsFor(dir, dist);
  if (o.x) kf.x = [o.x, 0];
  if (o.y) kf.y = [o.y, 0];
  return kf;
}

function hiddenTarget(dir: string, dist: number): Target {
  const t: Target = { opacity: 0 };
  if (dir === "scale") { t.scale = 0.94; return t; }
  const o = offsetsFor(dir, dist);
  if (o.x) t.x = o.x;
  if (o.y) t.y = o.y;
  return t;
}

/* Un reveal puede limitarse a un breakpoint con data-reveal-only="mobile|desktop".
   El que no aplica se muestra tal cual (el CSS anti-FOUC lo dejó en opacity 0). */
function skipForBreakpoint(el: HTMLElement, mobile: boolean): boolean {
  const only = el.dataset.revealOnly;
  if (!only) return false;
  const skip = only === "mobile" ? !mobile : only === "desktop" ? mobile : false;
  if (skip) {
    el.style.opacity = "1";
    el.style.transform = "none";
    el.style.willChange = "auto";
  }
  return skip;
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
  // En mobile el bloque ocupa casi toda la pantalla: con la ventana de desktop
  // (25%/65%) el texto pasaba demasiado tiempo desvanecido con el contenedor aún
  // visible. Ahí la entrada y la salida se hacen más cortas (y el recorrido más
  // chico), así el contenido está a plena opacidad casi todo el paso.
  const mobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
  const times = mobile ? [0, 0.12, 0.88, 1] : [0, 0.25, 0.65, 1];
  document.querySelectorAll<HTMLElement>("[data-reveal-scrub]").forEach((el) => {
    if (skipForBreakpoint(el, mobile)) return;
    const dir = (el.dataset.reveal || "up").toLowerCase();
    // Más agresivo (como on.pe): distancia 100 por defecto; la salida se aleja
    // ×1.7 en la misma dirección (no solo fade).
    const dist = Number(el.dataset.revealDistance || (mobile ? 56 : 100));
    const enter = offsetsFor(dir, dist);
    const exit = offsetsFor(dir, dist * 1.7); // la salida se aleja ×1.7
    const kf: Record<string, number[]> = { opacity: [0, 1, 1, 0] };
    if (enter.x || exit.x) kf.x = [enter.x, 0, 0, exit.x];
    if (enter.y || exit.y) kf.y = [enter.y, 0, 0, exit.y];
    scroll(
      // Desktop: 0–25% entra, 25–65% se mantiene, 65–100% sale (slide ×1.7 + fade).
      // Mobile: 0–12% / 12–88% / 88–100%.
      animate(el, kf as any, { times, ease: "linear" }),
      { target: el, offset: ["start end", "end start"] }
    );
  });
}

function initReveal() {
  const mobile = window.matchMedia?.("(max-width: 767px)").matches ?? false;
  document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
    if (el.dataset.revealScrub != null) return; // lo maneja initScrub
    if (skipForBreakpoint(el, mobile)) return;
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
