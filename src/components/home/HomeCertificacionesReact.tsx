import { useTina, tinaField } from "tinacms/dist/react";
import type { HomeQuery, HomeQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";
import { tField } from "../../utils/i18n";
import CertificacionesV2, { type CertItem } from "../shared/CertificacionesV2";

export interface CertificacionesSource {
  sectionTitle?: string | null;
  sectionTitle_en?: string | null;
  sectionDescription?: string | null;
  sectionDescription_en?: string | null;
  items: CertItem[];
}

interface Props {
  query: string;
  variables: HomeQueryVariables;
  data: HomeQuery;
  locale?: Locale;
  certificaciones: CertificacionesSource;
  sectionClassName?: string;
}

export default function HomeCertificacionesReact({ query, variables, data: initialData, locale = "es", certificaciones, sectionClassName }: Props) {
  const { data } = useTina<HomeQuery>({ query, variables, data: initialData });
  const intro = data?.home?.certificacionesIntro || initialData?.home?.certificacionesIntro;
  return (
    <CertificacionesV2
      eyebrow={tField(intro, "eyebrow", locale)}
      title={tField(intro, "title", locale) || tField(certificaciones, "sectionTitle", locale)}
      text={tField(intro, "text", locale) || tField(certificaciones, "sectionDescription", locale)}
      titleTinaField={intro ? tinaField(intro as any, "title") : undefined}
      textTinaField={intro ? tinaField(intro as any, "text") : undefined}
      items={certificaciones.items}
      locale={locale}
      sectionClassName={sectionClassName}
    />
  );
}
