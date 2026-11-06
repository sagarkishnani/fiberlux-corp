import { useEffect, useState } from "react";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { onFormPrefill, pendingFormPrefill } from "../../utils/formPrefill";
import DynamicFormReact from "../dynamic-form/DynamicFormReact";

export interface FormSource {
  query: string;
  variables: { relativePath: string };
  data: any;
}

export default function ServiceFormCard({
  form,
  locale,
  title,
  subtitle,
  prefill,
  className = "",
}: {
  form: FormSource;
  locale: Locale;
  title?: string;
  subtitle?: string;
  prefill?: Record<string, string>;
  className?: string;
}) {
  const [activePrefill, setActivePrefill] = useState(prefill);

  useEffect(() => {
    const pending = pendingFormPrefill();
    if (pending) setActivePrefill((current) => ({ ...current, ...pending }));
    return onFormPrefill((values) => setActivePrefill((current) => ({ ...current, ...values })));
  }, []);

  return (
    <div
      className={`relative rounded-[28px] border border-fx-line bg-white p-6 shadow-[0_40px_80px_-48px_rgba(101,13,74,.35)] lg:rounded-[40px] lg:p-10 ${className}`}
    >
      <h2 className="m-0 text-[28px] font-medium leading-[1.1] tracking-[-.025em] text-fx-purple lg:text-[34px]">
        {title || t("form.title", locale)}
      </h2>
      <p className="mb-6 mt-2 text-[15px] text-fx-body">{subtitle || t("form.subtitle", locale)}</p>
      <DynamicFormReact query={form.query} variables={form.variables} data={form.data} hideHeader prefill={activePrefill} locale={locale} styleVariant="contact" />
    </div>
  );
}
