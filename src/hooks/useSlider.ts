import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

/**
 * Shared slider engine for the site's card carousels — Embla Carousel (SPEC 68).
 *
 * Replaces the previous hand-rolled `useDragSlider`. Every slider renders a
 * viewport (`overflow-hidden`, gets `viewportRef`) wrapping a flex container of
 * `.slide` children. This hook governs drag/swipe, arrows and autoplay, and
 * exposes an API close to the old one so components migrate with minimal churn.
 *
 * Autoplay: pauses on hover (`stopOnMouseEnter`) and while the user interacts,
 * resuming afterwards (`stopOnInteraction: false`), and is disabled entirely
 * when the user prefers reduced motion.
 */

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

export interface UseSliderOptions {
  /** Enable autoplay (still gated by prefers-reduced-motion). Default false. */
  autoplay?: boolean;
  /** Autoplay delay in ms. Default 5000. */
  intervalMs?: number;
  /** Infinite loop. Default true. */
  loop?: boolean;
  /** Where a slide lands. Default "start". */
  align?: "start" | "center";
  /** Slides advanced per step. Default 1. */
  slidesToScroll?: number | "auto";
  /** Free-scroll (no hard snap). Default false. */
  dragFree?: boolean;
  /** Turn the whole carousel on/off (e.g. per breakpoint). Default true. */
  active?: boolean;
}

export interface Slider {
  /** Callback ref for the viewport element (overflow-hidden wrapper). */
  viewportRef: (node: HTMLElement | null) => void;
  activeIndex: number;
  scrollSnaps: number[];
  canPrev: boolean;
  canNext: boolean;
  /** True while the carousel is moving (drag or animation); false once settled. */
  scrolling: boolean;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export function useSlider(opts: UseSliderOptions = {}): Slider {
  const {
    autoplay = false,
    intervalMs = 5000,
    loop = true,
    align = "start",
    slidesToScroll = 1,
    dragFree = false,
    active = true,
  } = opts;

  const prefersReduced = usePrefersReducedMotion();
  const doAutoplay = autoplay && !prefersReduced;

  const plugins = doAutoplay
    ? [
        Autoplay({
          delay: intervalMs,
          stopOnMouseEnter: true,
          stopOnInteraction: false,
          stopOnFocusIn: true,
          // Sin loop: al llegar al último slide el autoplay se detiene (no reinicia).
          stopOnLastSnap: true,
        }),
      ]
    : [];

  const [viewportRef, embla] = useEmblaCarousel(
    { loop, align, slidesToScroll, dragFree, active, containScroll: "trimSnaps" },
    plugins
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  const onSelect = useCallback(() => {
    if (!embla) return;
    setActiveIndex(embla.selectedScrollSnap());
    setCanPrev(embla.canScrollPrev());
    setCanNext(embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    const syncSnaps = () => setScrollSnaps(embla.scrollSnapList());
    const onScroll = () => setScrolling(true);
    const onSettle = () => setScrolling(false);
    syncSnaps();
    onSelect();
    embla.on("select", onSelect);
    embla.on("reInit", syncSnaps);
    embla.on("reInit", onSelect);
    embla.on("scroll", onScroll);
    embla.on("pointerDown", onScroll);
    embla.on("settle", onSettle);
    return () => {
      embla.off("select", onSelect);
      embla.off("reInit", syncSnaps);
      embla.off("reInit", onSelect);
      embla.off("scroll", onScroll);
      embla.off("pointerDown", onScroll);
      embla.off("settle", onSettle);
    };
  }, [embla, onSelect]);

  const next = useCallback(() => embla?.scrollNext(), [embla]);
  const prev = useCallback(() => embla?.scrollPrev(), [embla]);
  const goTo = useCallback((index: number) => embla?.scrollTo(index), [embla]);

  return { viewportRef, activeIndex, scrollSnaps, canPrev, canNext, scrolling, next, prev, goTo };
}
