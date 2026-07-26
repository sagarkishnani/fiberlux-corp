/**
 * Overlap sticky del hero (SPEC 70) — capa de efecto con Motion.
 *
 * La mecánica del overlap es CSS: el hero va en un contenedor
 * `<div class="sticky top-0 z-0" data-hero-sticky>` y la sección siguiente
 * (opaca, z-10) sube por encima. Este módulo solo añade un efecto sutil al hero
 * mientras es cubierto: un leve scale-down + oscurecido, ligado al scroll.
 *
 * Respeta prefers-reduced-motion (no aplica efecto; el overlap sticky se mantiene).
 */
import { scroll, animate } from "motion";

function init() {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll<HTMLElement>("[data-hero-sticky]").forEach((el) => {
    // El elemento a animar es el hero (hijo del contenedor sticky); si no hay
    // hijo, se anima el propio contenedor.
    const inner = (el.firstElementChild as HTMLElement) || el;
    // Progreso: desde que el contenedor sticky toca el borde superior del
    // viewport hasta que termina de pasar (≈ el hero quedó totalmente cubierto).
    scroll(
      animate(inner, { scale: [1, 0.96], opacity: [1, 0.85] }, { ease: "linear" }),
      { target: el, offset: ["start start", "end start"] }
    );
  });
}

if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
