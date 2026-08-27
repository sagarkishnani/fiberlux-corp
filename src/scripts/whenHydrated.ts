/**
 * Difiere una mutación del DOM hasta que la isla de Astro que la contiene haya
 * hidratado.
 *
 * Los scripts de efectos (`fx.ts`, `reveal.ts`) escriben `style.transform`,
 * `style.opacity` o `textContent` sobre elementos que muchas veces pertenecen a
 * una isla React. Si escriben ANTES de que React hidrate, React encuentra
 * atributos que él no renderizó, reporta un "hydration mismatch" y descarta la
 * hidratación del árbol entero. Pasaba con Certificaciones (parallax del glow),
 * Nosotros (Misión/Visión y el hero) y cualquier isla `client:visible` que
 * hidrata después del `DOMContentLoaded` en el que corren estos scripts.
 *
 * `<astro-island>` lleva el atributo `ssr` mientras está sin hidratar y Astro se
 * lo quita al terminar. Como `hydrateRoot` de React 19 es concurrente y puede no
 * haber terminado en ese instante, se esperan además dos frames.
 *
 * Devuelve una función de limpieza: con View Transitions la espera puede quedar
 * pendiente cuando el usuario navega, y hay que cortarla antes del swap
 * (SPEC 110). Por la misma razón el callback no corre si el elemento ya salió
 * del documento.
 */
export function whenHydrated<T extends HTMLElement | SVGElement>(
  el: T,
  run: (el: T) => void
): () => void {
  const island = el.closest("astro-island[ssr]");
  if (!island) {
    run(el);
    return () => {};
  }
  let cancelled = false;
  const observer = new MutationObserver(() => {
    if (island.hasAttribute("ssr")) return;
    observer.disconnect();
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (cancelled || !el.isConnected) return;
        run(el);
      })
    );
  });
  observer.observe(island, { attributes: true, attributeFilter: ["ssr"] });
  return () => {
    cancelled = true;
    observer.disconnect();
  };
}
