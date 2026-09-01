/**
 * Pausa las animaciones CSS en bucle de lo que no se está viendo.
 *
 * El sitio tiene bastantes animaciones declaradas `infinite` (el trazo de los
 * íconos de Valores, los marquees de rubros y partners, los fondos de
 * certificaciones, los halos de las escenas…). Una animación CSS **no se
 * detiene sola** cuando su elemento sale del viewport: el navegador la sigue
 * componiendo —y repintando, si toca una propiedad de pintado como
 * `stroke-dashoffset` o `box-shadow`— durante toda la vida de la página.
 *
 * Medido en /nosotros con la página en el tope: 12 animaciones corriendo, entre
 * ellas los cuatro trazos de Valores, con esa sección todavía a varias
 * pantallas de distancia. Con esto quedan 2. En un escritorio la diferencia no
 * se nota; en un teléfono es trabajo constante de main thread que compite justo
 * con el scroll, y es buena parte de por qué secciones "quietas" se sienten
 * lentas.
 *
 * Se opera sobre los objetos `Animation` (Web Animations API) y NO sobre el
 * DOM. La primera versión marcaba los bloques con un atributo y los pausaba por
 * CSS, pero varios de esos bloques son raíces de islas de React y escribirles
 * un atributo antes de que hidraten provoca un aviso de hidratación
 * ("some attributes of the server rendered HTML didn't match").
 *
 * Dos filtros deliberados:
 *
 *  - Sólo animaciones **CSS infinitas**. Las de entrada (reveals de Motion) son
 *    WAAPI y finitas: si se pausaran, un bloque podría quedarse a medio
 *    aparecer.
 *  - Sólo se reanuda lo que este módulo pausó. Las escenas de soluciones ya
 *    gestionan su propio `animation-play-state` desde CSS; llamar `play()` a
 *    ciegas se lo pisaría.
 */
import { onEachPage } from "./lifecycle";

/** Margen de anticipación: se reanuda antes de que el bloque asome. */
const MARGEN = "300px 0px";

/** Animación que este módulo puede pausar sin cambiar lo que se ve. */
function esCssEnBucle(a: Animation): boolean {
  try {
    /* `CSSAnimation` deja fuera a las de Motion (WAAPI). Si el navegador no
       expone el constructor, el criterio de las iteraciones infinitas ya las
       descarta igual, porque las de entrada corren una sola vez. */
    const Ctor = (window as any).CSSAnimation;
    if (Ctor && !(a instanceof Ctor)) return false;
    return a.effect?.getTiming().iterations === Infinity;
  } catch {
    return false;
  }
}

onEachPage((cleanup) => {
  if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;
  /* Sin `getAnimations` en el elemento no hay nada que hacer; la página queda
     exactamente como antes. */
  if (typeof Element.prototype.getAnimations !== "function") return;

  /* `#a11y-content` es el envoltorio que BaseLayout pone alrededor del
     contenido. Se busca ese y no `main` porque no todas las páginas traen un
     `<main>` (medido: /nosotros no tiene). El último recurso es el `<body>`. */
  const raiz =
    document.getElementById("a11y-content") ||
    document.querySelector("main") ||
    document.body;
  if (!raiz) return;

  /* Bloques de nivel superior y, además, las secciones anidadas: la de
     soluciones mide varias pantallas y como bloque único casi siempre estaría
     "visible", así que sin la segunda pasada la granularidad no serviría de
     nada. Un Set porque las dos consultas se solapan.

     Y sólo los que ocupan una caja. Un `<astro-island>` es `display: contents`
     —no genera caja, `getClientRects()` da 0— y el IntersectionObserver NUNCA
     lo reporta como visible: dispara una vez con `isIntersecting: false` y no
     vuelve. Observarlo era el fallo que dejaba los trazos de Valores pausados
     para siempre: la isla, que es el primer bloque de la lista, se quedaba con
     las animaciones y nadie las devolvía. Los bloques con caja (las <section>
     que la isla contiene) sí reportan bien y son la granularidad correcta. */
  const bloques = new Set<HTMLElement>(
    [
      ...(Array.from(raiz.children) as HTMLElement[]),
      ...Array.from(raiz.querySelectorAll<HTMLElement>("section")),
    ].filter((el) => el.getClientRects().length > 0),
  );
  if (bloques.size === 0) return;

  /** Lo que pausamos nosotros, para poder devolverlo y no tocar nada más. */
  const pausadas = new Set<Animation>();

  const pausar = (el: HTMLElement) => {
    for (const a of el.getAnimations({ subtree: true })) {
      if (a.playState !== "running" || !esCssEnBucle(a)) continue;
      try {
        a.pause();
        pausadas.add(a);
      } catch {
        /* una animación que ya no existe no debe frenar a las demás */
      }
    }
  };

  /* Se reanuda por subárbol y no por la lista que guardó ESE bloque: los
     bloques se solapan (una sección anidada dentro de otra) y quien pausa no
     tiene por qué ser quien vuelve a ver. Con el registro global, cualquier
     bloque que asome devuelve a marcha lo que haya debajo suyo. */
  const reanudar = (el: HTMLElement) => {
    for (const a of el.getAnimations({ subtree: true })) {
      if (!pausadas.delete(a)) continue;
      try {
        a.play();
      } catch {}
    }
  };

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) reanudar(el);
        else pausar(el);
      }
    },
    { rootMargin: MARGEN, threshold: 0 },
  );

  bloques.forEach((el) => io.observe(el));

  /* Repaso tardío: una isla que hidrata después de la primera pasada del
     observador estrena sus animaciones corriendo aunque su bloque esté fuera de
     pantalla, y el observador no volverá a dispararse hasta que ese bloque
     cruce el borde. Un barrido a los 2s recoge esos casos. */
  const repaso = window.setTimeout(() => {
    const vh = window.innerHeight;
    bloques.forEach((el) => {
      const r = el.getBoundingClientRect();
      const fuera = r.bottom < -300 || r.top > vh + 300;
      if (fuera) pausar(el);
    });
  }, 2000);

  cleanup(() => {
    io.disconnect();
    window.clearTimeout(repaso);
    /* Al salir de la página se devuelve todo a marcha: si el swap deja algún
       nodo vivo, no debe quedarse congelado. */
    pausadas.forEach((a) => {
      try {
        a.play();
      } catch {}
    });
    pausadas.clear();
  });
});
