import { tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import { richField, tField } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { useAbout, type AboutProps } from "./useAbout";

export default function NosotrosSgsiReact(props: AboutProps) {
  const locale = props.locale || "es";
  const about = useAbout(props);
  const sgsi = about?.sgsi;
  if (!sgsi) return null;
  const items = ((sgsi.items || []).filter(Boolean) as any[]);
  const intro = richField(sgsi, "intro", locale);

  return (
    <section className="relative z-[6] -mt-10 rounded-t-[24px] bg-fx-bg pb-[67px] pt-[50px] lg:rounded-t-[40px] lg:pb-40 lg:pt-[120px]">
      <div
        data-reveal="up"
        data-reveal-distance="56"
        data-reveal-duration="1.2"
        data-reveal-ease="fx"
        className="fx-container grid gap-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20"
      >
        <div>
          <div
            className="inline-flex items-center gap-2.5 rounded-full bg-[#FAF0F6] py-2 pl-2 pr-3.5 font-mono text-[13px] font-medium tracking-[.12em] text-fx-purple-deep"
            data-tina-field={tinaField(sgsi, "badge")}
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-fx-purple text-white">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </span>
            {tField(sgsi, "badge", locale)}
          </div>
          <h2
            className="mb-0 mt-7 text-[27px] font-normal leading-[1.15] tracking-[-.02em] text-fx-ink [text-wrap:balance] lg:text-[40px]"
            data-tina-field={tinaField(sgsi, "title")}
          >
            {renderEmphasis(tField(sgsi, "title", locale))}
          </h2>
          <div
            className="mt-6 text-[16px] leading-[1.7] text-fx-body [text-wrap:pretty] [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-fx-ink"
            data-tina-field={tinaField(sgsi, "intro")}
          >
            {intro && <TinaMarkdown content={intro} />}
          </div>
        </div>
        <div className="flex flex-col">
          {items.map((item, i) => (
            <div key={i} className="border-b border-fx-soft py-6 text-[16px] leading-[1.6] text-fx-ink" data-tina-field={tinaField(item, "text")}>
              {tField(item, "text", locale)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
