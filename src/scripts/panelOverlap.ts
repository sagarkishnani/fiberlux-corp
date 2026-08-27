/**
 * Overlap "el panel sube y tapa" (SPEC 109) — bloque de testimonios/empresas.
 *
 * Mismo efecto que el overlap del hero de solución (SPEC 70), pero aplicado a
 * una sección intermedia: la sección ANTERIOR se queda fija mientras el panel
 * marcado con `[data-overlap-rise]` sube por encima y la cubre.
 *
 * La mecánica es CSS (`position: sticky` en la sección anterior); lo único que
 * hace falta en JS es calcular su `top`:
 *
 *   top = min(0, alturaViewport - alturaSección)
 *
 * Con `top: 0` a secas, una sección MÁS ALTA que el viewport se fijaría por su
 * cabecera y no se vería nunca su parte baja. Con el `top` negativo se fija su
 * ÚLTIMA pantalla, que es justo lo que el panel va a tapar.
 *
 * No se toca ninguna sección que tenga sus propios `sticky` dentro (rails,
 * cards apiladas): fijar el contenedor entero pelearía con ellos.
 *
 * Respeta `prefers-reduced-motion` y sólo actúa en desktop (lg+): en mobile las
 * secciones son mucho más altas que el viewport y el solape deja contenido
 * inalcanzable.
 */

import { onEachPage } from "./lifecycle";

const DESKTOP = "(min-width: 1024px)";

/** Secciones anteriores intervenidas, para poder revertirlas al salir de lg. */
let pares: { panel: HTMLElement; prev: HTMLElement }[] = [];

function medir() {
  const vh = window.innerHeight;
  for (const { prev } of pares) {
    const h = prev.getBoundingClientRect().height;
    // Sin alto todavía (isla sin hidratar, imágenes por cargar) no se fija nada:
    // el ResizeObserver vuelve a pasar por aquí cuando la sección ya mide.
    if (h <= 0) {
      prev.style.position = "";
      continue;
    }
    prev.style.position = "sticky";
    prev.style.top = `${Math.min(0, Math.round(vh - h))}px`;
  }
}

/**
 * Suelta el sticky en cuanto el panel ya cubrió del todo la sección (su borde
 * superior tocó el borde del viewport). Sin esto la sección seguiría fijada el
 * RESTO de la página: invisible bajo las secciones opacas, pero asomando por
 * las esquinas redondeadas de los bloques que vienen después. Volver a
 * `static` no mueve nada: `sticky` nunca alteró el flujo, así que su hueco
 * sigue donde estaba (ya fuera de pantalla).
 */
let pendiente = false;
function seguir() {
  if (pendiente) return;
  pendiente = true;
  requestAnimationFrame(() => {
    pendiente = false;
    for (const { panel, prev } of pares) {
      if (!prev.style.top) continue; // aún sin medir
      prev.style.position = panel.getBoundingClientRect().top <= 0 ? "" : "sticky";
    }
  });
}

function activar() {
  for (const { panel, prev } of pares) {
    prev.style.position = "sticky";
    prev.style.zIndex = "0";
    // El panel debe pintarse por encima sí o sí; las páginas ya le ponen un
    // `z-*`, pero no todas, y sin contexto de apilamiento el sticky ganaría.
    if (getComputedStyle(panel).position === "static") panel.style.position = "relative";
    if (getComputedStyle(panel).zIndex === "auto") panel.style.zIndex = "1";
  }
  medir();
}

function desactivar() {
  for (const { prev } of pares) {
    prev.style.position = "";
    prev.style.top = "";
    prev.style.zIndex = "";
  }
}

/**
 * Resuelve la caja real de la sección anterior. Dos casos que se dan en estas
 * páginas y que no se pueden posicionar:
 *  - hermanos sin caja (`<link>`/`<style>` que Astro inyecta entre componentes):
 *    se salta hacia atrás;
 *  - envoltorios `display: contents` (`<astro-island>` cuando la página monta el
 *    componente sin un `<div>` propio): se baja al primer hijo con caja, que
 *    participa del mismo flujo que el panel.
 */
function primeraCaja(n: HTMLElement | null): HTMLElement | null {
  while (n && getComputedStyle(n).display === "none") n = n.nextElementSibling as HTMLElement | null;
  return n;
}

function cajaReal(desde: HTMLElement | null): HTMLElement | null {
  let n: HTMLElement | null = desde;
  while (n && getComputedStyle(n).display === "none") n = n.previousElementSibling as HTMLElement | null;
  for (let i = 0; i < 3 && n; i++) {
    if (getComputedStyle(n).display !== "contents") return n;
    n = primeraCaja(n.firstElementChild as HTMLElement | null);
  }
  return null;
}

onEachPage((cleanup) => {
  if (typeof window === "undefined") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  // Con View Transitions el módulo no se reejecuta: los pares de la página
  // anterior apuntan a nodos ya desechados y hay que empezar de cero (SPEC 110).
  pares = [];

  document.querySelectorAll<HTMLElement>("[data-overlap-rise]").forEach((panel) => {
    const prev = cajaReal(panel.previousElementSibling as HTMLElement | null);
    if (!prev) return;
    // Si la sección de abajo ya tiene sus propios sticky (rails, cards
    // apiladas), fijarla entera pelearía con ellos: se deja como está.
    if (prev.querySelector(".sticky, [data-hero-sticky], [data-overlap-rise]")) return;
    if (getComputedStyle(prev).position === "sticky") return;
    pares.push({ panel, prev });
  });
  if (!pares.length) return;

  const mq = window.matchMedia(DESKTOP);
  const sync = () => {
    if (mq.matches) {
      activar();
      window.addEventListener("scroll", seguir, { passive: true });
      seguir();
    } else {
      window.removeEventListener("scroll", seguir);
      desactivar();
    }
  };
  sync();
  mq.addEventListener?.("change", sync);
  cleanup(() => {
    mq.removeEventListener?.("change", sync);
    window.removeEventListener("scroll", seguir);
    pares = [];
  });

  // Las alturas cambian al hidratarse las islas (el carrusel, las cifras), no
  // sólo al redimensionar: se observa cada sección anterior.
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => {
      if (mq.matches) medir();
    });
    pares.forEach(({ prev }) => ro.observe(prev));
    cleanup(() => ro.disconnect());
  }
  const onResize = () => {
    if (mq.matches) medir();
  };
  window.addEventListener("resize", onResize);
  cleanup(() => window.removeEventListener("resize", onResize));
});
