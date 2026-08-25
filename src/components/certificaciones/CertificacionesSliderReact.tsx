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

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
/* Decorative background glow (static asset), same pattern as the soluciones slider. */
const GLOW_PLANET = `${BASE}/images/soluciones/planet.svg`;

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
      /* `-mx-3` ensancha el viewport 12px por lado y cada slide compensa con
         `px-3`: así queda un canal de 24px ENTRE cards (antes se tocaban al
         pasar de una a otra) sin que la card pierda ancho — sigue llegando a
         los bordes de la columna, como en la referencia. */
      className="relative -mx-3 overflow-hidden py-2 select-none cert-carousel"
      style={{ cursor: hasItems ? "grab" : "default" }}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      <div className="flex items-stretch">
        {hasItems ? (
          items.map((item, i) => (
            <div key={i} className="cert-slide shrink-0 w-full px-3">
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
          <div className="cert-slide shrink-0 w-full px-3">
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
      {/* Decorative magenta glow (planet) so the background isn't just black.
          El wrapper añade una máscara vertical que DESVANECE el glow hacia los bordes
          superior/inferior de la sección, para que no se corte en seco contra las
          secciones vecinas (integración entre bloques). */}
      <div
        aria-hidden="true"
        data-parallax="0.12"
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0%, #000 9%, #000 82%, transparent 100%)",
          maskImage:
            "linear-gradient(to bottom, transparent 0%, #000 9%, #000 82%, transparent 100%)",
        }}
      >
        <img
          src={GLOW_PLANET}
          alt=""
          draggable={false}
          className="absolute -top-[30%] left-1/2 -translate-x-[38%] w-[92vw] max-w-[1100px] select-none opacity-70"
          style={{
            WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
            maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          }}
        />
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
          .cs-spin, .cs-spin-rev, .cert-reveal[data-go="1"] { animation: none !important; }
        }
      `}</style>
    </section>
  );
}
