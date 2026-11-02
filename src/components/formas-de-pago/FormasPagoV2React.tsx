import { useState } from "react";
import { useTina, tinaField } from "tinacms/dist/react";
import { TinaMarkdown, type Components } from "tinacms/dist/rich-text";
import type { FormasDePagoQuery, FormasDePagoQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, richField, tField } from "../../utils/i18n";
import { mediaUrl } from "../../utils/mediaUrl";
import { PillLink } from "../shared/fx/FxPrimitives";
import { Breadcrumb } from "../shared/fx/PageHero";
import PageHeroBackdrop from "../shared/fx/PageHeroBackdrop";

interface Props {
  query: string;
  variables: FormasDePagoQueryVariables;
  data: FormasDePagoQuery;
  locale?: Locale;
}

const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;

const descriptionComponents: Components<{}> = {
  p: (props: any) => <p className="m-0">{props.children}</p>,
  bold: (props: any) => <strong className="font-semibold text-fx-purple">{props.children}</strong>,
  ul: (props: any) => <ul className="mb-0 mt-2.5 flex list-none flex-col gap-1 p-0 text-[15px] text-fx-body">{props.children}</ul>,
  li: (props: any) => (
    <li className="flex gap-1.5">
      <span aria-hidden="true">–</span>
      <span>{props.children}</span>
    </li>
  ),
};

