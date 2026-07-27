import { useState } from "react";
import { useTina } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";
import CasoCard, { type Caso } from "./CasoCard";
import VideoModal from "./VideoModal";
import { useSlider, type SliderEffect } from "../../hooks/useSlider";
import SliderArrows from "../shared/SliderArrows";

interface CasosSliderProps {
  query: string;
  variables: CasosDeExitoQueryVariables;
  data: CasosDeExitoQuery;
  autoplay?: boolean;
  intervalMs?: number;
  effect?: SliderEffect;
}

export default function CasosSliderReact({
  query,
  variables,
  data: initialData,
  autoplay = true,
  intervalMs = 6000,
  effect = "none",
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
    <section className="bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-32">
      {/* obs10: sin título "Casos de éxito" (redundante con el H1 del hero).
          El viewport va dentro de site-container (igual que el hero) para que la
          primera card quede alineada al título y la descripción. */}
      <div className="site-container">
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
              <div className="caso-slide shrink-0 w-full max-w-[880px]">
                <div className="bg-white/[0.04] border border-white/10 h-[400px] flex items-center justify-center text-white/20 text-sm">
                  Casos de éxito — próximamente
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Arrows: below the video, aligned to the card's left edge */}
        {items.length > 1 && <div className="mt-8">{arrowsPill}</div>}
      </div>

      <VideoModal caso={modalCaso} onClose={() => setModalCaso(null)} />

      <style>{`
        .casos-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .casos-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
