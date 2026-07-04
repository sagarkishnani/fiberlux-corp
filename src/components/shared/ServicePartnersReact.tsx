import { useTina } from "tinacms/dist/react";
import type { ServiceQuery, ServiceQueryVariables } from "../../../tina/__generated__/types";
import PartnersMarquee from "./PartnersMarquee.tsx";

interface ServicePartnersProps {
  query: string;
  variables: ServiceQueryVariables;
  data: ServiceQuery;
}

/**
 * ServicePartnersReact — per-category partners marquee.
 * Reads the `partners` block of a single `service` document so each solution
 * page shows its own technology partners. Renders nothing when the category
 * has no partners defined.
 */
export default function ServicePartnersReact({ query, variables, data: initialData }: ServicePartnersProps) {
  const { data } = useTina<ServiceQuery>({ query, variables, data: initialData });
  return <PartnersMarquee partners={(data?.service as any)?.partners} />;
}
