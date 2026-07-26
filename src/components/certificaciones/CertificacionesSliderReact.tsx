import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CertificacionesQuery,
  CertificacionesQueryVariables,
} from "../../../tina/__generated__/types";
import CertCard, { type Cert } from "./CertCard";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderArrows from "../shared/SliderArrows";

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
}

export default function CertificacionesSliderReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 3500,
  effect = "none",
}: CertSliderProps) {
  const { data } = useTina<CertificacionesQuery>({ query, variables, data: initialData });

  const page = data?.certificaciones;
  const sectionTitle = page?.sectionTitle || "Certificaciones del grupo Fiberlux";
  const items = (page?.items || []).filter(Boolean) as any[];

  const hasItems = items.length > 0;
  const enough = items.length > 1;

  /* Embla slider: left-aligned cards, one card per arrow, autoplay w/ loop. */
  const slider = useSlider({
    align: "start",
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });
  const atEnd = !slider.canNext;

  const arrowsPill = (
    <SliderArrows
      canPrev={slider.canPrev}
      canNext={slider.canNext}
      onPrev={slider.prev}
      onNext={slider.next}
    />
  );

  /* ── Carousel viewport (Embla): mobile ~1 card + peek, desktop exactly 2 ── */
  const carousel = (
    <div
      ref={slider.viewportRef}
      className={`overflow-hidden py-2 select-none cert-carousel${atEnd ? " cert-at-end" : ""}`}
      style={{ cursor: hasItems ? "grab" : "default" }}
    >
      <div className="flex items-stretch gap-6">
        {hasItems ? (
          items.map((item, i) => (
            <div
              key={i}
              className="cert-slide shrink-0 w-[85%] md:w-[calc((100%-1.5rem)/2)]"
            >
              <CertCard cert={item as Cert} tinaItem={page?.items?.[i]} />
            </div>
          ))
        ) : (
          <div className="cert-slide shrink-0 w-[85%] md:w-[calc((100%-1.5rem)/2)]">
            <div className="bg-white/[0.04] border border-white/10 min-h-[420px] rounded-[24px] flex items-center justify-center text-white/20 text-sm">
              Certificaciones — próximamente
            </div>
          </div>
        )}
      </div>
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

      <div className="relative z-10 site-container md:flex md:items-center md:gap-10 lg:gap-16">
        {/* Left column: title + arrows (desktop) */}
        <div className="md:w-[34%] md:shrink-0">
          <h2
            className="text-[32px] md:text-[48px] leading-[1.1] font-semibold text-white max-w-[16ch]"
            data-tina-field={page ? tinaField(page, "sectionTitle") : undefined}
          >
            {sectionTitle}
          </h2>
          {items.length > 1 && <div className="hidden md:block mt-9">{arrowsPill}</div>}
        </div>

        {/* Right column: carousel */}
        <div className="md:flex-1 md:min-w-0 mt-8 md:mt-0">{carousel}</div>

        {/* Mobile arrows: below the carousel, left-aligned */}
        {items.length > 1 && <div className="md:hidden mt-8">{arrowsPill}</div>}
      </div>

      <style>{`
        /* obs_18: la card que se esconde a la derecha se desvanece (sin corte brusco). */
        .cert-carousel {
          -webkit-mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%);
          mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%);
        }
        /* obs_7: en la última card ya no hay card oculta a la derecha; se quita el
           fade para que la última (ISO) se vea nítida. */
        .cert-carousel.cert-at-end {
          -webkit-mask-image: none;
          mask-image: none;
        }
      `}</style>
    </section>
  );
}
