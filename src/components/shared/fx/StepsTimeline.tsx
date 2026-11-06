import { useRef } from "react";
import { tinaField } from "tinacms/dist/react";
import type { Locale } from "../../../i18n/config";
import { tField } from "../../../utils/i18n";
import { clamp, isDesktop, prefersReducedMotion, useScrollFrame } from "../../home/useScrollFrame";

export default function StepsTimeline({ steps, locale }: { steps: any[]; locale: Locale }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);

  useScrollFrame(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const fill = fillRef.current;
    const head = headRef.current;
    const dots = dotRefs.current.filter(Boolean) as HTMLSpanElement[];
    if (!root || !track || !fill || !head || !dots.length) return;
    const H = window.innerHeight;
    const rect = root.getBoundingClientRect();
    const horizontal = isDesktop();
    const centers = dots.map((d) => {
      const b = d.getBoundingClientRect();
      return horizontal ? b.left + b.width / 2 - rect.left : b.top + b.height / 2 - rect.top;
    });
    const start = centers[0];
    const end = centers[centers.length - 1];
    const span = Math.max(1, end - start);
    const progress = horizontal
      ? (H * 0.82 - rect.top) / (H * 0.5)
      : (H * 0.5 - rect.top - start) / span;
    const p = prefersReducedMotion() ? 1 : clamp(progress, 0, 1);
    const pos = start + (end - start) * p;
    if (horizontal) {
      Object.assign(track.style, { left: `${start}px`, width: `${end - start}px`, top: "10px", height: "1px" });
      Object.assign(fill.style, { left: `${start}px`, width: `${pos - start}px`, top: "10px", height: "1px" });
      head.style.transform = `translate3d(${pos}px,0,0)`;
      head.style.left = "-8px";
      head.style.top = "3px";
    } else {
      Object.assign(track.style, { top: `${start}px`, height: `${end - start}px`, left: "10.5px", width: "1px" });
      Object.assign(fill.style, { top: `${start}px`, height: `${pos - start}px`, left: "10.5px", width: "1px" });
      head.style.transform = `translate3d(0,${pos}px,0)`;
      head.style.left = "3px";
      head.style.top = "-8px";
    }
    head.style.opacity = p > 0.995 ? "0" : "1";
    dots.forEach((dot, i) => {
      const on = centers[i] <= pos + 2;
      dot.style.background = on ? "#96217A" : "#FFFFFF";
      dot.style.borderColor = on ? "#96217A" : "#C9C3CA";
      dot.style.boxShadow = on ? "0 0 0 7px rgba(150,33,122,.14)" : "none";
      const col = colRefs.current[i];
      if (col) col.style.opacity = on ? "1" : "0.38";
    });
  });

  return (
    <div ref={rootRef} className="relative mt-[43px] lg:mt-[72px]">
      <div ref={trackRef} className="absolute bg-[#E6E3E6]" />
      <div ref={fillRef} className="absolute bg-fx-purple" />
      <div
        ref={headRef}
        className="absolute z-[2] h-4 w-4 rounded-full border-[3px] border-fx-purple bg-white shadow-[0_0_0_6px_rgba(150,33,122,.14),0_0_18px_4px_rgba(150,33,122,.35)] will-change-transform"
      />
      <div className="grid gap-[18px] lg:grid-cols-4 lg:gap-10">
        {steps.map((step, i) => (
          <div
            key={i}
            ref={(el) => {
              colRefs.current[i] = el;
            }}
            className="relative min-w-0 pl-11 opacity-[.38] transition-opacity duration-[600ms] ease-fx-out lg:pl-0"
            data-tina-field={tinaField(step, "title")}
          >
            <span
              ref={(el) => {
                dotRefs.current[i] = el;
              }}
              className="absolute left-0 top-1.5 block h-[22px] w-[22px] rounded-full border-[1.5px] border-[#C9C3CA] bg-white transition-[background,border-color,box-shadow] duration-[400ms] lg:static"
            />
            <h3 className="m-0 text-[22px] font-medium leading-[1.1] tracking-[-.03em] text-fx-ink [overflow-wrap:anywhere] [text-wrap:balance] lg:mt-14 lg:text-[34px]">
              {tField(step, "title", locale)}
            </h3>
            <p className="mb-0 mt-5 max-w-[290px] text-[16px] leading-[1.65] text-fx-body [text-wrap:pretty]">{tField(step, "text", locale)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
