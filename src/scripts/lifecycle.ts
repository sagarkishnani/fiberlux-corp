/**
 * Ciclo de vida de página con View Transitions (SPEC 110).
 *
 * Los scripts de `src/scripts/*` son módulos: el navegador los ejecuta UNA sola
 * vez por documento. Con el `<ClientRouter />` de Astro las navegaciones ya no
 * recargan el documento (se intercambia el `<body>`), así que:
 *
 *  - `DOMContentLoaded` no vuelve a dispararse → los efectos no se aplicarían
 *    al contenido nuevo;
 *  - lo que dejó registrado la página anterior (listeners de scroll de Motion,
 *    ResizeObservers, sticky calculados) seguiría vivo apuntando a nodos que ya
 *    no están en el DOM → fuga de memoria y trabajo por cada navegación.
 *
 * `onEachPage` resuelve ambas cosas: corre `init` en la carga inicial y tras
 * cada swap (`astro:after-swap`, antes del primer pintado de la página nueva),
 * y ejecuta las limpiezas registradas justo antes de cada swap.
 *
 *   onEachPage((cleanup) => {
 *     const stop = inView(el, …);
 *     cleanup(stop);
 *   });
 */
type Cleanup = () => void;

export function onEachPage(init: (cleanup: (fn: Cleanup) => void) => void): void {
  if (typeof document === "undefined") return;

  let cleanups: Cleanup[] = [];
  const cleanup = (fn: Cleanup) => {
    cleanups.push(fn);
  };

  const run = () => init(cleanup);
  const clean = () => {
    const pending = cleanups;
    cleanups = [];
    for (const fn of pending) {
      try {
        fn();
      } catch {
        /* una limpieza rota no debe frenar a las demás */
      }
    }
  };

  if (document.readyState !== "loading") run();
  else document.addEventListener("DOMContentLoaded", run);

  document.addEventListener("astro:before-swap", clean);
  document.addEventListener("astro:after-swap", run);
}
