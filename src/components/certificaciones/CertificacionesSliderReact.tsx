import { useRef, useState, useCallback, useEffect } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type {
  CertificacionesQuery,
  CertificacionesQueryVariables,
} from "../../../tina/__generated__/types";
import CertCard, { type Cert } from "./CertCard";

interface CertSliderProps {
  query: string;
  variables: CertificacionesQueryVariables;
  data: CertificacionesQuery;
}

const GAP = 24; // px, matches gap-6

export default function CertificacionesSliderReact({
  query,
  variables,
  data: initialData,
}: CertSliderProps) {
  const { data } = useTina<CertificacionesQuery>({ query, variables, data: initialData });

  const page = data?.certificaciones;
  const sectionTitle = page?.sectionTitle || "Certificaciones del grupo Fiberlux";
  const items = (page?.items || []).filter(Boolean) as any[];

  const carouselRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* Step = one card width + gap (all cards are equal width). */
  const stepPx = () => {
    const el = carouselRef.current;
    const slide = el?.querySelector<HTMLElement>(".cert-slide");
    return slide ? slide.offsetWidth + GAP : 0;
  };

  /* ── Enable/disable arrows from scroll position ── */
  const updateEdges = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener("scroll", updateEdges, { passive: true });
    window.addEventListener("resize", updateEdges);
    return () => {
      el.removeEventListener("scroll", updateEdges);
      window.removeEventListener("resize", updateEdges);
    };
  }, [updateEdges, items.length]);

  /**
   * Animate to an absolute scroll position. CSS `scroll-snap-type: mandatory`
   * fights programmatic smooth scrolling in Chromium (it snaps back to the
   * origin mid-animation), so we disable snap for the duration of the animation
   * and restore it once we've landed on the (snap-aligned) target.
   */
  const snapTimer = useRef<number | null>(null);
  const animateTo = (left: number) => {
    const el = carouselRef.current;
    if (!el) return;
    if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    el.style.scrollSnapType = "none";
    el.scrollTo({ left, behavior: prefersReducedMotion ? "auto" : "smooth" });
    snapTimer.current = window.setTimeout(
      () => {
        if (carouselRef.current) carouselRef.current.style.scrollSnapType = "";
      },
      prefersReducedMotion ? 0 : 500,
    );
  };

  useEffect(() => () => {
    if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
  }, []);

  /* Scroll to a card index (clamped to the scrollable range). */
  const scrollToIndex = (i: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const step = stepPx();
    if (!step) return;
    const max = el.scrollWidth - el.clientWidth;
    animateTo(Math.min(Math.max(i, 0) * step, max));
  };

  /* ── Arrow navigation (one card at a time) ── */
  const scrollByCards = (dir: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const step = stepPx();
    if (!step) return;
    const current = el.scrollLeft / step;
    scrollToIndex(dir === "right" ? Math.round(current) + 1 : Math.round(current) - 1);
  };

  /* ── Drag to scroll (mouse) — direction-biased snap, no momentum ── */
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = carouselRef.current;
    if (!el) return;
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX;
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
  };

  const onMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = carouselRef.current;
    if (!el) return;
    el.style.cursor = "grab";
    // Snap is re-enabled by animateTo() once the settle animation completes.

    const step = stepPx();
    if (!step) return;
    const startIdx = Math.round(startScrollLeft.current / step);
    const moved = el.scrollLeft - startScrollLeft.current;
    // A deliberate drag (>15% of a card) advances one card in that direction;
    // a smaller nudge returns to where it started (no accidental half-steps).
    let target = startIdx;
    if (moved > step * 0.15) target = Math.ceil((startScrollLeft.current + moved) / step);
    else if (moved < -step * 0.15) target = Math.floor((startScrollLeft.current + moved) / step);
    scrollToIndex(target);
  };

  /* Swallow the click that follows a drag. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const hasItems = items.length > 0;

  /* ── Prev/Next pill ── */
  const arrowsPill = (
    <div className="inline-flex rounded-[12px] border-2 border-[#282445] bg-[#141223] overflow-hidden shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)]">
      <button
        type="button"
        onClick={() => scrollByCards("left")}
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
        onClick={() => scrollByCards("right")}
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
      ref={carouselRef}
      className="flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory py-2 select-none cert-carousel"
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
    <section className="bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <div className="site-container md:flex md:items-center md:gap-10 lg:gap-16">
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
        .cert-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .cert-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
