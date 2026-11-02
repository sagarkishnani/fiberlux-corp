import { useRef } from "react";
import { tinaField } from "tinacms/dist/react";
import { tField } from "../../utils/i18n";
import { clamp, prefersReducedMotion, useScrollFrame } from "../home/useScrollFrame";
import { useAbout, type AboutProps } from "./useAbout";

export default function NosotrosHistoriaReact(props: AboutProps) {
  const locale = props.locale || "es";
  const about = useAbout(props);
  const timeline = about?.timeline;
  const milestones = ((timeline?.milestones || []).filter(Boolean) as any[]);
  const lineRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useScrollFrame(() => {
    const line = lineRef.current;
    const fill = fillRef.current;
    if (!line || !fill) return;
    const reduced = prefersReducedMotion();
    const H = window.innerHeight;
    const center = H * 0.6;
    const rect = line.getBoundingClientRect();
    fill.style.height = `${reduced ? 100 : clamp((center - rect.top) / rect.height, 0, 1) * 100}%`;
    itemRefs.current.forEach((el) => {
      if (!el) return;
      const box = el.getBoundingClientRect();
      const on = reduced || box.top + box.height * 0.4 < center;
      el.style.opacity = on ? "1" : "0.28";
      el.style.transform = on ? "none" : "translateY(16px)";
    });
  });

  if (!timeline || !milestones.length) return null;

  return (
    <section className="relative z-[3] -mt-10 overflow-clip rounded-t-[24px] bg-[#3C0E30] text-white lg:rounded-t-[40px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_70%_0%,rgba(120,24,96,.55),rgba(60,14,48,0)_70%)]" />
      <div className="pointer-events-none absolute -top-[10%] left-[38%] h-[60%] w-[26%] origin-top rotate-[28deg] bg-[linear-gradient(90deg,rgba(150,33,122,0),rgba(170,45,140,.5)_50%,rgba(150,33,122,0))] blur-[40px]" />
      <div className="fx-container relative pb-[76px] pt-[59px] lg:pb-[180px] lg:pt-[140px]">
        <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="text-center">
          <div className="font-mono text-[13px] font-medium tracking-[.3em] text-[#B7A6B3]" data-tina-field={tinaField(timeline, "title")}>
            {tField(timeline, "title", locale)}
          </div>
          <h2
            className="mx-auto mb-0 mt-5 max-w-[760px] text-[34px] font-medium leading-[1.1] tracking-[-.025em] [text-wrap:balance] lg:text-[52px]"
            data-tina-field={tinaField(timeline, "heading")}
          >
            {tField(timeline, "heading", locale)}
          </h2>
        </div>
        <div ref={lineRef} className="relative mt-[60px] grid lg:mt-[100px] lg:grid-cols-[minmax(0,1fr)_160px_minmax(0,1fr)]">
          <div className="absolute bottom-0 left-2.5 top-0 -ml-px w-0.5 rounded-sm bg-white/[.12] lg:left-1/2" />
          <div
            ref={fillRef}
            className="absolute left-2.5 top-0 -ml-px h-0 w-0.5 rounded-sm bg-[linear-gradient(180deg,#F0509E,#C2349A_60%,#96217A)] shadow-[0_0_18px_2px_rgba(224,71,158,.45)] lg:left-1/2"
          />
          {milestones.map((m, i) => {
            const left = i % 2 === 0;
            return (
              <div
                key={i}
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                className={`py-7 pl-10 opacity-[.28] transition-[opacity,transform] duration-700 ease-fx-out lg:max-w-[460px] lg:py-20 lg:pl-0 ${
                  left ? "lg:col-start-1 lg:justify-self-end lg:text-right" : "lg:col-start-3 lg:justify-self-start"
                } ${i ? "lg:-mt-[120px]" : ""}`}
                style={{ gridRow: i + 1, transform: "translateY(16px)" }}
                data-tina-field={tinaField(m, "heading")}
              >
                <div className="text-[67px] font-semibold leading-[.95] tracking-[-.05em] text-white [font-variant-numeric:tabular-nums] lg:text-[112px]">
                  {m.year}
                </div>
                <p className="mb-0 mt-[26px] text-[18px] leading-[1.5] text-[#F3E6EF] [text-wrap:pretty] lg:text-[22px]">{tField(m, "heading", locale)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
