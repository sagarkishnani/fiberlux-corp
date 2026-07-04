import { useTina } from "tinacms/dist/react";
import type { GlobalQuery, GlobalQueryVariables } from "../../../tina/__generated__/types";
import PartnersMarquee from "./PartnersMarquee.tsx";

interface PartnersProps {
  query: string;
  variables: GlobalQueryVariables;
  data: GlobalQuery;
}

/**
 * PartnersReact — global "Trabajamos con los líderes de la industria" marquee.
 * Reads the shared partner list from the `global` collection.
 */
export default function PartnersReact({ query, variables, data: initialData }: PartnersProps) {
  const { data } = useTina<GlobalQuery>({ query, variables, data: initialData });
  return <PartnersMarquee partners={data?.global?.partners as any} />;
}
