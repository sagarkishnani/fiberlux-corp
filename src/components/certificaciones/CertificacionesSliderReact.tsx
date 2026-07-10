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
  const [activeIndex, setActiveIndex] = useState(0);

  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < items.length - 1;

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* ── Track active (centered) slide ── */
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    const onScroll = () => {
      const children = Array.from(el.querySelectorAll<HTMLElement>(".cert-slide"));
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
    const children = Array.from(el.querySelectorAll<HTMLElement>(".cert-slide"));
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

  /* Swallow the click that follows a drag. */
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  /* ── Arrow scroll (one card + gap) ── */
  const scroll = (direction: "left" | "right") => {
    const el = carouselRef.current;
    if (!el) return;
    const slide = el.querySelector<HTMLElement>(".cert-slide");
    if (!slide) return;
    const gap = 24;
    el.scrollBy({
      left: direction === "right" ? slide.offsetWidth + gap : -(slide.offsetWidth + gap),
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const hasItems = items.length > 0;

  /* ── Prev/Next pill ── */
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
    <section className="bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      {/* Header: title left, arrows right */}
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 flex items-end justify-between gap-6 mb-10 md:mb-14">
        <h2
          className="text-[32px] md:text-[48px] leading-[1.1] font-semibold text-white max-w-[16ch]"
          data-tina-field={page ? tinaField(page, "sectionTitle") : undefined}
        >
          {sectionTitle}
        </h2>
        {items.length > 1 && <div className="shrink-0">{arrowsPill}</div>}
      </div>

      {/* Carousel */}
      <div
        ref={carouselRef}
        className="flex items-center gap-6 overflow-x-auto snap-x snap-mandatory py-8 select-none cert-carousel px-6 md:px-[max(1.5rem,calc((100vw-340px)/2))]"
        style={{ cursor: hasItems ? "grab" : "default" }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClickCapture={onClickCapture}
      >
        {hasItems ? (
          items.map((item, i) => {
            const active = i === activeIndex;
            return (
              <div
                key={i}
                className={`cert-slide snap-center shrink-0 w-[300px] md:w-[340px] transition-all duration-300 ${
                  active ? "scale-100 opacity-100" : "scale-[0.9] opacity-60"
                }`}
              >
                <div
                  className={`h-full rounded-[26px] transition-shadow duration-300 ${
                    active ? "shadow-[0_30px_80px_-24px_rgba(150,35,122,0.55)]" : ""
                  }`}
                >
                  <CertCard cert={item as Cert} tinaItem={page?.items?.[i]} />
                </div>
              </div>
            );
          })
        ) : (
          <div className="cert-slide snap-center shrink-0 w-[300px] md:w-[340px]">
            <div className="bg-white/[0.04] border border-white/10 min-h-[440px] rounded-[26px] flex items-center justify-center text-white/20 text-sm">
              Certificaciones — próximamente
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cert-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .cert-carousel::-webkit-scrollbar { display: none; }
      `}</style>
    </section>
  );
}
