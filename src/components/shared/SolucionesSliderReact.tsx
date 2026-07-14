import { useRef, useState, useCallback, useEffect } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery } from "../../../tina/__generated__/types";

/* ── Props ── */
interface SolucionesSliderProps {
  query: string;
  variables: { relativePath: string };
  data: HomeQuery;
}

const GAP = 24; // px, matches gap-6
const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

/* Prefixes the CMS media path with BASE_URL so it resolves under a subpath deploy. */
function resolveIcon(icon?: string | null): string | null {
  if (!icon) return null;
  if (/^https?:\/\//.test(icon)) return icon;
  return `${BASE}${icon.startsWith("/") ? "" : "/"}${icon}`;
}

/* A bullet that just signals "there's more" — rendered as the muted label, not a line. */
const isMoreLabel = (b: string) => /^y\s*m[aá]s/i.test(b.trim());

export default function SolucionesSliderReact({
  query,
  variables,
  data: initialData,
}: SolucionesSliderProps) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });

  const services = data?.home?.services || initialData?.home?.services;
  const items = (services?.items || []).filter(Boolean) as NonNullable<
    NonNullable<typeof services>["items"]
  >;

  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* Step = one card width + gap (all cards are equal width). */
  const stepPx = () => {
    const el = carouselRef.current;
    const slide = el?.querySelector<HTMLElement>(".sol-slide");
    return slide ? slide.offsetWidth + GAP : 0;
  };

  /* ── Track active card + edges from scroll position ── */
  const updateFromScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
    const step = stepPx();
    if (step) {
      const idx = Math.round(el.scrollLeft / step);
      setActiveIndex((prev) => (prev !== idx ? idx : prev));
    }
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;
    updateFromScroll();
    el.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    return () => {
      el.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [updateFromScroll, items.length]);

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

  useEffect(
    () => () => {
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    },
    [],
  );

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
  if (!hasItems) return null;

  const active = items[Math.min(activeIndex, items.length - 1)];
  const activeTina = services?.items?.[Math.min(activeIndex, items.length - 1)];

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

  /* ── A single solution card ── */
  const renderCard = (item: (typeof items)[number], i: number) => {
    const tinaItem = services?.items?.[i];
    const bullets = (item?.bullets || []).filter(Boolean) as string[];
    const lines = bullets.filter((b) => !isMoreLabel(b));
    const onda = resolveIcon(item?.icon);
    const url = item?.url || "";

    return (
      <div className="relative flex h-full min-h-[420px] md:min-h-[520px] flex-col overflow-hidden rounded-[20px] border border-white/[0.06] bg-[#15131B] px-8 py-9 md:px-10 md:py-10">
        {/* Decorative magenta wave (from the CMS `icon`, per-card editable) */}
        {onda && (
          <img
            src={onda}
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover opacity-70"
            draggable={false}
          />
        )}

        {/* Content sits above the wave */}
        <div className="relative z-10 flex h-full flex-col">
          <ul
            className="space-y-1.5"
            data-tina-field={tinaItem ? tinaField(tinaItem, "bullets") : undefined}
          >
            {lines.map((line, bIdx) => (
              <li key={bIdx} className="text-[16px] leading-[1.5] text-white/85">
                {line}
              </li>
            ))}
          </ul>

          <p className="mt-6 text-[16px] text-white/45">Y más…</p>

          {url && (
            <a
              href={`${BASE}${url.startsWith("/") ? "" : "/"}${url}`}
              className="mt-6 inline-flex w-fit items-center text-[16px] font-medium text-[#d885c4] transition-colors hover:text-white"
              data-tina-field={tinaItem ? tinaField(tinaItem, "url") : undefined}
            >
              Conoce más
            </a>
          )}

          {/* Big number, anchored bottom-left */}
          <span
            className="mt-auto pt-10 text-[56px] md:text-[64px] font-semibold leading-none text-white/20"
            data-tina-field={tinaItem ? tinaField(tinaItem, "number") : undefined}
          >
            {item?.number}
          </span>
        </div>
      </div>
    );
  };

  /* ── Carousel viewport: shows ~1 card + peek of the next ── */
  const carousel = (
    <div
      ref={carouselRef}
      className="flex items-stretch gap-6 overflow-x-auto snap-x snap-mandatory py-2 select-none sol-carousel"
      style={{ cursor: "grab" }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onClickCapture={onClickCapture}
    >
      {items.map((item, i) => (
        <div
          key={i}
          className="sol-slide snap-start shrink-0 w-[86%] md:w-[68%] transition-opacity duration-500 ease-out"
          style={{ opacity: i === activeIndex ? 1 : 0.35 }}
        >
          {renderCard(item, i)}
        </div>
      ))}
    </div>
  );

  return (
    <section className="bg-greyscale-darkest pt-14 pb-20 md:pt-20 md:pb-28 overflow-hidden">
      <div className="site-container md:flex md:items-center md:gap-10 lg:gap-16">
        {/* Left column: active-solution title + description + arrows (desktop) */}
        <div className="md:w-[38%] md:shrink-0">
          <h2
            key={`t-${activeIndex}`}
            className="sol-fade text-[34px] md:text-[52px] leading-[1.05] font-semibold text-white max-w-[14ch]"
            data-tina-field={activeTina ? tinaField(activeTina, "title") : undefined}
          >
            {active?.title}
          </h2>
          {active?.description && (
            <p
              key={`d-${activeIndex}`}
              className="sol-fade mt-5 text-[16px] md:text-[18px] leading-relaxed text-white/60 max-w-[32ch]"
              data-tina-field={activeTina ? tinaField(activeTina, "description") : undefined}
            >
              {active.description}
            </p>
          )}
          {items.length > 1 && <div className="hidden md:block mt-9">{arrowsPill}</div>}
        </div>

        {/* Right column: carousel */}
        <div className="md:flex-1 md:min-w-0 mt-8 md:mt-0">{carousel}</div>

        {/* Mobile arrows: below the carousel, left-aligned */}
        {items.length > 1 && <div className="md:hidden mt-8">{arrowsPill}</div>}
      </div>

      <style>{`
        .sol-carousel { scrollbar-width: none; -ms-overflow-style: none; -webkit-overflow-scrolling: touch; }
        .sol-carousel::-webkit-scrollbar { display: none; }
        @keyframes sol-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .sol-fade { animation: sol-fade-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @media (prefers-reduced-motion: reduce) { .sol-fade { animation: none; } }
      `}</style>
    </section>
  );
}
