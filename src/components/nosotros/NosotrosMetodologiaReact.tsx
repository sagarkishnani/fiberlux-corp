import { useRef } from "react";
import { tinaField } from "tinacms/dist/react";
import { tField, localizeHref } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow, PillLink } from "../shared/fx/FxPrimitives";
import { clamp, isDesktop, prefersReducedMotion, useScrollFrame } from "../home/useScrollFrame";
import { useAbout, type AboutProps } from "./useAbout";

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;
const SHIELD_PATH = "M100 8 L176 36 V104 C176 158 140 196 100 214 C60 196 24 158 24 104 V36 Z";
const SHIELD_BACK_LAYERS = Array.from({ length: 16 }, (_, i) => -27.2 + i * 1.6);

function StepsTimeline({ steps, locale }: { steps: any[]; locale: "es" | "en" }) {
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
    const p = prefersReducedMotion() ? 1 : clamp((H * 0.82 - rect.top) / (H * 0.5), 0, 1);
    const horizontal = isDesktop();
    const centers = dots.map((d) => {
      const b = d.getBoundingClientRect();
      return horizontal ? b.left + b.width / 2 - rect.left : b.top + b.height / 2 - rect.top;
    });
    const start = centers[0];
    const end = centers[centers.length - 1];
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

function Shield3D() {
  return (
    <div aria-hidden="true" className="relative h-[333px] w-[300px] [perspective:1400px]">
      <div className="fx-shadow-pulse absolute inset-x-[10%] -bottom-[14%] h-[14%] rounded-full bg-[radial-gradient(closest-side,rgba(101,13,74,.32),rgba(101,13,74,0))]" />
      <div className="fx-shield absolute inset-0">
        {SHIELD_BACK_LAYERS.map((z) => (
          <svg key={z} viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${z}px)` }}>
            <path d={SHIELD_PATH} fill="#650D4A" opacity="0.92" />
          </svg>
        ))}
        {[-1.6, 0].map((z) => (
          <svg key={z} viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: `translateZ(${z}px)` }}>
            <path d={SHIELD_PATH} fill="#B2308F" />
          </svg>
        ))}
        <svg viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: "translateZ(1px)" }}>
          <defs>
            <linearGradient id="fxShieldFace" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#E0479E" />
              <stop offset=".5" stopColor="#96217A" />
              <stop offset="1" stopColor="#650D4A" />
            </linearGradient>
            <linearGradient id="fxShieldShine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#FFFFFF" stopOpacity=".55" />
              <stop offset=".5" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={SHIELD_PATH} fill="url(#fxShieldFace)" />
          <path d="M100 22 L164 46 V104 C164 150 134 184 100 200 C66 184 36 150 36 104 V46 Z" fill="none" stroke="#FFFFFF" strokeOpacity=".35" strokeWidth="2" />
          <path d="M100 8 L176 36 V96 C130 80 70 80 24 96 V36 Z" fill="url(#fxShieldShine)" />
        </svg>
        <svg viewBox="0 0 200 222" className="absolute inset-0 h-full w-full" style={{ transform: "translateZ(22px)" }}>
          <path d="M70 112 L92 134 L134 90" fill="none" stroke="#FFFFFF" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

export default function NosotrosMetodologiaReact(props: AboutProps) {
  const locale = props.locale || "es";
  const about = useAbout(props);
  const metodologia = about?.metodologia;
  const ciber = about?.ciberseguridad;
  const steps = ((metodologia?.steps || []).filter(Boolean) as any[]);
  const tags = ((ciber?.tags || []).filter(Boolean) as any[]);

  return (
    <>
      {metodologia && (
        <section className="fx-container relative mt-24 pb-[76px] lg:mt-40 lg:pb-[180px]">
          <div data-reveal="up" {...REVEAL} className="flex flex-col items-start gap-[29px] lg:flex-row lg:items-end lg:justify-between lg:gap-16">
            <div>
              <Eyebrow className="!text-[13px]">{tField(metodologia, "eyebrow", locale)}</Eyebrow>
              <h2
                className="mb-0 mt-[18px] max-w-[640px] text-[34px] font-medium leading-[1.08] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[52px]"
                data-tina-field={tinaField(metodologia, "title")}
              >
                {renderEmphasis(tField(metodologia, "title", locale))}
              </h2>
            </div>
            <p className="m-0 max-w-[420px] text-[17px] leading-[1.6] text-fx-body [text-wrap:pretty]" data-tina-field={tinaField(metodologia, "text")}>
              {tField(metodologia, "text", locale)}
            </p>
          </div>
          <StepsTimeline steps={steps} locale={locale} />
        </section>
      )}

      {ciber && (
        <section className="relative z-[2] overflow-clip rounded-t-[24px] bg-white pb-[84px] pt-[50px] lg:rounded-t-[40px] lg:pb-[200px] lg:pt-[120px]">
          <div className="fx-container grid items-center gap-9 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-20">
            <div data-reveal="up" {...REVEAL}>
              <Eyebrow className="!text-[13px]">{tField(ciber, "eyebrow", locale)}</Eyebrow>
              <h2
                className="mb-0 mt-[18px] text-[34px] font-medium leading-[1.08] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[52px]"
                data-tina-field={tinaField(ciber, "title")}
              >
                {renderEmphasis(tField(ciber, "title", locale))}
              </h2>
              <p className="mb-0 mt-7 max-w-[560px] text-[17px] leading-[1.7] text-fx-body [text-wrap:pretty]" data-tina-field={tinaField(ciber, "text")}>
                {tField(ciber, "text", locale)}
              </p>
              {tags.length > 0 && (
                <div className="mt-8 flex flex-wrap gap-2.5">
                  {tags.map((tag, i) => (
                    <span key={i} className="rounded-full bg-[#FAF0F6] px-[18px] py-2.5 text-[14px] font-medium text-fx-purple-deep" data-tina-field={tinaField(tag, "label")}>
                      {tField(tag, "label", locale)}
                    </span>
                  ))}
                </div>
              )}
              {ciber.cta?.label && (
                <div className="mt-10 flex">
                  <PillLink
                    href={localizeHref(ciber.cta.href, locale)}
                    iconSide="left"
                    size="lg"
                    className="!pr-5 lg:!pr-7"
                    data-tina-field={tinaField(ciber.cta, "label")}
                  >
                    {tField(ciber.cta, "label", locale)}
                  </PillLink>
                </div>
              )}
            </div>
            <div data-reveal="scale" data-reveal-duration="1.2" data-reveal-ease="fx" className="relative grid h-[322px] place-items-center lg:h-[520px]">
              <div className="pointer-events-none absolute h-[520px] w-[520px] bg-[radial-gradient(closest-side,rgba(150,33,122,.24),rgba(213,167,202,.12)_55%,rgba(255,255,255,0))]" />
              <Shield3D />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
