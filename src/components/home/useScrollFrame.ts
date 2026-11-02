import { useEffect } from "react";

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isDesktop(): boolean {
  return typeof window !== "undefined" && window.innerWidth >= 1024;
}

export function useScrollFrame(onFrame: () => void, deps: unknown[] = []) {
  useEffect(() => {
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        onFrame();
      });
    };
    onFrame();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, deps);
}
