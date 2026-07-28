import { useTina } from "tinacms/dist/react";
import type { GlobalQuery, GlobalQueryVariables } from "../../../tina/__generated__/types";
import PartnersMarquee from "./PartnersMarquee.tsx";
import type { Locale } from "../../i18n/config";

interface PartnersProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
  locale?: Locale;
}

/**
 * PartnersReact — global "Trabajamos con los líderes de la industria" marquee.
 * Reads the shared partner list from the `global` collection.
 */
export default function PartnersReact({ query, variables, data: initialData, locale = "es" }: PartnersProps) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });
  return <PartnersMarquee partners={data?.global?.partners as any} locale={locale} />;
}
