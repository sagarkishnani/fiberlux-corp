import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, tField } from "../../utils/i18n";
import CtaCasos from "../shared/CtaCasos";
import TestimoniosV2 from "../shared/TestimoniosV2";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  withCta?: boolean;
}

export default function HomeTestimoniosReact({ query, variables, data: initialData, locale = "es", withCta = false }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const testimonials = data?.home?.testimonials || initialData?.home?.testimonials;
  if (!testimonials || testimonials.visible === false) return null;
  return (
    <TestimoniosV2
      items={(testimonials.items || []).filter(Boolean) as any[]}
      eyebrow={t("testimonios.eyebrow", locale)}
      title={tField(testimonials, "sectionTitle", locale)}
      titleTinaField={tinaField(testimonials as any, "sectionTitle")}
      locale={locale}
    >
      {withCta && (
        <CtaCasos
          href={localizeHref(testimonials.ctaUrl || "/casos-de-exito", locale)}
          label={tField(testimonials, "ctaLabel", locale)}
          tinaFieldId={tinaField(testimonials as any, "ctaLabel")}
        />
      )}
    </TestimoniosV2>
  );
}
