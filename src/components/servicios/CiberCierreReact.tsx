import { useState } from "react";
import { tinaField } from "tinacms/dist/react";
import { localizeHref, tField } from "../../utils/i18n";
import StepsTimeline from "../shared/fx/StepsTimeline";
import { ServiceFormSection } from "./CategoriaCierreReact";
import { CyberHeading } from "./CiberIntroReact";
import { CyberguardIcon } from "./cyberguardIcons";
import type { FormSource } from "./ServiceFormCard";
import { REVEAL, useService, type ServiceProps } from "./useService";

export default function CiberCierreReact(props: ServiceProps & { form: FormSource }) {
  const locale = props.locale || "es";
  const service = useService(props);
  const [openFaq, setOpenFaq] = useState(0);
  const cg = service?.cyberguard;
  if (!cg) return null;
  const { queCambia, porQue, porArea, pasos, faq, cta } = cg;
  const rows = ((queCambia?.items || []).filter(Boolean) as any[]);
  const reasons = ((porQue?.items || []).filter(Boolean) as any[]);
  const areas = ((porArea?.items || []).filter(Boolean) as any[]);
  const steps = ((pasos?.items || []).filter(Boolean) as any[]);
  const faqs = ((faq?.items || []).filter(Boolean) as any[]);

  return (
    <>
      {queCambia && rows.length > 0 && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <CyberHeading block={queCambia} locale={locale} />
          <div data-reveal="up" {...REVEAL} className="mt-10 overflow-hidden rounded-[28px] border border-fx-line bg-white lg:mt-14">
            <div className="hidden bg-fx-purple-deep text-[13px] font-semibold tracking-[.14em] text-[#E9C6DE] lg:grid lg:grid-cols-[1.2fr_1fr_1fr]">
              <div className="px-10 py-[26px]">{tField(queCambia, "colSituation", locale)}</div>
              <div className="border-l border-white/[.12] px-10 py-[26px]">{tField(queCambia, "colWithout", locale)}</div>
              <div className="border-l border-white/[.12] px-10 py-[26px]">{tField(queCambia, "colWith", locale)}</div>
            </div>
            {rows.map((row, i) => (
              <div key={i} className={`grid lg:grid-cols-[1.2fr_1fr_1fr] ${i ? "border-t border-fx-soft" : ""}`} data-tina-field={tinaField(row, "situation")}>
                <div className="px-6 pb-3 pt-6 text-[16px] font-medium text-fx-ink lg:px-10 lg:py-[30px] lg:font-normal">{tField(row, "situation", locale)}</div>
                <div className="flex items-center gap-3.5 px-6 py-3 text-[15px] text-fx-muted lg:border-l lg:border-fx-soft lg:px-10 lg:py-[30px] lg:text-[16px]">
                  <span className="h-0.5 w-[18px] shrink-0 bg-fx-lilac-strong" />
                  <span>
                    <span className="mr-1 font-semibold lg:hidden">{tField(queCambia, "colWithout", locale)}:</span>
                    {tField(row, "without", locale)}
                  </span>
                </div>
                <div className="flex items-center gap-3.5 bg-[#FCF8FB] px-6 pb-6 pt-3 text-[15px] font-medium text-fx-purple-deep lg:border-l lg:border-fx-soft lg:px-10 lg:py-[30px] lg:text-[16px]">
                  <span className="flex shrink-0 text-fx-purple">
                    <CyberguardIcon name="check" size={18} />
                  </span>
                  {tField(row, "with", locale)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {porQue && reasons.length > 0 && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,.85fr)_minmax(0,1.15fr)] lg:gap-20">
            <div className="lg:sticky lg:top-[140px]">
              <CyberHeading block={porQue} locale={locale} />
            </div>
            <div data-reveal="up" {...REVEAL} className="grid overflow-hidden rounded-[28px] border border-fx-line bg-white lg:grid-cols-2">
              {reasons.map((reason, i) => (
                <div
                  key={i}
                  className={`p-7 transition-colors duration-[350ms] hover:bg-[#FCF8FB] lg:min-h-[220px] lg:p-10 ${i ? "border-t border-fx-line" : ""} ${
                    i === 1 ? "lg:border-t-0" : ""
                  } ${i % 2 === 1 ? "lg:border-l" : ""}`}
                  data-tina-field={tinaField(reason, "title")}
                >
                  <h3 className="m-0 text-[20px] font-medium leading-[1.3] text-fx-ink lg:text-[22px]">{tField(reason, "title", locale)}</h3>
                  <p className="mb-0 mt-3 text-[15px] leading-[1.6] text-fx-body">{tField(reason, "text", locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {porArea && areas.length > 0 && (
        <section className="mt-[84px] bg-[#FAF4F8] lg:mt-[140px]">
          <div className="fx-container py-[72px] lg:py-[120px]">
            <CyberHeading block={porArea} locale={locale} center withText={false} />
            <div className="mt-10 grid gap-5 lg:mt-16 lg:grid-cols-4">
              {areas.map((area, i) => (
                <div key={i} data-reveal="up" {...REVEAL} className="rounded-[28px] border border-fx-line bg-white p-8" data-tina-field={tinaField(area, "area")}>
                  <h3 className="m-0 text-[20px] font-medium text-fx-ink">{tField(area, "area", locale)}</h3>
                  <p className="mb-0 mt-3 text-[15px] leading-[1.6] text-fx-body">{tField(area, "benefit", locale)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {pasos && steps.length > 0 && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <CyberHeading block={pasos} locale={locale} titleClassName="max-w-[780px]" />
          <StepsTimeline steps={steps} locale={locale} />
        </section>
      )}

      {faq && faqs.length > 0 && (
        <section className="mt-[84px] bg-[#FAF4F8] lg:mt-[140px]">
          <div className="fx-container grid gap-10 py-[72px] lg:grid-cols-[minmax(0,.8fr)_minmax(0,1.2fr)] lg:gap-24 lg:py-[120px]">
            <CyberHeading block={faq} locale={locale} />
            <div data-reveal="up" {...REVEAL} className="border-t border-[#E6DCE3]">
              {faqs.map((item, i) => {
                const open = i === openFaq;
                return (
                  <div key={i} className="border-b border-[#E6DCE3]" data-tina-field={tinaField(item, "question")}>
                    <button
                      type="button"
                      onClick={() => setOpenFaq(open ? -1 : i)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between gap-6 py-[30px] text-left text-[17px] font-medium text-fx-ink lg:text-[18px]"
                    >
                      {tField(item, "question", locale)}
                      <span className="relative h-12 w-12 shrink-0 rounded-full bg-white shadow-[0_6px_16px_-8px_rgba(101,13,74,.3)]">
                        <span className="absolute left-[17px] top-[23px] h-0.5 w-3.5 rounded-sm bg-fx-purple" />
                        <span
                          className="absolute left-[17px] top-[23px] h-0.5 w-3.5 rounded-sm bg-fx-purple transition-transform duration-[400ms]"
                          style={{ transform: `rotate(${open ? 0 : 90}deg)` }}
                        />
                      </span>
                    </button>
                    <div
                      className="overflow-hidden transition-[max-height,opacity] duration-500 ease-fx-spring"
                      style={{ maxHeight: open ? 260 : 0, opacity: open ? 1 : 0 }}
                    >
                      <p className="m-0 pb-[30px] pr-0 text-[16px] leading-[1.7] text-fx-body lg:pr-[72px]">{tField(item, "answer", locale)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {cta && (
        <section className="fx-container mt-[84px] lg:mt-[140px]">
          <div
            data-reveal="scale"
            data-reveal-duration="1.2"
            data-reveal-ease="fx"
            className="relative overflow-hidden rounded-[28px] bg-fx-purple-deep px-6 py-16 text-center text-white lg:rounded-[40px] lg:px-16 lg:py-[110px]"
          >
            {[1100, 800, 520].map((size, i) => (
              <div
                key={size}
                className="fx-wave absolute left-1/2 top-1/2 rounded-full border border-white/10"
                style={{ width: size, height: size, margin: `-${size / 2}px 0 0 -${size / 2}px`, animationDuration: `${9 + i * 2}s`, animationDelay: `-${1.5 * (i + 1)}s` }}
              />
            ))}
            <div className="relative inline-flex rounded-full border border-white/[.22] bg-white/[.12] px-5 py-2.5 text-[14px] font-semibold" data-tina-field={tinaField(cta, "badge")}>
              {tField(cta, "badge", locale)}
            </div>
            <h2
              className="relative mx-auto mb-0 mt-7 max-w-[880px] text-[36px] font-semibold leading-[1.05] tracking-[-.035em] [text-wrap:balance] lg:text-[60px]"
              data-tina-field={tinaField(cta, "title")}
            >
              {tField(cta, "title", locale)}
            </h2>
            <p className="relative mx-auto mb-0 mt-6 max-w-[640px] text-[17px] leading-[1.6] text-fx-blush-soft lg:text-[18px]" data-tina-field={tinaField(cta, "text")}>
              {tField(cta, "text", locale)}
            </p>
            {cta.button?.label && (
              <a
                href={localizeHref(cta.button.href, locale)}
                className="group/cta relative mt-10 inline-flex h-[60px] items-center gap-3.5 rounded-full bg-white pl-[30px] pr-2.5 text-[16px] font-semibold text-fx-purple-deep transition-colors duration-300 hover:bg-[#F7EEF4] hover:text-fx-purple-deep"
                data-tina-field={tinaField(cta.button, "label")}
              >
                {tField(cta.button, "label", locale)}
                <span className="grid h-[42px] w-[42px] place-items-center rounded-full bg-fx-purple text-white transition-transform duration-[450ms] ease-fx-spring group-hover/cta:-rotate-45">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </span>
              </a>
            )}
          </div>
        </section>
      )}

      <ServiceFormSection form={props.form} locale={locale} />
    </>
  );
}
