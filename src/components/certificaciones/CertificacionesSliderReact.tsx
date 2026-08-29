import { useEffect, useRef, useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CertificacionesQuery,
  CertificacionesQueryVariables,
} from "../../../tina/__generated__/types";
import CertSeal, { type Cert } from "./CertSeal";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderSideArrows from "../shared/SliderSideArrows";
import { tField } from "../../utils/i18n";
import type { Locale } from "../../i18n/config";

interface CertSliderProps {
  query: string;
  variables: CertificacionesQueryVariables;
  data: CertificacionesQuery;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
  /** Navegar al pasar el cursor por los bordes del carrusel (CMS). Off por defecto. */
  edgeHover?: boolean;
  locale?: Locale;
}

export default function CertificacionesSliderReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
  edgeHover = false,
  locale = "es",
}: CertSliderProps) {
  const { data } = useTina<CertificacionesQuery>({ query, variables, data: initialData });

  const page = data?.certificaciones;
  const sectionTitle =
    tField(page as any, "sectionTitle", locale) ||
    (locale === "en" ? "Fiberlux group certifications" : "Certificaciones del Grupo Fiberlux");
  const sectionDescription = tField(page as any, "sectionDescription", locale);
  const items = (page?.items || []).filter(Boolean) as any[];

  const hasItems = items.length > 0;
  const enough = items.length > 1;

  /* Embla: una card completa por vista (el sello ocupa toda la columna derecha,
     como en la referencia). Con loop las flechas nunca se deshabilitan. */
  const slider = useSlider({
    align: "center",
    loop: true,
    autoplay: false, // autoplay manual (abajo) para pausar al pasar el cursor
    intervalMs,
    effect,
  });

  const goNext = () => slider.next();
  const goPrev = () => slider.prev();
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  goNextRef.current = goNext;
  goPrevRef.current = goPrev;

  /* ── Disparo del estampado: la sección entra en pantalla (una sola vez) ──
     El sello no se anima hasta ese momento; con `prefers-reduced-motion` no hay
     animación en absoluto y todo se pinta en su estado final. */
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const anima = !slider.reducedMotion;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || !("IntersectionObserver" in window)) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Cada vez que una card pasa a ser la activa del carrusel, su sello se vuelve
     a estampar: el contador se usa como `key`, así React la remonta y las
     animaciones CSS arrancan de nuevo. La card que ya se vio conserva su ciclo,
     de modo que las de los costados no se reinician. */
  const [cycles, setCycles] = useState<Record<number, number>>({});
  const activeIndex = slider.activeIndex;
  const primerEstampado = useRef(true);
  useEffect(() => {
    if (!inView || !anima) return;
    // El primer estampado ya lo dispara `stamp="go"`; sólo se remonta a partir
    // del segundo cambio de card (si no, se perdería la escalera de entrada).
    if (primerEstampado.current) {
      primerEstampado.current = false;
      return;
    }
    setCycles((prev) => ({ ...prev, [activeIndex]: (prev[activeIndex] ?? 0) + 1 }));
  }, [activeIndex, inView, anima]);

  /* Autoplay manual: avanza con envolvente y se pausa mientras el cursor está
     sobre el carrusel (leer sin que se mueva). Respeta prefers-reduced-motion.

     No es un `setInterval` de `intervalMs` a secas: el reloj se mide contra el
     ÚLTIMO cambio de card, venga de donde venga (flecha, dot o arrastre). Con un
     intervalo fijo, navegar a mano justo antes de que venciera hacía saltar una
     card de más un instante después — el "se mueve al siguiente sin razón". El
     sondeo corto sólo compara timestamps; el salto lo decide `lastChangeRef`. */
  const pausedRef = useRef(false);
  const autoplayOn = autoplay && enough && anima;
  const lastChangeRef = useRef(0);
  useEffect(() => {
    lastChangeRef.current = performance.now();
  }, [activeIndex]);

  useEffect(() => {
    if (!autoplayOn) return;
    lastChangeRef.current = performance.now();
    const id = window.setInterval(() => {
      // Con el cursor encima el reloj no corre: se empuja el origen.
      if (pausedRef.current) {
        lastChangeRef.current = performance.now();
        return;
      }
      if (performance.now() - lastChangeRef.current >= intervalMs) goNextRef.current();
    }, 250);
    return () => clearInterval(id);
  }, [autoplayOn, intervalMs]);

  /* Navegación por hover en los bordes del carrusel (obs. cliente): pasar el
     cursor por el borde derecho avanza al siguiente ISO; por el izquierdo, al
     anterior. Sólo en dispositivos con hover real (desktop). */
  const holdRef = useRef<number | null>(null);
  const stopHold = () => {
    if (holdRef.current != null) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };
  const startHold = (dir: "next" | "prev") => {
    stopHold();
    const step = () => (dir === "next" ? goNextRef.current() : goPrevRef.current());
    step(); // primer paso inmediato al entrar
    holdRef.current = window.setInterval(step, 1400);
  };
  useEffect(() => stopHold, []);

  /* El sello sólo anima cuando hay movimiento permitido; si no, `null` deja la
     card en su estado final sin keyframes. */
  const stamp: "idle" | "go" | null = !anima ? null : inView ? "go" : "idle";

  /* ── Carousel viewport (Embla): una card por vista ── */
  const carousel = (
    <div
      ref={slider.viewportRef}
      /* El viewport se ensancha con `-mx-*` y cada slide lo compensa con el
         `px-*` equivalente: la card conserva SU ancho (el de la columna) y lo
         que crece es el canal entre cards. Ese sobrante es el que usa la
         máscara `.cert-carousel` para desvanecer los bordes (obs. cliente):
         en reposo la card llega justo donde la máscara ya es opaca, así que no
         pierde nitidez, y al cambiar de slide los cantos se disuelven en vez de
         cortarse en seco contra el `overflow-hidden`. */
      className="relative -mx-3 md:-mx-10 overflow-hidden py-2 select-none cert-carousel"
      style={{ cursor: hasItems ? "grab" : "default" }}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="flex items-stretch">
        {hasItems ? (
          items.map((item, i) => (
            <div key={i} className="cert-slide shrink-0 w-full px-3 md:px-10">
              <CertSeal
                key={cycles[i] ?? 0}
                cert={item as Cert}
                tinaItem={page?.items?.[i]}
                locale={locale}
                stamp={stamp}
                cycle={cycles[i] ?? 0}
              />
            </div>
          ))
        ) : (
          <div className="cert-slide shrink-0 w-full px-3 md:px-10">
            <div className="bg-white/[0.04] border border-white/10 min-h-[380px] rounded-[24px] flex items-center justify-center text-white/20 text-sm">
              {locale === "en" ? "Certifications — coming soon" : "Certificaciones — próximamente"}
            </div>
          </div>
        )}
      </div>

      {/* Zonas de hover en los bordes: izq → ISO anterior, der → siguiente.
          Activable desde el CMS (`edgeHover`); desactivado por defecto. */}
      {enough && edgeHover && (
        <>
          <div
            aria-hidden="true"
            onMouseEnter={() => startHold("prev")}
            onMouseLeave={stopHold}
            className="absolute inset-y-0 left-0 z-20 hidden w-[15%] [@media(hover:hover)]:block"
          />
          <div
            aria-hidden="true"
            onMouseEnter={() => startHold("next")}
            onMouseLeave={stopHold}
            className="absolute inset-y-0 right-0 z-20 hidden w-[15%] [@media(hover:hover)]:block"
          />
        </>
      )}
    </div>
  );

  /* Revelado del encabezado y del panel: mismo disparo que el sello, en
     escalera. Con movimiento reducido devuelve sólo la clase base (sin
     `data-go` ni opacidad 0), así el bloque se pinta en su sitio. */
  const reveal = (i: number, extra: string) =>
    anima
      ? {
          className: `cert-reveal ${extra}`,
          style: { "--r-i": i, opacity: inView ? undefined : 0 } as React.CSSProperties,
          "data-go": inView ? "1" : undefined,
        }
      : { className: extra };

  return (
    <section
      ref={sectionRef}
      className="relative bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden"
    >
      {/* ── Fondo: cintas de luz magenta (SPEC 108) ──────────────────────────
          Antes era el blob `planet.svg` centrado, que se leía como una mancha
          suelta detrás del título. Ahora son cintas diagonales muy suaves que
          cruzan la sección por detrás de la card — el lenguaje de la referencia
          del cliente (agentflow.framer.ai): negro con luz sedosa pasando por
          detrás de los paneles, no un degradado decorativo encima.

          Los degradados viven en el bloque <style> de abajo (`.cert-bg-*`)
          porque cambian de sitio entre mobile (layout apilado: la luz baja hasta
          la card) y desktop (dos columnas: la luz baña la mitad derecha). Son
          `radial-gradient` elípticos en nodos rotados: el desvanecido es
          intrínseco al degradado, sin `filter: blur()` (caro en móviles) ni
          imágenes. Estático, sin animación, como pidió el cliente.

          La máscara vertical funde las cintas contra las secciones vecinas para
          que no se corten en seco arriba ni abajo. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          /* Fuerza global de las cintas. Un único dial sobre toda la capa en
             vez de retocar el alfa de cada degradado: sube o baja este número
             para aclarar u oscurecer el fondo sin desbalancear las cintas
             entre sí (1 = la intensidad original del SPEC 108). */
          opacity: 0.5,
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 12%, #000 86%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 12%, #000 86%, transparent 100%)",
        }}
      >
        {/* Luz ambiental: el baño amplio sobre el que se apoya la card, para que
            el glass tenga algo real que difuminar por detrás. */}
        <div className="cert-bg-amb absolute inset-0" />

        {/* `data-parallax` va en un nodo SIN `style` propio: el script de fx
            escribe `transform` aquí, y si React hubiera renderizado un style en
            este mismo nodo compararía ambos al hidratar y abortaría la isla. */}
        <div data-parallax="0.08" className="absolute inset-0">
          {/* Cinta principal, con el núcleo más claro y caída larga al negro. */}
          <div className="cert-bg-r1 absolute" />
          {/* Segunda cinta: otro ángulo y menos fuerza — da el volumen de
              "seda" en vez de una sola banda plana. */}
          <div className="cert-bg-r2 absolute" />
          {/* Filamento fino: la línea de luz que define el borde de la cinta.
              Es lo que hace que se lea como un haz y no como niebla. */}
          <div className="cert-bg-r3 absolute" />
        </div>
      </div>

      <div className="relative z-10 site-container lg:flex lg:items-center lg:gap-16">
        {/* Left column: título + descripción */}
        <div className="lg:w-[46%] lg:shrink-0">
          <h2
            {...reveal(0, "text-[32px] md:text-[48px] leading-[1.1] font-medium text-white max-w-[16ch]")}
            data-tina-field={page ? tinaField(page, "sectionTitle") : undefined}
          >
            {sectionTitle}
          </h2>
          {sectionDescription && (
            <p
              {...reveal(1, "mt-6 max-w-[46ch] text-[15px] leading-[1.75] text-white/45")}
              data-tina-field={page ? tinaField(page, "sectionDescription") : undefined}
            >
              {sectionDescription}
            </p>
          )}
        </div>

        {/* Right column: carrusel del sello + flechas laterales (desktop, SPEC 94) */}
        <div {...reveal(2, "lg:flex-1 lg:min-w-0 mt-10 lg:mt-0")}>
          <div className="relative">
            {carousel}
            {enough && (
              <SliderSideArrows
                canPrev
                canNext
                onPrev={goPrev}
                onNext={goNext}
                /* Certificaciones mantiene un margen más chico que el resto (SPEC 94). */
                offset="clamp(-3.5rem, 30px - 4.5vw, -1rem)"
              />
            )}
          </div>

          {/* Dots: indicador de progreso interactivo, centrado bajo la card. */}
          {slider.scrollSnaps.length > 1 && (
            <div
              className="mt-7 flex justify-center gap-2.5"
              role="tablist"
              aria-label={locale === "en" ? "Certifications" : "Certificaciones"}
            >
              {slider.scrollSnaps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-label={
                    locale === "en" ? `Go to certification ${i + 1}` : `Ir a la certificación ${i + 1}`
                  }
                  aria-selected={i === activeIndex}
                  onClick={() => slider.goTo(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === activeIndex ? "w-6 bg-[#96237A]" : "w-2 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Sin flechas bajo lg: la píldora repetía lo que ya hacen los dots
            (que también navegan) y el arrastre. En desktop se quedan las
            laterales de SPEC 94. */}
      </div>

      {/* ── Estampado del sello (SPEC 106) ──────────────────────────────────
          Todo el movimiento vive aquí, en CSS: sin `data-stamp` (reduced-motion
          o SSR) la card se pinta en su estado final. `--cs-base` es el instante
          en que arranca el trazo y `--cs-after` (base + 0.9s) el momento en que
          el anillo cierra y entra todo lo demás. */}
      <style>{`
        /* Eje de giro: con view-box el origen se resuelve contra el viewBox
           0 0 240 240, donde el centro es (120,120) pase lo que pase con el bbox
           — si no, el sello orbita fuera de eje en vez de girar sobre sí mismo. */
        .cs-eje { transform-box: view-box; transform-origin: 120px 120px; }

        @keyframes cs-draw   { to { stroke-dashoffset: 0; } }
        @keyframes cs-in     { to { opacity: 1; } }
        @keyframes cs-core-in{ from { opacity: 0; transform: scale(0.9); }
                                 to { opacity: 1; transform: scale(1); } }
        @keyframes cs-halo   { 35% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes cs-gira   { to { transform: rotate(360deg); } }
        @keyframes cs-sweep  { from { transform: translateX(-60%); }
                                 to { transform: translateX(60%); } }
        @keyframes cs-up     { from { opacity: 0; transform: translateY(12px); }
                                 to { opacity: 1; transform: none; } }

        /* ── Bordes del carrusel desvanecidos (obs. cliente) ──────────────
           El overflow-hidden del viewport cortaba las cards en seco: al pasar
           de una a otra se veía aparecer/desaparecer el borde de cristal contra
           una línea recta. La máscara horizontal funde esos cantos. El ancho del
           degradado es exactamente el px del slide, de modo que la card
           activa (que en reposo empieza justo ahí) queda íntegra: sólo se
           desvanece lo que entra o sale del encuadre. */
        .cert-carousel {
          --cert-fade: 12px;
          -webkit-mask-image: linear-gradient(90deg, transparent 0, #000 var(--cert-fade), #000 calc(100% - var(--cert-fade)), transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0, #000 var(--cert-fade), #000 calc(100% - var(--cert-fade)), transparent 100%);
        }
        @media (min-width: 768px) {
          .cert-carousel { --cert-fade: 40px; }
        }

        /* ── Cintas de luz del fondo ──────────────────────────────────────
           Mobile (layout apilado): el haz baja en diagonal hasta donde queda la
           card, y el baño ambiental se centra bajo el texto. */
        .cert-bg-amb {
          background: radial-gradient(84% 46% at 50% 74%, rgba(150,35,122,0.28) 0%, rgba(120,28,98,0.13) 44%, rgba(10,10,10,0) 76%);
        }
        .cert-bg-r1 {
          --rot: -20deg;
          left: -30%; right: -30%; top: 24%; height: 46%;
          transform: rotate(var(--rot));
          background: radial-gradient(closest-side, rgba(216,96,182,0.34) 0%, rgba(160,40,130,0.16) 38%, rgba(10,10,10,0) 76%);
        }
        .cert-bg-r2 {
          --rot: 12deg;
          left: -30%; right: -20%; top: 58%; height: 50%;
          transform: rotate(var(--rot));
          background: radial-gradient(closest-side, rgba(150,35,122,0.22) 0%, rgba(90,22,74,0.10) 42%, rgba(10,10,10,0) 78%);
        }
        .cert-bg-r3 {
          --rot: -20deg;
          left: -15%; right: -15%; top: 40%; height: 12%;
          transform: rotate(var(--rot));
          background: radial-gradient(closest-side, rgba(240,160,214,0.26) 0%, rgba(216,96,182,0.09) 45%, rgba(10,10,10,0) 80%);
        }

        /* ── Deriva de las cintas (obs. cliente) ──────────────────────────
           El fondo era una imagen pegada; ahora respira, con el lenguaje del
           hero de Soluciones: la luz se pasea por detrás de la card.

           EL EJE IMPORTA MÁS QUE LA AMPLITUD. Los dos primeros intentos movían
           sobre todo en X y no se veía nada, y la razón es geométrica: los
           porcentajes de translate se resuelven contra la CAJA DEL PROPIO
           elemento, y estas cintas miden ~2100px de ancho por ~280px de alto.
           Un 6% en X son 126px sobre una elipse de luz que ya ocupa los 2100px
           de ancho: la imagen no cambia. Ese mismo 6% en Y son 17px. Por eso el
           fondo se seguía leyendo como una foto pegada.

           Ahora el vaivén va por el EJE CORTO: ±22% de la altura en las cintas
           (~62px, casi un cuarto de su grosor) y ±45% en el filamento (~36px,
           la mitad de su grosor). Es lo mismo que pasa con un haz de luz real:
           lo que se nota es que suba o baje y que cambie de inclinación, no que
           se corra a lo largo de sí mismo.

           El bamboleo de INCLINACIÓN (±2.4°) es el segundo motor: con 2100px
           de brazo, dos grados desplazan los extremos del haz unos 45px. Y el
           vaivén de opacidad (0.55→1) hace que la luz entre y salga en vez de
           estar siempre igual.

           Sólo se animan transform y opacity — las dos propiedades que el
           compositor resuelve en GPU sin repintar el degradado — y cada cinta
           lleva su propio período (9s / 12s / 15s / 13s) para que nunca
           coincidan y el conjunto no lata como un solo bloque. La rotación base
           viaja en la variable --rot porque cambia entre mobile y desktop: los
           keyframes la reutilizan en vez de duplicarse por breakpoint. */
        @keyframes cert-drift-1 {
          from { transform: rotate(calc(var(--rot) - 2.4deg)) translate3d(-3%, -22%, 0) scale(1); opacity: 0.55; }
          to   { transform: rotate(calc(var(--rot) + 2.4deg)) translate3d(3%, 22%, 0) scale(1.1); opacity: 1; }
        }
        @keyframes cert-drift-2 {
          from { transform: rotate(calc(var(--rot) + 2deg)) translate3d(3%, 20%, 0) scale(1.08); opacity: 1; }
          to   { transform: rotate(calc(var(--rot) - 2deg)) translate3d(-3%, -20%, 0) scale(0.96); opacity: 0.5; }
        }
        @keyframes cert-drift-3 {
          from { transform: rotate(calc(var(--rot) - 2.2deg)) translate3d(-6%, -45%, 0) scaleX(0.85); opacity: 0.25; }
          to   { transform: rotate(calc(var(--rot) + 2.2deg)) translate3d(6%, 45%, 0) scaleX(1.18); opacity: 1; }
        }
        @keyframes cert-breathe {
          from { transform: translate3d(-2%, -7%, 0) scale(1); opacity: 0.6; }
          to   { transform: translate3d(2%, 7%, 0) scale(1.14); opacity: 1; }
        }
        .cert-bg-amb { animation: cert-breathe 13s ease-in-out infinite alternate; }
        .cert-bg-r1  { animation: cert-drift-1 12s ease-in-out infinite alternate; }
        .cert-bg-r2  { animation: cert-drift-2 15s ease-in-out infinite alternate; }
        .cert-bg-r3  { animation: cert-drift-3 9s ease-in-out infinite alternate; }

        /* Desktop (dos columnas): la luz cruza de izquierda a derecha y termina
           bañando la mitad derecha, donde vive la card. */
        @media (min-width: 1024px) {
          .cert-bg-amb {
            background: radial-gradient(58% 62% at 74% 42%, rgba(150,35,122,0.30) 0%, rgba(120,28,98,0.14) 44%, rgba(10,10,10,0) 74%);
          }
          .cert-bg-r1 {
            --rot: -14deg;
            left: -20%; right: -20%; top: 6%; height: 46%;
            background: radial-gradient(closest-side, rgba(216,96,182,0.40) 0%, rgba(160,40,130,0.19) 38%, rgba(10,10,10,0) 76%);
          }
          .cert-bg-r2 {
            --rot: 9deg;
            left: -25%; right: -10%; top: 46%; height: 52%;
            background: radial-gradient(closest-side, rgba(150,35,122,0.26) 0%, rgba(90,22,74,0.12) 42%, rgba(10,10,10,0) 78%);
          }
          .cert-bg-r3 {
            --rot: -14deg;
            left: -10%; right: -10%; top: 26%; height: 13%;
            background: radial-gradient(closest-side, rgba(240,160,214,0.30) 0%, rgba(216,96,182,0.10) 45%, rgba(10,10,10,0) 80%);
          }
        }

        /* Borde de cristal de la card: hairline con degradado. La máscara xor
           recorta el interior y deja sólo el contorno de 1px. */
        .cs-edge {
          padding: 1px;
          background: linear-gradient(138deg,
            rgba(255,255,255,0.30) 0%,
            rgba(255,255,255,0.10) 22%,
            rgba(255,255,255,0.03) 48%,
            rgba(216,96,182,0.22) 100%);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
        }

        /* Estado de reposo (sin data-stamp): el sello ya está estampado. */
        .cs-halo { opacity: 0; }
        .cs-sweep {
          left: -50%; right: -50%; opacity: 0;
          background: linear-gradient(105deg, transparent 42%, rgba(209,79,176,0.14) 50%, transparent 58%);
        }
        .cs-spin     { animation: cs-gira 60s linear infinite; }
        .cs-spin-rev { animation: cs-gira 90s linear infinite reverse; }

        /* Estado inicial del estampado. */
        [data-stamp] .cs-ring { stroke-dasharray: 1; stroke-dashoffset: 1; }
        [data-stamp] .cs-tick,
        [data-stamp] .cs-core,
        [data-stamp] .cs-meta { opacity: 0; }
        [data-stamp] .cs-spin,
        [data-stamp] .cs-spin-rev { animation: none; }

        /* Reproducción. */
        [data-stamp="go"] .cs-ring {
          animation: cs-draw 0.9s ease-in-out var(--cs-base) forwards;
        }
        [data-stamp="go"] .cs-tick {
          animation: cs-in 0.2s linear calc(var(--cs-base) + var(--i) * 0.075s) forwards;
        }
        [data-stamp="go"] .cs-halo {
          animation: cs-halo 0.7s ease-out var(--cs-after) forwards;
        }
        [data-stamp="go"] .cs-core {
          animation: cs-core-in 0.4s cubic-bezier(0.22,1,0.36,1) var(--cs-after) forwards;
        }
        [data-stamp="go"] .cs-sweep {
          opacity: 1;
          animation: cs-sweep 0.9s ease-in-out var(--cs-after) forwards;
        }
        [data-stamp="go"] .cs-meta {
          animation: cs-in 0.5s ease-out calc(var(--cs-after) + var(--cs-meta-i) * 0.08s) forwards;
        }
        [data-stamp="go"] .cs-spin {
          animation: cs-gira 60s linear var(--cs-after) infinite;
        }
        [data-stamp="go"] .cs-spin-rev {
          animation: cs-gira 90s linear var(--cs-after) infinite reverse;
        }

        /* Revelado en escalera del encabezado y del panel. */
        .cert-reveal[data-go="1"] {
          animation: cs-up 0.55s cubic-bezier(0.22,1,0.36,1) calc(var(--r-i) * 0.09s) both;
        }

        @media (prefers-reduced-motion: reduce) {
          .cs-spin, .cs-spin-rev, .cert-reveal[data-go="1"],
          .cert-bg-amb, .cert-bg-r1, .cert-bg-r2, .cert-bg-r3 { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
