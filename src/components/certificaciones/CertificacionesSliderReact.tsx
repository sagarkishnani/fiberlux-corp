import { useEffect, useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CertificacionesQuery,
  CertificacionesQueryVariables,
} from "../../../tina/__generated__/types";
import CertCard, { type Cert } from "./CertCard";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderArrows from "../shared/SliderArrows";
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
  intervalMs = 3500,
  effect = "none",
  edgeHover = false,
  locale = "es",
}: CertSliderProps) {
  const { data } = useTina<CertificacionesQuery>({ query, variables, data: initialData });

  const page = data?.certificaciones;
  const sectionTitle =
    tField(page as any, "sectionTitle", locale) ||
    (locale === "en" ? "Fiberlux group certifications" : "Certificaciones del grupo Fiberlux");
  const items = (page?.items || []).filter(Boolean) as any[];

  const hasItems = items.length > 0;
  const enough = items.length > 1;
  // Desktop arranca en la card del medio para poder ir a izquierda o derecha.
  const startIndex = hasItems ? Math.floor(items.length / 2) : 0;

  /* Embla slider: cards centradas (la seleccionada queda al medio, las de los
     costados asoman desvanecidas), una card por flecha. Con loop de Embla: clona
     los slides para que SIEMPRE asome una card a izquierda y derecha (efecto
     "infinito"), incluso en los extremos — así ninguna orilla queda vacía. */
  const slider = useSlider({
    align: "center",
    loop: true,
    autoplay: false, // autoplay manual (abajo) para pausar al pasar el cursor
    intervalMs,
    effect,
    startIndex,
  });

  /* Navegación: con loop, next()/prev() envuelven solos (sin costura). */
  const goNext = () => slider.next();
  const goPrev = () => slider.prev();
  const goNextRef = useRef(goNext);
  const goPrevRef = useRef(goPrev);
  goNextRef.current = goNext;
  goPrevRef.current = goPrev;

  /* Autoplay manual: avanza con envolvente y se pausa mientras el cursor está
     sobre el carrusel (leer sin que se mueva). Respeta prefers-reduced-motion. */
  const pausedRef = useRef(false);
  const autoplayOn = autoplay && enough && !slider.reducedMotion;
  useEffect(() => {
    if (!autoplayOn) return;
    const id = window.setInterval(() => {
      if (!pausedRef.current) goNextRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [autoplayOn, intervalMs]);

  // Con la navegación envolvente las flechas siempre están activas.
  const arrowsPill = (
    <SliderArrows
      canPrev={enough}
      canNext={enough}
      onPrev={goPrev}
      onNext={goNext}
    />
  );

  /* Navegación por hover en los bordes del carrusel (obs. cliente): pasar el
     cursor por el borde derecho avanza al siguiente ISO; por el izquierdo, al
     anterior. Mientras el cursor siga en la zona, sigue avanzando con calma
     (envolviendo al reiniciar). Sólo en dispositivos con hover real (desktop);
     las flechas siguen disponibles para touch y accesibilidad. */
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
    holdRef.current = window.setInterval(step, 900);
  };
  useEffect(() => stopHold, []);

  /* ── Carousel viewport (Embla): mobile ~1 card + peek, desktop exactly 2 ── */
  const carousel = (
    <div
      ref={slider.viewportRef}
      className="relative overflow-hidden py-2 select-none cert-carousel"
      style={{ cursor: hasItems ? "grab" : "default" }}
      onMouseEnter={() => (pausedRef.current = true)}
      onMouseLeave={() => (pausedRef.current = false)}
    >
      {/* Con loop de Embla el `gap` de flex no se mide bien al clonar (las cards
          se pegan). Se usa padding horizontal por slide (px-3 = 1.5rem entre
          cards) que sí forma parte de la caja medida por Embla. */}
      <div className="flex items-stretch">
        {hasItems ? (
          items.map((item, i) => (
            <div
              key={i}
              className="cert-slide shrink-0 w-[85%] lg:w-[58%] px-3"
            >
              <CertCard cert={item as Cert} tinaItem={page?.items?.[i]} locale={locale} />
            </div>
          ))
        ) : (
          <div className="cert-slide shrink-0 w-[85%] lg:w-[58%] px-3">
            <div className="bg-white/[0.04] border border-white/10 min-h-[420px] rounded-[24px] flex items-center justify-center text-white/20 text-sm">
              {locale === "en" ? "Certifications — coming soon" : "Certificaciones — próximamente"}
            </div>
          </div>
        )}
      </div>

      {/* Zonas de hover en los bordes: izq → ISO anterior, der → siguiente.
          Sólo en dispositivos con hover real; el centro sigue siendo arrastrable.
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

  return (
    <section className="relative bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
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
        {/* Left column: title + arrows (desktop) */}
        <div className="lg:w-[34%] lg:shrink-0">
          <h2
            className="text-[32px] md:text-[48px] leading-[1.1] font-semibold text-white max-w-[16ch]"
            data-tina-field={page ? tinaField(page, "sectionTitle") : undefined}
          >
            {sectionTitle}
          </h2>
        </div>

        {/* Right column: carousel + flechas laterales (desktop, SPEC 94) */}
        <div className="lg:flex-1 lg:min-w-0 mt-8 lg:mt-0">
          <div className="relative">
            {carousel}
            {items.length > 1 && (
              <SliderSideArrows
                canPrev={enough}
                canNext={enough}
                onPrev={goPrev}
                onNext={goNext}
                /* Certificaciones mantiene un margen más chico que el resto (SPEC 94). */
                offset="clamp(-3.5rem, 30px - 4.5vw, -1rem)"
              />
            )}
          </div>
        </div>

        {/* Mobile arrows: below the carousel, left-aligned */}
        {items.length > 1 && <div className="lg:hidden mt-8">{arrowsPill}</div>}
      </div>

      {/* Desktop: desvanece las cards que asoman a los costados con una máscara
          horizontal (además del tween de opacidad), para que sólo la del centro
          se lea nítida. */}
      <style>{`
        @media (min-width: 1024px) {
          .cert-carousel {
            -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, #000 16%, #000 84%, transparent 100%);
          }
        }
      `}</style>
    </section>
  );
}
