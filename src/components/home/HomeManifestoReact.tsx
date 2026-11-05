import { useRef } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { fxAsset } from "../shared/fx/FxPrimitives";
import { clamp, easeOutCubic, isDesktop, prefersReducedMotion, useScrollFrame } from "./useScrollFrame";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
}

export default function HomeManifestoReact({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const manifesto = data?.home?.manifesto || initialData?.home?.manifesto;
  const sectionRef = useRef<HTMLElement>(null);
  const leftRef = useRef<HTMLImageElement>(null);
  const rightRef = useRef<HTMLImageElement>(null);

  useScrollFrame(() => {
    const section = sectionRef.current;
    if (!section || !leftRef.current || !rightRef.current) return;
    if (prefersReducedMotion()) {
      leftRef.current.style.transform = rightRef.current.style.transform = "none";
      return;
    }
    const H = window.innerHeight;
    const rect = section.getBoundingClientRect();
    const center = rect.top + rect.height * 0.55 - H / 2;
    const desktop = isDesktop();
    const p = easeOutCubic(clamp(1 - center / (H * (desktop ? 0.75 : 0.7)), 0, 1));
    const offset = (1 - p) * (desktop ? window.innerWidth * 0.2 : 90);
    leftRef.current.style.transform = `translate3d(${-offset}px,0,0)`;
    rightRef.current.style.transform = `translate3d(${offset}px,0,0)`;
  });

  if (!manifesto) return null;

  return (
    <section ref={sectionRef} className="relative pt-[88px] lg:pt-[60px]">
      <div data-reveal="up" data-reveal-distance="56" data-reveal-duration="1.2" data-reveal-ease="fx" className="fx-container relative z-[2] text-center">
        <div
          className="font-mono text-[12px] font-medium tracking-[.3em] text-fx-ink lg:text-[14px] lg:tracking-[.4em]"
          data-tina-field={tinaField(manifesto as any, "eyebrow")}
        >
          {tField(manifesto, "eyebrow", locale)}
        </div>
        <h2
          className="mx-auto mb-0 mt-4 max-w-[820px] text-[30px] font-normal leading-[1.15] tracking-[-.02em] text-fx-ink [text-wrap:balance] lg:mt-[22px] lg:text-[48px]"
          data-tina-field={tinaField(manifesto as any, "title")}
        >
          {renderEmphasis(tField(manifesto, "title", locale))}
        </h2>
      </div>
      <div className="overflow-x-clip">
        <div className="relative -ml-[85px] mt-6 aspect-[100/31] w-[560px] lg:ml-0 lg:mt-8 lg:w-full lg:blur-[1.6px]">
          <img
            ref={leftRef}
            src={fxAsset("hand-left.png")}
            alt=""
            loading="lazy"
            className="absolute -left-[1%] top-0 h-auto w-[52%] will-change-transform"
          />
          <img
            ref={rightRef}
            src={fxAsset("hand-right.png")}
            alt=""
            loading="lazy"
            className="absolute left-[48.3%] top-0 -mt-[2.9%] h-auto w-[52%] will-change-transform"
          />
        </div>
      </div>
    </section>
  );
}
