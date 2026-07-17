import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared drag/scroll engine for the site's card sliders.
 *
 * Every slider is a horizontal `overflow-x-auto` container with CSS
 * `scroll-snap`. This hook governs the *feel* on top of that: mouse drag that
 * follows the pointer 1:1, inertia (momentum) on release, a clean settle onto a
 * card, and smooth arrow navigation — all sharing one implementation so the
 * five sliders behave identically.
 *
 * The DOM position is always driven through `scrollLeft` (never `transform`);
 * React state only tracks `activeIndex`/edges for the components' visuals.
 */

export interface DragSliderOptions {
  /** Selector for each slide, used to measure geometry. Default ".slide". */
  slideSelector?: string;
  /** Where a card lands when it snaps. Must match the slides' CSS snap-align. */
  align?: "start" | "center";
  /** Inertia on release. Default true. */
  momentum?: boolean;
  /** Velocity decay per frame during momentum. Default 0.92. */
  decay?: number;
  /** px/frame below which momentum stops and the slider settles. Default 0.6. */
  minVelocity?: number;
  /** Fraction of a card a slow drag must cover to advance one card. Default 0.15. */
  nudgeThreshold?: number;
  /** ms to keep CSS snap disabled while a programmatic animation runs. Default 500. */
  snapRestoreMs?: number;
  /** Re-measure when this changes (pass the item count). */
  itemCount?: number;
}

export interface DragSlider {
  ref: React.RefObject<HTMLDivElement | null>;
  activeIndex: number;
  atStart: boolean;
  atEnd: boolean;
  /** True between mousedown-with-movement and the following click (for swallowing it). */
  hasDragged: React.MutableRefObject<boolean>;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onClickCapture: (e: React.MouseEvent) => void;
  };
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
}

