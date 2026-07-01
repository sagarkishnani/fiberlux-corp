import { useRef, useState, useCallback, useEffect } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CasosDeExitoQuery,
  CasosDeExitoQueryVariables,
} from "../../../tina/__generated__/types";
import CasoCard, { type Caso } from "./CasoCard";
import VideoModal from "./VideoModal";

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

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [modalCaso, setModalCaso] = useState<Caso | null>(null);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < items.length - 1;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* ── Track active slide ── */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = Array.from(el.querySelectorAll<HTMLElement>(".caso-slide"));
      if (!children.length) return;
      let closest = 0;
      let minDist = Infinity;
      children.forEach((child, i) => {
        const center = child.offsetLeft + child.offsetWidth / 2;
        const dist = Math.abs(center - el.scrollLeft - el.offsetWidth / 2);
        if (dist < minDist) {
          minDist = dist;
          closest = i;
        }
      });
      setActiveIndex(closest);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  /* ── Drag to scroll (with momentum + smooth snap) ── */
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const momentumId = useRef<number | null>(null);

  const stopMomentum = () => {
    if (momentumId.current !== null) {
      cancelAnimationFrame(momentumId.current);
      momentumId.current = null;
    }
  };

  /* Ease onto the slide nearest the viewport centre, then restore CSS snap. */
  const snapToNearest = () => {
    const el = carouselRef.current;
    if (!el) return;
    const children = Array.from(el.querySelectorAll<HTMLElement>(".caso-slide"));
    if (!children.length) return;
    const targetCenter = el.scrollLeft + el.offsetWidth / 2;
    let nearest = children[0];
    let minDist = Infinity;
    children.forEach((child) => {
      const center = child.offsetLeft + child.offsetWidth / 2;
      const dist = Math.abs(center - targetCenter);
      if (dist < minDist) {
        minDist = dist;
        nearest = child;
      }
    });
    const left = nearest.offsetLeft + nearest.offsetWidth / 2 - el.offsetWidth / 2;
    el.scrollTo({ left, behavior: prefersReducedMotion ? "auto" : "smooth" });
    // Re-enable CSS snap only after the smooth settle, so it doesn't jump-cut the animation.
    window.setTimeout(
      () => {
        const n = carouselRef.current;
        if (n) n.style.scrollSnapType = "";
      },
      prefersReducedMotion ? 0 : 450,
    );
  };

  useEffect(() => () => stopMomentum(), []);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    stopMomentum();
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX;
    lastX.current = e.pageX;
    velocity.current = 0;
    startScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = carouselRef.current;
    if (!el) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 5) hasDragged.current = true;
    el.scrollLeft = startScrollLeft.current - dx;
    // Low-pass filtered velocity (px/frame) → smooth release momentum.
    velocity.current = 0.8 * velocity.current + 0.2 * (lastX.current - e.pageX);
    lastX.current = e.pageX;
  };

  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = carouselRef.current;
    if (!el) return;
    el.style.cursor = "grab";

    if (prefersReducedMotion || Math.abs(velocity.current) < 0.6) {
      snapToNearest();
      return;
    }

    const decay = 0.92;
    const step = () => {
      const node = carouselRef.current;
      if (!node) return;
      node.scrollLeft += velocity.current;
      velocity.current *= decay;
      if (Math.abs(velocity.current) < 0.6) {
        momentumId.current = null;
        snapToNearest();
        return;
      }
      momentumId.current = requestAnimationFrame(step);
    };
    momentumId.current = requestAnimationFrame(step);
  };

  /* Cancel the click that follows a drag so it doesn't open the modal. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  /* ── Arrow scroll ── */
  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>(".caso-slide");
    if (!slide) return;
    const gap = 56;
    el.scrollBy({
      left: direction === "right" ? slide.offsetWidth + gap : -(slide.offsetWidth + gap),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const hasItems = items.length > 0;

  /* ── Prev/Next pill (shared desktop overlay + mobile) ── */
  const arrowsPill = (
    <div className="inline-flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        onClick={() => scroll("left")}
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
        onClick={() => scroll("right")}
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
    <section className="bg-greyscale-darkest pt-20 pb-32">
      <div className="max-w-[1440px] mx-auto">
        <h2
          className="text-[32px] md:text-[48px] leading-[1.15] font-medium text-white text-center mb-16"
          data-tina-field={page ? tinaField(page, "sectionTitle") : undefined}
        >
          {sectionTitle}
        </h2>
      </div>

      {/* Carousel */}
      <div className="relative">
        <div
          ref={carouselRef}
          className="flex gap-14 overflow-x-auto snap-x snap-mandatory pb-3 select-none casos-carousel px-6 md:px-[max(1.5rem,calc((100vw-880px)/2))]"
          style={{ cursor: hasItems ? "grab" : "default" }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onClickCapture={onClickCapture}
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
