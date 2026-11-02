import { tinaField } from "tinacms/dist/react";
import { tField, localizeHref } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow, PillLink } from "../shared/fx/FxPrimitives";
import StepsTimeline from "../shared/fx/StepsTimeline";
import Shield3D from "../shared/fx/Shield3D";
import { useAbout, type AboutProps } from "./useAbout";

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

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