function PillSelect({ label, value, onChange, options }: { label: string; value: number; onChange: (i: number) => void; options: string[] }) {
  return (
    <label className="relative block w-full sm:w-auto sm:min-w-[280px]">
      <span className="mb-2 block text-[13px] font-medium text-fx-body">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-14 w-full cursor-pointer appearance-none rounded-full border border-[#E6E3E6] bg-white pl-[22px] pr-[52px] text-[15px] font-medium text-fx-ink outline-none transition-[border-color,box-shadow] duration-[250ms] hover:border-fx-lilac-strong focus:border-fx-purple focus:shadow-[0_0_0_4px_rgba(150,33,122,.12)]"
      >
        {options.map((option, i) => (
          <option key={i} value={i}>
            {option}
          </option>
        ))}
      </select>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#96217A"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute bottom-5 right-[22px]"
        aria-hidden="true"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </label>
  );
}

export default function FormasPagoV2React({ query, variables, data: initialData, locale = "es" }: Props) {
  const { data } = useTina<FormasDePagoQuery>({ query, variables, data: initialData });
  const [bankIdx, setBankIdx] = useState(0);
  const [methodIdx, setMethodIdx] = useState(0);

  const page = (data?.formasDePago || initialData?.formasDePago) as any;
  if (!page) return null;
  const banks = ((page.banks || []).filter(Boolean) as any[]);
  const bank = banks[Math.min(bankIdx, Math.max(banks.length - 1, 0))];
  const methods = ((bank?.methods || []).filter(Boolean) as any[]);
  const safeMethodIdx = Math.min(methodIdx, Math.max(methods.length - 1, 0));
  const method = methods[safeMethodIdx];
  const steps = ((method?.steps || []).filter(Boolean) as any[]);
  const methodLabel = method ? tField(method, "label", locale) : "";
  const bankLabel = bank ? bank.name || tField(bank, "optionLabel", locale) : "";
  const stepWord = t("pago.step", locale);

  return (
    <>
      <section className="relative overflow-clip pb-[50px] pt-10 lg:pb-[120px] lg:pt-24">
        <PageHeroBackdrop variant="full" />
        <div className="fx-container relative">
          <Breadcrumb crumb={t("pago.crumb", locale)} locale={locale} />
          <h1
            data-reveal="up"
            {...REVEAL}
            data-reveal-delay="0.08"
            className="mb-0 mt-4 max-w-[820px] text-[34px] font-medium leading-[1.1] tracking-[-.03em] text-fx-ink [text-wrap:balance] lg:text-[56px]"
            data-tina-field={tinaField(page, "heading")}
          >
            {tField(page, "heading", locale)}
          </h1>
          {banks.length > 0 && (
            <div data-reveal="up" {...REVEAL} data-reveal-delay="0.16" className="mt-[29px] flex flex-wrap gap-4 lg:mt-12">
              <PillSelect
                label={tField(page, "bankSelectLabel", locale)}
                value={banks.indexOf(bank)}
                onChange={(i) => {
                  setBankIdx(i);
                  setMethodIdx(0);
                }}
                options={banks.map((b, i) => tField(b, "optionLabel", locale) || b.name || `${i + 1}`)}
              />
              {methods.length > 0 && (
                <PillSelect
                  label={tField(page, "methodSelectLabel", locale)}
                  value={safeMethodIdx}
                  onChange={setMethodIdx}
                  options={methods.map((m, i) => tField(m, "label", locale) || `${i + 1}`)}
                />
              )}
            </div>
          )}
        </div>
      </section>

      <section className="relative z-[2] rounded-t-[24px] bg-white pb-[67px] pt-[27px] lg:rounded-t-[40px] lg:pb-40 lg:pt-16">
        <div className="fx-container">
          {steps.length > 0 ? (
            steps.map((step, i) => {
              const n = i + 1;
              const image = mediaUrl(step.image);
              return (
                <div
                  key={`${bankIdx}-${safeMethodIdx}-${i}`}
                  className={`fx-ch-in grid items-center gap-9 py-[27px] lg:grid-cols-2 lg:gap-20 lg:py-16 ${i ? "border-t border-fx-soft" : ""}`}
                  style={{ animationDelay: `${Math.min(i, 4) * 0.08}s` }}
                >
                  <div>
                    <div className="font-mono text-[13px] font-medium tracking-[.2em] text-fx-purple">
                      {stepWord.toUpperCase()} {n}
                    </div>
                    <h2 className="mb-0 mt-3.5 text-[29px] font-medium leading-[1.15] tracking-[-.02em] text-fx-ink lg:text-[36px]">
                      {methodLabel} – {stepWord} {n}
                    </h2>
                    <div className="mt-6 flex max-w-[520px] gap-3.5">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#FAF0F6] text-fx-purple">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M5 12l5 5L20 7" />
                        </svg>
                      </span>
                      <div className="text-[16px] leading-[1.65] text-fx-ink" data-tina-field={tinaField(step, "description")}>
                        <TinaMarkdown content={richField(step, "description", locale)} components={descriptionComponents} />
                      </div>
                    </div>
                  </div>
                  <div className="group/step flex h-[260px] items-center justify-center rounded-[24px] bg-fx-bg p-5 lg:h-[420px] lg:rounded-[32px] lg:p-10">
                    {image && (
                      <img
                        src={image}
                        alt={`${stepWord} ${n}`}
                        loading="lazy"
                        className="block h-auto max-h-full w-auto max-w-full rounded-xl shadow-[0_24px_50px_-24px_rgba(17,12,16,.35)] transition-transform duration-[600ms] ease-fx-out group-hover/step:-translate-y-1.5"
                        data-tina-field={tinaField(step, "image")}
                      />
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-start justify-between gap-[18px] rounded-[24px] bg-fx-bg p-6 lg:flex-row lg:items-center lg:gap-10 lg:rounded-[32px] lg:p-14">
              <div>
                <h2 className="m-0 text-[22px] font-medium tracking-[-.02em] text-fx-ink lg:text-[28px]">
                  {t("pago.emptyTitle", locale)} {methodLabel} {bankLabel}
                </h2>
                <p className="mb-0 mt-3 max-w-[560px] text-[16px] leading-[1.6] text-fx-body">{t("pago.emptyText", locale)}</p>
              </div>
              <PillLink href={localizeHref("/contacto", locale)} iconSide="left" size="lg" className="shrink-0 whitespace-nowrap !pr-5 lg:!pr-7">
                {t("pago.contact", locale)}
              </PillLink>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
