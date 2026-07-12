import { useTina, tinaField } from "tinacms/dist/react";
import type {
  FormasDePagoQuery,
  FormasDePagoQueryVariables,
} from "../../../tina/__generated__/types";

interface HeroFormasPagoProps {
  query: string;
  variables: FormasDePagoQueryVariables;
  data: FormasDePagoQuery;
}

export default function HeroFormasPagoReact({
  query,
  variables,
  data: initialData,
}: HeroFormasPagoProps) {
  const { data } = useTina<FormasDePagoQuery>({
    query,
    variables,
    data: initialData,
  });

  const page = data?.formasDePago;
  if (!page) return null;

  return (
    <section
      className="relative overflow-hidden -mt-16"
      style={{ background: "#0a0a0a" }}
    >
      <div className="relative z-10 site-container pt-28 pb-10 md:pt-40 lg:pt-48 lg:pb-12">
        <h1
          className="text-[40px] md:text-[56px] leading-[1.15] font-medium text-greyscale-white max-w-[820px] tracking-[-1.6px]"
          data-tina-field={tinaField(page, "heading")}
        >
          {page.heading}
        </h1>

        {page.intro && (
          <p
            className="mt-6 text-body-lg text-greyscale-light max-w-[640px]"
            data-tina-field={tinaField(page, "intro")}
          >
            {page.intro}
          </p>
        )}
      </div>
    </section>
  );
}
