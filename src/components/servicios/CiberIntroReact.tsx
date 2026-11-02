import type { ReactNode } from "react";
import { tinaField } from "tinacms/dist/react";
import type { Locale } from "../../i18n/config";
import { localizeHref, tField } from "../../utils/i18n";
import { PillLink } from "../shared/fx/FxPrimitives";
import PageHeroBackdrop from "../shared/fx/PageHeroBackdrop";
import Shield3D from "../shared/fx/Shield3D";
import SolutionsBreadcrumb from "./SolutionsBreadcrumb";
import { CyberguardIcon } from "./cyberguardIcons";
import { REVEAL, useService, type ServiceProps } from "./useService";

export function CyberHeading({
  block,
  locale,
  center = false,
  withText = true,
  titleClassName = "",
}: {
  block: any;
  locale: Locale;
  center?: boolean;
  withText?: boolean;
  titleClassName?: string;
}) {
  return (
    <div data-reveal="up" {...REVEAL} className={center ? "text-center" : ""}>
      <div className="text-[13px] font-semibold tracking-[.2em] text-fx-purple" data-tina-field={tinaField(block, "eyebrow")}>
        {tField(block, "eyebrow", locale)}
      </div>
      <h2
        className={`mb-0 mt-[18px] text-[34px] font-medium leading-[1.08] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[52px] ${
          center ? "mx-auto max-w-[800px]" : ""
        } ${titleClassName}`}
        data-tina-field={tinaField(block, "title")}
      >
        {tField(block, "title", locale)}
      </h2>
      {withText && tField(block, "text", locale) && (
        <p
          className={`mb-0 mt-6 text-[17px] leading-[1.6] text-fx-body ${center ? "mx-auto max-w-[640px]" : "max-w-[620px]"}`}
          data-tina-field={tinaField(block, "text")}
        >
          {tField(block, "text", locale)}
        </p>
      )}
    </div>
  );
}

export function renderBold(text: string): ReactNode {
  return text.split("**").map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-fx-ink">
        {part}
      </strong>
    ) : (
      part
    )
  );
}

const ESCALA_STYLES = [
  { offset: "lg:mt-[120px]", pad: "lg:pt-10", bars: ["bg-fx-purple", "bg-[#EFE6EC]", "bg-[#EFE6EC]"] },
  { offset: "lg:mt-[60px]", pad: "lg:pt-20", bars: ["bg-fx-lilac-strong", "bg-fx-purple", "bg-[#EFE6EC]"] },
  { offset: "lg:mt-0", pad: "lg:pt-[120px]", bars: ["bg-white/45", "bg-white/45", "bg-white"] },
];

