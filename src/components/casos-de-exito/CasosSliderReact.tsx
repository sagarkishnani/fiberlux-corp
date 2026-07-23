import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";
import CasoCard, { type Caso } from "./CasoCard";
import VideoModal from "./VideoModal";
import { useDragSlider } from "../../hooks/useDragSlider";

interface CasosSliderProps {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
}

export default function CasosSliderReact({
  query,
  variables,
  data: initialData,
}: CasosSliderProps) {
  const { data } = useTina<CasosDeExitoQuery>({ query, variables, data: initialData });

  const page = data?.casosDeExito;
  const sectionTitle = page?.sectionTitle || "Casos de éxito";
  const items = (page?.items || []).filter(Boolean) as any[];

  const [modalCaso, setModalCaso] = useState<Caso | null>(null);

  /* Shared drag/scroll engine: centre-aligned cards, one card per arrow. */
  const slider = useDragSlider({
    slideSelector: ".caso-slide",
    align: "center",
    momentum: false,
    itemCount: items.length,
  });
  const { activeIndex } = slider;

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < items.length - 1;

  const hasItems = items.length > 0;

  /* ── Prev/Next pill (shared desktop overlay + mobile) ── */
  const arrowsPill = (
    <div className="inline-flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        onClick={slider.prev}
        disabled={!canGoPrev}
        aria-label="Anterior"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          canGoPrev ? "text-white hover:bg-white/5" : "text-white/30 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        onClick={slider.next}
        disabled={!canGoNext}
        aria-label="Siguiente"
        className={`w-[49px] h-[49px] flex items-center justify-center transition-colors ${
          canGoNext ? "bg-[#96237A] text-white hover:bg-[#650F50]" : "bg-[#96237A]/40 text-white/40 cursor-default"
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );

  return (
    <section className="bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-32">
      <div className="max-w-[1680px] mx-auto">
        <h2
          className="px-6 text-[32px] md:text-[48px] leading-[1.15] font-medium text-white text-center mb-10 md:mb-16"
          data-tina-field={page ? tinaField(page, "sectionTitle") : undefined}
        >
          {sectionTitle}
        </h2>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={slider.ref}
          className="flex gap-14 overflow-x-auto snap-x snap-proximity pb-3 select-none casos-carousel px-6 md:px-[max(1.5rem,calc((100vw-880px)/2))]"
          style={{ cursor: hasItems ? "grab" : "default" }}
          {...slider.handlers}
        >
          {hasItems ? (
            items.map((item, i) => (
              <div
                key={i}
                className={`caso-slide snap-center shrink-0 w-full max-w-[880px] transition-opacity duration-300 ${
                  i === activeIndex ? "opacity-100" : "opacity-25"
                }`}
              >
                <CasoCard
                  caso={item as Caso}
                  tinaItem={page?.items?.[i]}
                  onPlay={() => setModalCaso(item as Caso)}
                />
              </div>
            ))
          ) : (
            <div className="caso-slide snap-center shrink-0 w-full max-w-[880px]">
              <div className="bg-white/[0.04] border border-white/10 h-[400px] flex items-center justify-center text-white/20 text-sm">
                Casos de éxito — próximamente
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Arrows: below the video, aligned to its left edge */}
      {items.length > 1 && (
        <div className="px-6 md:px-[max(1.5rem,calc((100vw-880px)/2))] mt-8">
          {arrowsPill}
        </div>
      )}

      <VideoModal caso={modalCaso} onClose={() => setModalCaso(null)} />

      <style>{`
        .casos-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .casos-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
