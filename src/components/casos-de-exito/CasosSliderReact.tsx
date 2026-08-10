import { useState } from "react";
import { useTina } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";
import CasoCard, { type Caso } from "./CasoCard";
import VideoModal from "./VideoModal";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import type { Locale } from "../../i18n/config";
import SliderArrows from "../shared/SliderArrows";
import SliderSideArrows from "../shared/SliderSideArrows";

interface CasosSliderProps {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
  locale?: Locale;
}

export default function CasosSliderReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
  locale = "es",
}: CasosSliderProps) {
  const { data } = useTina<CasosDeExitoQuery>({ query, variables, data: initialData });

  const page = data?.casosDeExito;
  const items = (page?.items || []).filter(Boolean) as any[];

  const [modalCaso, setModalCaso] = useState<Caso | null>(null);

  const enough = items.length > 1;

  /* Embla slider: left-aligned cards (obs10), one per arrow, autoplay w/ loop. */
  const slider = useSlider({
    align: "start",
    loop: false,
    autoplay: autoplay && enough,
    intervalMs,
    effect,
  });
  const { activeIndex } = slider;

  const hasItems = items.length > 0;

  const arrowsPill = (
    <SliderArrows
      canPrev={slider.canPrev}
      canNext={slider.canNext}
      onPrev={slider.prev}
      onNext={slider.next}
    />
  );

  return (
    <section className="bg-greyscale-darkest pt-2 pb-20 md:pt-4 md:pb-32">
      {/* obs10: sin título "Casos de éxito" (redundante con el H1 del hero).
          El viewport va dentro de site-container (igual que el hero) para que la
          primera card quede alineada al título y la descripción. */}
      <div className="site-container">
        {/* Móvil: una flecha a cada lado del video (centradas verticalmente),
            como un carrusel clásico. La card es alta y, con las flechas
            arriba/abajo, el usuario no notaba que podía moverse; a los lados del
            video quedan a la vista justo donde está mirando. Desktop: debajo. */}
        <div className="relative">
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Anterior"
                onClick={slider.prev}
                className="md:hidden absolute left-3 top-[148px] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#96237A] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#650F50] active:bg-[#650F50]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={slider.next}
                className="md:hidden absolute right-3 top-[148px] -translate-y-1/2 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-[#96237A] text-white shadow-[0_8px_24px_-6px_rgba(0,0,0,0.7)] transition-colors hover:bg-[#650F50] active:bg-[#650F50]"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          <div
            ref={slider.viewportRef}
            className="overflow-hidden pt-2 pb-3 select-none casos-carousel"
            style={{ cursor: hasItems ? "grab" : "default" }}
          >
          <div className="flex gap-14">
            {hasItems ? (
              items.map((item, i) => (
                <div
                  key={i}
                  className={`caso-slide shrink-0 w-full max-w-[880px] transition-opacity duration-300 ${
                    i === activeIndex ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <CasoCard
                    caso={item as Caso}
                    locale={locale}
                    tinaItem={page?.items?.[i]}
                    onPlay={() => setModalCaso(item as Caso)}
                  />
                </div>
              ))
            ) : (
              <div className="caso-slide shrink-0 w-full max-w-[880px]">
                <div className="bg-white/[0.04] border border-white/10 h-[400px] flex items-center justify-center text-white/20 text-sm">
                  Casos de éxito — próximamente
                </div>
              </div>
            )}
          </div>
          </div>

          {/* Desktop (lg+): flechas laterales superpuestas (SPEC 94) */}
          {items.length > 1 && (
            <SliderSideArrows
              canPrev={slider.canPrev}
              canNext={slider.canNext}
              onPrev={slider.prev}
              onNext={slider.next}
            />
          )}
        </div>

        {/* Arrows: below the video (tablet md–lg); en lg+ se usan las laterales */}
        {items.length > 1 && <div className="hidden md:block lg:hidden mt-8">{arrowsPill}</div>}

        {/* Dots: indicador de progreso interactivo, centrado bajo el slider.
            El dot activo se alarga (px) y toma el magenta de marca; clic navega. */}
        {slider.scrollSnaps.length > 1 && (
          <div className="mt-8 flex justify-center gap-2.5" role="tablist" aria-label="Casos de éxito">
            {slider.scrollSnaps.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-label={`Ir al caso ${i + 1}`}
                aria-selected={i === activeIndex}
                onClick={() => slider.goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex
                    ? "w-6 bg-[#96237A]"
                    : "w-2 bg-white/25 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      <VideoModal caso={modalCaso} onClose={() => setModalCaso(null)} />

      <style>{`
        .casos-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .casos-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
