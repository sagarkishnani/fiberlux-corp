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
import { onEachPage } from "./lifecycle";

onEachPage((cleanup) => {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  document.querySelectorAll<HTMLElement>("[data-hero-sticky]").forEach((el) => {
    // Solo aplica el efecto si el contenedor está realmente fijado (sticky).
    // En páginas donde el overlap es solo desktop (p.ej. solución, cuyo hero es
    // más alto que el viewport en mobile) el contenedor es estático en mobile y
    // no debe animarse.
    if (getComputedStyle(el).position !== "sticky") return;
    // El elemento a animar es el hero (hijo del contenedor sticky); si no hay
    // hijo, se anima el propio contenedor.
    const inner = (el.firstElementChild as HTMLElement) || el;
    // Progreso: desde que el contenedor sticky toca el borde superior del
    // viewport hasta que termina de pasar (≈ el hero quedó totalmente cubierto).
    // `scroll()` deja un listener global vivo: se cancela antes del swap de la
    // siguiente navegación (SPEC 110).
    cleanup(
      scroll(
        animate(inner, { scale: [1, 0.96], opacity: [1, 0.85] }, { ease: "linear" }),
        { target: el, offset: ["start start", "end start"] }
      )
    );
  });
});
