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

  /**
   * The `scrollLeft` value that aligns the FIRST slide (left edge, or centre).
   * Computed from live rects so it's independent of the offsetParent coordinate
   * space — `offsetLeft` is relative to the offsetParent, not the scroller, so it
   * can't be used directly. This value is invariant to the current scroll: as you
   * scroll, the slide's on-screen position shifts by exactly the scroll delta.
   */
  const measureBase = useCallback((): number => {
    const el = ref.current;
    const slides = getSlides();
    if (!el || !slides.length) return 0;
    const c = el.getBoundingClientRect();
    const s0 = slides[0].getBoundingClientRect();
    return align === "center"
      ? el.scrollLeft + (s0.left + s0.width / 2) - (c.left + c.width / 2)
      : el.scrollLeft + (s0.left - c.left) - paddingLeft();
  }, [align, getSlides, paddingLeft]);

  /** Fractional card index at a scroll position (equal-width, equal-gap slides). */
  const indexFloat = useCallback(
    (scrollLeft: number): number => {
      const step = measureStep();
      if (!step) return 0;
      return (scrollLeft - measureBase()) / step;
    },
    [measureBase, measureStep],
  );

  /** Index of the slide currently nearest the alignment point. */
  const nearestIndex = useCallback(
    (scrollLeft: number): number => {
      const slides = getSlides();
      if (!slides.length) return 0;
      return Math.min(Math.max(Math.round(indexFloat(scrollLeft)), 0), slides.length - 1);
    },
    [getSlides, indexFloat],
  );

  /** Absolute scrollLeft that lands card `i` at the alignment point (clamped). */
  const targetForIndex = useCallback(
    (i: number): number => {
      const el = ref.current;
      const slides = getSlides();
      if (!el || !slides.length) return 0;
      const step = measureStep();
      const clamped = Math.min(Math.max(i, 0), slides.length - 1);
      const max = el.scrollWidth - el.clientWidth;
      return Math.min(Math.max(measureBase() + clamped * step, 0), max);
    },
    [getSlides, measureBase, measureStep],
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
   * Animate to an absolute scroll position with a self-driven `requestAnimationFrame`
   * tween (easeOutCubic). We do NOT use native `scrollTo({behavior:"smooth"})`:
   * it is unreliable here — Lenis (global smooth scroll) leaves it inert, and CSS
   * `scroll-snap-type: mandatory` fights it in Chromium. Driving `scrollLeft`
   * ourselves works everywhere. Snap is disabled during the tween and restored on
   * the exact frame it lands (no fragile timeout).
   */
  const animId = useRef<number | null>(null);
  const cancelAnim = useCallback(() => {
    if (animId.current !== null) {
      cancelAnimationFrame(animId.current);
      animId.current = null;
    }
  }, []);

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const animateTo = useCallback(
    (left: number) => {
      const el = ref.current;
      if (!el) return;
      cancelAnim();
      const max = el.scrollWidth - el.clientWidth;
      const target = Math.min(Math.max(left, 0), max);
      el.style.scrollSnapType = "none";

      if (reduced) {
        el.scrollLeft = target;
        el.style.scrollSnapType = "";
        return;
      }

      const from = el.scrollLeft;
      const dist = target - from;
      if (Math.abs(dist) < 1) {
        el.style.scrollSnapType = "";
        return;
      }
      // Duration scales with distance: snappy for short hops, a longer glide for
      // multi-card flings on wide sliders.
      const duration = Math.min(750, Math.max(240, Math.abs(dist) * 0.5));
      let startTime: number | null = null;
      const frame = (now: number) => {
        const node = ref.current;
        if (!node) return;
        if (startTime === null) startTime = now;
        const p = Math.min(1, (now - startTime) / duration);
        node.scrollLeft = from + dist * easeOutCubic(p);
        if (p < 1) {
          animId.current = requestAnimationFrame(frame);
        } else {
          animId.current = null;
          node.style.scrollSnapType = "";
        }
      };
      animId.current = requestAnimationFrame(frame);
    },
    [reduced, cancelAnim],
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
    cancelAnim();
    isDragging.current = true;
    hasDragged.current = false;
    startX.current = e.pageX;
    lastX.current = e.pageX;
    velocity.current = 0;
    startScrollLeft.current = el.scrollLeft;
    el.style.cursor = "grabbing";
    el.style.scrollSnapType = "none";
  }, [stopMomentum, cancelAnim]);

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

    const v = velocity.current;

    // Slow/short release → deterministic one-card snap (return or advance one).
    if (!momentum || reduced || Math.abs(v) < minVelocity) {
      snapDirectional();
      return;
    }

    // Fling → project where free momentum WOULD land, pick that card, and glide
    // there in ONE eased tween. A single continuous motion (no momentum-loop →
    // snap-tween handoff) reads as much smoother, especially on wide cards.
    const step = measureStep();
    if (!step) {
      snapToNearest();
      return;
    }
    const projected = el.scrollLeft + v * (decay / (1 - decay));
    let target = Math.round(indexFloat(projected));
    // A decisive flick always advances at least one card in its direction.
    const cur = Math.round(indexFloat(el.scrollLeft));
    if (v > 0 && target <= cur) target = cur + 1;
    else if (v < 0 && target >= cur) target = cur - 1;
    goTo(target);
  }, [momentum, reduced, minVelocity, decay, measureStep, indexFloat, goTo, snapToNearest, snapDirectional]);

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
      cancelAnim();
    },
    [stopMomentum, cancelAnim],
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