export default function CiberIntroReact(props: ServiceProps) {
  const locale = props.locale || "es";
  const service = useService(props);
  const cg = service?.cyberguard;
  if (!cg) return null;
  const { hero, frentes, escalas, planes } = cg;
  const highlights = ((hero?.highlights || []).filter(Boolean) as any[]);
  const frenteItems = ((frentes?.items || []).filter(Boolean) as any[]);
  const escalaItems = ((escalas?.items || []).filter(Boolean) as any[]);
  const plans = ((planes?.items || []).filter(Boolean) as any[]);

  return (
    <>
      {hero && (
        <section className="relative pt-[30px] lg:pt-[72px]">
          <PageHeroBackdrop />
          <div className="fx-container relative grid items-center gap-8 lg:min-h-[600px] lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-12">
            <div>
              <SolutionsBreadcrumb locale={locale} trail={[{ label: tField(service, "title", locale) }]} />
              <div
                data-reveal="up"
                {...REVEAL}
                data-reveal-delay="0.04"
                className="mt-7 inline-flex rounded-full border border-fx-lilac bg-[#FAF0F6] px-[18px] py-2.5 text-[14px] font-semibold text-fx-purple"
                data-tina-field={tinaField(hero, "badge")}
              >
                {tField(hero, "badge", locale)}
              </div>
              <h1
                data-reveal="up"
                {...REVEAL}
                data-reveal-delay="0.08"
                className="mb-0 mt-6 max-w-[640px] text-[36px] font-medium leading-[1.1] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[52px]"
                data-tina-field={tinaField(hero, "title")}
              >
                {tField(hero, "title", locale)}
              </h1>
              <p
                data-reveal="up"
                {...REVEAL}
                data-reveal-delay="0.16"
                className="mb-0 mt-7 max-w-[620px] text-[17px] leading-[1.65] text-fx-body [text-wrap:pretty] lg:text-[18px]"
                data-tina-field={tinaField(hero, "text")}
              >
                {tField(hero, "text", locale)}
              </p>
              <div data-reveal="up" {...REVEAL} data-reveal-delay="0.24" className="mt-10 flex flex-col gap-3 lg:flex-row">
                {hero.ctaPrimary?.label && (
                  <PillLink href={localizeHref(hero.ctaPrimary.href, locale)} iconSide="left" size="lg" className="!pr-5 lg:!pr-7">
                    {tField(hero.ctaPrimary, "label", locale)}
                  </PillLink>
                )}
                {hero.ctaSecondary?.label && (
                  <a
                    href={localizeHref(hero.ctaSecondary.href, locale)}
                    className="inline-flex h-14 items-center justify-center rounded-full border-[1.5px] border-fx-line-strong bg-white px-7 text-[15px] font-medium text-fx-ink transition-[border-color,background,color] duration-300 hover:border-fx-ink hover:bg-fx-ink hover:text-white"
                  >
                    {tField(hero.ctaSecondary, "label", locale)}
                  </a>
                )}
              </div>
            </div>
            <div data-reveal="scale" data-reveal-duration="1.2" data-reveal-ease="fx" className="relative grid h-[400px] place-items-center lg:h-[560px]">
              <div className="pointer-events-none absolute h-[560px] w-[560px] bg-[radial-gradient(closest-side,rgba(150,33,122,.30),rgba(213,167,202,.14)_55%,rgba(247,247,247,0))]" />
              <Shield3D size="lg" />
            </div>
          </div>
          {highlights.length > 0 && (
            <div data-reveal="up" {...REVEAL} className="fx-container relative mt-10 grid rounded-[28px] border border-fx-line bg-white lg:grid-cols-3">
              {highlights.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-[18px] px-6 py-6 lg:px-9 lg:py-8 ${i ? "border-t border-fx-line lg:border-l lg:border-t-0" : ""}`}
                  data-tina-field={tinaField(item, "text")}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#FAF0F6] text-fx-purple">
                    <CyberguardIcon name={item.icon} size={20} />
                  </span>
                  <span className="text-[16px] leading-[1.45] text-fx-ink">{tField(item, "text", locale)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {frentes && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <CyberHeading block={frentes} locale={locale} />
          <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-3">
            {frenteItems.map((item, i) => (
              <div
                key={i}
                data-reveal="up"
                {...REVEAL}
                className="group/fr flex flex-col gap-7 rounded-[28px] border border-fx-line bg-white p-7 transition-[transform,border-color,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:border-fx-lilac-strong hover:shadow-[0_30px_60px_-30px_rgba(150,33,122,.4)] lg:p-9"
                data-tina-field={tinaField(item, "title")}
              >
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#FAF0F6] text-fx-purple transition-all duration-[400ms] group-hover/fr:bg-fx-purple group-hover/fr:text-white">
                  <CyberguardIcon name={item.icon} />
                </div>
                <div>
                  <h3 className="m-0 text-[22px] font-medium leading-[1.3] tracking-[-.01em] text-fx-ink lg:text-[24px]">{tField(item, "title", locale)}</h3>
                  <p className="mb-0 mt-3 text-[15px] leading-[1.6] text-fx-body [text-wrap:pretty]">{tField(item, "text", locale)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {escalas && (
        <section className="mt-[84px] bg-[#FAF4F8] lg:mt-[140px]">
          <div className="fx-container py-[72px] lg:py-[120px]">
            <CyberHeading block={escalas} locale={locale} center withText={false} />
            <div className="mt-10 grid items-end gap-5 lg:mt-[72px] lg:grid-cols-3">
              {escalaItems.map((item, i) => {
                const style = ESCALA_STYLES[Math.min(i, ESCALA_STYLES.length - 1)];
                const dark = i === escalaItems.length - 1;
                return (
                  <div
                    key={i}
                    data-reveal="up"
                    {...REVEAL}
                    data-reveal-delay={String(i * 0.08)}
                    className={`overflow-hidden rounded-[28px] border transition-[transform,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:shadow-[0_30px_60px_-30px_rgba(101,13,74,.45)] ${style.offset} ${
                      dark ? "border-fx-purple-deep bg-fx-purple-deep" : "border-fx-line bg-white"
                    }`}
                    data-tina-field={tinaField(item, "title")}
                  >
                    <div className={`px-10 pt-10 ${style.pad} ${dark ? "bg-white/[.06]" : "bg-[#FAF4F8]"}`}>
                      <div className="flex h-16 items-end gap-2">
                        {[24, 36, 52].map((h, b) => (
                          <span key={b} className={`w-[30px] rounded-t-md ${style.bars[b]}`} style={{ height: h }} />
                        ))}
                      </div>
                    </div>
                    <div className="px-10 pb-11 pt-9">
                      <div className={`text-[13px] font-semibold tracking-[.12em] ${dark ? "text-[#E9C6DE]" : "text-fx-purple"}`}>{tField(item, "tag", locale)}</div>
                      <h3 className={`mb-0 mt-4 text-[26px] font-medium tracking-[-.02em] lg:text-[30px] ${dark ? "text-white" : "text-fx-ink"}`}>{tField(item, "title", locale)}</h3>
                      <p className={`mb-0 mt-3.5 text-[16px] leading-[1.6] ${dark ? "text-fx-blush-soft" : "text-fx-body"}`}>{tField(item, "text", locale)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {planes && (
        <section id="planes" className="fx-container mt-[84px] scroll-mt-28 lg:mt-[140px]">
          <CyberHeading block={planes} locale={locale} center />
          <div className="mt-14 grid items-stretch gap-8 lg:mt-[72px] lg:grid-cols-3 lg:gap-5">
            {plans.map((plan, i) => {
              const features = ((plan.features || []).filter(Boolean) as any[]);
              const includes = tField(plan, "includes", locale);
              return (
                <div
                  key={i}
                  data-reveal="up"
                  {...REVEAL}
                  data-reveal-delay={String(i * 0.08)}
                  className={`relative flex flex-col rounded-[32px] bg-white p-8 transition-[transform,box-shadow] duration-500 ease-fx-spring hover:-translate-y-1.5 hover:shadow-[0_40px_80px_-36px_rgba(150,33,122,.45)] lg:p-10 ${
                    plan.highlighted ? "border-2 border-fx-purple shadow-[0_40px_80px_-40px_rgba(150,33,122,.45)]" : "border border-fx-line"
                  }`}
                  data-tina-field={tinaField(plan, "name")}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-fx-purple px-[18px] py-[7px] text-[12px] font-semibold tracking-[.14em] text-white">
                      {tField(planes, "recommendedLabel", locale)}
                    </div>
                  )}
                  <span className="self-start rounded-full bg-[#FAF0F6] px-4 py-2 text-[13px] font-semibold text-fx-purple">{tField(plan, "tag", locale)}</span>
                  <h3 className="mb-0 mt-7 text-[30px] font-semibold tracking-[-.02em] text-fx-ink lg:text-[34px]">{plan.name}</h3>
                  <div className="mt-1.5 text-[18px] text-fx-purple">{tField(plan, "subtitle", locale)}</div>
                  <div className="mt-7 border-y border-fx-soft py-[22px]">
                    <div className="text-[12px] font-semibold tracking-[.12em] text-fx-muted">{tField(planes, "idealLabel", locale)}</div>
                    <div className="mt-2 text-[16px] text-fx-ink">{tField(plan, "idealFor", locale)}</div>
                  </div>
                  <div className="mb-9 mt-7 flex flex-col gap-4">
                    {[...(includes ? [{ text: includes, text_en: includes }] : []), ...features].map((feature, f) => (
                      <div key={f} className="flex items-start gap-3.5 text-[15px] leading-[1.5] text-fx-ink">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FAF0F6] text-fx-purple">
                          <CyberguardIcon name="check" size={14} />
                        </span>
                        <span className={`pt-[3px] ${includes && f === 0 ? "font-semibold" : ""}`}>{f === 0 && includes ? includes : tField(feature, "text", locale)}</span>
                      </div>
                    ))}
                  </div>
                  {plan.cta?.label && (
                    <a
                      href={localizeHref(plan.cta.href, locale)}
                      className={`mt-auto inline-flex h-14 items-center justify-center rounded-full text-[15px] font-medium transition-[background,color,border-color] duration-300 ${
                        plan.highlighted
                          ? "bg-fx-purple text-white hover:bg-fx-purple-hover hover:text-white"
                          : "border-[1.5px] border-fx-line-strong bg-white text-fx-ink hover:border-fx-purple hover:bg-fx-purple hover:text-white"
                      }`}
                      data-tina-field={tinaField(plan.cta, "label")}
                    >
                      {tField(plan.cta, "label", locale)}
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          {tField(planes, "note", locale) && (
            <div
              data-reveal="up"
              {...REVEAL}
              className="mt-9 flex items-start justify-center gap-3 text-[15px] text-fx-body lg:items-center"
              data-tina-field={tinaField(planes, "note")}
            >
              <span className="flex shrink-0 text-fx-purple">
                <CyberguardIcon name="shield" size={20} />
              </span>
              <span>{renderBold(tField(planes, "note", locale))}</span>
            </div>
          )}
        </section>
      )}
    </>
  );
}
