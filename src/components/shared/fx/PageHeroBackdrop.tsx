import { useRef } from "react";
import { prefersReducedMotion, useScrollFrame } from "../../home/useScrollFrame";
import { fxAsset } from "./FxPrimitives";

export default function PageHeroBackdrop({ variant = "soft" }: { variant?: "full" | "soft" }) {
  const bgRef = useRef<HTMLDivElement>(null);
  const full = variant === "full";

  useScrollFrame(() => {
    if (!bgRef.current || prefersReducedMotion()) return;
    bgRef.current.style.transform = `translate3d(0,${Math.min(window.scrollY, 800) * 0.08}px,0)`;
  });

  return (
    <div
      ref={bgRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 -top-10 will-change-transform ${
        full ? "h-[1300px]" : "bottom-0 overflow-hidden [mask-image:linear-gradient(180deg,#000_55%,transparent_95%)]"
      }`}
    >
      <img
        src={fxAsset("nosotros/nosotros-gradient.webp")}
        alt=""
        className={`fx-drift absolute -left-[10%] top-0 h-auto w-[120%] max-w-none ${full ? "opacity-95" : "opacity-50"}`}
      />
    </div>
  );
}
