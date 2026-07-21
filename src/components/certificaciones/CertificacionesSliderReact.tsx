import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CertificacionesQuery,
  CertificacionesQueryVariables,
} from "../../../tina/__generated__/types";
import CertCard, { type Cert } from "./CertCard";
import { useDragSlider } from "../../hooks/useDragSlider";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
/* Decorative background glow (static asset), same pattern as the soluciones slider. */
const GLOW_PLANET = `${BASE}/images/soluciones/planet.svg`;

interface CertSliderProps {
  query: string;
  variables: CertificacionesQueryVariables;
  data: CertificacionesQuery;
}

export default function CertificacionesSliderReact({
  query,
  variables,
  data: initialData,
}: CertSliderProps) {
  const { data } = useTina<CertificacionesQuery>({ query, variables, data: initialData });

  const page = data?.certificaciones;
  const sectionTitle = page?.sectionTitle || "Certificaciones del grupo Fiberlux";
  const items = (page?.items || []).filter(Boolean) as any[];

  /* Shared drag/scroll engine: left-aligned cards, one card per arrow. */
  const slider = useDragSlider({
    slideSelector: ".cert-slide",
    align: "start",
    itemCount: items.length,
  });
  const { atStart, atEnd } = slider;

  const hasItems = items.length > 0;

  /* ── Prev/Next pill ── */
  const arrowsPill = (
    <div className="inline-flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        onClick={slider.prev}
        disabled={atStart}
        aria-label="Anterior"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          !atStart ? "text-white hover:bg-white/5" : "text-white/30 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={slider.next}
        disabled={atEnd}
        aria-label="Siguiente"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          !atEnd ? "bg-[#96237A] text-white hover:bg-[#650F50]" : "bg-[#96237A]/40 text-white/40 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  /* ── Carousel viewport: mobile shows ~1 card + peek, desktop exactly 2 ── */
  const carousel = (
    <div
      ref={slider.ref}
      className="flex items-stretch gap-6 overflow-x-auto snap-x snap-proximity py-2 select-none cert-carousel"
      style={{ cursor: hasItems ? "grab" : "default" }}
      {...slider.handlers}
    >
      {hasItems ? (
        items.map((item, i) => (
          <div
            key={i}
            className="cert-slide snap-start shrink-0 w-[85%] md:w-[calc((100%-1.5rem)/2)]"
          >
            <CertCard cert={item as Cert} tinaItem={page?.items?.[i]} />
          </div>
        ))
      ) : (
        <div className="cert-slide snap-start shrink-0 w-[85%] md:w-[calc((100%-1.5rem)/2)]">
          <div className="bg-white/[0.04] border border-white/10 min-h-[420px] rounded-[24px] flex items-center justify-center text-white/20 text-sm">
            Certificaciones — próximamente
          </div>
        </div>
      )}
    </div>
  );

  return (
    <section className="relative bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Decorative magenta glow (planet) so the background isn't just black.
          Masked so the SVG's blurred ellipse never shows a hard rectangular cut. */}
      <img
        src={GLOW_PLANET}
        alt=""
        aria-hidden="true"
        draggable={false}
        className="pointer-events-none absolute -top-[30%] left-1/2 -translate-x-[38%] z-0 w-[92vw] max-w-[1100px] select-none opacity-70"
        style={{
          WebkitMaskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
          maskImage: "radial-gradient(closest-side, #000 55%, transparent 100%)",
        }}
      />

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
          scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch;
          -webkit-mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%);
          mask-image: linear-gradient(to right, #000 0%, #000 86%, transparent 100%);
        }
        .cert-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
