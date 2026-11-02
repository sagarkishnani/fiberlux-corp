import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown } from "tinacms/dist/rich-text";
import type { SubservicioQuery, SubservicioQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, richField, tField } from "../../utils/i18n";
import { renderEmphasis } from "../../utils/emphasis";
import { ArrowIcon, Eyebrow, PillLink } from "../shared/fx/FxPrimitives";
import PageHeroBackdrop from "../shared/fx/PageHeroBackdrop";
import TestimoniosV2 from "../shared/TestimoniosV2";
import SolutionsBreadcrumb from "./SolutionsBreadcrumb";
import ServiceFormCard, { type FormSource } from "./ServiceFormCard";
import { REVEAL } from "./useService";

interface Props {
  query: string;
  variables: SubservicioQueryVariables;
  data: SubservicioQuery;
  locale?: Locale;
  category: { title: string; title_en?: string | null; href: string };
  siblings: { title: string; title_en?: string | null; url: string }[];
  testimonials: any[];
  form: FormSource;
}

export default function SolucionV2React({ query, variables, data: initialData, locale = "es", category, siblings, testimonials, form }: Props) {
  const { data } = useTina<SubservicioQuery>({ query, variables, data: initialData });
  const sub = (data?.subservicio || initialData?.subservicio) as any;
  if (!sub) return null;
  const hero = sub.hero;
  const title = tField(sub, "title", locale);
  const categoryTitle = tField(category, "title", locale);
  const benefits = ((sub.beneficios?.items || []).filter(Boolean) as any[]);
  const statement = sub.casosDeUso ? richField(sub.casosDeUso, "statement", locale) : null;

  return (
    <>
      <section className="relative pt-[30px] lg:pt-[72px]">
        <PageHeroBackdrop />
        <div className="fx-container relative grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-[72px]">
          <div className="lg:sticky lg:top-[120px] lg:pt-8">
            <SolutionsBreadcrumb locale={locale} trail={[{ label: categoryTitle, href: category.href }, { label: title }]} />
            <h1
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.08"
              className="mb-0 mt-4 text-[36px] font-medium leading-[1.05] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[60px]"
              data-tina-field={tinaField(hero, "heading")}
            >
              {tField(hero, "heading", locale) || title}
            </h1>
            <p
              data-reveal="up"
              {...REVEAL}
              data-reveal-delay="0.16"
              className="mb-0 mt-6 max-w-[540px] text-[17px] leading-[1.6] text-fx-ink [text-wrap:pretty] lg:text-[18px]"
              data-tina-field={tinaField(hero, "intro")}
            >
              {tField(hero, "intro", locale)}
            </p>
            {tField(hero, "note", locale) && (
              <div
                data-reveal="up"
                {...REVEAL}
                data-reveal-delay="0.22"
                className="mt-8 max-w-[540px] rounded-[24px] border border-fx-line bg-white px-5 py-6 lg:px-7"
                data-tina-field={tinaField(hero, "note")}
              >
                <div className="text-[12px] font-semibold tracking-[.18em] text-fx-purple">{t("solucion.idealFor", locale)}</div>
                <p className="mb-0 mt-2.5 text-[15px] leading-[1.6] text-fx-body [text-wrap:pretty]">{tField(hero, "note", locale)}</p>
              </div>
            )}
            <div data-reveal="up" {...REVEAL} data-reveal-delay="0.28" className="mt-9 flex">
              <PillLink href="#beneficios" iconSide="left" size="lg" className="!pr-5 lg:!pr-7" data-tina-field={tinaField(hero, "ctaLabel")}>
                {tField(hero, "ctaLabel", locale) || t("sol.cta", locale)}
              </PillLink>
            </div>
          </div>
          <div id="formulario" data-reveal="up" {...REVEAL} data-reveal-delay="0.12" className="scroll-mt-28">
            <ServiceFormCard form={form} locale={locale} title={tField(hero, "formTitle", locale)} prefill={{ servicio: sub._sys?.filename || "" }} />
          </div>
        </div>
      </section>

      {benefits.length > 0 && (
        <section id="beneficios" className="fx-container mt-[84px] scroll-mt-28 lg:mt-[140px]">
          <div data-reveal="up" {...REVEAL}>
            <Eyebrow className="!text-[13px]">[ {(tField(sub.beneficios, "title", locale) || t("beneficios.eyebrow", locale)).toUpperCase()} ]</Eyebrow>
            <h2 className="mb-0 mt-[18px] text-[33px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[48px]">
              {renderEmphasis(t("beneficios.title", locale))}
            </h2>
          </div>
          <div className="mt-[34px] border-t border-[#E6E3E6] lg:mt-14">
            {benefits.map((item, i) => (
              <div
                key={i}
                data-reveal="up"
                {...REVEAL}
                className="group/ben relative grid items-center gap-4 border-b border-[#E6E3E6] p-5 transition-colors duration-500 ease-fx-out hover:bg-white lg:grid-cols-[140px_minmax(0,1fr)_64px] lg:gap-8 lg:px-8 lg:py-12"
                data-tina-field={tinaField(item, "title")}
              >
                <div className="font-mono text-[14px] font-medium text-fx-muted">{String(i + 1).padStart(2, "0")}</div>
                <div className="flex items-center">
                  <span className="mr-0 h-3 w-0 shrink-0 rounded-full bg-fx-purple opacity-0 transition-[width,margin,opacity] duration-500 ease-fx-out group-hover/ben:mr-[22px] group-hover/ben:w-3 group-hover/ben:opacity-100" />
                  <div>
                    <p className="m-0 max-w-[820px] text-[24px] font-medium leading-[1.2] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[34px]">
                      {tField(item, "title", locale)}
                    </p>
                    {tField(item, "text", locale) && (
                      <p className="mb-0 mt-2 max-w-[720px] text-[15px] leading-[1.6] text-fx-body lg:text-[16px]">{tField(item, "text", locale)}</p>
                    )}
                  </div>
                </div>
                <span className="hidden h-16 w-16 place-items-center rounded-full border border-fx-line-strong bg-white text-fx-ink transition-all duration-[450ms] ease-fx-spring group-hover/ben:rotate-45 group-hover/ben:border-fx-purple group-hover/ben:bg-fx-purple group-hover/ben:text-white lg:grid">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17L17 7M8 7h9v9" />
                  </svg>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {statement && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <div
            data-reveal="scale"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            className="relative overflow-hidden rounded-[24px] bg-fx-purple px-6 py-10 text-white lg:rounded-[40px] lg:px-24 lg:py-20"
            data-tina-field={tinaField(sub.casosDeUso, "statement")}
          >
            <div className="fx-wave absolute -right-[120px] -top-40 h-[560px] w-[560px] rounded-full border border-white/[.14]" style={{ animationDelay: "-1.5s" }} />
            <div className="fx-wave absolute -right-10 -top-20 h-[380px] w-[380px] rounded-full border border-white/10" style={{ animationDuration: "11s", animationDelay: "-3s" }} />
            <div className="relative font-mono text-[13px] font-medium tracking-[.2em] text-fx-blush">
              {tField(sub.casosDeUso, "eyebrow", locale) || t("casosUso.eyebrow", locale)}
            </div>
            <div className="relative mt-7 max-w-[980px] text-[22px] font-normal leading-[1.35] tracking-[-.015em] [text-wrap:pretty] lg:text-[34px] [&_p]:m-0 [&_strong]:font-semibold">
              <TinaMarkdown content={statement} />
            </div>
          </div>
        </section>
      )}

      <TestimoniosV2 items={testimonials} eyebrow={t("testimonios.eyebrow", locale)} title={t("testimonios.title", locale)} locale={locale} />

      {siblings.length > 0 && (
        <section className="fx-container mt-[84px] pb-24 lg:mt-[140px] lg:pb-40">
          <div data-reveal="up" {...REVEAL} className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div>
              <Eyebrow className="!text-[13px]">{t("otras.eyebrow", locale)}</Eyebrow>
              <h2 className="mb-0 mt-[18px] text-[33px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[48px]">
                {t("otras.titlePrefix", locale)} <span className="font-semibold text-fx-purple">{categoryTitle}</span>
              </h2>
            </div>
            <PillLink href={localizeHref(category.href, locale)} variant="lilac" className="self-start lg:self-auto">
              {t("otras.viewCategory", locale)}
            </PillLink>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {siblings.map((sibling) => (
              <a
                key={sibling.url}
                href={localizeHref(sibling.url, locale)}
                className="group/other inline-flex h-[60px] items-center gap-3.5 rounded-full border border-fx-line bg-white pl-[26px] pr-2.5 text-[16px] font-medium text-fx-ink transition-[border-color,color] duration-300 hover:border-fx-purple hover:text-fx-purple"
              >
                {tField(sibling, "title", locale)}
                <span className="grid h-10 w-10 place-items-center rounded-full bg-fx-bg text-fx-ink transition-all duration-[450ms] ease-fx-spring group-hover/other:-rotate-45 group-hover/other:bg-fx-purple group-hover/other:text-white">
                  <ArrowIcon size={15} />
                </span>
              </a>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
