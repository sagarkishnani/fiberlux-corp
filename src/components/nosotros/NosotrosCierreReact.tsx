import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { t } from "../../i18n/ui";
import { localizeHref, tField } from "../../utils/i18n";
import TestimoniosV2 from "../shared/TestimoniosV2";
import CtaCasos from "../shared/CtaCasos";
import RubrosV2 from "../shared/RubrosV2";

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  rubros: any;
  locale?: Locale;
}

export default function NosotrosCierreReact({ query, variables, data: initialData, rubros, locale = "es" }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const testimonials = data?.home?.testimonials || initialData?.home?.testimonials;

  return (
    <>
      {testimonials && testimonials.visible !== false && (
        <TestimoniosV2
          items={(testimonials.items || []).filter(Boolean) as any[]}
          eyebrow={t("casos.eyebrow", locale)}
          title={tField(testimonials, "sectionTitle", locale)}
          titleTinaField={tinaField(testimonials as any, "sectionTitle")}
          locale={locale}
          sectionClassName="relative z-[7] -mt-10 rounded-t-[24px] bg-white pb-[67px] pt-[50px] lg:rounded-t-[40px] lg:pb-40 lg:pt-[120px]"
        >
          <CtaCasos
            href={localizeHref(testimonials.ctaUrl || "/casos-de-exito", locale)}
            label={tField(testimonials, "ctaLabel", locale)}
            tinaFieldId={tinaField(testimonials as any, "ctaLabel")}
          />
        </TestimoniosV2>
      )}
      <RubrosV2 rubros={rubros} locale={locale} className="z-[8] -mt-10" />
    </>
  );
}
