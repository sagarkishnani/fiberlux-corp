import { useTina } from "tinacms/dist/react";
import type { AboutQuery, AboutQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";

export interface AboutProps {
  query: string;
  variables: AboutQueryVariables;
  data: AboutQuery;
  locale?: Locale;
}

export function useAbout({ query, variables, data }: AboutProps): any {
  const { data: live } = useTina<AboutQuery>({ query, variables, data });
  return live?.about || data?.about;
}
