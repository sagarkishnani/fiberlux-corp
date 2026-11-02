import { tinaField } from "tinacms/dist/react";
import { tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow } from "../shared/fx/FxPrimitives";
import { NosotrosIcon } from "./nosotrosIcons";
import { useAbout, type AboutProps } from "./useAbout";

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

function Photo({ src, alt, field }: { src?: string | null; alt: string; field?: string }) {
  return (
    <div
      data-reveal="scale"
      data-reveal-duration="1.2"
      data-reveal-ease="fx"
      className="group/img relative h-[360px] overflow-hidden rounded-[24px] bg-fx-ink lg:h-[580px] lg:rounded-[32px]"
      data-tina-field={field}
    >
      {src && (
        <img
          src={mediaUrl(src)}
          alt={alt}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-fx-out group-hover/img:scale-105"
        />
      )}
    </div>
  );
}

function Statement({ eyebrow, text, field, large }: { eyebrow: string; text: string; field?: string; large: boolean }) {
  return (
    <div data-reveal="up" {...REVEAL}>
      <div className="font-mono text-[13px] font-medium tracking-[.2em] text-fx-purple">[ {eyebrow.toUpperCase()} ]</div>
      <p
        className={`mb-0 mt-6 text-[18px] font-normal tracking-[-.02em] text-fx-ink [text-wrap:pretty] ${
          large ? "leading-[1.25] lg:text-[38px]" : "leading-[1.28] lg:text-[34px]"
        }`}
        data-tina-field={field}
      >
        {renderEmphasis(text)}
      </p>
    </div>
  );
}

export default function NosotrosMisionValoresReact(props: AboutProps) {
  const locale = props.locale || "es";
  const about = useAbout(props);
  if (!about) return null;
  const { mission, vision, values } = about;
  const valueItems = ((values?.items || []).filter(Boolean) as any[]);

  return (
    <section className="relative z-[5] -mt-10 rounded-t-[24px] bg-white pb-[67px] pt-[50px] lg:rounded-t-[40px] lg:pb-40 lg:pt-[120px]">
      <div className="fx-container relative">
        <div data-reveal="up" {...REVEAL} className="mx-auto mb-[58px] max-w-[760px] text-center lg:mb-24">
          <Eyebrow className="!text-[13px]">{tField(about, "missionVisionEyebrow", locale)}</Eyebrow>
          <h2
            className="mb-0 mt-[18px] text-[33px] font-normal leading-[1.1] tracking-[-.02em] text-fx-ink [text-wrap:balance] lg:text-[48px]"
            data-tina-field={tinaField(about, "missionVisionTitle")}
          >
            {renderEmphasis(tField(about, "missionVisionTitle", locale))}
          </h2>
        </div>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-[88px]">
          <Photo src={about.hero?.image} alt={tField(mission, "title", locale)} field={tinaField(about.hero, "image")} />
          <Statement eyebrow={tField(mission, "title", locale)} text={tField(mission, "text", locale)} field={tinaField(mission, "text")} large />
        </div>
        <div className="mt-[84px] grid items-center gap-10 lg:mt-[140px] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-[88px]">
          <Statement eyebrow={tField(vision, "title", locale)} text={tField(vision, "text", locale)} field={tinaField(vision, "text")} large={false} />
          <Photo src={about.missionImage} alt={tField(vision, "title", locale)} field={tinaField(about, "missionImage")} />
        </div>
      </div>

      {values && (
        <div className="fx-container relative mt-24 grid items-start gap-[43px] lg:mt-40 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-24">
          <div data-reveal="up" {...REVEAL} className="lg:sticky lg:top-[140px]">
            <Eyebrow className="!text-[13px]">{tField(values, "eyebrow", locale)}</Eyebrow>
            <h2
              className="mb-0 mt-[18px] text-[34px] font-normal leading-[1.08] tracking-[-.025em] text-fx-ink lg:text-[56px]"
              data-tina-field={tinaField(values, "title")}
            >
              {renderEmphasis(tField(values, "title", locale))}
            </h2>
            <p className="mb-0 mt-6 max-w-[420px] text-[17px] leading-[1.65] text-fx-body [text-wrap:pretty]" data-tina-field={tinaField(values, "subtitle")}>
              {tField(values, "subtitle", locale)}
            </p>
          </div>
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-x-14 lg:gap-y-[72px]">
            {valueItems.map((item, i) => (
              <div
                key={i}
                data-reveal="up"
                {...REVEAL}
                className="group/val border-t border-[#DCD8DC] pt-5 lg:pt-8"
                data-tina-field={tinaField(item, "name")}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl border border-[#E6E3E6] bg-white text-fx-purple shadow-[0_6px_14px_-6px_rgba(17,12,16,.12)] transition-all duration-[450ms] ease-fx-spring group-hover/val:-translate-y-1 group-hover/val:border-fx-purple group-hover/val:bg-fx-purple group-hover/val:text-white">
                  <NosotrosIcon name={item.icon} />
                </div>
                <h3 className="mb-0 mt-7 text-[22px] font-medium tracking-[-.01em] text-[#2B252C] lg:text-[26px]">{tField(item, "name", locale)}</h3>
                <p className="mb-0 mt-3 max-w-[320px] text-[16px] leading-[1.65] text-fx-body [text-wrap:pretty]">{tField(item, "description", locale)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
