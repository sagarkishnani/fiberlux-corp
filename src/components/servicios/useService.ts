import { useTina } from "tinacms/dist/react";
import type { ServiceQuery, ServiceQueryVariables } from "../../../tina/__generated__/types";
import type { Locale } from "../../i18n/config";

export interface ServiceProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
  locale?: Locale;
}

export function useService({ query, variables, data }: ServiceProps): any {
  const { data: live } = useTina<ServiceQuery>({ query, variables, data });
  return live?.service || data?.service;
}

export const REVEAL = { "data-reveal-distance": "56", "data-reveal-duration": "1.2", "data-reveal-ease": "fx" } as const;
