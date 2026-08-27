/**
 * Pegamento global de View Transitions (SPEC 110).
 *
 * Este módulo corre UNA vez por documento y sus listeners sobreviven a las
 * navegaciones (el `<ClientRouter />` sólo intercambia `<head>` y `<body>`).
 * Repara aquí todo lo que el swap de Astro se lleva por delante:
 *
 *  1. Atributos del `<html>`. `swapRootAttributes` borra TODOS los atributos del
 *     elemento raíz y copia los del documento nuevo. Se pierden por tanto las
 *     clases que sólo existen en runtime: `reveal-js` (anti-FOUC de los
 *     reveals), `lenis`/`lenis-smooth` (sin ellas el smooth-scroll deja de
 *     comportarse) y las de accesibilidad, más las custom properties de
 *     accesibilidad. Los scripts inline pre-paint que las ponen NO se
 *     reejecutan (Astro deduplica por contenido), así que se restauran aquí,
 *     dentro del callback de la transición (antes del primer pintado).
 *  2. Marca `data-astro-navigated` en el `<html>` para que el CSS pueda tratar
 *     distinto una navegación interna (p. ej. no mostrar el preloader del Home).
 *  3. Lenis: la instancia es única y persiste, pero cachea alto de página y
 *     posición de scroll; tras el swap hay que remedir y resincronizar o el
 *     primer gesto salta a la posición de la página anterior.
 *  4. GTM: sin recarga de documento no hay pageview nativo. Se empuja un evento
 *     `spa_pageview` al dataLayer para que el contenedor pueda dispararlo.
 */

declare global {
  interface Window {
    __lenis?: {
      resize: () => void;
      scrollTo: (target: number, opts?: Record<string, unknown>) => void;
    };
    __applyA11yPrefs?: () => void;
    dataLayer?: Record<string, unknown>[];
  }
}

/** Clases del <html> justo antes del swap (el SSR no emite ninguna). */
let clasesPrevias: string[] = [];

document.addEventListener("astro:before-swap", () => {
  clasesPrevias = Array.from(document.documentElement.classList);
});

document.addEventListener("astro:after-swap", () => {
  const root = document.documentElement;

  // 1 + 2 — estado del <html> que el swap acaba de borrar.
  root.classList.add(...clasesPrevias, "reveal-js");
  root.dataset.astroNavigated = "";
  try {
    window.__applyA11yPrefs?.();
  } catch {
    /* preferencias corruptas: la página se ve sin ajustes, no se rompe */
  }

  // 3 — Lenis contra la altura y el scroll de la página nueva.
  const lenis = window.__lenis;
  if (lenis) {
    lenis.resize();
    lenis.scrollTo(window.scrollY, { immediate: true, force: true });
  }

  // 4 — pageview para GTM (requiere un trigger de evento personalizado
  // `spa_pageview` en el contenedor; sin él, el push es inocuo).
  window.dataLayer?.push({
    event: "spa_pageview",
    page_path: location.pathname + location.search,
    page_title: document.title,
  });
});

export {};