export function useDragSlider(options: DragSliderOptions = {}): DragSlider {
  const {
    slideSelector = ".slide",
    align = "start",
    momentum = true,
    decay = 0.92,
    minVelocity = 0.6,
    nudgeThreshold = 0.15,
    snapRestoreMs = 500,
    itemCount = 0,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  /* ── Geometry helpers ── */
  const getSlides = useCallback((): HTMLElement[] => {
    const el = ref.current;
    return el ? Array.from(el.querySelectorAll<HTMLElement>(slideSelector)) : [];
  }, [slideSelector]);

  const paddingLeft = useCallback((): number => {
    const el = ref.current;
    return el ? parseFloat(getComputedStyle(el).paddingLeft) || 0 : 0;
  }, []);

  /** One card + gap, measured from the first two real slides. */
  const measureStep = useCallback((): number => {
    const slides = getSlides();
    if (!slides.length) return 0;
    const first = slides[0];
    const second = slides[1];
    const gap = second ? second.offsetLeft - (first.offsetLeft + first.offsetWidth) : 0;
    return first.offsetWidth + Math.max(0, gap);
  }, [getSlides]);

  /** The content-space point a given scrollLeft aligns to (left edge or centre). */
  const scrollAlignPoint = useCallback(
    (scrollLeft: number): number => {
      const el = ref.current;
      if (!el) return 0;
      return align === "center" ? scrollLeft + el.clientWidth / 2 : scrollLeft + paddingLeft();
    },
    [align, paddingLeft],
  );

  const slideCoord = useCallback(
    (slide: HTMLElement): number =>
      align === "center" ? slide.offsetLeft + slide.offsetWidth / 2 : slide.offsetLeft,
    [align],
  );

  /** Index of the slide currently nearest the alignment point. */
  const nearestIndex = useCallback(
    (scrollLeft: number): number => {
      const el = ref.current;
      const slides = getSlides();
      if (!el || !slides.length) return 0;
      const p = scrollAlignPoint(scrollLeft);
      let best = 0;
      let min = Infinity;
      slides.forEach((s, i) => {
        const d = Math.abs(slideCoord(s) - p);
        if (d < min) {
          min = d;
          best = i;
        }
      });
      return best;
    },
    [getSlides, scrollAlignPoint, slideCoord],
  );

  /** Fractional card index at a scroll position (for direction-biased snap). */
  const indexFloat = useCallback(
    (scrollLeft: number): number => {
      const slides = getSlides();
      const step = measureStep();
      if (!slides.length || !step) return 0;
      return (scrollAlignPoint(scrollLeft) - slideCoord(slides[0])) / step;
    },
    [getSlides, measureStep, scrollAlignPoint, slideCoord],
  );

  /** Absolute scrollLeft that lands card `i` at the alignment point (clamped). */
  const targetForIndex = useCallback(
    (i: number): number => {
      const el = ref.current;
      const slides = getSlides();
      if (!el || !slides.length) return 0;
      const clamped = Math.min(Math.max(i, 0), slides.length - 1);
      const slide = slides[clamped];
      const max = el.scrollWidth - el.clientWidth;
      const target =
        align === "center"
          ? slide.offsetLeft + slide.offsetWidth / 2 - el.clientWidth / 2
          : slide.offsetLeft - paddingLeft();
      return Math.min(Math.max(target, 0), max);
    },
    [align, getSlides, paddingLeft],
  );

  /* ── Track active card + edges from scroll ── */
  const updateFromScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 1);
    setAtEnd(el.scrollLeft >= max - 1);
    const idx = nearestIndex(el.scrollLeft);
    setActiveIndex((prev) => (prev !== idx ? idx : prev));
  }, [nearestIndex]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateFromScroll();
    el.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll);
    return () => {
      el.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [updateFromScroll, itemCount]);

  /**
   * Animate to an absolute scroll position. CSS `scroll-snap-type: mandatory`
   * fights programmatic smooth scrolling in Chromium (it snaps back to the
   * origin mid-animation), so we disable snap for the animation and restore it
   * once we've landed on the (snap-aligned) target.
   */
  const snapTimer = useRef<number | null>(null);
  const animateTo = useCallback(
    (left: number) => {
      const el = ref.current;
      if (!el) return;
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
      el.style.scrollSnapType = "none";
      el.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
      snapTimer.current = window.setTimeout(
        () => {
          if (ref.current) ref.current.style.scrollSnapType = "";
        },
        reduced ? 0 : snapRestoreMs,
      );
    },
    [reduced, snapRestoreMs],
  );

  const goTo = useCallback(
    (index: number) => {
      animateTo(targetForIndex(index));
    },
    [animateTo, targetForIndex],
  );

  const next = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    goTo(nearestIndex(el.scrollLeft) + 1);
  }, [goTo, nearestIndex]);

  const prev = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    goTo(nearestIndex(el.scrollLeft) - 1);
  }, [goTo, nearestIndex]);

  /* ── Drag to scroll (mouse) ── */
  const isDragging = useRef(false);
  const hasDragged = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const lastX = useRef(0);
  const velocity = useRef(0);
  const momentumId = useRef<number | null>(null);

  const stopMomentum = useCallback(() => {
    if (momentumId.current !== null) {
      cancelAnimationFrame(momentumId.current);
      momentumId.current = null;
    }
  }, []);

  /** Ease onto the nearest card, then restore CSS snap. */
  const snapToNearest = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    goTo(nearestIndex(el.scrollLeft));
  }, [goTo, nearestIndex]);

  /**
   * Direction-biased snap for slow/short drags: a deliberate drag (> nudge
   * threshold of a card) rounds outward in the drag direction; a smaller nudge
   * returns to the card it started on (no accidental half-steps).
   */
  const snapDirectional = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const step = measureStep();
    if (!step) {
      snapToNearest();
      return;
    }
    const moved = el.scrollLeft - startScrollLeft.current;
    const endF = indexFloat(el.scrollLeft);
    let target = Math.round(indexFloat(startScrollLeft.current));
    if (moved > step * nudgeThreshold) target = Math.ceil(endF);
    else if (moved < -step * nudgeThreshold) target = Math.floor(endF);
    goTo(target);
  }, [goTo, indexFloat, measureStep, nudgeThreshold, snapToNearest]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    const el = ref.current;
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
  }, [stopMomentum]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = ref.current;
    if (!el) return;
    const dx = e.pageX - startX.current;
    if (Math.abs(dx) > 5) hasDragged.current = true;
    el.scrollLeft = startScrollLeft.current - dx;
    // Low-pass filtered velocity (px/frame) → smooth release momentum.
    velocity.current = 0.8 * velocity.current + 0.2 * (lastX.current - e.pageX);
    lastX.current = e.pageX;
  }, []);

  const onMouseUp = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const el = ref.current;
    if (!el) return;
    el.style.cursor = "grab";

    // Slow/short release → deterministic one-card snap.
    if (!momentum || reduced || Math.abs(velocity.current) < minVelocity) {
      snapDirectional();
      return;
    }

    // Fast flick → inertia, then settle on the nearest card.
    const stepFrame = () => {
      const node = ref.current;
      if (!node) return;
      node.scrollLeft += velocity.current;
      velocity.current *= decay;
      if (Math.abs(velocity.current) < minVelocity) {
        momentumId.current = null;
        snapToNearest();
        return;
      }
      momentumId.current = requestAnimationFrame(stepFrame);
    };
    momentumId.current = requestAnimationFrame(stepFrame);
  }, [momentum, reduced, minVelocity, decay, snapDirectional, snapToNearest]);

  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasDragged.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  /* ── Cleanup ── */
  useEffect(
    () => () => {
      stopMomentum();
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    },
    [stopMomentum],
  );

  return {
    ref,
    activeIndex,
    atStart,
    atEnd,
    hasDragged,
    handlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp, onClickCapture },
    next,
    prev,
    goTo,
  };
}
