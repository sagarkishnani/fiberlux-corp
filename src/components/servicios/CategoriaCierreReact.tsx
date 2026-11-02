import type { CSSProperties } from "react";
import { tinaField } from "tinacms/dist/react";
import { t } from "../../i18n/ui";
import { tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import type { PostSummary } from "../../utils/postMeta";
import { renderEmphasis } from "../../utils/emphasis";
import { Eyebrow } from "../shared/fx/FxPrimitives";
import PostCardsSection from "../shared/PostCardsSection";
import ServiceFormCard, { type FormSource } from "./ServiceFormCard";
import { REVEAL, useService, type ServiceProps } from "./useService";

export function ServiceFormSection({ form, locale, prefill }: { form: FormSource; locale: "es" | "en"; prefill?: Record<string, string> }) {
  return (
    <section id="formulario" className="fx-container relative mt-[84px] scroll-mt-28 pb-24 lg:mt-[140px] lg:pb-40">
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,640px)] lg:gap-20">
        <div data-reveal="up" {...REVEAL} className="lg:sticky lg:top-[140px]">
          <Eyebrow className="!text-[13px]">{t("form.eyebrow", locale)}</Eyebrow>
          <h2 className="mb-0 mt-[18px] text-[34px] font-medium leading-[1.1] tracking-[-.025em] text-fx-ink [text-wrap:balance] lg:text-[48px]">
            {renderEmphasis(t("form.sectionTitle", locale))}
          </h2>
          <p className="mb-0 mt-6 max-w-[460px] text-[16px] leading-[1.6] text-fx-body [text-wrap:pretty]">{t("form.sectionText", locale)}</p>
        </div>
        <div data-reveal="up" {...REVEAL} data-reveal-delay="0.12">
          <ServiceFormCard form={form} locale={locale} prefill={prefill} />
        </div>
      </div>
    </section>
  );
}

export default function CategoriaCierreReact(props: ServiceProps & { posts: PostSummary[]; form: FormSource }) {
  const locale = props.locale || "es";
  const service = useService(props);
  if (!service) return null;
  const partners = service.partners;
  const logos = ((partners?.logos || []).filter((l: any) => l?.image) as any[]);

  return (
    <>
      {logos.length > 0 && (
        <section className="pt-[84px] lg:pt-[140px]">
          <div data-reveal="up" {...REVEAL} className="fx-container text-center">
            <Eyebrow className="!text-[13px]" >{tField(partners, "eyebrow", locale)}</Eyebrow>
            <h2
              className="mb-0 mt-[18px] text-[28px] font-normal leading-[1.15] tracking-[-.02em] text-fx-ink [text-wrap:balance] lg:text-[40px]"
              data-tina-field={tinaField(partners, "title")}
            >
              {renderEmphasis(tField(partners, "title", locale))}
            </h2>
          </div>
          <div className="mt-10 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)] lg:mt-14">
            <div className="fx-marquee flex w-max items-center" style={{ "--fx-marquee-duration": "40s" } as CSSProperties}>
              {[0, 1].map((copy) =>
                [...logos, ...logos].map((logo, i) => (
                  <img
                    key={`${copy}-${i}`}
                    src={mediaUrl(logo.image)}
                    alt={copy === 0 && i < logos.length ? logo.alt || "" : ""}
                    title={logo.alt || ""}
                    loading="lazy"
                    className="mr-14 block h-8 w-auto max-w-[150px] opacity-80 [filter:grayscale(1)_brightness(.32)] lg:mr-24 lg:h-10 lg:max-w-[180px]"
                  />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      <PostCardsSection
        posts={props.posts}
        title={t("related.title", locale)}
        buttonText={t("related.viewAll", locale)}
        locale={locale}
        sectionClassName="fx-container mt-[84px] lg:mt-[140px]"
      />

      <ServiceFormSection form={props.form} locale={locale} />
    </>
  );
}
